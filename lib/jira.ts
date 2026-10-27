// lib/jira.ts
import { auth, resolveTargetResource } from "@/auth";

export interface JiraAuthContext {
  isConfigured: boolean;
  authType: "oauth" | "basic" | "mock";
  authHeader: string;
  baseUrl: string;
  siteUrl?: string;
  cloudId?: string;
  serviceDeskId?: string;
  userEmail?: string;
  userName?: string;
  userAccountId?: string;
}

/**
 * Resolves the Jira Cloud ID either from tenant info or session
 */
export async function getCloudId(baseUrl: string): Promise<string> {
  const cleanUrl = baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${cleanUrl}/_edge/tenant_info`);
  if (!res.ok) throw new Error("Failed to resolve Cloud ID");
  const data = await res.json();
  return data.cloudId;
}

/**
 * Resolves the current Jira authentication context.
 * - Extracts the logged-in user's identity (email, name, accountId) from the Auth.js session.
 * - Uses Service Account Basic Auth (JIRA_USER_EMAIL + JIRA_API_TOKEN) for Jira/JSM API execution
 *   when configured, allowing unlicensed portal users (without Jira/Confluence seats) to browse
 *   catalogs, read KB articles, and raise/view their own tickets seamlessly.
 * - Falls back to OAuth Bearer token (if full product scopes & cloudId are present) or Mock mode.
 * Strictly targets production Jira (emsmc1.atlassian.net) and rejects sandbox connections.
 */
export async function getJiraAuthContext(): Promise<JiraAuthContext> {
  const {
    JIRA_BASE_URL,
    JIRA_USER_EMAIL,
    JIRA_API_TOKEN,
    JIRA_SERVICE_DESK_ID,
    JIRA_SERVICE_DESK,
    JSM_EMPLOYEE_EMAIL,
    ATLASSIAN_CLOUD_ID,
  } = process.env;

  const resolvedServiceDeskId =
    JIRA_SERVICE_DESK_ID ||
    JIRA_SERVICE_DESK ||
    process.env.JSM_SERVICE_DESK_ID ||
    "4";

  const configuredUrl = (
    JIRA_BASE_URL && !JIRA_BASE_URL.includes("sandbox")
      ? JIRA_BASE_URL
      : "https://emsmc1.atlassian.net"
  )
    .trim()
    .replace(/\/+$/, "");

  let sessionUserEmail: string | undefined;
  let sessionUserName: string | undefined;
  let sessionAccountId: string | undefined;
  let sessionAccessToken: string | undefined;
  let sessionCloudId: string | undefined;
  let sessionSiteUrl: string | undefined;

  // 1. Inspect logged-in user session for identity & optional OAuth token
  try {
    const session = await auth();
    if (session?.user) {
      sessionUserEmail = session.user.email || undefined;
      sessionUserName = session.user.name || undefined;
      sessionAccountId = session.user.id || undefined;
    }
    if (session?.accessToken && !session.error) {
      sessionAccessToken = session.accessToken;
      sessionCloudId = session.cloudId;
      sessionSiteUrl = session.siteUrl;
    }
  } catch (err) {
    console.warn("OAuth session inspection error:", err);
  }

  // 2. Prefer Service Account Basic Auth for Jira/JSM REST API calls when configured,
  // while preserving the logged-in user's identity (sessionUserEmail / sessionUserName)
  // so unlicensed employees can use the portal without needing a paid Jira/Confluence seat.
  if (JIRA_USER_EMAIL && JIRA_API_TOKEN) {
    const cleanUrl = configuredUrl;
    return {
      isConfigured: true,
      authType: "basic",
      authHeader: `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL.trim()}:${JIRA_API_TOKEN.trim()}`,
      ).toString("base64")}`,
      baseUrl: cleanUrl,
      siteUrl: cleanUrl,
      cloudId: ATLASSIAN_CLOUD_ID || sessionCloudId || undefined,
      serviceDeskId: resolvedServiceDeskId,
      userEmail: sessionUserEmail || JSM_EMPLOYEE_EMAIL || JIRA_USER_EMAIL,
      userName: sessionUserName,
      userAccountId: sessionAccountId,
    };
  }

  // 3. Fallback to User OAuth Bearer token if Service Account Basic Auth is not configured
  // and the user's OAuth token has site access (cloudId)
  if (sessionAccessToken) {
    let cloudId = sessionCloudId;

    if (!cloudId) {
      try {
        const res = await fetch(
          "https://api.atlassian.com/oauth/token/accessible-resources",
          {
            headers: {
              Authorization: `Bearer ${sessionAccessToken}`,
              Accept: "application/json",
            },
          },
        );
        if (res.ok) {
          const resources = await res.json();
          if (Array.isArray(resources) && resources.length > 0) {
            const targetResource = resolveTargetResource(
              resources,
              configuredUrl,
            );
            if (targetResource) {
              cloudId = targetResource.id;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to resolve accessible resources on demand:", err);
      }
    }

    if (cloudId) {
      const activeSite =
        sessionSiteUrl && !sessionSiteUrl.includes("sandbox")
          ? sessionSiteUrl
          : configuredUrl;

      return {
        isConfigured: true,
        authType: "oauth",
        authHeader: `Bearer ${sessionAccessToken}`,
        baseUrl: `https://api.atlassian.com/ex/jira/${cloudId}`,
        siteUrl: activeSite,
        cloudId,
        serviceDeskId: resolvedServiceDeskId,
        userEmail: sessionUserEmail,
        userName: sessionUserName,
        userAccountId: sessionAccountId,
      };
    }
  }

  // 4. Fallback to mock data mode when no live Jira API credentials are configured
  return {
    isConfigured: false,
    authType: "mock",
    authHeader: "",
    baseUrl: "",
    siteUrl: configuredUrl,
    serviceDeskId: resolvedServiceDeskId,
    userEmail: sessionUserEmail || JSM_EMPLOYEE_EMAIL,
    userName: sessionUserName,
    userAccountId: sessionAccountId,
  };
}
