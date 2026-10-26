"use client";

import React from "react";
import {
  Layers,
  Clock,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";
import { getStatusStyle } from "./TicketBadge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TicketsStatsProps {
  tickets: TicketItem[];
  activeStatusFilter: string;
  onSelectStatusFilter: (filter: string) => void;
}

export const TicketsStats: React.FC<TicketsStatsProps> = ({
  tickets,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const stats = React.useMemo(() => {
    let inProgress = 0;
    let waitingSupport = 0;
    let waitingCustomer = 0;
    let resolved = 0;

    tickets.forEach((t) => {
      const style = getStatusStyle(t.status, t.statusCategory);
      if (style.categoryKey === "done") {
        resolved++;
      } else if (style.categoryKey === "waiting-customer") {
        waitingCustomer++;
      } else if (style.categoryKey === "new") {
        waitingSupport++;
      } else {
        inProgress++;
      }
    });

    return {
      total: tickets.length,
      inProgress,
      waitingSupport,
      waitingCustomer,
      resolved,
    };
  }, [tickets]);

  const cards = [
    {
      id: "all",
      label: "All Requests",
      count: stats.total,
      subtext: "Total tickets logged",
      icon: Layers,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200/80",
      activeBg: "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm",
    },
    {
      id: "in-progress",
      label: "In Progress",
      count: stats.inProgress,
      subtext: "Actively being worked",
      icon: Clock,
      color: "text-sky-600",
      bg: "bg-sky-50 border-sky-200/80",
      activeBg: "bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-sm",
      pulse: stats.inProgress > 0,
    },
    {
      id: "waiting-support",
      label: "Waiting on Support",
      count: stats.waitingSupport,
      subtext: "Pending agent review",
      icon: HelpCircle,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200/80",
      activeBg: "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-sm",
    },
    {
      id: "waiting-customer",
      label: "Waiting on You",
      count: stats.waitingCustomer,
      subtext: "Customer reply needed",
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200/80",
      activeBg: "bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-sm",
      alert: stats.waitingCustomer > 0,
    },
    {
      id: "resolved",
      label: "Resolved",
      count: stats.resolved,
      subtext: "Completed & closed",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200/80",
      activeBg: "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeStatusFilter === c.id;

        return (
          <Card
            key={c.id}
            onClick={() => onSelectStatusFilter(isActive ? "all" : c.id)}
            className={cn(
              "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between",
              isActive
                ? c.activeBg
                : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105",
                  c.bg,
                  c.color
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                {c.count}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {c.label}
                </p>
                {c.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                {c.subtext}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
