// app/api/jsm/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { TicketDetail, TicketStatusItem, TicketCommentItem } from "@/types/jsm";
import { getMockTicketDetail } from "@/lib/mock-tickets";

interface JsmRequestResponse {
  issueId?: string;
  issueKey?: string;
  serviceDeskId?: string;
  requestTypeId?: string;
  createdDate?: { iso8601?: string; friendly?: string };
  currentStatus?: {
    status?: string;
    statusCategory?: string;
    statusDate?: { iso8601?: string; friendly?: string };
  };
  reporter?: {
    displayName?: string;
    emailAddress?: string;
  };
  _links?: {
    web?: string;
  };
}

interface JsmStatusResponse {
  values?: Array<{
    status?: string;
    statusCategory?: string;
    statusDate?: { iso8601?: string; friendly?: string };
  }>;
}

interface JsmCommentItem {
  id?: string;
  body?: string;
  created?: { iso8601?: string; friendly?: string } | string;
  author?: {
    displayName?: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
  };
  public?: boolean;
}

interface JsmCommentsResponse {
  values?: JsmCommentItem[];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketKey } = await params;
  const authCtx = await getJiraAuthContext();

  // If live credentials are not configured, return a rich mock ticket detail with progression & comments
  if (!authCtx.isConfigured) {
    const mockDetail = getMockTicketDetail(
      ticketKey,
      authCtx.userName,
      authCtx.userEmail
    );
    return NextResponse.json(mockDetail);
  }

  try {
    // 1. Fetch Customer Request metadata
    const requestRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
        ticketKey
      )}`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let jsmData: JsmRequestResponse | null = null;
    let summary = `Request ${ticketKey}`;

    if (requestRes.ok) {
      jsmData = (await requestRes.json()) as JsmRequestResponse;
    }

    // Fetch Issue fields (summary, issuetype, priority, assignee) via standard Jira API
    let issueFields: {
      summary?: string;
      priority?: { name?: string; iconUrl?: string };
      assignee?: {
        displayName?: string;
        emailAddress?: string;
        avatarUrls?: Record<string, string>;
      };
      project?: { name?: string; key?: string };
    } = {};

    try {
      const issueRes = await fetch(
        `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
          ticketKey
        )}?fields=summary,issuetype,created,updated,status,reporter,priority,assignee,project`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );
      if (issueRes.ok) {
        const issueData = await issueRes.json();
        if (issueData.fields) {
          issueFields = issueData.fields;
          if (issueData.fields.summary) {
            summary = issueData.fields.summary;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch detailed issue summary:", e);
    }

    // 2. Fetch Status History
    let statusHistory: TicketStatusItem[] = [];
    try {
      const statusRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
          ticketKey
        )}/status`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as JsmStatusResponse;
        statusHistory = (statusData.values || []).map((s) => ({
          status: s.status || "Unknown",
          statusCategory: s.statusCategory,
          statusDate: s.statusDate?.iso8601 || null,
        }));
      }
    } catch (e) {
      console.warn("Failed to load status progression history:", e);
    }

    // If status history endpoint was empty, provide current status as single milestone
    if (statusHistory.length === 0 && jsmData?.currentStatus?.status) {
      statusHistory.push({
        status: jsmData.currentStatus.status,
        statusCategory: jsmData.currentStatus.statusCategory,
        statusDate: jsmData.currentStatus.statusDate?.iso8601 || null,
      });
    }

    // 3. Fetch Public Comments
    let comments: TicketCommentItem[] = [];
    try {
      const commentsRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
          ticketKey
        )}/comment?public=true`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (commentsRes.ok) {
        const commentsData = (await commentsRes.json()) as JsmCommentsResponse;
        comments = (commentsData.values || []).map((c) => {
          const authorEmail = c.author?.emailAddress || "";
          const isCurrentUser =
            authCtx.userEmail &&
            authorEmail.toLowerCase() === authCtx.userEmail.toLowerCase();

          return {
            id: String(c.id || Math.random()),
            author: {
              displayName: c.author?.displayName || "Support Specialist",
              emailAddress: c.author?.emailAddress,
              avatarUrl: c.author?.avatarUrls?.["48x48"],
              isAgent: !isCurrentUser,
            },
            body: typeof c.body === "string" ? c.body : JSON.stringify(c.body),
            created:
              typeof c.created === "string"
                ? c.created
                : c.created?.iso8601 || new Date().toISOString(),
            isPublic: c.public ?? true,
          };
        });
      }
    } catch (e) {
      console.warn("Failed to load public comments:", e);
    }

    const hostUrl =
      authCtx.siteUrl ||
      process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
      "https://emsmc1.atlassian.net";

    const detail: TicketDetail = {
      id: jsmData?.issueId || ticketKey,
      key: ticketKey,
      summary,
      status: jsmData?.currentStatus?.status || "In Progress",
      statusCategory: jsmData?.currentStatus?.statusCategory || "INDETERMINATE",
      type: "Service Request",
      created: jsmData?.createdDate?.iso8601 || null,
      updated: jsmData?.currentStatus?.statusDate?.iso8601 || null,
      priority: issueFields.priority?.name
        ? {
            name: issueFields.priority.name,
            iconUrl: issueFields.priority.iconUrl,
          }
        : undefined,
      projectName: issueFields.project?.name,
      projectKey: issueFields.project?.key,
      reporter: {
        displayName: jsmData?.reporter?.displayName,
        emailAddress: jsmData?.reporter?.emailAddress,
      },
      assignee: issueFields.assignee?.displayName
        ? {
            displayName: issueFields.assignee.displayName,
            emailAddress: issueFields.assignee.emailAddress,
            avatarUrl: issueFields.assignee.avatarUrls?.["48x48"],
          }
        : undefined,
      statusHistory,
      comments,
      portalUrl:
        jsmData?._links?.web ||
        `${hostUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(
          ticketKey
        )}`,
      backendUrl: `${hostUrl}/browse/${encodeURIComponent(ticketKey)}`,
    };

    return NextResponse.json(detail);
  } catch (error: unknown) {
    console.error("Ticket details API error, falling back to mock:", error);
    const mockDetail = getMockTicketDetail(
      ticketKey,
      authCtx.userName,
      authCtx.userEmail
    );
    return NextResponse.json(mockDetail);
  }
}
