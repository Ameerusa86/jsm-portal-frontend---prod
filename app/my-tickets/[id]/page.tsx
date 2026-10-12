import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SingleTicketPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const baseUrl =
    process.env.JIRA_BASE_URL && !process.env.JIRA_BASE_URL.includes("sandbox")
      ? process.env.JIRA_BASE_URL.replace(/\/+$/, "")
      : "https://emsmc.atlassian.net";
  
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${resolvedParams.id}`;
  
  redirect(myTicketsUrl);
}
