"use client";

import React from "react";
import {
  Laptop,
  Wifi,
  KeyRound,
  Users,
  AlertCircle,
  Layers,
  ArrowRight,
  CreditCard,
  Briefcase,
  Zap,
  Building2,
  Sparkles,
  Folder,
  Database,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestTypeWithGroup } from "@/types/jsm";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  groupName: string;
  requestTypes: RequestTypeWithGroup[];
  onClick: () => void;
  spaceName?: string;
  variant?: "grid" | "list";
}

interface GroupTheme {
  icon: LucideIcon;
  bg: string;
  badgeBg: string;
  borderHover: string;
}

export const getGroupTheme = (name: string): GroupTheme => {
  const text = name.toLowerCase();

  // 1. Logins, Accounts, MFA, Passwords, Security
  if (
    text.includes("login") ||
    text.includes("account") ||
    text.includes("password") ||
    text.includes("mfa") ||
    text.includes("security") ||
    text.includes("credential") ||
    text.includes("identity")
  ) {
    return {
      icon: KeyRound,
      bg: "bg-amber-500 text-white shadow-amber-500/20",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      borderHover: "hover:border-amber-400",
    };
  }

  // 2. Computers, Hardware, Laptops, Workstations
  if (
    text.includes("computer") ||
    text.includes("laptop") ||
    text.includes("hardware") ||
    text.includes("workstation") ||
    text.includes("device") ||
    text.includes("equipment") ||
    text.includes("monitor") ||
    text.includes("peripheral")
  ) {
    return {
      icon: Laptop,
      bg: "bg-indigo-600 text-white shadow-indigo-600/20",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      borderHover: "hover:border-indigo-400",
    };
  }

  // 3. Applications, Software, Licenses, Developer Tools
  if (
    text.includes("software") ||
    text.includes("application") ||
    text.includes("license") ||
    text.includes("tool") ||
    text.includes("saas") ||
    text.includes("app")
  ) {
    return {
      icon: Layers,
      bg: "bg-blue-600 text-white shadow-blue-600/20",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      borderHover: "hover:border-blue-400",
    };
  }

  // 4. Facilities, Badges, Office, Building Access
  if (
    text.includes("facility") ||
    text.includes("badge") ||
    text.includes("building") ||
    text.includes("office") ||
    text.includes("access") ||
    text.includes("desk")
  ) {
    return {
      icon: Building2,
      bg: "bg-emerald-600 text-white shadow-emerald-600/20",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      borderHover: "hover:border-emerald-400",
    };
  }

  // 5. Database, Systems, Cloud & Infrastructure
  if (
    text.includes("database") ||
    text.includes("sql") ||
    text.includes("data & systems") ||
    text.includes("cloud") ||
    text.includes("infra") ||
    text.includes("server")
  ) {
    return {
      icon: Database,
      bg: "bg-sky-600 text-white shadow-sky-600/20",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      borderHover: "hover:border-sky-400",
    };
  }

  // 6. Network, VPN & Connectivity
  if (
    text.includes("network") ||
    text.includes("vpn") ||
    text.includes("wifi") ||
    text.includes("connect")
  ) {
    return {
      icon: Wifi,
      bg: "bg-cyan-600 text-white shadow-cyan-600/20",
      badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
      borderHover: "hover:border-cyan-400",
    };
  }

  // 7. Incidents, Outages, System Problems
  if (
    text.includes("incident") ||
    text.includes("outage") ||
    text.includes("problem") ||
    text.includes("broken") ||
    text.includes("repair") ||
    text.includes("issue")
  ) {
    return {
      icon: AlertCircle,
      bg: "bg-rose-600 text-white shadow-rose-600/20",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      borderHover: "hover:border-rose-400",
    };
  }

  // 8. Data, Analytics, Automation, Reports
  if (
    text.includes("automation") ||
    text.includes("report") ||
    text.includes("analytic") ||
    text.includes("pipeline") ||
    text.includes("dashboard")
  ) {
    return {
      icon: Zap,
      bg: "bg-teal-600 text-white shadow-teal-600/20",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      borderHover: "hover:border-teal-400",
    };
  }

  // 9. Suggestions, Ideas, Feedback
  if (
    text.includes("suggest") ||
    text.includes("idea") ||
    text.includes("feedback") ||
    text.includes("improv")
  ) {
    return {
      icon: Sparkles,
      bg: "bg-purple-600 text-white shadow-purple-600/20",
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      borderHover: "hover:border-purple-400",
    };
  }

  // 10. Billing, Invoices, Financials
  if (
    text.includes("invoice") ||
    text.includes("billing") ||
    text.includes("payment") ||
    text.includes("refund") ||
    text.includes("ledger")
  ) {
    return {
      icon: CreditCard,
      bg: "bg-emerald-600 text-white shadow-emerald-600/20",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      borderHover: "hover:border-emerald-400",
    };
  }

  // 11. HR, People, Onboarding
  if (
    text.includes("hr") ||
    text.includes("people") ||
    text.includes("onboard") ||
    text.includes("benefit") ||
    text.includes("leave")
  ) {
    return {
      icon: Users,
      bg: "bg-violet-600 text-white shadow-violet-600/20",
      badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
      borderHover: "hover:border-violet-400",
    };
  }

  // Default Fallback
  return {
    icon: Folder,
    bg: "bg-slate-800 text-white shadow-slate-800/20",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    borderHover: "hover:border-blue-400",
  };
};

export const GroupCard: React.FC<GroupCardProps> = ({
  groupName,
  requestTypes,
  onClick,
  spaceName,
  variant = "grid",
}) => {
  const count = requestTypes.length;
  const theme = getGroupTheme(groupName);
  const Icon = theme.icon;

  const resolvedSpaceName =
    spaceName ||
    requestTypes.find((r) => r.spaceName)?.spaceName ||
    "Information Technology";

  // Build a preview of service names included in this group
  const previewNames = requestTypes.slice(0, 3).map((r) => r.name);
  const remainingCount = Math.max(0, count - 3);

  if (variant === "list") {
    return (
      <Card
        onClick={onClick}
        className={cn(
          "group bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 sm:p-5 transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          theme.borderHover
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
              theme.bg
            )}
          >
            <Icon className="size-5 sm:size-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base sm:text-lg">
                {groupName}
              </h3>
              <Badge
                variant="outline"
                className={cn("px-2 py-0.5 text-xs font-semibold rounded-full", theme.badgeBg)}
              >
                {count} {count === 1 ? "request" : "requests"}
              </Badge>
            </div>
            {previewNames.length > 0 && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                {previewNames.join(", ")}
                {remainingCount > 0 ? ` +${remainingCount} more` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 sm:self-center">
          {resolvedSpaceName && (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[11px] font-semibold bg-slate-50 text-slate-600 border-slate-200"
            >
              {resolvedSpaceName}
            </Badge>
          )}
          <div className="flex items-center text-xs font-bold text-blue-600 gap-1 group-hover:translate-x-1 transition-transform">
            <span>View {count} services</span>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-7 transition-all duration-200 shadow-2xs hover:shadow-lg cursor-pointer flex flex-col justify-between min-h-[200px]",
        theme.borderHover
      )}
    >
      <div>
        {/* Top Header: Group Icon & Badge Count */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={cn(
              "size-12 sm:size-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform",
              theme.bg
            )}
          >
            <Icon className="size-6 text-white" />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 text-xs font-semibold rounded-full shadow-2xs",
              theme.badgeBg
            )}
          >
            {count} {count === 1 ? "request" : "requests"}
          </Badge>
        </div>

        {/* Group Title */}
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg sm:text-xl tracking-tight leading-snug">
          {groupName}
        </h3>

        {/* Preview of Request Types */}
        {previewNames.length > 0 && (
          <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {previewNames.join(", ")}
            {remainingCount > 0 ? `, and ${remainingCount} more...` : "."}
          </p>
        )}
      </div>

      {/* Card Footer: Space Name & Action */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span
          className="text-slate-500 font-medium truncate max-w-[170px] sm:max-w-[210px]"
          title={resolvedSpaceName}
        >
          {resolvedSpaceName}
        </span>
        <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-1.5 transition-transform shrink-0">
          <span>View all</span>
          <ArrowRight className="size-4" />
        </div>
      </div>
    </Card>
  );
};
