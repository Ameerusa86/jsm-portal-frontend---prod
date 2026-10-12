import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MyTicketsPage() {
  const baseUrl =
    process.env.JIRA_BASE_URL && !process.env.JIRA_BASE_URL.includes("sandbox")
      ? process.env.JIRA_BASE_URL.replace(/\/+$/, "")
      : "https://emsmc.atlassian.net";
  
  // Direct URL to the customer portal "My Requests" page in production
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests`;
  
  redirect(myTicketsUrl);
}
