// components/tickets/TicketExport.ts
import { TicketItem } from "@/types/jsm";

export function exportTicketsToCsv(tickets: TicketItem[], filename = "my-tickets.csv") {
  if (!tickets || tickets.length === 0) return;

  const headers = [
    "Key",
    "Summary",
    "Client / Organization",
    "Status",
    "Status Category",
    "Request Type",
    "Space / Department",
    "Priority",
    "Assignee",
    "Reporter",
    "Created Date",
    "Updated Date",
    "Resolution",
    "Portal URL",
  ];

  const rows = tickets.map((t) => [
    `"${(t.key || "").replace(/"/g, '""')}"`,
    `"${(t.summary || "").replace(/"/g, '""')}"`,
    `"${(t.clientName || t.organization || "").replace(/"/g, '""')}"`,
    `"${(t.status || "").replace(/"/g, '""')}"`,
    `"${(t.statusCategoryName || t.statusCategory || "").replace(/"/g, '""')}"`,
    `"${(t.type || "").replace(/"/g, '""')}"`,
    `"${(t.projectName || t.projectKey || "").replace(/"/g, '""')}"`,
    `"${(t.priority?.name || "Medium").replace(/"/g, '""')}"`,
    `"${(t.assignee?.displayName || "Unassigned").replace(/"/g, '""')}"`,
    `"${(t.reporter?.displayName || "").replace(/"/g, '""')}"`,
    `"${t.created || ""}"`,
    `"${t.updated || ""}"`,
    `"${(t.resolution?.name || "").replace(/"/g, '""')}"`,
    `"${(t.portalUrl || t.backendUrl || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
