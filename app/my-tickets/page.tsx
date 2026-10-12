import { redirect } from "next/navigation";

export default function MyTicketsPage() {
  const baseUrl =
    process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
    "https://emsmc.atlassian.net";
  
  // URL to the customer portal "My Requests" page
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests`;
  
  redirect(myTicketsUrl);
}
