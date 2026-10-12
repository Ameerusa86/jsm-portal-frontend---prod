import { redirect } from "next/navigation";

export default async function SingleTicketPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const baseUrl =
    process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
    "https://emsmc.atlassian.net";
  
  // URL to the customer portal "My Requests" page where they can see the ticket
  // Note: we link to the general requests page since we don't have the specific portal ID
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${resolvedParams.id}`;
  
  redirect(myTicketsUrl);
}
