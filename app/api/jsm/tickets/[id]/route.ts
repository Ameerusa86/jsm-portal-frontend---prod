// app/api/jsm/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { TicketDetail, TicketStatusItem, TicketCommentItem } from "@/types/jsm";

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
    const mockDetail: TicketDetail = {
      id: "mock-1001",
      key: ticketKey,
      summary: "MacBook Pro M3 Hardware Diagnostics & Battery Replacement",
      status: "In Progress",
      statusCategory: "INDETERMINATE",
      type: "Hardware Support",
      created: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated: new Date(Date.now() - 3600000 * 3).toISOString(),
      reporter: {
        displayName: authCtx.userName || "Employee User",
        emailAddress: authCtx.userEmail || "employee@company.com",
      },
      statusHistory: [
        {
          status: "Waiting for support",
          statusCategory: "NEW",
          statusDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          status: "Under Review",
          statusCategory: "INDETERMINATE",
          statusDate: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          status: "In Progress",
          statusCategory: "INDETERMINATE",
          statusDate: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      comments: [
        {
          id: "c-1",
          author: {
            displayName: "IT Service Desk System",
            isAgent: true,
          },
          body: "Your request has been received and assigned to the Enterprise Hardware team (Tier 2).",
          created: new Date(Date.now() - 86400000 * 2).toISOString(),
          isPublic: true,
        },
        {
          id: "c-2",
          author: {
            displayName: "Sarah Jenkins (Hardware Specialist)",
            isAgent: true,
          },
          body: "Hi! We reviewed your battery swelling diagnostic report. We have dispatched a replacement loaner unit to your office desk, and scheduled diagnostic repair for your MacBook.",
          created: new Date(Date.now() - 3600000 * 4).toISOString(),
          isPublic: true,
        },
      ],
      backendUrl: `https://mock.atlassian.net/browse/${ticketKey}`,
      isMock: true,
    };

    return NextResponse.json(mockDetail);
  }

  try {
    // 1. Fetch Customer Request metadata
    const requestRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}`,
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

    // Fetch Issue fields (summary, issuetype) via standard Jira API
    try {
      const issueRes = await fetch(
        `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(ticketKey)}?fields=summary,issuetype,created,updated,status,reporter`,
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
        if (issueData.fields?.summary) {
          summary = issueData.fields.summary;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch detailed issue summary:", e);
    }

    // 2. Fetch Status History
    let statusHistory: TicketStatusItem[] = [];
    try {
      const statusRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/status`,
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
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/comment?public=true`,
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

    const detail: TicketDetail = {
      id: jsmData?.issueId || ticketKey,
      key: ticketKey,
      summary,
      status: jsmData?.currentStatus?.status || "In Progress",
      statusCategory: jsmData?.currentStatus?.statusCategory || "INDETERMINATE",
      type: "Service Request",
      created: jsmData?.createdDate?.iso8601 || null,
      updated: jsmData?.currentStatus?.statusDate?.iso8601 || null,
      reporter: {
        displayName: jsmData?.reporter?.displayName,
        emailAddress: jsmData?.reporter?.emailAddress,
      },
      statusHistory,
      comments,
      portalUrl: jsmData?._links?.web,
      backendUrl: jsmData?._links?.web ? `${new URL(jsmData._links.web).origin}/browse/${ticketKey}` : undefined,
    };

    return NextResponse.json(detail);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load ticket details";
    console.error("Ticket details API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
