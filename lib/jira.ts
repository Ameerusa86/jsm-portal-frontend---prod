// lib/jira.ts
import { auth } from "@/auth";

export interface JiraAuthContext {
  isConfigured: boolean;
  authType: "oauth" | "basic" | "mock";
  authHeader: string;
  baseUrl: string;
  cloudId?: string;
  serviceDeskId?: string;
  userEmail?: string;
  userName?: string;
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
 * Resolves the current Jira authentication context, prioritizing OAuth (from Auth.js session)
 * and gracefully falling back to Basic Auth (from env vars) or Mock mode.
 */
export async function getJiraAuthContext(): Promise<JiraAuthContext> {
  const {
    JIRA_BASE_URL,
    JIRA_USER_EMAIL,
    JIRA_API_TOKEN,
    JIRA_SERVICE_DESK_ID,
    JSM_EMPLOYEE_EMAIL,
  } = process.env;

  // 1. Check for logged-in user with Atlassian OAuth session
  try {
    const session = await auth();
    if (session?.accessToken) {
      let cloudId = session.cloudId;

      // If cloudId wasn't cached in session yet, resolve from accessible-resources
      if (!cloudId) {
        try {
          const res = await fetch(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                Accept: "application/json",
              },
            },
          );
          if (res.ok) {
            const resources = await res.json();
            if (Array.isArray(resources) && resources.length > 0) {
              const configuredUrl = process.env.JIRA_BASE_URL?.replace(/\/+$/, "");
              let targetResource = resources[0];
              if (configuredUrl) {
                const match = resources.find(r => r.url.replace(/\/+$/, "") === configuredUrl);
                if (match) targetResource = match;
              }
              cloudId = targetResource.id;
            }
          }
        } catch (err) {
          console.warn(
            "Failed to resolve accessible resources on demand:",
            err,
          );
        }
      }

      if (cloudId) {
        return {
          isConfigured: true,
          authType: "oauth",
          authHeader: `Bearer ${session.accessToken}`,
          baseUrl: `https://api.atlassian.com/ex/jira/${cloudId}`,
          cloudId,
          serviceDeskId:
            JIRA_SERVICE_DESK_ID || process.env.JIRA_SERVICE_DESK_ID,
          userEmail: session.user?.email || undefined,
          userName: session.user?.name || undefined,
        };
      }

      console.warn(
        "Atlassian OAuth session exists but the Jira cloudId could not be resolved. Re-authentication may be required with the full Atlassian scope set.",
      );
    }
  } catch (err) {
    console.warn("OAuth session inspection error:", err);
  }

  // 2. Fallback to Basic Auth if environment variables are provided
  if (JIRA_BASE_URL && JIRA_USER_EMAIL && JIRA_API_TOKEN) {
    const cleanUrl = JIRA_BASE_URL.replace(/\/+$/, "");
    return {
      isConfigured: true,
      authType: "basic",
      authHeader: `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`,
      ).toString("base64")}`,
      baseUrl: cleanUrl,
      serviceDeskId: JIRA_SERVICE_DESK_ID,
      userEmail: JSM_EMPLOYEE_EMAIL || JIRA_USER_EMAIL,
    };
  }

  // 3. Fallback to mock data mode only when no live Jira auth is available
  return {
    isConfigured: false,
    authType: "mock",
    authHeader: "",
    baseUrl: "",
    serviceDeskId: JIRA_SERVICE_DESK_ID,
  };
}
