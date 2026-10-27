import NextAuth from "next-auth";
import Atlassian from "next-auth/providers/atlassian";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { JWT } from "next-auth/jwt";

/**
 * Refreshes an expired Atlassian OAuth access token using the stored refresh token.
 * Note: Atlassian employs rotating refresh tokens, so we update both accessToken and refreshToken.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  const clientId =
    process.env.AUTH_ATLASSIAN_ID || process.env.ATLASSIAN_CLIENT_ID;
  const clientSecret =
    process.env.AUTH_ATLASSIAN_SECRET || process.env.ATLASSIAN_CLIENT_SECRET;

  if (!token.refreshToken || !clientId || !clientSecret) {
    return {
      ...token,
      error: "MissingRefreshTokenOrCredentials",
    };
  }

  try {
    const response = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(
        Date.now() / 1000 + (refreshedTokens.expires_in || 3600),
      ),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error: unknown) {
    console.error("Error refreshing Atlassian access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

/**
 * Resolves the target Atlassian Cloud site from accessible-resources,
 * strictly and exclusively targeting the Jira PRODUCTION environment (emsmc1.atlassian.net).
 * Any sandbox site is strictly rejected and ignored.
 */
export function resolveTargetResource(
  resources: Array<{ id: string; url: string; name: string }>,
  configuredBaseUrl = "https://emsmc1.atlassian.net",
): { id: string; url: string; name: string } | undefined {
  if (!resources || resources.length === 0) return undefined;

  // 1. Strictly filter OUT any sandbox resource
  const prodResources = resources.filter((r) => {
    const urlLower = (r.url || "").toLowerCase();
    const nameLower = (r.name || "").toLowerCase();
    return !urlLower.includes("sandbox") && !nameLower.includes("sandbox");
  });

  // Pure Production Policy: Never fall back to sandbox resources under any condition
  if (prodResources.length === 0) {
    console.warn(
      "⚠️ [Atlassian Production OAuth] No production Jira resource found in accessible-resources. All sandbox sites are strictly rejected.",
    );
    return undefined;
  }

  const candidates = prodResources;

  // 2. Exact match against configuredBaseUrl if specified
  const targetHost = configuredBaseUrl
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  const hostMatch = candidates.find((r) => {
    const resHost = (r.url || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0];
    return resHost === targetHost;
  });

  if (hostMatch) return hostMatch;

  // 3. Fallback to first non-sandbox candidate
  return candidates[0];
}

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "development-secret-for-production-portal";

const clientId =
  process.env.AUTH_ATLASSIAN_ID || process.env.ATLASSIAN_CLIENT_ID || "";
const clientSecret =
  process.env.AUTH_ATLASSIAN_SECRET ||
  process.env.ATLASSIAN_CLIENT_SECRET ||
  "";

const msClientId =
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID ||
  process.env.AZURE_AD_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  "";
const msClientSecret =
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ||
  process.env.AZURE_AD_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  "";
const msTenantId =
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ||
  process.env.AZURE_AD_TENANT_ID ||
  process.env.MICROSOFT_TENANT_ID ||
  "";
const msIssuer =
  process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ||
  (msTenantId
    ? `https://login.microsoftonline.com/${msTenantId}/v2.0`
    : "https://login.microsoftonline.com/organizations/v2.0");

// Request ONLY User Identity ("read:me offline_access") by default so that
// employees/customers WITHOUT a paid Jira, JSM Agent, or Confluence seat
// never get blocked by Atlassian's "Access Denied" product license screen.
// All backend Jira/JSM/Confluence API requests execute via the Service Account
// (JIRA_USER_EMAIL + JIRA_API_TOKEN) on behalf of the authenticated user.
const oauthScopes =
  process.env.ATLASSIAN_OAUTH_SCOPES || "read:me offline_access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    MicrosoftEntraID({
      clientId: msClientId,
      clientSecret: msClientSecret,
      issuer: msIssuer,
    }),
    Atlassian({
      clientId,
      clientSecret,
      authorization: {
        params: {
          scope: oauthScopes,
          prompt: "consent",
          audience: "api.atlassian.com",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      const configuredBaseUrl = (
        process.env.JIRA_BASE_URL &&
        !process.env.JIRA_BASE_URL.includes("sandbox")
          ? process.env.JIRA_BASE_URL
          : "https://emsmc1.atlassian.net"
      )
        .trim()
        .replace(/\/+$/, "");

      // 1a. Microsoft 365 / Entra ID SSO login (for all company employees, no Jira license required)
      if (account?.provider === "microsoft-entra-id") {
        const oidcProfile = profile as
          | {
              email?: string;
              preferred_username?: string;
              upn?: string;
              name?: string;
              sub?: string;
            }
          | undefined;

        const resolvedEmail =
          user?.email ||
          oidcProfile?.email ||
          oidcProfile?.preferred_username ||
          oidcProfile?.upn ||
          token.email;

        token.email = resolvedEmail;
        token.name = user?.name || oidcProfile?.name || token.name;
        token.accountId =
          user?.id || account.providerAccountId || oidcProfile?.sub || token.sub;
        token.siteUrl = configuredBaseUrl;
        // Do not store Microsoft OAuth tokens in Atlassian token fields
        token.accessToken = undefined;
        token.refreshToken = undefined;
        token.expiresAt = undefined;
        token.error = undefined;
        return token;
      }

      // 1b. Initial Atlassian OAuth login: extract tokens and retrieve Production Cloud ID (if site scopes are used)
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.accountId = account.providerAccountId || token.sub;
        token.siteUrl = configuredBaseUrl;

        console.log(
          "\n========================================================",
        );
        console.log("🔐 [Atlassian Production OAuth] Login event detected");
        console.log(`   Target Production URL:    "${configuredBaseUrl}"`);
        console.log(
          `   OAuth Client ID:          "${clientId ? clientId.substring(0, 10) + "..." : "Not set"}"`,
        );
        console.log(`   OAuth Scopes:             "${oauthScopes}"`);

        // Fetch accessible resources only if product scopes beyond read:me are requested
        const hasProductScopes =
          oauthScopes.includes("jira") ||
          oauthScopes.includes("servicedesk") ||
          oauthScopes.includes("confluence");

        try {
          if (account.access_token && hasProductScopes) {
            const res = await fetch(
              "https://api.atlassian.com/oauth/token/accessible-resources",
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  Accept: "application/json",
                },
              },
            );

            if (res.ok) {
              const resources = (await res.json()) as Array<{
                id: string;
                url: string;
                name: string;
              }>;
              if (Array.isArray(resources) && resources.length > 0) {
                token.accessibleResources = resources;
                const targetResource = resolveTargetResource(
                  resources,
                  configuredBaseUrl,
                );

                if (targetResource) {
                  token.cloudId = targetResource.id;
                  token.siteUrl = targetResource.url.replace(/\/+$/, "");
                } else {
                  token.cloudId = undefined;
                  token.siteUrl = configuredBaseUrl;
                }
              }
            }
          } else {
            console.log(
              "   ℹ️ Identity-only OAuth active (read:me). Backend API calls will use Service Account Basic Auth.",
            );
          }
        } catch (err: unknown) {
          console.error(
            "   ❌ Error fetching Atlassian accessible resources:",
            err,
          );
        }
        console.log(
          "========================================================\n",
        );

        // Force sanitation: token.siteUrl MUST NOT be sandbox
        if (!token.siteUrl || token.siteUrl.includes("sandbox")) {
          token.siteUrl = "https://emsmc1.atlassian.net";
        }

        return token;
      }

      // Safety check on existing tokens: purge any legacy sandbox siteUrl from old cookies
      if (!token.siteUrl || token.siteUrl.includes("sandbox")) {
        token.siteUrl = "https://emsmc1.atlassian.net";
      }

      // 2. If session does not use Atlassian refresh tokens (e.g. Microsoft Entra ID SSO), return as-is
      if (!token.expiresAt || !token.refreshToken) {
        return token;
      }

      // 3. Return current Atlassian token if it has not expired yet (with 60-second safety window)
      if (Date.now() < token.expiresAt * 1000 - 60000) {
        return token;
      }

      // 4. Token expired -> refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.cloudId = token.cloudId;
      if (session.user && (token.accountId || token.sub)) {
        session.user.id = (token.accountId || token.sub) as string;
      }
      session.siteUrl =
        token.siteUrl && !token.siteUrl.includes("sandbox")
          ? token.siteUrl
          : "https://emsmc1.atlassian.net";
      session.error = token.error;
      session.accessibleResources = token.accessibleResources;
      return session;
    },
  },
});
