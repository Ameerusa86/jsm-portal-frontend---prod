"use client";

import React, { useState } from "react";
import { Copy, Check, User, Building } from "lucide-react";
import Image from "next/image";
import { TicketItem } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";

interface TicketsGridProps {
  tickets: TicketItem[];
  onSelectTicket: (ticket: TicketItem) => void;
  selectedTicketKey?: string | null;
}

export const TicketsGrid: React.FC<TicketsGridProps> = ({
  tickets,
  onSelectTicket,
  selectedTicketKey,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {tickets.map((ticket) => {
        const isSelected = selectedTicketKey === ticket.key;

        return (
          <div
            key={ticket.id || ticket.key}
            onClick={() => onSelectTicket(ticket)}
            className={`group rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              isSelected
                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md"
            }`}
          >
            {/* Top row: Department + Priority + Key */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Department Tag */}
                  {(ticket.projectName || ticket.projectKey) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold tracking-wider uppercase truncate">
                      {ticket.projectKey || ticket.projectName}
                    </span>
                  )}

                  {/* Priority Chip */}
                  <PriorityChip
                    priority={ticket.priority?.name || "Medium"}
                    showLabel={true}
                  />
                </div>

                {/* Key with Copy Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                    {ticket.key}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyKey(e, ticket.key)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Copy issue key"
                  >
                    {copiedKey === ticket.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
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
                    {ticket.assignee.avatarUrl ? (
                      <Image
                        src={ticket.assignee.avatarUrl}
                        alt={ticket.assignee.displayName}
                        width={40}
                        height={40}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {ticket.assignee.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
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
          </div>
        );
      })}
    </div>
  );
};
