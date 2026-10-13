import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function MyTicketsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }

  const rawBaseUrl = session.siteUrl || process.env.JIRA_BASE_URL?.replace(/\/+$/, "") || "https://emsmc.atlassian.net";
  const baseUrl =
    !rawBaseUrl || rawBaseUrl.includes("sandbox") || rawBaseUrl.includes("emsmc1")
      ? "https://emsmc.atlassian.net"
      : rawBaseUrl;
  
  // URL to the customer portal "My Requests" page
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests`;
  
  redirect(myTicketsUrl);
}
