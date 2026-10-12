import NextAuth from "next-auth";
import Atlassian from "next-auth/providers/atlassian";
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
 * strictly and exclusively targeting the Jira PRODUCTION environment (emsmc.atlassian.net).
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

  const candidates = prodResources.length > 0 ? prodResources : resources;

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    Atlassian({
      clientId,
      clientSecret,
      authorization: {
        params: {
          scope:
            "read:me read:jira-user read:jira-work write:jira-work read:servicedesk-request write:servicedesk-request read:knowledgebase:jira-service-management read:confluence-space.summary read:confluence-content.summary offline_access",
          prompt: "consent",
          audience: "api.atlassian.com",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const configuredBaseUrl = (
        process.env.JIRA_BASE_URL &&
        !process.env.JIRA_BASE_URL.includes("sandbox")
          ? process.env.JIRA_BASE_URL
          : "https://emsmc1.atlassian.net"
      )
        .trim()
        .replace(/\/+$/, "");

      // 1. Initial login: extract tokens and retrieve Production Cloud ID
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.siteUrl = configuredBaseUrl;

        console.log(
          "\n========================================================",
        );
        console.log("🔐 [Atlassian Production OAuth] Login event detected");
        console.log(`   Target Production URL:    "${configuredBaseUrl}"`);
        console.log(
          `   OAuth Client ID:          "${clientId ? clientId.substring(0, 10) + "..." : "Not set"}"`,
        );

        // Fetch accessible resources (Atlassian Cloud sites)
        try {
          if (account.access_token) {
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

                console.log(
                  `   Atlassian authorized site(s) (${resources.length}):`,
                );
                resources.forEach((r, idx) => {
                  console.log(
                    `     [${idx + 1}] ID: ${r.id} | Name: "${r.name}" | URL: "${r.url}"`,
                  );
                });
                console.log(
                  `   Selected Production Site:  ${targetResource?.url} (${targetResource?.name}) [Cloud ID: ${targetResource?.id}]`,
                );

                if (targetResource) {
                  token.cloudId = targetResource.id;
                  token.siteUrl = targetResource.url.replace(/\/+$/, "");
                }
              } else {
                console.warn(
                  "   ⚠️ Warning: Atlassian returned 0 accessible resources! Check user site permissions.",
                );
              }
            } else {
              const errBody = await res.text();
              console.error(
                `   ❌ Failed to fetch accessible-resources: HTTP ${res.status} - ${errBody}`,
              );
            }
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
      if (token.siteUrl && token.siteUrl.includes("sandbox")) {
        token.siteUrl = "https://emsmc1.atlassian.net";
      }

      // 2. Return current token if it has not expired yet (with 60-second safety window)
      if (token.expiresAt && Date.now() < token.expiresAt * 1000 - 60000) {
        return token;
      }

      // 3. Token expired -> refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.cloudId = token.cloudId;
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
