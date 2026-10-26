"use client";

import React from "react";
import {
  AlertTriangle,
  Minus,
  ArrowDown,
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return dateStr;

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
}

export function formatFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function getStatusStyle(
  statusName: string = "",
  statusCategory?: string
) {
  const s = statusName.toLowerCase();
  const cat = (statusCategory || "").toLowerCase();

  // 1. Done / Resolved / Closed
  if (
    cat === "done" ||
    s.includes("resolved") ||
    s.includes("closed") ||
    s.includes("completed") ||
    s.includes("done")
  ) {
    return {
      label: statusName || "Resolved",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/80",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
      categoryKey: "done",
    };
  }

  // 2. Waiting for customer
  if (
    s.includes("waiting for customer") ||
    s.includes("need info") ||
    s.includes("customer pending") ||
    s.includes("pending you")
  ) {
    return {
      label: statusName || "Waiting for You",
      bg: "bg-amber-50 text-amber-700 border-amber-200/90 hover:bg-amber-100/80",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock,
      categoryKey: "waiting-customer",
    };
  }

  // 3. Waiting for support / New
  if (
    cat === "new" ||
    s.includes("waiting for support") ||
    s.includes("open") ||
    s.includes("to do") ||
    s.includes("submitted")
  ) {
    return {
      label: statusName || "Waiting for Support",
      bg: "bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100/80",
      dot: "bg-purple-500",
      icon: HelpCircle,
      categoryKey: "new",
    };
  }

  // 4. Canceled
  if (s.includes("cancel")) {
    return {
      label: statusName || "Canceled",
      bg: "bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100/80",
      dot: "bg-rose-500",
      icon: XCircle,
      categoryKey: "canceled",
    };
  }

  // 5. Default: In Progress / Indeterminate
  return {
    label: statusName || "In Progress",
    bg: "bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100/80",
    dot: "bg-blue-500 animate-pulse",
    icon: Clock,
    categoryKey: "indeterminate",
  };
}

export function getPriorityStyle(priorityName: string = "Medium") {
  const p = priorityName.toLowerCase();

  if (p.includes("highest") || p.includes("critical") || p.includes("urgent")) {
    return {
      label: priorityName,
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200 hover:bg-rose-100/80",
      icon: Flame,
    };
  }
  if (p.includes("high")) {
    return {
      label: priorityName,
      color: "text-orange-700",
      bg: "bg-orange-50 border-orange-200 hover:bg-orange-100/80",
      icon: AlertTriangle,
    };
  }
  if (p.includes("low")) {
    return {
      label: priorityName,
      color: "text-slate-600",
      bg: "bg-slate-100 border-slate-200 hover:bg-slate-200/80",
      icon: ArrowDown,
    };
  }

  // Medium
  return {
    label: priorityName || "Medium",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200 hover:bg-blue-100/80",
    icon: Minus,
  };
}

export const StatusBadge: React.FC<{
  status: string;
  statusCategory?: string;
  className?: string;
}> = ({ status, statusCategory, className = "" }) => {
  const style = getStatusStyle(status, statusCategory);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 px-2.5 py-0.5 font-semibold text-xs", style.bg, className)}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className="truncate">{style.label}</span>
    </Badge>
  );
};

export const PriorityChip: React.FC<{
  priority?: string;
  showLabel?: boolean;
  className?: string;
}> = ({ priority = "Medium", showLabel = true, className = "" }) => {
  const style = getPriorityStyle(priority);
  const Icon = style.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 px-2 py-0.5 font-semibold text-xs rounded-lg", style.bg, style.color, className)}
      title={`Priority: ${style.label}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {showLabel && <span>{style.label}</span>}
    </Badge>
  );
};

export const ClientBadge: React.FC<{
  clientName?: string | null;
  className?: string;
}> = ({ clientName, className = "" }) => {
  if (!clientName) return null;
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1 px-2 py-0.5 text-xs font-medium max-w-[200px] truncate border border-slate-200", className)}
      title={`Client / Organization: ${clientName}`}
    >
      <Building className="w-3 h-3 text-slate-500 shrink-0" />
      <span className="truncate">{clientName}</span>
    </Badge>
  );
};
