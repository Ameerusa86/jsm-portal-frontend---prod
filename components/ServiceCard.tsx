"use client";

import React from "react";
import { RequestType } from "@/types/jsm";
import {
  Laptop,
  Wifi,
  KeyRound,
  Users,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  CreditCard,
  DollarSign,
  Briefcase,
  Zap,
  Headphones,
  Building2,
  Sparkles,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  requestType: RequestType & { group?: string };
  boardName?: string;
  isIT?: boolean;
  onClick: () => void;
  variant?: "grid" | "list";
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  requestType,
  boardName,
  isIT = false,
  onClick,
  variant = "grid",
}) => {
  const getMetadata = () => {
    const text = `${requestType.name} ${requestType.group || ""}`.toLowerCase();

    // 1. Financial, Billing, Accounting
    if (
      text.includes("invoice") ||
      text.includes("billing") ||
      text.includes("payment") ||
      text.includes("remittance") ||
      text.includes("reconcil") ||
      text.includes("credit memo") ||
      text.includes("refund") ||
      text.includes("ledger") ||
      text.includes("tax") ||
      text.includes("w-9") ||
      text.includes("ar ") ||
      text.includes("ap ")
    ) {
      return {
        icon: text.includes("refund") || text.includes("credit") ? DollarSign : CreditCard,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/40 dark:text-emerald-400",
        glow: "hover:shadow-emerald-500/10",
        accent: "from-emerald-500 to-teal-600",
      };
    }

    // 2. Passwords, Logins, MFA, Security & Cloud Access
    if (
      text.includes("password") ||
      text.includes("access") ||
      text.includes("login") ||
      text.includes("locked") ||
      text.includes("permission") ||
      text.includes("mfa") ||
      text.includes("security") ||
      text.includes("iam") ||
      text.includes("credential")
    ) {
      return {
        icon: KeyRound,
        bg: "bg-amber-50 text-amber-600 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/40 dark:text-amber-400",
        glow: "hover:shadow-amber-500/10",
        accent: "from-amber-500 to-orange-500",
      };
    }

    // 3. Network, VPN & Remote Connectivity
    if (
      text.includes("vpn") ||
      text.includes("wifi") ||
      text.includes("network") ||
      text.includes("connect") ||
      text.includes("internet") ||
      text.includes("tunnel") ||
      text.includes("dns")
    ) {
      return {
        icon: Wifi,
        bg: "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-400",
        glow: "hover:shadow-blue-500/10",
        accent: "from-blue-500 to-indigo-600",
      };
    }

    // 4. Hardware, Laptops, Monitors & Workstations
    if (
      text.includes("laptop") ||
      text.includes("computer") ||
      text.includes("monitor") ||
      text.includes("hardware") ||
      text.includes("device") ||
      text.includes("keyboard") ||
      text.includes("mouse") ||
      text.includes("headset") ||
      text.includes("printer")
    ) {
      return {
        icon: Laptop,
        bg: "bg-indigo-50 text-indigo-600 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400",
        glow: "hover:shadow-indigo-500/10",
        accent: "from-indigo-500 to-blue-600",
      };
    }

    // 5. System Incidents, Outages & Bugs
    if (
      text.includes("problem") ||
      text.includes("issue") ||
      text.includes("broken") ||
      text.includes("error") ||
      text.includes("outage") ||
      text.includes("crash") ||
      text.includes("bug") ||
      text.includes("down") ||
      text.includes("incident")
    ) {
      return {
        icon: AlertCircle,
        bg: "bg-rose-50 text-rose-600 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white dark:bg-rose-950/40 dark:text-rose-400",
        glow: "hover:shadow-rose-500/10",
        accent: "from-rose-500 to-red-600",
      };
    }

    // 6. People, HR, Onboarding, Personnel
    if (
      text.includes("onboard") ||
      text.includes("hire") ||
      text.includes("employee") ||
      text.includes("offboard") ||
      text.includes("contractor") ||
      text.includes("role") ||
      text.includes("transfer") ||
      text.includes("team") ||
      text.includes("hr") ||
      text.includes("benefit") ||
      text.includes("leave")
    ) {
      return {
        icon: text.includes("role") || text.includes("transfer") ? Briefcase : Users,
        bg: "bg-violet-50 text-violet-600 border-violet-200/80 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950/40 dark:text-violet-400",
        glow: "hover:shadow-violet-500/10",
        accent: "from-violet-500 to-purple-600",
      };
    }

    // 7. Automation, Data, Reports, Workflows
    if (
      text.includes("automation") ||
      text.includes("report") ||
      text.includes("workflow") ||
      text.includes("pipeline") ||
      text.includes("dashboard") ||
      text.includes("analytics") ||
      text.includes("query") ||
      text.includes("sync")
    ) {
      return {
        icon: Zap,
        bg: "bg-teal-50 text-teal-600 border-teal-200/80 group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-950/40 dark:text-teal-400",
        glow: "hover:shadow-teal-500/10",
        accent: "from-teal-500 to-emerald-600",
      };
    }

    // 8. Customer Support / Operations
    if (
      text.includes("client") ||
      text.includes("customer") ||
      text.includes("support") ||
      text.includes("ticket") ||
      text.includes("service")
    ) {
      return {
        icon: Headphones,
        bg: "bg-sky-50 text-sky-600 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white dark:bg-sky-950/40 dark:text-sky-400",
        glow: "hover:shadow-sky-500/10",
        accent: "from-sky-500 to-blue-600",
      };
    }

    // 9. Workplace, Office, Facilities & Badges
    if (
      text.includes("badge") ||
      text.includes("building") ||
      text.includes("facility") ||
      text.includes("desk") ||
      text.includes("office") ||
      text.includes("parking")
    ) {
      return {
        icon: Building2,
        bg: "bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-700 group-hover:text-white dark:bg-amber-950/40 dark:text-amber-400",
        glow: "hover:shadow-amber-500/10",
        accent: "from-amber-600 to-orange-600",
      };
    }

    // 10. Suggestions & Ideas
    if (text.includes("suggest") || text.includes("idea") || text.includes("improv")) {
      return {
        icon: Sparkles,
        bg: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200/80 group-hover:bg-fuchsia-600 group-hover:text-white dark:bg-fuchsia-950/40 dark:text-fuchsia-400",
        glow: "hover:shadow-fuchsia-500/10",
        accent: "from-fuchsia-500 to-purple-600",
      };
    }

    // 11. Software, Tools & SaaS Licenses
    if (
      text.includes("software") ||
      text.includes("license") ||
      text.includes("tool") ||
      text.includes("saas") ||
      text.includes("app")
    ) {
      return {
        icon: Layers,
        bg: "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-400",
        glow: "hover:shadow-blue-500/10",
        accent: "from-blue-500 to-cyan-600",
      };
    }

    // Default Fallback
    return {
      icon: FileText,
      bg: "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-900 group-hover:text-white",
      glow: "hover:shadow-slate-500/10",
      accent: "from-slate-700 to-slate-900",
    };
  };

  const { icon: IconComponent, bg, glow, accent } = getMetadata();
  const isLocked = Boolean(requestType.isLocked);
  const categoryLabel =
    requestType.group && requestType.group !== "General Requests"
      ? requestType.group
      : null;

  const displayBadge = isIT ? (boardName || categoryLabel) : categoryLabel;
  const footerLabel = isIT ? (boardName || categoryLabel || "Start Request") : (categoryLabel || "Start Request");

  // -------------------------------------------------------------
  // VARIANT 1: SLEEK LIST VIEW
  // -------------------------------------------------------------
  if (variant === "list") {
    return (
      <Card
        onClick={onClick}
        render={<button type="button" onClick={onClick} />}
        className={cn(
          "group w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-row items-center justify-between gap-4 text-left relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500",
          isLocked
            ? "bg-slate-50/70 border-slate-200/90 hover:border-amber-300/80 cursor-pointer opacity-90 shadow-2xs"
            : "bg-white hover:bg-slate-50/70 border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-lg cursor-pointer",
          !isLocked && glow
        )}
      >
        {/* Left accent bar */}
        <div className={cn("absolute left-0 inset-y-0 w-1 bg-linear-to-b opacity-0 group-hover:opacity-100 transition-opacity", isLocked ? "from-amber-400 to-amber-600" : accent)} />

        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div
            className={cn(
              "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs",
              isLocked
                ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400"
                : bg
            )}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn(
                "font-bold transition-colors text-sm sm:text-base leading-snug tracking-tight",
                isLocked ? "text-slate-800 group-hover:text-amber-700" : "text-slate-900 group-hover:text-blue-600"
              )}>
                {requestType.name}
              </h3>
              {isLocked && (
                <Badge
                  variant="outline"
                  className="h-auto px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 gap-1 shrink-0"
                >
                  <Lock className="size-2.5 text-amber-600 dark:text-amber-400" />
                  <span>Restricted</span>
                </Badge>
              )}
              {displayBadge && (
                <Badge
                  variant="secondary"
                  className="h-auto px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200/70"
                >
                  {displayBadge}
                </Badge>
              )}
            </div>
            {isLocked && (
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 line-clamp-1">
                Restricted to authorized personnel. Permission required to raise request.
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 text-xs font-semibold border border-amber-200/90 shadow-2xs">
              <Lock className="size-3 text-amber-700 dark:text-amber-400" />
              <span>Restricted</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-semibold shadow-xs group-hover:shadow-md transition-all duration-200">
              <span>Start</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      </Card>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 2: BIGGER, SPACIOUS GRID VIEW
  // -------------------------------------------------------------
  return (
    <Card
      onClick={onClick}
      render={<button type="button" onClick={onClick} />}
      className={cn(
        "group relative flex flex-col justify-between text-left rounded-2xl sm:rounded-3xl border p-6 sm:p-7 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full overflow-hidden min-h-[175px] sm:min-h-[190px]",
        isLocked
          ? "bg-slate-50/70 hover:bg-slate-50 border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-md cursor-pointer opacity-95"
          : "bg-white hover:bg-linear-to-b hover:from-white hover:to-slate-50/60 border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        !isLocked && glow
      )}
    >
      {/* Top subtle gradient highlight bar */}
      <div className={cn("absolute top-0 inset-x-0 h-1.5 bg-linear-to-r opacity-40 group-hover:opacity-100 transition-opacity duration-300", isLocked ? "from-amber-400 to-amber-600" : accent)} />

      {/* Top Row: Icon + Category Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-xs shrink-0",
            isLocked
              ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400"
              : bg
          )}
        >
          {isLocked ? (
            <Lock className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <IconComponent className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[70%]">
          {isLocked && (
            <Badge
              variant="outline"
              className="h-auto px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 gap-1.5 shrink-0 shadow-2xs"
            >
              <Lock className="size-3 text-amber-600 dark:text-amber-400" />
              <span>Restricted</span>
            </Badge>
          )}
          {displayBadge && (
            <Badge
              variant="secondary"
              className="h-auto px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200/80 text-right shrink-0 truncate"
            >
              {displayBadge}
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom Area: Title & Footer */}
      <div className="mt-auto">
        <h3 className={cn(
          "font-extrabold transition-colors text-base sm:text-lg leading-snug tracking-tight mb-2 break-words",
          isLocked ? "text-slate-800 group-hover:text-amber-700" : "text-slate-900 group-hover:text-blue-600"
        )}>
          {requestType.name}
        </h3>

        {isLocked && (
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mb-3 line-clamp-2 leading-relaxed">
            Restricted to authorized personnel. Permission required to raise request.
          </p>
        )}

        {isLocked ? (
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-400 pt-3 border-t border-slate-100 gap-2">
            <span className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5 break-words">
              <Lock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Permission Required</span>
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80">
              <Lock className="size-3.5" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors pt-3 border-t border-slate-100 gap-2">
            <span className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors break-words">
              {footerLabel}
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all text-slate-400 shrink-0">
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
