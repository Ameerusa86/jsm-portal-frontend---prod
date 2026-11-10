import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { TicketItem } from "@/types/jsm";

interface JiraSearchResponse {
  issues?: Array<{
    id: string;
    key: string;
    fields: {
      summary?: string;
      created?: string;
      updated?: string;
      status?: {
        name?: string;
        statusCategory?: {
          id?: number;
          key?: string;
          name?: string;
          colorName?: string;
        };
      };
      issuetype?: {
        name?: string;
        iconUrl?: string;
      };
      project?: {
        id?: string;
        name?: string;
        key?: string;
      };
      priority?: {
        name?: string;
        iconUrl?: string;
      };
      reporter?: {
        displayName?: string;
        emailAddress?: string;
        avatarUrls?: Record<string, string>;
      };
      assignee?: {
        displayName?: string;
        emailAddress?: string;
        avatarUrls?: Record<string, string>;
      };
      organizations?: Array<{
        id?: string;
        name?: string;
      }>;
      resolution?: {
        name?: string;
        date?: string;
      };
    };
  }>;
}

function resolveStatusCategory(
  catKey?: string,
  statusName?: string
): "new" | "indeterminate" | "done" {
  if (catKey === "new" || catKey === "indeterminate" || catKey === "done") {
    return catKey;
  }
  const s = (statusName || "").toLowerCase();
  if (
    s.includes("done") ||
    s.includes("resolved") ||
    s.includes("closed") ||
    s.includes("completed") ||
    s.includes("cancel")
  ) {
    return "done";
  }
  if (
    s.includes("open") ||
    s.includes("new") ||
    s.includes("to do") ||
    s.includes("submitted") ||
    s.includes("waiting for support")
  ) {
    return "new";
  }
  return "indeterminate";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const searchParam = searchParams.get("search") || searchParams.get("q") || "";
  const spaceParam = searchParams.get("space") || searchParams.get("project") || "";
  const statusParam = searchParams.get("status") || "";
  const columnParam = searchParams.get("column") || "";
  const valueParam = searchParams.get("value") || "";
  const limitParam = parseInt(searchParams.get("limit") || "100", 10);

  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    return NextResponse.json(
      { error: "Jira credentials are not configured" },
      { status: 401 },
    );
  }

  // Construct dynamic JQL query for Jira Cloud
  const jqlClauses: string[] = [];

  if (authCtx.authType === "oauth") {
    jqlClauses.push("reporter = currentUser()");
  } else if (authCtx.userEmail) {
    const cleanEmail = authCtx.userEmail.replace(/"/g, '\\"');
    const resolvedAccountIds = new Set<string>();

    // Resolve Jira/JSM customer accountId(s) for the logged-in user's email
    try {
      const userSearchRes = await fetch(
        `${authCtx.baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(
          authCtx.userEmail
        )}&maxResults=10`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );
      if (userSearchRes.ok) {
        const users = (await userSearchRes.json()) as Array<{
          accountId?: string;
          emailAddress?: string;
        }>;
        if (Array.isArray(users)) {
          users.forEach((u) => {
            if (u.accountId) {
              resolvedAccountIds.add(u.accountId);
            }
          });
        }
      }
    } catch {
      // Ignore user lookup error and fall back to email/accountId
    }

    if (resolvedAccountIds.size > 0) {
      const idList = Array.from(resolvedAccountIds)
        .map((id) => `"${id.replace(/"/g, '\\"')}"`)
        .join(", ");
      jqlClauses.push(
        `(reporter in (${idList}) OR description ~ "${cleanEmail}")`
      );
    } else {
      // User may already exist by email or via description tag if not yet indexed in Jira user search
      jqlClauses.push(`reporter = "${cleanEmail}"`);
    }
  }

  if (spaceParam && spaceParam !== "all") {
    jqlClauses.push(`project = "${spaceParam.replace(/"/g, '\\"')}"`);
  }

  if (searchParam) {
    jqlClauses.push(`(text ~ "${searchParam.replace(/"/g, '\\"')}*" OR key = "${searchParam.replace(/"/g, '\\"')}")`);
  }

  if (columnParam && valueParam) {
    const col = columnParam.toLowerCase();
    const cleanVal = valueParam.replace(/"/g, '\\"');
    if (col === "assignee") {
      jqlClauses.push(`assignee ~ "${cleanVal}"`);
    } else if (col === "priority") {
      jqlClauses.push(`priority = "${cleanVal}"`);
    } else if (col === "status") {
      jqlClauses.push(`status = "${cleanVal}"`);
    } else if (col === "type") {
      jqlClauses.push(`issuetype = "${cleanVal}"`);
    } else if (col === "key") {
      jqlClauses.push(`key = "${cleanVal}"`);
    } else if (col === "client" || col === "organization") {
      // Jira Service Management Organization JQL
      jqlClauses.push(`organizations = "${cleanVal}"`);
    }
  }

  const jql = jqlClauses.length > 0
    ? `${jqlClauses.join(" AND ")} ORDER BY created DESC`
    : `ORDER BY created DESC`;

  const fields =
    "summary,created,updated,status,issuetype,project,priority,reporter,assignee,resolution,organizations";

  try {
    const response = await fetch(
      `${authCtx.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(
        jql
      )}&maxResults=${limitParam}&fields=${fields}`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let issues: JiraSearchResponse["issues"] = [];

    if (!response.ok) {
      // If reporter = "email" failed with 400 (because this brand-new user has never created a Jira ticket yet),
      // try searching by description tag or return an empty ticket list for this new user
      if (response.status === 400 && authCtx.userEmail) {
        const cleanEmail = authCtx.userEmail.replace(/"/g, '\\"');
        const descJql = `description ~ "${cleanEmail}" ORDER BY created DESC`;
        const descRes = await fetch(
          `${authCtx.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(
            descJql
          )}&maxResults=${limitParam}&fields=${fields}`,
          {
            headers: {
              Authorization: authCtx.authHeader,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );
        if (descRes.ok) {
          const descData = (await descRes.json()) as JiraSearchResponse;
          issues = descData.issues || [];
        } else {
          return NextResponse.json([]);
        }
      } else {
        // Fallback standard search endpoint for Jira Cloud
        const fallbackResponse = await fetch(
          `${authCtx.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(
            jql
          )}&maxResults=${limitParam}&fields=${fields}`,
          {
            headers: {
              Authorization: authCtx.authHeader,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = (await fallbackResponse.json()) as JiraSearchResponse;
          issues = fallbackData.issues || [];
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Jira search API returned error:", errData);
          return NextResponse.json([]);
        }
      }
    } else {
      const data = (await response.json()) as JiraSearchResponse;
      issues = data.issues || [];
    }

    const hostUrl =
      authCtx.siteUrl ||
      process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
      "https://emsmc1.atlassian.net";

    const mappedTickets: TicketItem[] = issues.map((issue) => {
      const catKey = resolveStatusCategory(
        issue.fields.status?.statusCategory?.key,
        issue.fields.status?.name
      );

      const clientName =
        issue.fields.organizations?.[0]?.name ||
        issue.fields.project?.name ||
        null;

      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary || "Untitled request",
        status: issue.fields.status?.name || "Unknown",
        statusCategory: catKey,
        statusCategoryName:
          issue.fields.status?.statusCategory?.name ||
          (catKey === "done"
            ? "Done"
            : catKey === "new"
            ? "To Do"
            : "In Progress"),
        type: issue.fields.issuetype?.name || "Service request",
        typeIconUrl: issue.fields.issuetype?.iconUrl,
        clientName: clientName,
        organization: clientName,
        created: issue.fields.created || null,
        updated: issue.fields.updated || null,
        projectId: issue.fields.project?.id || null,
        projectName: issue.fields.project?.name || null,
        projectKey: issue.fields.project?.key || null,
        priority: {
          name: issue.fields.priority?.name || "Medium",
          iconUrl: issue.fields.priority?.iconUrl,
        },
        reporter: {
          displayName: issue.fields.reporter?.displayName,
          emailAddress: issue.fields.reporter?.emailAddress,
          avatarUrl: issue.fields.reporter?.avatarUrls?.["48x48"],
        },
        assignee: {
          displayName: issue.fields.assignee?.displayName,
          emailAddress: issue.fields.assignee?.emailAddress,
          avatarUrl: issue.fields.assignee?.avatarUrls?.["48x48"],
        },
        resolution: issue.fields.resolution
          ? {
              name: issue.fields.resolution.name,
              date: issue.fields.resolution.date,
            }
          : undefined,
        portalUrl: `${hostUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(
          issue.key
        )}`,
        backendUrl: `${hostUrl}/browse/${encodeURIComponent(issue.key)}`,
      };
    });

    return NextResponse.json(mappedTickets);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Tickets GET error:", error);
    return NextResponse.json(
      { error: "Failed to load tickets", details: message },
      { status: 500 },
    );
  }
}
