import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

interface JiraSearchResponse {
  issues?: Array<{
    id: string;
    key: string;
    fields: {
      summary?: string;
      created?: string;
      updated?: string;
      status?: { name?: string };
      issuetype?: { name?: string };
      project?: { id?: string };
    };
  }>;
}

export async function GET() {
  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    return NextResponse.json(
      { error: "Jira ticket tracking is not configured." },
      { status: 503 }
    );
  }

  // Determine JQL reporter filter:
  // For OAuth users: currentUser() or matching user email
  // For Basic auth: reporter email
  const jql =
    authCtx.authType === "oauth"
      ? `reporter = currentUser() ORDER BY created DESC`
      : authCtx.userEmail
      ? `reporter = "${authCtx.userEmail.replace(/"/g, '\\"')}" ORDER BY created DESC`
      : `ORDER BY created DESC`;

  try {
    const response = await fetch(
      `${authCtx.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,created,updated,status,issuetype,project`,
      {
        headers: { Authorization: authCtx.authHeader, Accept: "application/json" },
        cache: "no-store",
      }
    );

    const data = (await response.json()) as JiraSearchResponse & {
      errorMessages?: string[];
    };

    if (!response.ok) {
      // If search/jql fails (e.g. older Jira without new search API), try fallback standard search endpoint
      const fallbackResponse = await fetch(
        `${authCtx.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,created,updated,status,issuetype,project`,
        {
          headers: { Authorization: authCtx.authHeader, Accept: "application/json" },
          cache: "no-store",
        }
      );

      if (fallbackResponse.ok) {
        const fallbackData = (await fallbackResponse.json()) as JiraSearchResponse;
        return NextResponse.json(
          (fallbackData.issues || []).map((issue) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary || "Untitled request",
            status: issue.fields.status?.name || "Unknown",
            type: issue.fields.issuetype?.name || "Service request",
            created: issue.fields.created || null,
            updated: issue.fields.updated || null,
            projectId: issue.fields.project?.id || null,
          }))
        );
      }

      return NextResponse.json(
        { error: data.errorMessages?.join(" ") || "Failed to load tickets." },
        { status: response.status }
      );
    }

    return NextResponse.json(
      (data.issues || []).map((issue) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary || "Untitled request",
        status: issue.fields.status?.name || "Unknown",
        type: issue.fields.issuetype?.name || "Service request",
        created: issue.fields.created || null,
        updated: issue.fields.updated || null,
        projectId: issue.fields.project?.id || null,
      }))
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
