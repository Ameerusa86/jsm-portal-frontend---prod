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
  const baseUrl =
    session.siteUrl ||
    process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
    "https://emsmc1.atlassian.net";

  const myTicketsUrl = `${baseUrl}/servicedesk/customer/user/requests?issueKey=${encodeURIComponent(resolvedParams.id)}`;

  redirect(myTicketsUrl);
}
