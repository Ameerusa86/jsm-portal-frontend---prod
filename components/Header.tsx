"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, Ticket, ChevronDown, Layers } from "lucide-react";
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

  return (
    <header className="w-full border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 transition-all">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <button
              onClick={onHomeClick}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg transition-all cursor-pointer group py-1"
            >
              <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-white group-hover:text-blue-400 transition-colors">
                EMSMC
              </span>
            </button>

            {/* Spaces Dropdown */}
            {spaces.length > 0 && (
              <div className="relative ml-2 sm:ml-4" ref={spacesDropdownRef}>
                <button
                  onClick={() => setSpacesOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Spaces</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {spacesOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-700 mb-1">
                      <input
                        type="text"
                        placeholder="Search spaces..."
                        className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 text-xs sm:text-sm rounded-md px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-2"
                        onChange={(e) => {
                          const query = e.target.value.toLowerCase();
                          setSpacesFilter(query);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Select a Space
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {spaces
                        .filter((space) =>
                          space.projectName
                            .toLowerCase()
                            .includes(spacesFilter),
                        )
                        .map((space) => (
                          <Link
                            key={space.id}
                            href={`/?space=${space.id}`}
                            onClick={() => {
                              setSpacesOpen(false);
                              setSpacesFilter(""); // reset filter on close
                              // If they are on another page, they will navigate.
                              // The onHomeClick is for resetting state on the homepage,
                              // we don't strictly need it if they click a link, but
                              // we might want to force a refresh if they are on the same space.
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
                      {spaces.filter((space) =>
                        space.projectName.toLowerCase().includes(spacesFilter),
                      ).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">
                          No spaces found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation / User Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/my-tickets"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-blue-400" />
              <span>My Tickets</span>
            </Link>

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 transition-all cursor-pointer"
                >
                  {session.user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-6 h-6 rounded-full border border-slate-600"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {(session.user?.name || session.user?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-30 sm:max-w-45 truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-blue-400" />
                      <span>View My Tickets</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-300 hover:bg-slate-700 hover:text-rose-200 transition-colors cursor-pointer text-left"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
