"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { TicketItem } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "cn";

interface TicketsGridProps {
  tickets: TicketItem[];
  selectedTicketKey: string | null;
  onSelectTicket: (ticket: TicketItem) => void;
}

export const TicketsGrid: React.FC<TicketsGridProps> = ({
  tickets,
  selectedTicketKey,
  onSelectTicket,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {tickets.map((ticket) => {
        const isSelected = selectedTicketKey === ticket.key;

        return (
          <Card
            key={ticket.id || ticket.key}
            onClick={() => onSelectTicket(ticket)}
            className={cn(
              "group rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden",
              isSelected
                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md"
            )}
          >
            {/* Top row: Department + Priority + Key */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Department Tag */}
                  {(ticket.projectName || ticket.projectKey) && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold tracking-wider uppercase truncate px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {ticket.projectKey || ticket.projectName}
                    </Badge>
                  )}

                  {/* Priority Chip */}
                  <PriorityChip
                    priority={ticket.priority?.name || "Medium"}
                    showLabel={true}
                  />
                </div>

                {/* Key with Copy Button */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border-blue-200/80 px-2 py-0.5 rounded-md"
                  >
                    {ticket.key}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => handleCopyKey(e, ticket.key)}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Copy issue key"
                  >
                    {copiedKey === ticket.key ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Summary / Title */}
              <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                {ticket.summary}
              </h3>

              {/* Client / Organization Name */}
              {(ticket.clientName || ticket.organization) && (
                <div className="mb-2.5">
                  <ClientBadge
                    clientName={ticket.clientName || ticket.organization}
                  />
                </div>
              )}

              {/* Request Type */}
              <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                <span className="font-medium text-slate-400">Type:</span>{" "}
                {ticket.type}
              </p>
            </div>

            {/* Bottom row: Status badge + Relative time + Assignee */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
              <StatusBadge
                status={ticket.status}
                statusCategory={ticket.statusCategory}
              />

              <div className="flex items-center gap-3 shrink-0">
                {/* Assignee Avatar / Name */}
                {ticket.assignee?.displayName ? (
                  <div
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                    title={`Assigned to ${ticket.assignee.displayName}`}
                  >
                    <Avatar size="sm" className="size-6 border border-slate-200">
                      {ticket.assignee.avatarUrl && (
                        <AvatarImage
                          src={ticket.assignee.avatarUrl}
                          alt={ticket.assignee.displayName}
                        />
                      )}
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                        {ticket.assignee.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-22.5 truncate text-[11px] font-medium text-slate-700">
                      {ticket.assignee.displayName}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Unassigned
                  </span>
                )}

                {/* Relative timestamp */}
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatRelativeTime(ticket.updated || ticket.created)}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
