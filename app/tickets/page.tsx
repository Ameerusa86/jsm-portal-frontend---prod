"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  Search,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Inbox,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketItem } from "@/types/jsm";

import { TicketsHeader } from "@/components/tickets/TicketsHeader";
import { TicketsStats } from "@/components/tickets/TicketsStats";
import {
  TicketsFilterBar,
  FilterState,
  ViewMode,
  SortOption,
  ColumnFilterItem,
} from "@/components/tickets/TicketsFilterBar";
import { TicketsGrid } from "@/components/tickets/TicketsGrid";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { TicketsKanban } from "@/components/tickets/TicketsKanban";
import { TicketDetailDrawer } from "@/components/tickets/TicketDetailDrawer";
import { getStatusStyle } from "@/components/tickets/TicketBadge";
import { exportTicketsToCsv } from "@/components/tickets/TicketExport";

function TicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tickets state
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected ticket for drawer derived directly from URL query param
  const selectedTicketKey = searchParams.get("id");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: searchParams.get("q") || "",
    statusCategory: searchParams.get("status") || "all",
    space: searchParams.get("space") || "all",
    requestType: searchParams.get("type") || "all",
    priority: searchParams.get("priority") || "all",
    dateRange: searchParams.get("date") || "all",
    sortBy: "updated-desc",
    viewMode: (searchParams.get("view") as ViewMode) || "grid",
    columnFilters: [],
  });

  const [currentTime] = useState(() => Date.now());

  // Fetch tickets on mount
  useEffect(() => {
    let ignore = false;
    const fetchTickets = async () => {
      try {
        const res = await fetch("/api/jsm/tickets", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load your tickets from Jira");
        }
        const data: TicketItem[] = await res.json();
        if (!ignore) {
          setTickets(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Error loading tickets";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchTickets();

    return () => {
      ignore = true;
    };
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/jsm/tickets", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load your tickets from Jira");
      }
      const data: TicketItem[] = await res.json();
      setTickets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error loading tickets";
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Filter mutation helper
  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      statusCategory: "all",
      space: "all",
      requestType: "all",
      priority: "all",
      dateRange: "all",
      sortBy: "updated-desc",
      viewMode: filters.viewMode,
      columnFilters: [],
    });
  };

  // Available spaces derived from data
  const availableSpaces = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      const name = t.projectName || t.projectKey;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Available request types derived from data
  const availableRequestTypes = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.type) set.add(t.type);
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Dynamic Multi-Filter & Sort Engine
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Full text search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const keyMatch = (t.key || "").toLowerCase().includes(q);
        const summaryMatch = (t.summary || "").toLowerCase().includes(q);
        const clientMatch = (t.clientName || t.organization || "")
          .toLowerCase()
          .includes(q);
        const typeMatch = (t.type || "").toLowerCase().includes(q);
        const spaceMatch = (t.projectName || t.projectKey || "")
          .toLowerCase()
          .includes(q);
        const assigneeMatch = (t.assignee?.displayName || "")
          .toLowerCase()
          .includes(q);
        return (
          keyMatch ||
          summaryMatch ||
          clientMatch ||
          typeMatch ||
          spaceMatch ||
          assigneeMatch
        );
      });
    }

    // 2. Dynamic Column Filters (Chosen by User)
    if (filters.columnFilters.length > 0) {
      filters.columnFilters.forEach((cf) => {
        const val = cf.value.toLowerCase().trim();
        result = result.filter((t) => {
          if (cf.column === "client") {
            return (t.clientName || t.organization || "")
              .toLowerCase()
              .includes(val);
          }
          if (cf.column === "assignee") {
            return (t.assignee?.displayName || "").toLowerCase().includes(val);
          }
          if (cf.column === "reporter") {
            return (t.reporter?.displayName || "").toLowerCase().includes(val);
          }
          if (cf.column === "space") {
            return (
              (t.projectName || "").toLowerCase().includes(val) ||
              (t.projectKey || "").toLowerCase().includes(val)
            );
          }
          if (cf.column === "type") {
            return (t.type || "").toLowerCase().includes(val);
          }
          if (cf.column === "priority") {
            return (t.priority?.name || "").toLowerCase() === val;
          }
          if (cf.column === "status") {
            return (t.status || "").toLowerCase().includes(val);
          }
          if (cf.column === "key") {
            return (t.key || "").toLowerCase().includes(val);
          }
          if (cf.column === "summary") {
            return (t.summary || "").toLowerCase().includes(val);
          }
          return true;
        });
      });
    }

    // 3. Status Category filter
    if (filters.statusCategory !== "all") {
      result = result.filter((t) => {
        const style = getStatusStyle(t.status, t.statusCategory);
        if (filters.statusCategory === "in-progress") {
          return style.categoryKey === "indeterminate";
        }
        if (filters.statusCategory === "waiting-support") {
          return style.categoryKey === "new";
        }
        if (filters.statusCategory === "waiting-customer") {
          return style.categoryKey === "waiting-customer";
        }
        if (filters.statusCategory === "resolved") {
          return (
            style.categoryKey === "done" || style.categoryKey === "canceled"
          );
        }
        return true;
      });
    }

    // 4. Space / Department filter
    if (filters.space !== "all") {
      result = result.filter(
        (t) =>
          (t.projectName || "").toLowerCase() === filters.space.toLowerCase() ||
          (t.projectKey || "").toLowerCase() === filters.space.toLowerCase()
      );
    }

    // 5. Request Type filter
    if (filters.requestType !== "all") {
      result = result.filter(
        (t) => (t.type || "").toLowerCase() === filters.requestType.toLowerCase()
      );
    }

    // 6. Priority filter
    if (filters.priority !== "all") {
      result = result.filter((t) => {
        const p = (t.priority?.name || "").toLowerCase();
        if (filters.priority === "highest") {
          return (
            p.includes("highest") || p.includes("critical") || p.includes("urgent")
          );
        }
        if (filters.priority === "high") {
          return p.includes("high") && !p.includes("highest");
        }
        if (filters.priority === "medium") {
          return p.includes("medium");
        }
        if (filters.priority === "low") {
          return p.includes("low");
        }
        return true;
      });
    }

    // 7. Date Range filter
    if (filters.dateRange !== "all") {
      const now = currentTime;
      const oneDay = 24 * 3600 * 1000;

      result = result.filter((t) => {
        const d = new Date(t.created || t.updated || 0).getTime();
        if (isNaN(d)) return true;
        const diffDays = (now - d) / oneDay;

        if (filters.dateRange === "today") return diffDays <= 1;
        if (filters.dateRange === "7d") return diffDays <= 7;
        if (filters.dateRange === "30d") return diffDays <= 30;
        if (filters.dateRange === "90d") return diffDays <= 90;
        return true;
      });
    }

    // 8. Multi-directional Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.updated || a.created || 0).getTime();
      const timeB = new Date(b.updated || b.created || 0).getTime();
      const createA = new Date(a.created || 0).getTime();
      const createB = new Date(b.created || 0).getTime();

      switch (filters.sortBy) {
        case "updated-desc":
          return timeB - timeA;
        case "updated-asc":
          return timeA - timeB;
        case "created-desc":
          return createB - createA;
        case "created-asc":
          return createA - createB;
        case "key-asc":
          return (a.key || "").localeCompare(b.key || "");
        case "summary-asc":
          return (a.summary || "").localeCompare(b.summary || "");
        case "priority-desc": {
          const pOrder: Record<string, number> = {
            highest: 5,
            critical: 5,
            urgent: 5,
            high: 4,
            medium: 3,
            low: 2,
            lowest: 1,
          };
          const scoreA =
            pOrder[(a.priority?.name || "").toLowerCase()] || 3;
          const scoreB =
            pOrder[(b.priority?.name || "").toLowerCase()] || 3;
          return scoreB - scoreA;
        }
        default:
          return timeB - timeA;
      }
    });

    return result;
  }, [tickets, filters]);

  // Drawer handlers
  const handleSelectTicket = (ticket: TicketItem) => {
    const params = new URLSearchParams(window.location.search);
    params.set("id", ticket.key);
    router.replace(`/tickets?${params.toString()}`);
  };

  const handleCloseDrawer = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    router.replace(`/tickets?${params.toString()}`);
  };

  const handleTicketStatusUpdated = (key: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.key === key
          ? {
              ...t,
              status: newStatus,
              statusCategory: "done",
              updated: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleExportCsv = () => {
    exportTicketsToCsv(
      filteredTickets,
      `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-500 selection:text-white font-sans">
      {/* Global Header */}
      <Header />

      {/* Main Body Area: Full screen width */}
      <main className="grow w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8 w-full">
          {/* Page Top Header */}
          <TicketsHeader
            onRefresh={handleRefresh}
            onExportCsv={handleExportCsv}
            refreshing={refreshing}
            totalCount={filteredTickets.length}
          />

          {/* Top KPI Statistics Cards */}
          <TicketsStats
            tickets={tickets}
            activeStatusFilter={filters.statusCategory}
            onSelectStatusFilter={(cat) =>
              handleFilterChange("statusCategory", cat)
            }
          />

          {/* Filter Bar with Dynamic Column Filter */}
          <TicketsFilterBar
            filters={filters}
            onChangeFilter={handleFilterChange}
            onResetFilters={handleResetFilters}
            availableSpaces={availableSpaces}
            availableRequestTypes={availableRequestTypes}
            totalResultsCount={filteredTickets.length}
            allTickets={tickets}
          />

          {/* Tickets Content View */}
          {loading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Loading your tickets...
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fetching current status, client information, and SLA metrics from Jira Cloud.
              </p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 max-w-lg mx-auto">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Could not load requests
              </h3>
              <p className="text-xs text-rose-700">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
                <Inbox className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  No matching requests found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  We couldn&rsquo;t find any tickets matching your selected criteria.
                  Try adjusting your column filter or resetting all filters.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit New Request</span>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {filters.viewMode === "grid" && (
                <TicketsGrid
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  selectedTicketKey={selectedTicketKey}
                />
              )}

              {filters.viewMode === "table" && (
                <TicketsTable
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  selectedTicketKey={selectedTicketKey}
                />
              )}

              {filters.viewMode === "kanban" && (
                <TicketsKanban
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  selectedTicketKey={selectedTicketKey}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Slide-over Ticket Details Drawer */}
      <TicketDetailDrawer
        ticketKey={selectedTicketKey}
        onClose={handleCloseDrawer}
        onTicketUpdated={handleTicketStatusUpdated}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
