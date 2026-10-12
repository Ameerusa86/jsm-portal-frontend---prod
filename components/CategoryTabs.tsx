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
  Compass,
  LayoutGrid,
  List,
} from "lucide-react";

interface CategoryTabsProps {
  categories: { name: string; count: number }[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenFinder?: () => void;
  viewMode?: "grid" | "list";
  onToggleViewMode?: (mode: "grid" | "list") => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onOpenFinder,
  viewMode = "grid",
  onToggleViewMode,
}) => {
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("incident") || n.includes("urgent") || n.includes("outage"))
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
      n.includes("people") ||
      n.includes("onboard") ||
      n.includes("workplace") ||
      n.includes("team")
    )
      return Users;
    if (n.includes("software") || n.includes("cloud") || n.includes("app"))
      return Layers;
    if (n === "all") return Sparkles;
    return Layers;
  };

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Category Pills (horizontally scrollable on small screens) */}
      <div className="flex flex-wrap items-center gap-2 pb-1 sm:pb-0 flex-1">
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

        {onOpenFinder && (
          <button
            type="button"
            onClick={onOpenFinder}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 hover:text-blue-800 border border-blue-200/80 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Help Me Choose</span>
          </button>
        )}
      </div>
    </div>
  );
};
