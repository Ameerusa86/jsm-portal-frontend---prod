"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, Ticket, ChevronDown, Layers, X, Search } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [spaces, setSpaces] = useState<{ id: string; projectName: string }[]>(
    [],
  );
  const [spacesFilter, setSpacesFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const spacesDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (data.values) {
          setSpaces(data.values);
        }
      })
      .catch((err) => console.error("Failed to load spaces in header", err));
  }, []);

  const filteredSpaces = spaces.filter((space) =>
    space.projectName.toLowerCase().includes(spacesFilter.toLowerCase()),
  );

  return (
    <header className="w-full border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo */}
            <button
              onClick={onHomeClick}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg transition-all cursor-pointer group py-1 min-h-[44px] flex items-center"
            >
              <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-white group-hover:text-blue-400 transition-colors">
                EMSMC
              </span>
            </button>

            {/* Spaces Trigger Button */}
            {spaces.length > 0 && (
              <div className="relative ml-1 sm:ml-4" ref={spacesDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSpacesOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-800 sm:border-transparent hover:border-slate-700 bg-slate-800/60 sm:bg-transparent hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px]"
                  aria-label="Browse Spaces"
                >
                  <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="inline text-xs sm:text-sm">Spaces</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                </button>

                {/* Desktop Dropdown Menu (hidden on mobile) */}
                {spacesOpen && (
                  <div className="hidden sm:block absolute left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-700 mb-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search spaces..."
                          value={spacesFilter}
                          className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          onChange={(e) => setSpacesFilter(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2">
                        Select a Space
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSpaces.map((space) => (
                        <Link
                          key={space.id}
                          href={`/?space=${space.id}`}
                          onClick={() => {
                            setSpacesOpen(false);
                            setSpacesFilter("");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="truncate">
                            <p className="font-medium truncate">
                              {space.projectName}
                            </p>
                          </div>
                        </Link>
                      ))}
                      {filteredSpaces.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">
                          No spaces found matching &ldquo;{spacesFilter}&rdquo;.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation / User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session && (
              <Link
                href="/my-tickets"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 min-h-[44px]"
                title="View My Tickets"
              >
                <Ticket className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="hidden sm:inline">My Tickets</span>
              </Link>
            )}

            {status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse" />
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 transition-all cursor-pointer min-h-[44px]"
                >
                  {session.user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-6 h-6 rounded-full border border-slate-600 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(session.user?.name || session.user?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-30 sm:max-w-45 truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-xs font-semibold text-white truncate">
                        {session.user?.name || "Atlassian User"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {session.user?.email}
                      </p>
                    </div>

                    <Link
                      href="/my-tickets"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 hover:text-white transition-colors min-h-[40px]"
                    >
                      <Ticket className="w-4 h-4 text-blue-400" />
                      <span>View My Tickets</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-300 hover:bg-slate-700 hover:text-rose-200 transition-colors cursor-pointer text-left min-h-[40px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn("atlassian")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer for Spaces */}
      {spacesOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSpacesOpen(false)}
          />

          {/* Slide-in drawer container */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250 pb-[env(safe-area-inset-bottom,16px)]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-white">Select a Space</h3>
              </div>
              <button
                type="button"
                onClick={() => setSpacesOpen(false)}
                className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input (16px to prevent iOS Safari auto-zoom) */}
            <div className="p-4 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter boards & spaces..."
                  value={spacesFilter}
                  onChange={(e) => setSpacesFilter(e.target.value)}
                  className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-base rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Spaces List with big touch targets */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredSpaces.map((space) => (
                <Link
                  key={space.id}
                  href={`/?space=${space.id}`}
                  onClick={() => {
                    setSpacesOpen(false);
                    setSpacesFilter("");
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 shrink-0 border border-slate-700/60">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-sm text-slate-100 truncate">
                      {space.projectName}
                    </p>
                  </div>
                </Link>
              ))}

              {filteredSpaces.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No spaces found matching &ldquo;{spacesFilter}&rdquo;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
