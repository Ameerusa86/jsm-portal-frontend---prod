"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";
import {
  StatusBadge,
  PriorityChip,
  ClientBadge,
  formatRelativeTime,
} from "./TicketBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
        <div className="bg-muted/40 border border-border rounded-xl px-3 py-2 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold shrink-0">
            <MoveHorizontal className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Horizontal Scroll:</span>
          </div>

          {/* Quick Scroll Left Button */}
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={() => scrollByAmount(-350)}
            disabled={!canScrollLeft}
            className="cursor-pointer shrink-0"
            title="Scroll table left"
            aria-label="Scroll table left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

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
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={() => scrollByAmount(350)}
            disabled={!canScrollRight}
            className="cursor-pointer shrink-0"
            title="Scroll table right"
            aria-label="Scroll table right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN DATA TABLE CONTAINER                                 */}
      {/* ========================================================= */}
      <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-xs relative">
        <Table
          containerRef={tableContainerRef}
          containerClassName="scroll-smooth"
          className="w-full text-left text-xs border-collapse"
        >
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 text-muted-foreground font-bold uppercase tracking-wider text-[11px] select-none hover:bg-muted/60">
              {/* Sticky Left Column: Key */}
              <TableHead className="py-3.5 px-4 sticky left-0 z-20 bg-muted shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                Key
              </TableHead>
              <TableHead className="py-3.5 px-4 min-w-[260px]">Summary & Type</TableHead>
              <TableHead className="py-3.5 px-4 min-w-[200px]">Client / Organization</TableHead>
              <TableHead className="py-3.5 px-4 min-w-[140px]">Department</TableHead>
              <TableHead className="py-3.5 px-4 min-w-[130px]">Status</TableHead>
              <TableHead className="py-3.5 px-4 min-w-[100px]">Priority</TableHead>
              <TableHead className="py-3.5 px-4 min-w-[140px]">Assignee</TableHead>
              <TableHead className="py-3.5 px-4 text-right min-w-[110px]">Updated</TableHead>
              <TableHead className="py-3.5 px-4 text-center min-w-[90px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-foreground">
            {tickets.map((ticket) => {
              const isSelected = selectedTicketKey === ticket.key;

              return (
                <TableRow
                  key={ticket.id || ticket.key}
                  onClick={() => onSelectTicket(ticket)}
                  className={cn(
                    "group transition-colors cursor-pointer hover:bg-muted/40",
                    isSelected && "bg-blue-50/50 font-medium dark:bg-blue-950/20"
                  )}
                >
                  {/* Sticky Left Column: Key */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap sticky left-0 z-10 bg-card group-hover:bg-muted/40 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-1.5">
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
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        title="Copy ticket key"
                      >
                        {copiedKey === ticket.key ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>

                  {/* Summary & Type */}
                  <TableCell className="py-3.5 px-4">
                    <div className="min-w-0 max-w-md">
                      <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">
                        {ticket.summary}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {ticket.type}
                      </p>
                    </div>
                  </TableCell>

                  {/* Client / Organization */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">
                    <ClientBadge
                      clientName={ticket.clientName || ticket.organization}
                    />
                  </TableCell>

                  {/* Department */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
                    >
                      {ticket.projectKey || ticket.projectName || "General"}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge
                      status={ticket.status}
                      statusCategory={ticket.statusCategory}
                    />
                  </TableCell>

                  {/* Priority */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityChip
                      priority={ticket.priority?.name || "Medium"}
                      showLabel={true}
                    />
                  </TableCell>

                  {/* Assignee */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">
                    {ticket.assignee?.displayName ? (
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <Avatar size="sm" className="size-5 border border-border">
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
                        <span className="truncate max-w-[130px] font-medium">
                          {ticket.assignee.displayName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">
                        Unassigned
                      </span>
                    )}
                  </TableCell>

                  {/* Updated */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-[11px] text-muted-foreground">
                    {formatRelativeTime(ticket.updated || ticket.created)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className="cursor-pointer hover:bg-blue-600 hover:text-white"
                        title="View request details"
                      >
                        <ArrowRight className="size-3.5" />
                      </Button>

                      {ticket.portalUrl && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(ticket.portalUrl, "_blank", "noopener,noreferrer");
                          }}
                          className="cursor-pointer"
                          title="Open in native Jira portal"
                        >
                          <ExternalLink className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* ========================================================= */}
        {/* STICKY BOTTOM FLOATING SCROLLBAR                          */}
        {/* Sticks to bottom of viewport so users don't have to       */}
        {/* scroll all the way down to the end of the table to scroll */}
        {/* ========================================================= */}
        {needsHorizontalScroll && (
          <div className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-xs border-t border-border py-2 px-4 flex items-center justify-between gap-3 shadow-md">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
              Scroll Table:
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => scrollByAmount(-350)}
              disabled={!canScrollLeft}
              className="cursor-pointer shrink-0"
              title="Scroll left"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <div
              ref={bottomStickyScrollRef}
              onScroll={handleBottomStickyScroll}
              className="overflow-x-auto flex-1 h-2.5 cursor-ew-resize rounded-full"
              style={{ scrollbarWidth: "thin" }}
            >
              <div style={{ width: scrollWidth, height: 1 }} />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => scrollByAmount(350)}
              disabled={!canScrollRight}
              className="cursor-pointer shrink-0"
              title="Scroll right"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
