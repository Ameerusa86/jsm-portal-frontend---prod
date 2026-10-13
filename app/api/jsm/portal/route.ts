import { redirect } from "next/navigation";
import { getJiraAuthContext } from "@/lib/jira";

export async function GET(request: Request) {
  const authCtx = await getJiraAuthContext();

  const rawBaseUrl =
    authCtx.baseUrl.startsWith("http") && !authCtx.baseUrl.includes("api.atlassian.com")
      ? authCtx.baseUrl.replace(/\/+$/, "")
      : process.env.JIRA_BASE_URL?.replace(/\/+$/, "") || "https://emsmc1.atlassian.net";
  const baseUrl =
    !rawBaseUrl || rawBaseUrl.includes("sandbox")
      ? "https://emsmc1.atlassian.net"
      : rawBaseUrl;
  const searchParams = new URL(request.url).searchParams;
  const view = searchParams.get("view");
  const ticketKey = searchParams.get("key");
  const sdParam = searchParams.get("serviceDeskId");
  const serviceDeskId =
    sdParam ||
    authCtx.serviceDeskId ||
    process.env.JIRA_SERVICE_DESK_ID ||
    process.env.JIRA_SERVICE_DESK ||
    process.env.JSM_SERVICE_DESK_ID;

  if (!baseUrl || !serviceDeskId) {
    return new Response("Jira portal is not configured.", { status: 503 });
  }

  const path =
    view === "requests"
      ? `/servicedesk/customer/portal/${serviceDeskId}/user/requests`
      : view === "ticket" && ticketKey
        ? `/servicedesk/customer/portal/${serviceDeskId}/${encodeURIComponent(ticketKey)}`
        : `/servicedesk/customer/portal/${serviceDeskId}`;

  redirect(`${baseUrl}${path}`);
}
