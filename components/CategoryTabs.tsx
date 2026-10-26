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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
            <Button
              key={cat.name}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(cat.name)}
              className={cn(
                "cursor-pointer gap-2 shrink-0 rounded-xl h-9 font-medium shadow-xs",
                isActive
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-white" : "text-muted-foreground"
                )}
              />
              <span>{cat.name === "all" ? "All Services" : cat.name}</span>
              <Badge
                variant={isActive ? "secondary" : "secondary"}
                className={cn(
                  "px-1.5 py-0 text-[11px] font-semibold h-4 min-w-4 rounded-full",
                  isActive
                    ? "bg-blue-700/80 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cat.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Right Controls: View Switcher (Grid/List) */}
      <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto">
        {onToggleViewMode && (
          <div className="inline-flex items-center p-1 bg-card border border-border rounded-xl shadow-xs">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onToggleViewMode("grid")}
              title="Grid View"
              className={cn(
                "cursor-pointer",
                viewMode === "grid" && "bg-muted text-primary shadow-xs"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onToggleViewMode("list")}
              title="List View"
              className={cn(
                "cursor-pointer",
                viewMode === "list" && "bg-muted text-primary shadow-xs"
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
