import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MyTicketsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const rawBaseUrl =
    session.siteUrl ||
    process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
    "https://emsmc1.atlassian.net";
  const baseUrl =
    !rawBaseUrl || rawBaseUrl.includes("sandbox")
      ? "https://emsmc1.atlassian.net"
      : rawBaseUrl;
  
  // URL to the customer portal "My Requests" page
  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests`;
  
  redirect(myTicketsUrl);
}
