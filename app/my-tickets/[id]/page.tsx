import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SingleTicketPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const resolvedParams = await params;
  const rawBaseUrl =
    session.siteUrl ||
    process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
    "https://emsmc.atlassian.net";

  const baseUrl =
    !rawBaseUrl || rawBaseUrl.includes("sandbox") || rawBaseUrl.includes("emsmc1")
      ? "https://emsmc.atlassian.net"
      : rawBaseUrl;

  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(resolvedParams.id)}`;

  redirect(myTicketsUrl);
}
