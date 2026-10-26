"use client";

import React, { useMemo } from "react";
import {
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";
import {
  getStatusStyle,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";

interface TicketsKanbanProps {
  tickets: TicketItem[];
  onSelectTicket: (ticket: TicketItem) => void;
  selectedTicketKey?: string | null;
}

export const TicketsKanban: React.FC<TicketsKanbanProps> = ({
  tickets,
  onSelectTicket,
  selectedTicketKey,
}) => {
  const columns = useMemo(() => {
    const cols: Record<
      string,
      {
        id: string;
        title: string;
        icon: typeof Clock;
        color: string;
        bg: string;
        badgeBg: string;
        items: TicketItem[];
      }
    > = {
      new: {
        id: "new",
        title: "Submitted / Open",
        icon: HelpCircle,
        color: "text-purple-600",
        bg: "border-purple-200/80 bg-purple-50/30",
        badgeBg: "bg-purple-100 text-purple-700",
        items: [],
      },
      indeterminate: {
        id: "indeterminate",
        title: "In Progress / Review",
        icon: Clock,
        color: "text-sky-600",
        bg: "border-sky-200/80 bg-sky-50/30",
        badgeBg: "bg-sky-100 text-sky-700",
        items: [],
      },
      "waiting-customer": {
        id: "waiting-customer",
        title: "Action Needed",
        icon: AlertCircle,
        color: "text-amber-600",
        bg: "border-amber-200/80 bg-amber-50/30",
        badgeBg: "bg-amber-100 text-amber-700",
        items: [],
      },
      done: {
        id: "done",
        title: "Resolved / Closed",
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "border-emerald-200/80 bg-emerald-50/30",
        badgeBg: "bg-emerald-100 text-emerald-700",
        items: [],
      },
    };

    tickets.forEach((ticket) => {
      const style = getStatusStyle(ticket.status, ticket.statusCategory);
      const catKey = style.categoryKey;
      if (catKey === "waiting-customer") {
        cols["waiting-customer"].items.push(ticket);
      } else if (catKey === "done" || catKey === "canceled") {
        cols.done.items.push(ticket);
      } else if (catKey === "new") {
        cols.new.items.push(ticket);
      } else {
        cols.indeterminate.items.push(ticket);
      }
    });

    return Object.values(cols);
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className={`rounded-2xl border p-3 flex flex-col h-[700px] ${col.bg}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-2 mb-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h4 className="text-xs font-bold text-slate-800">
                  {col.title}
                </h4>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}
              >
                {col.items.length}
              </span>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {col.items.map((ticket) => {
                const isSelected = selectedTicketKey === ticket.key;

                return (
                  <div
                    key={ticket.id || ticket.key}
                    onClick={() => onSelectTicket(ticket)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                        : "bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top info */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80">
                          {ticket.key}
                        </span>
                        <PriorityChip
                          priority={ticket.priority?.name || "Medium"}
                          showLabel={false}
                        />
                      </div>

                      {/* Summary */}
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-relaxed mb-1.5">
                        {ticket.summary}
                      </p>

                      {/* Client Name */}
                      {(ticket.clientName || ticket.organization) && (
                        <div className="mb-2">
                          <ClientBadge
                            clientName={ticket.clientName || ticket.organization}
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span className="truncate max-w-[120px] font-medium text-slate-600">
                        {ticket.projectName || ticket.projectKey || ticket.type}
                      </span>
                      <span className="font-mono text-slate-400">
                        {formatRelativeTime(ticket.updated || ticket.created)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {col.items.length === 0 && (
                <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-center p-4">
                  <p className="text-xs text-slate-400 font-medium">No requests in this stage</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
