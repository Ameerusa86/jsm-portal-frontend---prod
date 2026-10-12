import { redirect } from "next/navigation";

export default function SingleTicketPage({ params }: { params: { id: string } }) {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/+$/, "") || "https://emsmc-sandbox.atlassian.net";
  
  // URL to the customer portal "My Requests" page where they can see the ticket
  // Note: we link to the general requests page since we don't have the specific portal ID
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${params.id}`;
  
  redirect(myTicketsUrl);
}
