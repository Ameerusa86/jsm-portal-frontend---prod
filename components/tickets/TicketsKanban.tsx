"use client";

import React, { useMemo } from "react";
import {
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";
import {
  getStatusStyle,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        badgeVariant: "default" | "secondary" | "outline";
        items: TicketItem[];
      }
    > = {
      new: {
        id: "new",
        title: "Submitted / Open",
        icon: HelpCircle,
        color: "text-purple-600 dark:text-purple-400",
        bg: "border-purple-200/80 bg-purple-50/30 dark:border-purple-900/40 dark:bg-purple-950/20",
        badgeVariant: "secondary",
        items: [],
      },
      indeterminate: {
        id: "indeterminate",
        title: "In Progress / Review",
        icon: Clock,
        color: "text-sky-600 dark:text-sky-400",
        bg: "border-sky-200/80 bg-sky-50/30 dark:border-sky-900/40 dark:bg-sky-950/20",
        badgeVariant: "secondary",
        items: [],
      },
      "waiting-customer": {
        id: "waiting-customer",
        title: "Action Needed",
        icon: AlertCircle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20",
        badgeVariant: "secondary",
        items: [],
      },
      done: {
        id: "done",
        title: "Resolved / Closed",
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20",
        badgeVariant: "secondary",
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
            className={cn(
              "rounded-2xl border p-3 flex flex-col h-[700px]",
              col.bg
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-2 mb-2 border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <Icon className={cn("size-4", col.color)} />
                <h4 className="text-xs font-bold text-foreground">
                  {col.title}
                </h4>
              </div>
              <Badge
                variant={col.badgeVariant}
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
              >
                {col.items.length}
              </Badge>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {col.items.map((ticket) => {
                const isSelected = selectedTicketKey === ticket.key;

                return (
                  <Card
                    key={ticket.id || ticket.key}
                    onClick={() => onSelectTicket(ticket)}
                    className={cn(
                      "cursor-pointer group flex flex-col justify-between py-0 gap-0 transition-all",
                      isSelected
                        ? "bg-blue-50/50 border-blue-500 shadow-sm ring-2 ring-blue-500/20 dark:bg-blue-950/30"
                        : "bg-card hover:bg-muted/40 border-border hover:border-slate-300 shadow-2xs hover:shadow-xs"
                    )}
                  >
                    <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Top info */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border-blue-200/80 px-1.5 py-0.5 rounded"
                          >
                            {ticket.key}
                          </Badge>
                          <PriorityChip
                            priority={ticket.priority?.name || "Medium"}
                            showLabel={false}
                          />
                        </div>

                        {/* Summary */}
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed mb-1.5">
                          {ticket.summary}
                        </p>

                        {/* Client Name */}
                        {(ticket.clientName || ticket.organization) && (
                          <div className="mb-2">
                            <ClientBadge
                              clientName={
                                ticket.clientName || ticket.organization
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                        <span className="truncate max-w-[120px] font-medium text-foreground">
                          {ticket.projectName ||
                            ticket.projectKey ||
                            ticket.type}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {formatRelativeTime(ticket.updated || ticket.created)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {col.items.length === 0 && (
                <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-xl text-center p-4">
                  <p className="text-xs text-muted-foreground font-medium">
                    No requests in this stage
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
