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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Atlassian({
      clientId:
        process.env.AUTH_ATLASSIAN_ID || process.env.ATLASSIAN_CLIENT_ID,
      clientSecret:
        process.env.AUTH_ATLASSIAN_SECRET ||
        process.env.ATLASSIAN_CLIENT_SECRET,
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
      // 1. Initial login: extract tokens and retrieve Atlassian Cloud ID
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        const configuredBaseUrl =
          process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
          "https://emsmc.atlassian.net";
        token.siteUrl = configuredBaseUrl;

        // Fetch accessible resources (Atlassian Cloud sites) - STRICTLY production only
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
                // Strictly exclude any sandbox environment to guarantee PURE production
                const prodResources = resources.filter(
                  (r) =>
                    !r.url.toLowerCase().includes("sandbox") &&
                    !(r.name || "").toLowerCase().includes("sandbox"),
                );
                const candidates =
                  prodResources.length > 0 ? prodResources : resources;

                const match = candidates.find(
                  (r) =>
                    r.url.replace(/\/+$/, "").toLowerCase() ===
                    configuredBaseUrl.toLowerCase(),
                );
                const targetResource = match || candidates[0];

                token.cloudId = targetResource.id;
                token.siteUrl = targetResource.url.replace(/\/+$/, "");
              }
            }
          }
        } catch (err: unknown) {
          console.error("Failed to fetch Atlassian accessible resources:", err);
        }

        return token;
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
      session.siteUrl = token.siteUrl;
      session.error = token.error;
      return session;
    },
  },
});
