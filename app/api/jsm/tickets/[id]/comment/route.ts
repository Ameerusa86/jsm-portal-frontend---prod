// app/api/jsm/tickets/[id]/comment/route.ts
import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

interface PostCommentBody {
  body: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketKey } = await params;
  const authCtx = await getJiraAuthContext();

  try {
    const { body } = (await req.json()) as PostCommentBody;

    if (!body || !body.trim()) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    if (!authCtx.isConfigured) {
      return NextResponse.json(
        { error: "Jira credentials are not configured" },
        { status: 401 }
      );
    }

    // Post to Atlassian Service Desk Customer Comment API
    const response = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/comment`,
      {
        method: "POST",
        headers: {
          Authorization: authCtx.authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          body: body.trim(),
          public: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data.errorMessage || data.message || "Failed to post comment to Jira";
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: String(data.id || Date.now()),
        author: {
          displayName: data.author?.displayName || authCtx.userName || "You",
          emailAddress: data.author?.emailAddress || authCtx.userEmail,
          avatarUrl: data.author?.avatarUrls?.["48x48"],
          isAgent: false,
        },
        body: typeof data.body === "string" ? data.body : body.trim(),
        created:
          typeof data.created === "string"
            ? data.created
            : data.created?.iso8601 || new Date().toISOString(),
        isPublic: true,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to post comment";
    console.error("Comment submission error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
