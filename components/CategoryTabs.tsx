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
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: { name: string; count: number }[];
  activeCategory?: string;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  viewMode?: "grid" | "list";
  onToggleViewMode?: (mode: "grid" | "list") => void;
  onViewModeChange?: (mode: "grid" | "list") => void;
  viewGrouping?: "groups" | "all";
  onViewGroupingChange?: (grouping: "groups" | "all") => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  selectedCategory,
  onSelectCategory,
  viewMode = "grid",
  onToggleViewMode,
  onViewModeChange,
  viewGrouping = "groups",
  onViewGroupingChange,
}) => {
  const effectiveActive = selectedCategory ?? activeCategory ?? "all";
  const handleToggle = onToggleViewMode ?? onViewModeChange;
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
          const isActive = effectiveActive === cat.name;
          const Icon = getCategoryIcon(cat.name);

          return (
            <Button
              key={cat.name}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(cat.name)}
              className={cn(
                "cursor-pointer gap-2 shrink-0 rounded-xl h-9 font-medium shadow-xs",
                isActive
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm font-semibold"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span>{cat.name === "all" ? "All Services" : cat.name}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "px-1.5 py-0 text-[11px] font-semibold h-4 min-w-4 rounded-full",
                  isActive
                    ? "bg-blue-700/80 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {cat.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Right Controls: Grouping Toggle (By Group / All Cards) & View Switcher (Grid/List) */}
      <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto flex-wrap">
        {onViewGroupingChange && (
          <div className="inline-flex items-center p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs gap-0.5">
            <Button
              type="button"
              variant={viewGrouping === "groups" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewGroupingChange("groups")}
              title="Show requests organized by group"
              className={cn(
                "cursor-pointer text-xs font-semibold gap-1.5 h-7 px-2.5 rounded-lg",
                viewGrouping === "groups" && "bg-slate-100 text-blue-600 shadow-2xs font-bold"
              )}
            >
              <FolderTree className="size-3.5" />
              <span>By Group</span>
            </Button>
            <Button
              type="button"
              variant={viewGrouping === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewGroupingChange("all")}
              title="List all request cards directly"
              className={cn(
                "cursor-pointer text-xs font-semibold gap-1.5 h-7 px-2.5 rounded-lg",
                viewGrouping === "all" && "bg-slate-100 text-blue-600 shadow-2xs font-bold"
              )}
            >
              <Layers className="size-3.5" />
              <span>All Cards</span>
            </Button>
          </div>
        )}

        {handleToggle && (
          <div className="inline-flex items-center p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => handleToggle("grid")}
              title="Grid View"
              className={cn(
                "cursor-pointer",
                viewMode === "grid" && "bg-slate-100 text-blue-600 shadow-xs"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => handleToggle("list")}
              title="List View"
              className={cn(
                "cursor-pointer",
                viewMode === "list" && "bg-slate-100 text-blue-600 shadow-xs"
              )}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
