import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function MyTicketsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }

  const baseUrl = session.siteUrl || process.env.JIRA_BASE_URL?.replace(/\/+$/, "") || "https://emsmc1.atlassian.net";
  
  // URL to the customer portal "My Requests" page
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests`;
  
  redirect(myTicketsUrl);
}
