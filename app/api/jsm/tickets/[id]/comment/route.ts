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

    // Mock simulation if credentials are not configured
    if (!authCtx.isConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return NextResponse.json({
        success: true,
        comment: {
          id: `mock-${Date.now()}`,
          author: {
            displayName: authCtx.userName || "You (Employee)",
            emailAddress: authCtx.userEmail || "employee@company.com",
            isAgent: false,
          },
          body: body.trim(),
          created: new Date().toISOString(),
          isPublic: true,
        },
      });
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
