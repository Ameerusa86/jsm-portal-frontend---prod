import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Ticket } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketDetailDrawer } from "@/components/tickets/TicketDetailDrawer";
import { redirect } from "next/navigation";

export default async function TicketDirectPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const ticketId = resolvedParams.id;

  // Seamlessly route to the tickets dashboard with this ticket opened in the detail drawer
  redirect(`/tickets?id=${encodeURIComponent(ticketId)}`);
}
