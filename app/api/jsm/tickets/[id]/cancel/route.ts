import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketKey } = await params;
  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    // Mock successful cancellation
    return NextResponse.json({ success: true });
  }

  try {
    // 1. Fetch available customer transitions for the request
    const transitionsRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/transition`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
      }
    );

    if (!transitionsRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch transitions: ${transitionsRes.statusText}` },
        { status: transitionsRes.status }
      );
    }

    const transitionsData = await transitionsRes.json();
    const transitions = transitionsData.values || [];

    // Find a transition that sounds like a cancel/close
    const cancelTransition = transitions.find((t: { name?: string; id?: string }) => {
      const name = (t.name || "").toLowerCase();
      return name.includes("cancel") || name.includes("close") || name.includes("resolve");
    });

    if (!cancelTransition) {
      return NextResponse.json(
        { error: "This request cannot be canceled at this time." },
        { status: 400 }
      );
    }

    // 2. Perform the transition
    const performRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/transition`,
      {
        method: "POST",
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: cancelTransition.id,
        }),
      }
    );

    if (!performRes.ok) {
      const errorText = await performRes.text();
      console.error("Failed to cancel ticket:", errorText);
      return NextResponse.json(
        { error: `Failed to cancel ticket: ${performRes.statusText}` },
        { status: performRes.status }
      );
    }

    // Optional: add a comment that it was canceled by the customer
    await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/comment`,
      {
        method: "POST",
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: "Request canceled by the reporter.",
          public: true,
        }),
      }
    );

    return NextResponse.json({ success: true, status: cancelTransition.name });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to cancel ticket";
    console.error("Cancel API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
