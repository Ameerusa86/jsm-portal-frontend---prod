"use client";

import React, { useEffect, useRef } from "react";
import { RequestTypeWithGroup } from "@/types/jsm";
import {
  Laptop,
  Wifi,
  KeyRound,
  Users,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

interface QuickSearchDropdownProps {
  isOpen: boolean;
  query: string;
  results: RequestTypeWithGroup[];
  kbResults?: any[];
  kbLoading?: boolean;
  selectedIndex: number;
  onSelect: (rt: RequestTypeWithGroup) => void;
  onClose: () => void;
  onOpenFinder: () => void;
}

export const QuickSearchDropdown: React.FC<QuickSearchDropdownProps> = ({
  isOpen,
  query,
  results,
  kbResults = [],
  kbLoading = false,
  selectedIndex,
  onSelect,
  onClose,
  onOpenFinder,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen || !query.trim()) return null;

  const getServiceMeta = (rt: RequestTypeWithGroup) => {
    const text = `${rt.name} ${rt.description || ""} ${rt.group || ""}`.toLowerCase();

    if (
      text.includes("vpn") ||
      text.includes("wifi") ||
      text.includes("network") ||
      text.includes("connect")
    ) {
      return {
        icon: Wifi,
        bg: "bg-blue-50 text-blue-600 border-blue-200",
        sla: "Under 1 hr",
      };
    }
    if (
      text.includes("password") ||
      text.includes("access") ||
      text.includes("login") ||
      text.includes("locked") ||
      text.includes("mfa")
    ) {
      return {
        icon: KeyRound,
        bg: "bg-amber-50 text-amber-600 border-amber-200",
        sla: "Instant / 30m",
      };
    }
    if (
      text.includes("hardware") ||
      text.includes("laptop") ||
      text.includes("screen") ||
      text.includes("computer") ||
      text.includes("repair") ||
      text.includes("broken")
    ) {
      return {
        icon: Laptop,
        bg: "bg-purple-50 text-purple-600 border-purple-200",
        sla: "1-2 business days",
      };
    }
    if (
      text.includes("software") ||
      text.includes("license") ||
      text.includes("app") ||
      text.includes("saas")
    ) {
      return {
        icon: Layers,
        bg: "bg-indigo-50 text-indigo-600 border-indigo-200",
        sla: "Same day",
      };
    }
    if (
      text.includes("onboard") ||
      text.includes("employee") ||
      text.includes("hire") ||
      text.includes("contractor")
    ) {
      return {
        icon: Users,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        sla: "2 business days",
      };
    }
    if (
      text.includes("incident") ||
      text.includes("urgent") ||
      text.includes("outage")
    ) {
      return {
        icon: AlertCircle,
        bg: "bg-rose-50 text-rose-600 border-rose-200",
        sla: "High priority",
      };
    }

    return {
      icon: FileText,
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      sla: "Standard SLA",
    };
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {results.length > 0
              ? `Found ${results.length} matching request${results.length === 1 ? "" : "s"}`
              : "No direct matching requests"}
          </span>
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Use ↑ ↓ to navigate · Enter to select
        </span>
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {kbLoading && (
          <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2 border-b border-slate-100">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Searching Knowledge Base...</span>
          </div>
        )}

        {kbResults && kbResults.length > 0 && (
          <div className="border-b border-slate-100">
            <div className="px-4 py-2 bg-indigo-50/50 text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Help Articles
            </div>
            {kbResults.map((article) => (
              <a
                key={article.title}
                href={article.portalUrl || article.content?.iframeSrc || "#"}
                className="w-full p-3.5 sm:p-4 flex items-start gap-3.5 text-left transition-colors hover:bg-indigo-50/30 cursor-pointer block border-b border-slate-100 last:border-0"
              >
                <div className="w-10 h-10 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                    {article.title}
                  </span>
                  {article.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                      {article.excerpt.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center self-center text-indigo-600 font-medium text-xs gap-1 pl-2">
                  <span className="hidden sm:inline">Read</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Service Requests
          </div>
        )}
        {results.map((rt, index) => {
          const isSelected = index === selectedIndex;
          const { icon: Icon, bg, sla } = getServiceMeta(rt);

          return (
            <button
              key={rt.id}
              type="button"
              onClick={() => onSelect(rt)}
              className={`w-full p-3.5 sm:p-4 flex items-start gap-3.5 text-left transition-colors cursor-pointer border-b border-slate-100 last:border-0 ${
                isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${bg}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                    {rt.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {rt.group || "General"}
                  </span>
                </div>

                {rt.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                    {rt.description}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center self-center text-blue-600 font-medium text-xs gap-1 pl-2">
                <span className="hidden sm:inline">Select</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}

        {results.length === 0 && (!kbResults || kbResults.length === 0) && !kbLoading && (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              No results matching &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching with general terms like &ldquo;broken&rdquo;, &ldquo;wifi&rdquo;, or &ldquo;laptop&rdquo;.
            </p>
          </div>
        )}
      </div>


    </div>
  );
};
