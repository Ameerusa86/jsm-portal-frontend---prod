import { redirect } from "next/navigation";
import { getJiraAuthContext } from "@/lib/jira";

export async function GET(request: Request) {
  const authCtx = await getJiraAuthContext();

  const rawBase =
    authCtx.siteUrl ||
    (authCtx.baseUrl.startsWith("http") && !authCtx.baseUrl.includes("api.atlassian.com")
      ? authCtx.baseUrl.replace(/\/+$/, "")
      : process.env.JIRA_BASE_URL?.replace(/\/+$/, ""));

  const baseUrl =
    !rawBase || rawBase.includes("sandbox")
      ? "https://emsmc1.atlassian.net"
      : rawBase;

  const searchParams = new URL(request.url).searchParams;
  const view = searchParams.get("view");
  const ticketKey = searchParams.get("key");
  const sdParam = searchParams.get("serviceDeskId");
  const serviceDeskId =
    sdParam ||
    authCtx.serviceDeskId ||
    process.env.JIRA_SERVICE_DESK_ID ||
    process.env.JIRA_SERVICE_DESK ||
    process.env.JSM_SERVICE_DESK_ID ||
    "1";

  if (!baseUrl || !serviceDeskId) {
    return new Response("Jira portal is not configured.", { status: 503 });
  }

  if (view === "ticket" && ticketKey) {
    redirect(
      `${baseUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(ticketKey)}`
    );
  }

  const requestTypeId = searchParams.get("requestTypeId");
  const groupId = searchParams.get("groupId");
  if (requestTypeId && !/^(1\d\d|2\d\d|3\d\d|5\d\d)$/.test(requestTypeId)) {
    if (groupId) {
      redirect(`${baseUrl}/servicedesk/customer/portal/${serviceDeskId}/group/${groupId}/create/${requestTypeId}`);
    }
    redirect(`${baseUrl}/servicedesk/customer/portal/${serviceDeskId}/create/${requestTypeId}`);
  }

  redirect(`${baseUrl}/servicedesk/customer/portal/${serviceDeskId}`);
}
