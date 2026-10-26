"use client";

import React from "react";
import Link from "next/link";
import { Plus, Download, ExternalLink, Ticket } from "lucide-react";

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
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-mono">
              Custom
            </span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Subtle Live Auto-Update status badge */}
        {isAutoUpdating && (
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs font-medium"
            title="Tickets update automatically in real-time"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline text-slate-600 font-semibold text-[11px]">
              Live Updates
            </span>
          </div>
        )}

        {/* Export CSV button */}
        <button
          type="button"
          onClick={onExportCsv}
          disabled={totalCount === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer min-h-[40px] shadow-2xs active:scale-95"
          title="Download filtered tickets as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        {/* Native Tickets Page Link */}
        <Link
          href="/my-tickets"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all min-h-[40px] shadow-2xs group"
          title="Open Jira's native customer requests portal in a new tab"
        >
          <Ticket className="w-3.5 h-3.5 text-blue-600" />
          <span>Native Jira Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        </Link>

        {/* Submit New Request Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-blue-600/20 active:scale-95 min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </Link>
      </div>
    </div>
  );
};
