"use client";

import React from "react";
import Link from "next/link";
import { Plus, Download, ExternalLink, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TicketsHeaderProps {
  onExportCsv: () => void;
  totalCount: number;
  isAutoUpdating?: boolean;
}

export const TicketsHeader: React.FC<TicketsHeaderProps> = ({
  onExportCsv,
  totalCount,
  isAutoUpdating = true,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Requests & Ticket Center</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Export CSV button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={totalCount === 0}
          className="h-10 px-3 border-slate-200 text-slate-700 shadow-2xs font-semibold cursor-pointer"
          title="Download filtered tickets as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>

        {/* Native Tickets Page Link */}
        <Link
          href="/my-tickets"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs group font-semibold",
          )}
          title="Open Jira's native customer requests portal in a new tab"
        >
          <Ticket className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
          <span>Native Jira Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-1.5" />
        </Link>

        {/* Submit New Request Button */}
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-600/20",
          )}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Request</span>
        </Link>
      </div>
    </div>
  );
};
