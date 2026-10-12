import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketKey } = await params;
  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    // Mock successful participant add
    return NextResponse.json({ success: true });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const res = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(ticketKey)}/participant`,
      {
        method: "POST",
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: [email],
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to add participant:", errorText);
      return NextResponse.json(
        { error: `Failed to add participant: ${res.statusText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add participant";
    console.error("Participant API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
