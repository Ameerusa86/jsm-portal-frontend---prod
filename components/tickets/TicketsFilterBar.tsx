"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  LayoutGrid,
  List,
  Columns3,
  RotateCcw,
  Filter,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table" | "kanban";
export type SortOption =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "priority-desc"
  | "key-asc"
  | "summary-asc";

export type FilterColumn =
  | "client"
  | "assignee"
  | "reporter"
  | "space"
  | "type"
  | "priority"
  | "status"
  | "key"
  | "summary";

export interface ColumnFilterItem {
  id: string;
  column: FilterColumn;
  columnLabel: string;
  value: string;
}

export interface FilterState {
  searchQuery: string;
  statusCategory: string; // "all" | "in-progress" | "waiting-support" | "waiting-customer" | "resolved"
  space: string;
  requestType: string;
  priority: string;
  dateRange: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  columnFilters: ColumnFilterItem[];
}

interface TicketsFilterBarProps {
  filters: FilterState;
  onChangeFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  onResetFilters: () => void;
  availableSpaces: string[];
  availableRequestTypes: string[];
  totalResultsCount: number;
  allTickets: TicketItem[];
}

const COLUMN_OPTIONS: Array<{ id: FilterColumn; label: string }> = [
  { id: "client", label: "Client / Organization Name" },
  { id: "assignee", label: "Assigned Specialist" },
  { id: "reporter", label: "Reporter" },
  { id: "space", label: "Department / Space" },
  { id: "type", label: "Request Type" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
  { id: "key", label: "Ticket Key" },
  { id: "summary", label: "Summary Title" },
];

export const TicketsFilterBar: React.FC<TicketsFilterBarProps> = ({
  filters,
  onChangeFilter,
  onResetFilters,
  availableSpaces,
  availableRequestTypes,
  totalResultsCount,
  allTickets,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Column Filter popup state
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<FilterColumn>("client");
  const [columnFilterInput, setColumnFilterInput] = useState("");

  // Extract unique values for the selected column
  const distinctValuesForColumn = useMemo(() => {
    const counts = new Map<string, number>();

    allTickets.forEach((t) => {
      let val = "";
      if (selectedColumn === "client")
        val = t.clientName || t.organization || "";
      else if (selectedColumn === "assignee")
        val = t.assignee?.displayName || "";
      else if (selectedColumn === "reporter")
        val = t.reporter?.displayName || "";
      else if (selectedColumn === "space")
        val = t.projectName || t.projectKey || "";
      else if (selectedColumn === "type") val = t.type || "";
      else if (selectedColumn === "priority") val = t.priority?.name || "";
      else if (selectedColumn === "status") val = t.status || "";
      else if (selectedColumn === "key") val = t.key || "";
      else if (selectedColumn === "summary") val = t.summary || "";

      if (val.trim()) {
        const clean = val.trim();
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allTickets, selectedColumn]);

  const handleAddColumnFilter = (valToAdd?: string) => {
    const finalVal = (valToAdd || columnFilterInput).trim();
    if (!finalVal) return;

    const colMeta = COLUMN_OPTIONS.find((c) => c.id === selectedColumn);
    const newFilter: ColumnFilterItem = {
      id: `${selectedColumn}-${Date.now()}`,
      column: selectedColumn,
      columnLabel: colMeta?.label || selectedColumn,
      value: finalVal,
    };

    const updated = [...filters.columnFilters, newFilter];
    onChangeFilter("columnFilters", updated);
    setColumnFilterInput("");
    setShowColumnModal(false);
  };

  const handleRemoveColumnFilter = (id: string) => {
    const updated = filters.columnFilters.filter((f) => f.id !== id);
    onChangeFilter("columnFilters", updated);
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.statusCategory !== "all" ||
    filters.space !== "all" ||
    filters.requestType !== "all" ||
    filters.priority !== "all" ||
    filters.dateRange !== "all" ||
    filters.columnFilters.length > 0;

  return (
    <div className="space-y-3 bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
      {/* Top Row: Search Input + View Switcher + Sort Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input with live clear */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilter("searchQuery", e.target.value)}
            placeholder="Search tickets by key (e.g. IT-1042), title, client name, or keywords..."
            className="pl-9 pr-9 h-9 bg-muted/40 border-border focus-visible:bg-background transition-all"
          />
          {filters.searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                onChangeFilter("searchQuery", "");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Clear search query"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* View Switcher & Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChangeFilter("sortBy", e.target.value as SortOption)
              }
              className="h-9 bg-card border border-border text-foreground text-xs font-semibold rounded-lg pl-8 pr-7 py-1.5 appearance-none focus:outline-none focus:border-ring cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
              aria-label="Sort tickets by"
            >
              <option value="created-desc">Latest Submitted</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="created-asc">Oldest Submitted</option>
              <option value="updated-asc">Oldest Updated</option>
              <option value="priority-desc">Priority (Highest first)</option>
              <option value="key-asc">Ticket Key (A-Z)</option>
              <option value="summary-asc">Title (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-muted border border-border shrink-0">
            <Button
              type="button"
              variant={filters.viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onChangeFilter("viewMode", "grid")}
              className={cn(
                "cursor-pointer",
                filters.viewMode === "grid" && "bg-background text-primary shadow-xs"
              )}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={filters.viewMode === "table" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onChangeFilter("viewMode", "table")}
              className={cn(
                "cursor-pointer",
                filters.viewMode === "table" && "bg-background text-primary shadow-xs"
              )}
              title="Dense Table View"
              aria-label="Dense Table View"
            >
              <List className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={filters.viewMode === "kanban" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onChangeFilter("viewMode", "kanban")}
              className={cn(
                "cursor-pointer",
                filters.viewMode === "kanban" && "bg-background text-primary shadow-xs"
              )}
              title="Kanban Board View"
              aria-label="Kanban Board View"
            >
              <Columns3 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Middle Row: Quick Dropdowns & "Filter by Column" Feature */}
      <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-border/60">
        {/* Dynamic Column Filter Button (User Choice) */}
        <div className="relative">
          <Button
            type="button"
            variant={showColumnModal || filters.columnFilters.length > 0 ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowColumnModal((prev) => !prev)}
            className="cursor-pointer gap-1.5 font-bold shadow-2xs"
          >
            <Filter className="size-3.5 text-primary" />
            <span>Filter by Column...</span>
            <Badge
              variant="default"
              className="text-[10px] font-mono px-1.5 py-0 h-4 min-w-4 rounded-full"
            >
              {filters.columnFilters.length}
            </Badge>
          </Button>

          {/* Column Filter Interactive Modal / Flyout */}
          {showColumnModal && (
            <Card className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150 rounded-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-3">
                <span className="text-xs font-bold text-foreground">
                  Filter by Column of Your Choice
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowColumnModal(false)}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Step 1: Pick Column */}
              <div className="space-y-1 mb-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Column:
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => {
                    setSelectedColumn(e.target.value as FilterColumn);
                    setColumnFilterInput("");
                  }}
                  className="w-full bg-muted/40 border border-border text-foreground text-xs font-semibold rounded-lg p-2 focus:outline-none focus:border-ring"
                >
                  {COLUMN_OPTIONS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Enter or Choose Value */}
              <div className="space-y-1 mb-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Filter Value:
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="text"
                    value={columnFilterInput}
                    onChange={(e) => setColumnFilterInput(e.target.value)}
                    placeholder={`e.g. ${distinctValuesForColumn[0]?.name || "search value..."}`}
                    className="flex-1 bg-muted/40 border-border text-foreground text-xs h-8"
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleAddColumnFilter()}
                    disabled={!columnFilterInput.trim()}
                    className="cursor-pointer"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Step 3: Quick Pick from Existing Column Values */}
              {distinctValuesForColumn.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Existing Values in Data ({distinctValuesForColumn.length}):
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {distinctValuesForColumn.map((item) => (
                      <Button
                        key={item.name}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddColumnFilter(item.name)}
                        className="w-full justify-between px-2.5 py-1.5 h-auto text-xs text-foreground hover:bg-primary/10 hover:text-primary text-left"
                      >
                        <span className="truncate max-w-[220px]">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.count} {item.count === 1 ? "ticket" : "tickets"}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Space / Department Dropdown */}
        <div className="relative">
          <select
            value={filters.space}
            onChange={(e) => onChangeFilter("space", e.target.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs h-8",
              filters.space !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                : "bg-card border-border hover:border-slate-300 text-foreground"
            )}
          >
            <option value="all">All Departments / Portals</option>
            {availableSpaces.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Request Type Dropdown */}
        {availableRequestTypes.length > 0 && (
          <div className="relative">
            <select
              value={filters.requestType}
              onChange={(e) => onChangeFilter("requestType", e.target.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs h-8",
                filters.requestType !== "all"
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                  : "bg-card border-border hover:border-slate-300 text-foreground"
              )}
            >
              <option value="all">All Request Types</option>
              {availableRequestTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Dropdown */}
        <div className="relative">
          <select
            value={filters.priority}
            onChange={(e) => onChangeFilter("priority", e.target.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs h-8",
              filters.priority !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                : "bg-card border-border hover:border-slate-300 text-foreground"
            )}
          >
            <option value="all">All Priorities</option>
            <option value="highest">Critical / Highest</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low / Lowest</option>
          </select>
        </div>

        {/* Date Range Dropdown */}
        <div className="relative">
          <select
            value={filters.dateRange}
            onChange={(e) => onChangeFilter("dateRange", e.target.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs h-8",
              filters.dateRange !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                : "bg-card border-border hover:border-slate-300 text-foreground"
            )}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
            <option value="90d">Past 90 Days</option>
          </select>
        </div>

        {/* Reset All Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="cursor-pointer gap-1 ml-auto text-xs font-semibold"
            title="Reset all search & filter options"
          >
            <RotateCcw className="size-3.5 text-muted-foreground" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Active Filter Badges Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Active Filters:
          </span>

          {/* Search Query Pill */}
          {filters.searchQuery && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
            >
              <span>Search: &ldquo;{filters.searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => onChangeFilter("searchQuery", "")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Dynamic Column Filter Pills */}
          {filters.columnFilters.map((cf) => (
            <Badge
              key={cf.id}
              variant="default"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium shadow-2xs"
            >
              <span className="font-semibold">{cf.columnLabel}:</span>
              <span>&ldquo;{cf.value}&rdquo;</span>
              <button
                type="button"
                onClick={() => handleRemoveColumnFilter(cf.id)}
                className="hover:text-primary-foreground/80 cursor-pointer ml-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {/* Status Category Pill */}
          {filters.statusCategory !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium capitalize"
            >
              <span>Status: {filters.statusCategory.replace("-", " ")}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("statusCategory", "all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Space Pill */}
          {filters.space !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
            >
              <span>Dept: {filters.space}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("space", "all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Request Type Pill */}
          {filters.requestType !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
            >
              <span>Type: {filters.requestType}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("requestType", "all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Priority Pill */}
          {filters.priority !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium capitalize"
            >
              <span>Priority: {filters.priority}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("priority", "all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Date Range Pill */}
          {filters.dateRange !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
            >
              <span>Date: {filters.dateRange}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("dateRange", "all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          <span className="text-[11px] text-muted-foreground font-medium ml-auto">
            Showing {totalResultsCount} matching{" "}
            {totalResultsCount === 1 ? "request" : "requests"}
          </span>
        </div>
      )}
    </div>
  );
};
