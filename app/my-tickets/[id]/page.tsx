import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
    "https://emsmc1.atlassian.net";

  const baseUrl =
    !rawBaseUrl || rawBaseUrl.includes("sandbox")
      ? "https://emsmc1.atlassian.net"
      : rawBaseUrl;

  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(resolvedParams.id)}`;

  redirect(myTicketsUrl);
}
