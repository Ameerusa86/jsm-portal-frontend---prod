"use client";

import React, { useEffect, useRef } from "react";
import { JsmSpace, RequestTypeWithGroup, KnowledgeBaseArticle } from "@/types/jsm";
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
  Search,
  CreditCard,
  Headphones,
  Building2,
  FolderKanban,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DropdownKbArticle = KnowledgeBaseArticle;

interface QuickSearchDropdownProps {
  isOpen: boolean;
  query: string;
  results: RequestTypeWithGroup[];
  spaces?: JsmSpace[];
  kbResults?: DropdownKbArticle[];
  kbLoading?: boolean;
  selectedIndex: number;
  onSelect: (rt: RequestTypeWithGroup) => void;
  onClose: () => void;
}

export const QuickSearchDropdown: React.FC<QuickSearchDropdownProps> = ({
  isOpen,
  query,
  results,
  spaces = [],
  kbResults = [],
  kbLoading = false,
  selectedIndex,
  onSelect,
  onClose,
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

  const getSpaceInfo = (rt: RequestTypeWithGroup) => {
    const matchedSpace = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
    const spaceName =
      rt.spaceName ||
      matchedSpace?.projectName ||
      (rt.serviceDeskId === "1" || rt.serviceDeskId === "4" ? "Information Technology" : undefined) ||
      "Enterprise Service";
    const spaceKey =
      rt.spaceKey ||
      (matchedSpace as { projectKey?: string })?.projectKey;

    const lowerName = spaceName.toLowerCase();
    const lowerKey = (spaceKey || "").toLowerCase();

    // IT / Technology
    if (
      lowerKey === "it" ||
      lowerKey === "tech" ||
      lowerKey === "its" ||
      lowerName.includes("information technology") ||
      lowerName.includes("it support") ||
      lowerName.includes("tech")
    ) {
      return {
        name: spaceName,
        key: spaceKey || "IT",
        icon: Laptop,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90",
        dotClass: "bg-blue-500",
      };
    }

    // Billing / Finance / Accounting / Revenue
    if (
      lowerKey === "bill" ||
      lowerKey === "fin" ||
      lowerKey === "rev" ||
      lowerName.includes("billing") ||
      lowerName.includes("finance") ||
      lowerName.includes("revenue") ||
      lowerName.includes("accounting")
    ) {
      return {
        name: spaceName,
        key: spaceKey || "BILL",
        icon: CreditCard,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
        dotClass: "bg-emerald-500",
      };
    }

    // HR / Human Resources / People
    if (
      lowerKey === "hr" ||
      lowerKey === "people" ||
      lowerName.includes("human resources") ||
      lowerName.includes("people") ||
      lowerName.includes("talent") ||
      lowerName.includes("employee")
    ) {
      return {
        name: spaceName,
        key: spaceKey || "HR",
        icon: Users,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200/90",
        dotClass: "bg-purple-500",
      };
    }

    // Client Operations / Support / Operations
    if (
      lowerKey === "ops" ||
      lowerKey === "cs" ||
      lowerName.includes("operations") ||
      lowerName.includes("client") ||
      lowerName.includes("customer")
    ) {
      return {
        name: spaceName,
        key: spaceKey || "OPS",
        icon: Headphones,
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/90",
        dotClass: "bg-sky-500",
      };
    }

    // Facilities / Workplace
    if (
      lowerName.includes("facilities") ||
      lowerName.includes("workplace") ||
      lowerName.includes("building")
    ) {
      return {
        name: spaceName,
        key: spaceKey || "FAC",
        icon: Building2,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/90",
        dotClass: "bg-amber-500",
      };
    }

    return {
      name: spaceName,
      key: spaceKey,
      icon: FolderKanban,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200/90",
      dotClass: "bg-slate-400",
    };
  };

  const getServiceMeta = (rt: RequestTypeWithGroup, spaceName?: string) => {
    const text = `${rt.name} ${rt.description || ""} ${rt.group || ""} ${spaceName || ""}`.toLowerCase();

    // Financial / Billing specific
    if (
      text.includes("invoice") ||
      text.includes("billing") ||
      text.includes("reconcil") ||
      text.includes("remittance") ||
      text.includes("refund") ||
      text.includes("tax") ||
      text.includes("w-9") ||
      text.includes("ledger")
    ) {
      return {
        icon: text.includes("refund") ? DollarSign : CreditCard,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        sla: "1-2 business days",
      };
    }

    // Network / VPN / Access
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

    // Password / MFA / Security
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

    // Hardware / Laptop / Repair
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

    // Software / SaaS
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

    // HR / Employee / Onboarding / Benefits
    if (
      text.includes("onboard") ||
      text.includes("employee") ||
      text.includes("hire") ||
      text.includes("contractor") ||
      text.includes("benefit") ||
      text.includes("human resources")
    ) {
      return {
        icon: Users,
        bg: "bg-purple-50 text-purple-600 border-purple-200",
        sla: "2 business days",
      };
    }

    // Client Operations / Support
    if (
      text.includes("operations") ||
      text.includes("client") ||
      text.includes("customer")
    ) {
      return {
        icon: Headphones,
        bg: "bg-sky-50 text-sky-600 border-sky-200",
        sla: "Same day",
      };
    }

    // Facilities
    if (
      text.includes("badge") ||
      text.includes("building") ||
      text.includes("facilities") ||
      text.includes("office")
    ) {
      return {
        icon: Building2,
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        sla: "1 business day",
      };
    }

    // Incidents / Emergencies
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
    <Card
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Search className="size-3.5 text-primary" />
          <span>
            {results.length > 0
              ? `Found ${results.length} matching request${results.length === 1 ? "" : "s"}`
              : "No direct matching requests"}
          </span>
        </span>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Use ↑ ↓ to navigate · Enter to select
        </span>
      </div>

      <div className="max-h-[60vh] sm:max-h-[380px] overflow-y-auto divide-y divide-border/60 scroll-smooth">
        {kbLoading && (
          <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2 border-b border-slate-100">
            <Clock className="size-4 animate-spin" />
            <span>Searching Knowledge Base...</span>
          </div>
        )}

        {kbResults && kbResults.length > 0 && (
          <div className="border-b border-slate-100">
            <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="size-3.5" />
              Help Articles
            </div>
            {kbResults.map((article) => (
              <a
                key={String(article.id || article.portalUrl || article.title)}
                href={article.portalUrl || article.content?.iframeSrc || "#"}
                className="w-full p-3.5 sm:p-4 flex items-start gap-3.5 text-left transition-colors hover:bg-muted/30 cursor-pointer block border-b border-slate-100 last:border-0"
              >
                <div className="size-10 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                    {article.title}
                  </span>
                  {article.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                      {article.excerpt.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center self-center text-primary font-medium text-xs gap-1 pl-2">
                  <span className="hidden sm:inline">Read</span>
                  <ArrowRight className="size-4" />
                </div>
              </a>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Service Requests
          </div>
        )}
        {results.map((rt, index) => {
          const isSelected = index === selectedIndex;
          const spaceInfo = getSpaceInfo(rt);
          const { icon: Icon, bg } = getServiceMeta(rt, spaceInfo.name);
          const SpaceIcon = spaceInfo.icon;

          return (
            <button
              key={`${rt.serviceDeskId || ""}-${rt.id}`}
              type="button"
              onClick={() => onSelect(rt)}
              className={cn(
                "w-full p-3.5 sm:p-4 flex items-start gap-3.5 text-left transition-colors cursor-pointer border-b border-slate-100 last:border-0",
                isSelected ? "bg-muted/60" : "hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs",
                  bg
                )}
              >
                <Icon className="size-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                    {rt.name}
                  </span>

                  {/* Prominent Department / Space Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
                      spaceInfo.badgeClass
                    )}
                    title={`Department: ${spaceInfo.name}`}
                  >
                    <SpaceIcon className="size-3 shrink-0" />
                    <span>{spaceInfo.name}</span>
                  </Badge>

                  {/* Group / Category Badge */}
                  {rt.group &&
                    rt.group !== "General Requests" &&
                    rt.group !== "General" && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                      >
                        {rt.group}
                      </Badge>
                    )}
                </div>

                {rt.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                    {rt.description}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center self-center text-primary font-medium text-xs gap-1 pl-2">
                <span className="hidden sm:inline">Select</span>
                <ArrowRight className="size-4" />
              </div>
            </button>
          );
        })}

        {results.length === 0 && (!kbResults || kbResults.length === 0) && !kbLoading && (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">
              No results matching &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try searching with general terms like &ldquo;broken&rdquo;, &ldquo;wifi&rdquo;, or &ldquo;laptop&rdquo;.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
