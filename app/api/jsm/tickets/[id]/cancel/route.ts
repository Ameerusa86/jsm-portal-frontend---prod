import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

interface JiraTransitionItem {
  id: string;
  name?: string;
  to?: {
    id?: string;
    name?: string;
    statusCategory?: {
      key?: string;
      name?: string;
    };
  };
  fields?: Record<
    string,
    {
      required?: boolean;
      allowedValues?: Array<{ id?: string; name?: string }>;
    }
  >;
}

function scoreTransition(
  name?: string,
  toName?: string,
  categoryKey?: string
): number {
  const text = `${name || ""} ${toName || ""}`.toLowerCase();
  if (text.includes("cancel")) return 100;
  if (text.includes("withdraw")) return 90;
  if (text.includes("discard") || text.includes("abandon")) return 80;
  if (text.includes("close")) return 70;
  if (
    text.includes("reject") ||
    text.includes("decline") ||
    text.includes("won't")
  )
    return 60;
  if (text.includes("resolve")) return 50;
  if (categoryKey === "done") return 40;
  if (text.includes("done")) return 30;
  return 0;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketKey } = await params;
  const authCtx = await getJiraAuthContext();

  // 1. Simulation for Mock Mode (Credentials not configured)
  if (!authCtx.isConfigured) {
    return NextResponse.json({
      success: true,
      status: "Canceled",
      method: "mock",
    });
  }

  const authHeaders: Record<string, string> = {
    Authorization: authCtx.authHeader,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    // 2. Pre-check: Check if the issue is already in a Closed or Done status
    try {
      const issueCheckRes = await fetch(
        `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
          ticketKey
        )}?fields=status`,
        { headers: authHeaders, cache: "no-store" }
      );
      if (issueCheckRes.ok) {
        const issueData = await issueCheckRes.json();
        const currentStatusName = issueData.fields?.status?.name || "";
        const catKey =
          issueData.fields?.status?.statusCategory?.key?.toLowerCase() || "";
        if (
          catKey === "done" ||
          /cancel|closed|resolved|completed/i.test(currentStatusName)
        ) {
          return NextResponse.json({
            success: true,
            status: currentStatusName || "Canceled",
            message: "This request is already resolved or closed.",
          });
        }
      }
    } catch {
      // Ignore pre-check failure and proceed to transition attempts
    }

    let transitionedStatus = "";

    // 3. ATTEMPT 1: JSM Customer Transition API
    // Used when customer-facing transitions are exposed on the customer portal
    try {
      const jsmRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
          ticketKey
        )}/transition`,
        { headers: authHeaders, cache: "no-store" }
      );

      if (jsmRes.ok) {
        const jsmData = await jsmRes.json();
        const values: Array<{ id: string; name?: string }> =
          jsmData.values || [];

        const scored = values
          .map((t) => ({ ...t, score: scoreTransition(t.name) }))
          .filter((t) => t.score > 0)
          .sort((a, b) => b.score - a.score);

        if (scored.length > 0) {
          const chosen = scored[0];

          // Try transitioning with additionalComment first
          let performRes = await fetch(
            `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
              ticketKey
            )}/transition`,
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                id: String(chosen.id),
                additionalComment: {
                  body: "Request canceled by the reporter.",
                },
              }),
            }
          );

          // If rejected (e.g. additionalComment forbidden on this transition screen), try plain id
          if (!performRes.ok) {
            performRes = await fetch(
              `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
                ticketKey
              )}/transition`,
              {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                  id: String(chosen.id),
                }),
              }
            );
          }

          if (performRes.ok) {
            return NextResponse.json({
              success: true,
              status: chosen.name || "Canceled",
              method: "jsm_customer_transition",
            });
          }
          const errText = await performRes.text().catch(() => "");
          console.warn(`JSM Customer Transition POST failed for ${ticketKey}:`, errText);
        }
      }
    } catch (err) {
      console.warn("JSM Customer Transition attempt error:", err);
    }

    // 4. ATTEMPT 2: Standard Jira Core Workflow Transitions API
    // Works across all Jira issues and respects full workflow transitions
    try {
      const coreRes = await fetch(
        `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
          ticketKey
        )}/transitions?expand=transitions.fields`,
        { headers: authHeaders, cache: "no-store" }
      );

      if (coreRes.ok) {
        const coreData = await coreRes.json();
        const transitions: JiraTransitionItem[] = coreData.transitions || [];

        const scored = transitions
          .map((t) => ({
            ...t,
            score: scoreTransition(
              t.name,
              t.to?.name,
              t.to?.statusCategory?.key
            ),
          }))
          .filter((t) => t.score > 0)
          .sort((a, b) => b.score - a.score);

        if (scored.length > 0) {
          const chosen = scored[0];
          const payload: {
            transition: { id: string };
            fields?: Record<string, unknown>;
          } = {
            transition: { id: String(chosen.id) },
          };

          // If resolution field is on the transition screen, provide an appropriate resolution
          if (chosen.fields?.resolution) {
            const allowed = chosen.fields.resolution.allowedValues || [];
            const cancelRes =
              allowed.find((r) =>
                /cancel|withdraw|won't|discard/i.test(r.name || "")
              ) ||
              allowed.find((r) =>
                /done|closed|resolved/i.test(r.name || "")
              ) ||
              allowed[0];

            if (cancelRes?.name) {
              payload.fields = {
                resolution: { name: cancelRes.name },
              };
            }
          }

          let postRes = await fetch(
            `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
              ticketKey
            )}/transitions`,
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify(payload),
            }
          );

          // If failed with fields, retry without fields
          if (!postRes.ok && payload.fields) {
            postRes = await fetch(
              `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
                ticketKey
              )}/transitions`,
              {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ transition: { id: String(chosen.id) } }),
              }
            );
          }

          if (postRes.ok) {
            transitionedStatus = chosen.to?.name || chosen.name || "Canceled";

            // Post cancellation comment to Jira Core
            await fetch(
              `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
                ticketKey
              )}/comment`,
              {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                  body: {
                    type: "doc",
                    version: 1,
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: "Request canceled by the reporter.",
                          },
                        ],
                      },
                    ],
                  },
                }),
              }
            ).catch(() => {});

            return NextResponse.json({
              success: true,
              status: transitionedStatus,
              method: "jira_core_transition",
            });
          }
          const coreErrText = await postRes.text().catch(() => "");
          console.warn(`Jira Core Transition POST failed for ${ticketKey}:`, coreErrText);
        }
      }
    } catch (err) {
      console.warn("Jira Core Transition attempt error:", err);
    }

    // 5. ATTEMPT 3: Graceful Workflow Fallback
    // When the current workflow status does not allow direct transition by the reporter,
    // post an official cancellation request comment and flag the ticket for the agent queue.
    let commentPosted = false;

    // Try JSM Customer Comment endpoint
    try {
      const commentRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(
          ticketKey
        )}/comment`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            body: "⚠️ [Cancellation Request] The reporter has requested to cancel this request as it is no longer needed. Please review and close/cancel this ticket.",
            public: true,
          }),
        }
      );
      if (commentRes.ok) {
        commentPosted = true;
      }
    } catch {
      // Ignore JSM comment error
    }

    // If JSM comment failed, try Jira Core Comment endpoint
    if (!commentPosted) {
      try {
        const jiraCommentRes = await fetch(
          `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(
            ticketKey
          )}/comment`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              body: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "⚠️ [Cancellation Request] The reporter has requested to cancel this request as it is no longer needed. Please review and close/cancel this ticket.",
                      },
                    ],
                  },
                ],
              },
            }),
          }
        );
        if (jiraCommentRes.ok) {
          commentPosted = true;
        }
      } catch {
        // Ignore Jira comment error
      }
    }

    // Try adding the label 'cancellation-requested'
    try {
      await fetch(
        `${authCtx.baseUrl}/rest/api/3/issue/${encodeURIComponent(ticketKey)}`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            update: {
              labels: [{ add: "cancellation-requested" }],
            },
          }),
        }
      );
    } catch {
      // Ignore label update failure
    }

    if (commentPosted) {
      return NextResponse.json({
        success: true,
        status: "Cancellation Requested",
        cancellationRequested: true,
        message:
          "Cancellation request recorded and sent to the support team.",
      });
    }

    return NextResponse.json(
      {
        error:
          "This request cannot be transitioned or canceled in its current status. Please contact the service desk directly.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel ticket";
    console.error("Cancel API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
