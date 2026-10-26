"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  LogIn,
  LogOut,
  Ticket,
  ChevronDown,
  Layers,
  X,
  Search,
  ExternalLink,
  Laptop,
  CreditCard,
  Users,
  Headphones,
  Building2,
  ArrowRight,
  LayoutGrid,
  LayoutList,
  Check,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JsmSpace } from "@/types/jsm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onHomeClick?: () => void;
  currentSpaceName?: string;
  onSearchFocus?: () => void;
}

const getSpaceIconAndTheme = (projectName = "", category = "") => {
  const text = `${projectName} ${category}`.toLowerCase();

  // 1. Finance, Billing & Accounting
  if (
    text.includes("bill") ||
    text.includes("finance") ||
    text.includes("accounting") ||
    text.includes("revenue") ||
    text.includes("invoice")
  ) {
    return {
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      badge: "Finance",
    };
  }

  // 2. HR & People & Culture
  if (
    text.includes("hr") ||
    text.includes("human resources") ||
    text.includes("people") ||
    text.includes("talent") ||
    text.includes("culture")
  ) {
    return {
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/25",
      badge: "People & HR",
    };
  }

  // 3. Customer Operations & Support
  if (
    text.includes("support") ||
    text.includes("operations") ||
    text.includes("client") ||
    text.includes("customer")
  ) {
    return {
      icon: Headphones,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/25",
      badge: "Support",
    };
  }

  // 4. Workplace, Facilities & Real Estate
  if (
    text.includes("facilit") ||
    text.includes("workplace") ||
    text.includes("building") ||
    text.includes("office")
  ) {
    return {
      icon: Building2,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/25",
      badge: "Facilities",
    };
  }

  // 5. IT / Technology
  if (
    text.includes("it") ||
    text.includes("tech") ||
    text.includes("engineer") ||
    text.includes("software") ||
    text.includes("security")
  ) {
    return {
      icon: Laptop,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/25",
      badge: "IT & Tech",
    };
  }

  // Default
  return {
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/25",
    badge: "General",
  };
};

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  currentSpaceName,
  onSearchFocus,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [spaces, setSpaces] = useState<JsmSpace[]>([]);
  const [spacesFilter, setSpacesFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const spacesDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        spacesDropdownRef.current &&
        !spacesDropdownRef.current.contains(event.target as Node)
      ) {
        setSpacesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (spacesOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [spacesOpen]);

  // Global Ctrl+K / Cmd+K shortcut listener to focus search
  const handleSearchClick = useCallback(() => {
    if (onSearchFocus) {
      onSearchFocus();
      return;
    }
    const heroInput = document.querySelector<HTMLInputElement>(
      'input[placeholder*="Search for help"]',
    );
    if (heroInput) {
      heroInput.focus();
      heroInput.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      router.push("/");
    }
  }, [onSearchFocus, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchClick();
      }
      if (e.key === "Escape") {
        setSpacesOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSearchClick]);

  // Load spaces
  useEffect(() => {
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (data.values && Array.isArray(data.values)) {
          setSpaces(data.values);
        }
      })
      .catch((err) => console.error("Failed to load spaces in header", err));
  }, []);

  // Auto-focus search input when spaces dropdown opens
  useEffect(() => {
    if (spacesOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [spacesOpen]);

  const filteredSpaces = useMemo(() => {
    const q = spacesFilter.toLowerCase().trim();
    if (!q) return spaces;
    return spaces.filter((space) => {
      const name = space.projectName.toLowerCase();
      const cat = ((space.category as string) || "").toLowerCase();
      const key = ((space.projectKey as string) || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || key.includes(q);
    });
  }, [spaces, spacesFilter]);

  const handleHomeClick = () => {
    setSpacesOpen(false);
    if (onHomeClick) {
      onHomeClick();
    } else {
      router.push("/");
    }
  };

  return (
    <header className="w-full border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-xl bg-slate-900/90 transition-all pt-[env(safe-area-inset-top,0px)] shadow-lg shadow-black/20">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* ========================================================= */}
          {/* LEFT: BRAND LOGO + ACTIVE BREADCRUMB + PORTALS DROPDOWN */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* EMSMC Brand Title */}
            <button
              type="button"
              onClick={handleHomeClick}
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl transition-all cursor-pointer group py-1 min-h-[44px]"
              aria-label="EMSMC Help Center Home"
            >
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                EMS|MC
              </span>
            </button>

            {/* Active Space Breadcrumb */}
            {currentSpaceName && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
                <Badge
                  variant="outline"
                  className="gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 text-blue-300 border-slate-700/80 font-medium shadow-2xs"
                >
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  <span className="max-w-[160px] lg:max-w-[200px] truncate">
                    {currentSpaceName}
                  </span>
                </Badge>
              </div>
            )}

            {/* Spaces / Portals Dropdown Trigger */}
            {spaces.length > 0 && (
              <div className="relative ml-1 sm:ml-2" ref={spacesDropdownRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSpacesOpen((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[40px] text-slate-300 hover:text-white hover:bg-slate-800",
                    spacesOpen
                      ? "bg-slate-800 border-blue-500/60 text-white shadow-sm ring-2 ring-blue-500/20"
                      : "bg-slate-800/60 sm:bg-transparent border-slate-800 sm:border-transparent"
                  )}
                  aria-label="Browse Portals and Spaces"
                >
                  <Layers className="size-4 text-blue-400 shrink-0" />
                  <span className="inline">Portals</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold px-1.5 py-0 h-4 min-w-4 rounded-full bg-slate-800 text-slate-400 border-slate-700 hidden sm:inline-flex"
                  >
                    {spaces.length}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-200",
                      spacesOpen ? "rotate-180 text-blue-400" : "text-slate-400"
                    )}
                  />
                </Button>

                {/* Desktop Dropdown Menu */}
                {spacesOpen && (
                  <div className="hidden sm:block absolute left-0 mt-2.5 w-84 lg:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                    {/* Search and Filter */}
                    <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 space-y-2">
                      <div className="relative">
                        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <Input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search boards or departments..."
                          value={spacesFilter}
                          className="bg-slate-950 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2 border-slate-700 focus-visible:border-blue-500 h-9"
                          onChange={(e) => setSpacesFilter(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {spacesFilter && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setSpacesFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                          Available Service Desks ({filteredSpaces.length})
                        </span>
                        <span className="text-[10px]">Esc to close</span>
                      </div>
                    </div>

                    {/* Reset to All Portals Item */}
                    <div className="p-1.5 border-b border-slate-800 bg-slate-900/60">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleHomeClick}
                        className="w-full justify-between px-3 py-2 h-auto text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800/90 hover:text-white"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                            <LayoutGrid className="size-3.5" />
                          </div>
                          <span>All Portals & Solutions</span>
                        </div>
                        <span className="text-[11px] text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Overview
                          <ArrowRight className="size-3" />
                        </span>
                      </Button>
                    </div>

                    {/* Spaces List */}
                    <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                      {filteredSpaces.map((space) => {
                        const theme = getSpaceIconAndTheme(
                          space.projectName,
                          space.category as string,
                        );
                        const Icon = theme.icon;
                        const isCurrent =
                          currentSpaceName &&
                          currentSpaceName.toLowerCase() ===
                            space.projectName.toLowerCase();

                        return (
                          <Link
                            key={space.id}
                            href={`/?space=${space.id}`}
                            onClick={() => {
                              setSpacesOpen(false);
                              setSpacesFilter("");
                            }}
                            className={cn(
                              "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all group",
                              isCurrent
                                ? "bg-blue-600/15 border border-blue-500/30 text-white"
                                : "text-slate-200 hover:bg-slate-800/90 hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  "size-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105",
                                  theme.bg,
                                  theme.color
                                )}
                              >
                                <Icon className="size-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-xs sm:text-sm truncate">
                                    {space.projectName}
                                  </p>
                                  {Boolean(space.projectKey) && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-mono font-bold px-1.5 py-0 rounded bg-slate-800 text-slate-400 border-slate-700"
                                    >
                                      {String(space.projectKey)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {(space.category as string) || "General"}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center text-slate-500 group-hover:text-blue-400 transition-colors">
                              {isCurrent ? (
                                <Check className="size-4 text-blue-400" />
                              ) : (
                                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                              )}
                            </div>
                          </Link>
                        );
                      })}

                      {filteredSpaces.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs text-slate-400 space-y-1">
                          <p className="font-semibold text-slate-300">
                            No service desks found
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            No results matching &ldquo;{spacesFilter}&rdquo;.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT: MY TICKETS + USER PROFILE */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Custom Tickets Page Link */}
            <Link
              href="/tickets"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 sm:gap-2 px-3 sm:px-3.5 h-10 rounded-xl border-blue-500/30 hover:border-blue-400 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 hover:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 group shadow-xs"
              )}
              title="Custom tickets page with advanced filtering & sorting"
            >
              <LayoutList className="size-4 text-blue-400 group-hover:scale-105 transition-transform shrink-0" />
              <span className="hidden sm:inline">Custom Tickets</span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-1.5 py-0 h-4 rounded-full bg-blue-500/20 text-blue-300 border-blue-500/30"
              >
                New
              </Badge>
            </Link>

            {/* My Tickets Button */}
            {session ? (
              <Link
                href="/my-tickets"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5 sm:gap-2 px-3 sm:px-3.5 h-10 rounded-xl border-slate-700/90 hover:border-blue-500/50 bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 group shadow-xs"
                )}
                title="View all your Jira tickets and requests"
              >
                <Ticket className="size-4 text-blue-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="hidden sm:inline">My Tickets</span>
                <ExternalLink className="size-3 text-slate-500 group-hover:text-slate-300 transition-colors hidden sm:inline shrink-0" />
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => signIn("atlassian")}
                className="hidden sm:inline-flex items-center gap-2 h-10 rounded-xl border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium transition-all"
                title="Log in to view your tickets"
              >
                <Ticket className="size-4 text-slate-500" />
                <span>My Tickets</span>
              </Button>
            )}

            {/* User Session / Profile */}
            {status === "loading" ? (
              <div className="size-9 rounded-xl bg-slate-800 animate-pulse border border-slate-700" />
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={cn(
                    "gap-2 px-2.5 sm:px-3 h-10 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer",
                    dropdownOpen
                      ? "bg-slate-800 border-blue-500/50 text-white shadow-sm ring-2 ring-blue-500/20"
                      : "bg-slate-800 hover:bg-slate-750 border-slate-700/80 text-slate-200"
                  )}
                  aria-label="User Profile Menu"
                >
                  <Avatar size="sm" className="size-6 sm:size-7 rounded-lg">
                    {session.user?.image && (
                      <AvatarImage
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <AvatarFallback className="rounded-lg bg-linear-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold">
                      {(session.user?.name || session.user?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span className="hidden md:inline max-w-28 lg:max-w-40 truncate font-semibold">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-slate-400 shrink-0 transition-transform duration-200",
                      dropdownOpen ? "rotate-180 text-blue-400" : ""
                    )}
                  />
                </Button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">
                        {session.user?.name || "Atlassian User"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {session.user?.email}
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        href="/tickets"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors min-h-[40px] group"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutList className="size-4 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span>Custom Tickets Page</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border-blue-500/30"
                        >
                          New
                        </Badge>
                      </Link>

                      <Link
                        href="/my-tickets"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors min-h-[40px] group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Ticket className="size-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                          <span>View My Tickets</span>
                        </div>
                        <ExternalLink className="size-3 text-slate-500 group-hover:text-slate-300" />
                      </Link>
                    </div>

                    <div className="p-1 border-t border-slate-800 pt-1 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut({ callbackUrl: "/login", redirectTo: "/login" });
                        }}
                        className="w-full justify-start gap-2.5 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 rounded-xl cursor-pointer h-auto"
                      >
                        <LogOut className="size-4 text-rose-400" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => signIn("atlassian")}
                className="gap-2 px-3.5 sm:px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/25 active:scale-95 cursor-pointer"
              >
                <LogIn className="size-4" />
                <span>Log In</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER FOR SPACES & ACTIONS */}
      {/* ========================================================= */}
      {spacesOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSpacesOpen(false)}
          />

          {/* Slide-in drawer container */}
          <div className="relative w-4/5 max-w-xs bg-slate-950 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250 pb-[env(safe-area-inset-bottom,16px)]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Service Desks
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Select a portal to browse
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setSpacesOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter portals..."
                  value={spacesFilter}
                  onChange={(e) => setSpacesFilter(e.target.value)}
                  className="bg-slate-900 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-9 pr-4 py-2 border-slate-800 focus-visible:border-blue-500 h-9"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="px-3 pt-3 space-y-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleHomeClick}
                className="w-full justify-between p-3 h-auto rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-300 font-semibold text-xs"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="size-4 text-blue-400" />
                  <span>All Portals & Solutions</span>
                </span>
                <ArrowRight className="size-3.5 text-blue-400" />
              </Button>

              <Link
                href="/tickets"
                onClick={() => setSpacesOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LayoutList className="size-4 text-blue-400" />
                  <span>Custom Tickets Page</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border-blue-500/30"
                >
                  New
                </Badge>
              </Link>

              <Link
                href="/my-tickets"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSpacesOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Ticket className="size-4 text-slate-400" />
                  <span>My Tickets (Native)</span>
                </span>
                <ExternalLink className="size-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Spaces List with big touch targets */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredSpaces.map((space) => {
                const theme = getSpaceIconAndTheme(
                  space.projectName,
                  space.category as string,
                );
                const Icon = theme.icon;

                return (
                  <Link
                    key={space.id}
                    href={`/?space=${space.id}`}
                    onClick={() => {
                      setSpacesOpen(false);
                      setSpacesFilter("");
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-200 hover:text-white transition-all min-h-[48px]"
                  >
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center border shrink-0",
                        theme.bg,
                        theme.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-xs text-slate-100 truncate">
                        {space.projectName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {(space.category as string) || "General"}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {filteredSpaces.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No portals found matching &ldquo;{spacesFilter}&rdquo;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
