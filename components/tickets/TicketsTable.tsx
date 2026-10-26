"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Building,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
} from "lucide-react";
import Image from "next/image";
import { TicketItem } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";

interface TicketsTableProps {
  tickets: TicketItem[];
  onSelectTicket: (ticket: TicketItem) => void;
  selectedTicketKey?: string | null;
}

export const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  onSelectTicket,
  selectedTicketKey,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // References for synchronized dual scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomStickyScrollRef = useRef<HTMLDivElement>(null);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsHorizontalScroll, setNeedsHorizontalScroll] = useState(false);

  const handleCopyKey = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Update scroll metrics and indicators
  const updateScrollState = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const sWidth = el.scrollWidth;
    const cWidth = el.clientWidth;
    const sLeft = el.scrollLeft;

    setScrollWidth(sWidth);
    setClientWidth(cWidth);
    setNeedsHorizontalScroll(sWidth > cWidth + 5);
    setCanScrollLeft(sLeft > 5);
    setCanScrollRight(sLeft + cWidth < sWidth - 5);
  }, []);

  // Synchronize scroll events
  useEffect(() => {
    updateScrollState();
    const el = tableContainerRef.current;
    if (!el) return;

    const handleMainScroll = () => {
      const sLeft = el.scrollLeft;

      if (
        topScrollRef.current &&
        Math.abs(topScrollRef.current.scrollLeft - sLeft) > 1
      ) {
        topScrollRef.current.scrollLeft = sLeft;
      }
      if (
        bottomStickyScrollRef.current &&
        Math.abs(bottomStickyScrollRef.current.scrollLeft - sLeft) > 1
      ) {
        bottomStickyScrollRef.current.scrollLeft = sLeft;
      }

      updateScrollState();
    };

    el.addEventListener("scroll", handleMainScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", handleMainScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tickets, updateScrollState]);

  // Synchronize top scrollbar movement to main table
  const handleTopScroll = () => {
    if (tableContainerRef.current && topScrollRef.current) {
      const sLeft = topScrollRef.current.scrollLeft;
      if (Math.abs(tableContainerRef.current.scrollLeft - sLeft) > 1) {
        tableContainerRef.current.scrollLeft = sLeft;
      }
    }
  };

  // Synchronize bottom sticky scrollbar movement to main table
  const handleBottomStickyScroll = () => {
    if (tableContainerRef.current && bottomStickyScrollRef.current) {
      const sLeft = bottomStickyScrollRef.current.scrollLeft;
      if (Math.abs(tableContainerRef.current.scrollLeft - sLeft) > 1) {
        tableContainerRef.current.scrollLeft = sLeft;
      }
    }
  };

  // Quick scroll button click handler
  const scrollByAmount = (amount: number) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* ========================================================= */}
      {/* TOP SYNCHRONIZED SCROLLBAR & CONTROLS                     */}
      {/* Allows horizontal scrolling directly from top of table    */}
      {/* ========================================================= */}
      {needsHorizontalScroll && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold shrink-0">
            <MoveHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Horizontal Scroll:</span>
          </div>

          {/* Quick Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollByAmount(-350)}
            disabled={!canScrollLeft}
            className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer shrink-0"
            title="Scroll table left"
            aria-label="Scroll table left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Top Real Scrollbar Track */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto flex-1 h-3 cursor-ew-resize rounded-full"
            style={{ scrollbarWidth: "thin" }}
          >
            <div style={{ width: scrollWidth, height: 1 }} />
          </div>

          {/* Quick Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollByAmount(350)}
            disabled={!canScrollRight}
            className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer shrink-0"
            title="Scroll table right"
            aria-label="Scroll table right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN DATA TABLE CONTAINER                                 */}
      {/* ========================================================= */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs relative">
        <div
          ref={tableContainerRef}
          className="overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "thin" }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95 text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                {/* Sticky Left Column: Key */}
                <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  Key
                </th>
                <th className="py-3.5 px-4 min-w-[260px]">Summary & Type</th>
                <th className="py-3.5 px-4 min-w-[200px]">Client / Organization</th>
                <th className="py-3.5 px-4 min-w-[140px]">Department</th>
                <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                <th className="py-3.5 px-4 min-w-[100px]">Priority</th>
                <th className="py-3.5 px-4 min-w-[140px]">Assignee</th>
                <th className="py-3.5 px-4 text-right min-w-[110px]">Updated</th>
                <th className="py-3.5 px-4 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tickets.map((ticket) => {
                const isSelected = selectedTicketKey === ticket.key;

                return (
                  <tr
                    key={ticket.id || ticket.key}
                    onClick={() => onSelectTicket(ticket)}
                    className={`group transition-colors cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? "bg-blue-50/50 font-medium" : ""
                    }`}
                  >
                    {/* Sticky Left Column: Key */}
                    <td className="py-3.5 px-4 whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                          {ticket.key}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyKey(e, ticket.key)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title="Copy ticket key"
                        >
                          {copiedKey === ticket.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Summary & Type */}
                    <td className="py-3.5 px-4">
                      <div className="min-w-0 max-w-md">
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {ticket.summary}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ticket.type}
                        </p>
                      </div>
                    </td>

                    {/* Client / Organization */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ClientBadge
                        clientName={ticket.clientName || ticket.organization}
                      />
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold tracking-wider uppercase">
                        {ticket.projectKey || ticket.projectName || "General"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={ticket.status}
                        statusCategory={ticket.statusCategory}
                      />
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityChip
                        priority={ticket.priority?.name || "Medium"}
                        showLabel={true}
                      />
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ticket.assignee?.displayName ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          {ticket.assignee.avatarUrl ? (
                            <Image
                              src={ticket.assignee.avatarUrl}
                              alt={ticket.assignee.displayName}
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700">
                              {ticket.assignee.displayName
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <span className="truncate max-w-[130px] font-medium">
                            {ticket.assignee.displayName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-[11px] text-slate-500">
                      {formatRelativeTime(ticket.updated || ticket.created)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(ticket);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors cursor-pointer"
                          title="View request details"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {ticket.portalUrl && (
                          <a
                            href={ticket.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Open in native Jira portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* STICKY BOTTOM FLOATING SCROLLBAR                          */}
        {/* Sticks to bottom of viewport so users don't have to       */}
        {/* scroll all the way down to the end of the table to scroll */}
        {/* ========================================================= */}
        {needsHorizontalScroll && (
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-2 px-4 flex items-center justify-between gap-3 shadow-md">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">
              Scroll Table:
            </span>

            <button
              type="button"
              onClick={() => scrollByAmount(-350)}
              disabled={!canScrollLeft}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={bottomStickyScrollRef}
              onScroll={handleBottomStickyScroll}
              className="overflow-x-auto flex-1 h-2.5 cursor-ew-resize rounded-full"
              style={{ scrollbarWidth: "thin" }}
            >
              <div style={{ width: scrollWidth, height: 1 }} />
            </div>

            <button
              type="button"
              onClick={() => scrollByAmount(350)}
              disabled={!canScrollRight}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
