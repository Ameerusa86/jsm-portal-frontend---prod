"use client";

import React from "react";
import {
  Layers,
  Laptop,
  Wifi,
  Users,
  Sparkles,
  KeyRound,
  AlertCircle,
  LayoutGrid,
  List,
  CreditCard,
  FileText,
  Zap,
  HelpCircle,
  Briefcase,
  DollarSign,
} from "lucide-react";

interface CategoryTabsProps {
  categories: { name: string; count: number }[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  viewMode?: "grid" | "list";
  onToggleViewMode?: (mode: "grid" | "list") => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  viewMode = "grid",
  onToggleViewMode,
}) => {
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("incident") ||
      n.includes("urgent") ||
      n.includes("outage") ||
      n.includes("problem")
    )
      return AlertCircle;
    if (
      n.includes("hardware") ||
      n.includes("equipment") ||
      n.includes("device") ||
      n.includes("computer")
    )
      return Laptop;
    if (
      n.includes("network") ||
      n.includes("vpn") ||
      n.includes("connect") ||
      n.includes("wifi")
    )
      return Wifi;
    if (
      n.includes("login") ||
      n.includes("access") ||
      n.includes("security") ||
      n.includes("password")
    )
      return KeyRound;
    if (
      n.includes("invoice") ||
      n.includes("billing") ||
      n.includes("payment") ||
      n.includes("remittance")
    )
      return CreditCard;
    if (
      n.includes("refund") ||
      n.includes("adjustment") ||
      n.includes("ledger") ||
      n.includes("finance") ||
      n.includes("accounting")
    )
      return DollarSign;
    if (
      n.includes("people") ||
      n.includes("onboard") ||
      n.includes("workplace") ||
      n.includes("team") ||
      n.includes("hr") ||
      n.includes("hiring")
    )
      return Users;
    if (n.includes("benefit") || n.includes("leave") || n.includes("payroll"))
      return Briefcase;
    if (n.includes("automation") || n.includes("report"))
      return Zap;
    if (n.includes("work order") || n.includes("order"))
      return FileText;
    if (n.includes("inquir") || n.includes("support") || n.includes("assist"))
      return HelpCircle;
    if (n.includes("software") || n.includes("cloud") || n.includes("app"))
      return Layers;
    if (n === "all") return Sparkles;
    return Layers;
  };

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Category Pills (horizontally scrollable on small screens) */}
      <div className="flex overflow-x-auto sm:flex-wrap items-center gap-2 pb-2 sm:pb-0 flex-1 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          const Icon = getCategoryIcon(cat.name);

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer border whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm font-semibold"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs font-medium"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>{cat.name === "all" ? "All Services" : cat.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-700/60 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: View Switcher (Grid/List) & 2-Step Finder */}
      <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto">
        {onToggleViewMode && (
          <div className="inline-flex items-center p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => onToggleViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-100 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
