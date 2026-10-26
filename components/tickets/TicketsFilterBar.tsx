"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  Columns3,
  RotateCcw,
  Plus,
  Filter,
  Check,
  Building,
} from "lucide-react";
import { TicketItem } from "@/types/jsm";

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
  onChangeFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
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
      if (selectedColumn === "client") val = t.clientName || t.organization || "";
      else if (selectedColumn === "assignee") val = t.assignee?.displayName || "";
      else if (selectedColumn === "reporter") val = t.reporter?.displayName || "";
      else if (selectedColumn === "space") val = t.projectName || t.projectKey || "";
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
    <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      {/* Top Row: Search Input + View Switcher + Sort Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input with live clear */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilter("searchQuery", e.target.value)}
            placeholder="Search tickets by key (e.g. IT-1042), title, client name, or keywords..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-10 pr-9 py-2.5 transition-all shadow-2xs"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => {
                onChangeFilter("searchQuery", "");
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Switcher & Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) => onChangeFilter("sortBy", e.target.value as SortOption)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-8 pr-7 py-2.5 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
              aria-label="Sort tickets by"
            >
              <option value="created-desc">Latest Submitted (Default)</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="created-asc">Oldest Submitted</option>
              <option value="updated-asc">Oldest Updated</option>
              <option value="priority-desc">Priority (Highest first)</option>
              <option value="key-asc">Ticket Key (A-Z)</option>
              <option value="summary-asc">Title (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => onChangeFilter("viewMode", "grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filters.viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeFilter("viewMode", "table")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filters.viewMode === "table"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dense Table View"
              aria-label="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeFilter("viewMode", "kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filters.viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Kanban Board View"
              aria-label="Kanban Board View"
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Quick Dropdowns & "Filter by Column" Feature */}
      <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100">
        {/* Dynamic Column Filter Button (User Choice) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnModal((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              showColumnModal || filters.columnFilters.length > 0
                ? "bg-blue-50 border-blue-400 text-blue-700"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter by Column...</span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              {filters.columnFilters.length}
            </span>
          </button>

          {/* Column Filter Interactive Modal / Flyout */}
          {showColumnModal && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-900">
                  Filter by Column of Your Choice
                </span>
                <button
                  type="button"
                  onClick={() => setShowColumnModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Pick Column */}
              <div className="space-y-1 mb-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Column:
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => {
                    setSelectedColumn(e.target.value as FilterColumn);
                    setColumnFilterInput("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2 focus:outline-none focus:border-blue-500"
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Filter Value:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={columnFilterInput}
                    onChange={(e) => setColumnFilterInput(e.target.value)}
                    placeholder={`e.g. ${distinctValuesForColumn[0]?.name || "search value..."}`}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddColumnFilter()}
                    disabled={!columnFilterInput.trim()}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Step 3: Quick Pick from Existing Column Values */}
              {distinctValuesForColumn.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Existing Values in Data ({distinctValuesForColumn.length}):
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {distinctValuesForColumn.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleAddColumnFilter(item.name)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left group"
                      >
                        <span className="truncate max-w-[220px]">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600">
                          {item.count} {item.count === 1 ? "ticket" : "tickets"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Space / Department Dropdown */}
        <div className="relative">
          <select
            value={filters.space}
            onChange={(e) => onChangeFilter("space", e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs ${
              filters.space !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
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
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs ${
                filters.requestType !== "all"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
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
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs ${
              filters.priority !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
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
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border appearance-none cursor-pointer transition-colors shadow-2xs ${
              filters.dateRange !== "all"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
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
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors ml-auto cursor-pointer"
            title="Reset all search & filter options"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            Active Filters:
          </span>

          {/* Search Query Pill */}
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              <span>Search: &ldquo;{filters.searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => onChangeFilter("searchQuery", "")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Dynamic Column Filter Pills */}
          {filters.columnFilters.map((cf) => (
            <span
              key={cf.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-medium shadow-2xs"
            >
              <span className="font-semibold">{cf.columnLabel}:</span>
              <span>&ldquo;{cf.value}&rdquo;</span>
              <button
                type="button"
                onClick={() => handleRemoveColumnFilter(cf.id)}
                className="hover:text-slate-200 cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Status Category Pill */}
          {filters.statusCategory !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium capitalize">
              <span>Status: {filters.statusCategory.replace("-", " ")}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("statusCategory", "all")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Space Pill */}
          {filters.space !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              <span>Dept: {filters.space}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("space", "all")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Request Type Pill */}
          {filters.requestType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              <span>Type: {filters.requestType}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("requestType", "all")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Priority Pill */}
          {filters.priority !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium capitalize">
              <span>Priority: {filters.priority}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("priority", "all")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Date Range Pill */}
          {filters.dateRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              <span>Date: {filters.dateRange}</span>
              <button
                type="button"
                onClick={() => onChangeFilter("dateRange", "all")}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <span className="text-[11px] text-slate-500 font-medium ml-auto">
            Showing {totalResultsCount} matching {totalResultsCount === 1 ? "request" : "requests"}
          </span>
        </div>
      )}
    </div>
  );
};
