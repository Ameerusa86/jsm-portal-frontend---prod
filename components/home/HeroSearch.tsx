"use client";

import React, { RefObject } from "react";
import { Search, X } from "lucide-react";
import { QuickSearchDropdown } from "@/components/QuickSearchDropdown";
import { JsmSpace, KnowledgeBaseArticle, RequestTypeWithGroup } from "@/types/jsm";

interface HeroSearchProps {
  spaceParamId: string | null;
  spaceCategoryParam?: string | null;
  spaces: JsmSpace[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  selectedSearchIndex: number;
  setSelectedSearchIndex: React.Dispatch<React.SetStateAction<number>>;
  searchDropdownResults: RequestTypeWithGroup[];
  kbResults: KnowledgeBaseArticle[];
  kbLoading: boolean;
  handleSelectType: (rt: RequestTypeWithGroup & { portalUrl?: string }) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  compact?: boolean;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  spaceParamId,
  spaceCategoryParam,
  spaces,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  selectedSearchIndex,
  setSelectedSearchIndex,
  searchDropdownResults,
  kbResults,
  kbLoading,
  handleSelectType,
  searchInputRef,
  compact = false,
}) => {
  const currentSpace =
    spaceParamId && spaceParamId !== "all"
      ? spaces.find((s) => String(s.id) === String(spaceParamId))
      : null;

  const isITCategory =
    spaceCategoryParam && (spaceParamId === "all" || !spaceParamId);

  const displayTitle = currentSpace
    ? currentSpace.projectName
    : isITCategory
      ? spaceCategoryParam === "Information Technology"
        ? "Technology Solutions"
        : spaceCategoryParam
      : "Welcome to the EMS|MC Help Center";

  const displaySubtitle = currentSpace
    ? `Search across all articles and request types, or browse services in ${currentSpace.projectName}.`
    : isITCategory
      ? "Search across all articles and request types, or browse IT solutions below."
      : "Search for solutions or select a category below to get started.";

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchDropdownResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev < searchDropdownResults.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev > 0 ? prev - 1 : searchDropdownResults.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchDropdownResults[selectedSearchIndex]) {
        handleSelectType(searchDropdownResults[selectedSearchIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  return (
    <section
      className={`relative w-full bg-linear-to-b from-slate-900 via-slate-900 to-slate-800 text-white px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 overflow-visible border-b border-slate-800 ${
        compact ? "py-8 sm:py-10" : "pb-16 pt-12 sm:pt-16 sm:pb-20"
      }`}
    >
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto text-center space-y-3 sm:space-y-4">
        <h1
          className={
            compact
              ? "text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight"
              : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
          }
        >
          {displayTitle}
        </h1>

        <p
          className={
            compact
              ? "text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-normal leading-relaxed"
              : "text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto font-normal leading-relaxed"
          }
        >
          {displaySubtitle}
        </p>

        {/* Omni Search Bar with Floating Typeahead Dropdown */}
        <div
          className={`max-w-3xl xl:max-w-4xl mx-auto relative z-50 ${
            compact ? "mt-4 sm:mt-5" : "mt-6 sm:mt-8"
          }`}
        >
          <div className="relative w-full shadow-2xl rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSelectedSearchIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search for help, articles, or request types..."
              className="block w-full bg-white pl-12 sm:pl-16 pr-12 py-4 sm:py-5 rounded-2xl border-0 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/30 text-base md:text-lg outline-none shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer min-w-[44px] min-h-[44px]"
                aria-label="Clear search query"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Floating Live Search Dropdown (Available Everywhere) */}
          <QuickSearchDropdown
            isOpen={isSearchOpen}
            query={searchQuery}
            results={searchDropdownResults}
            kbResults={kbResults}
            kbLoading={kbLoading}
            selectedIndex={selectedSearchIndex}
            onSelect={handleSelectType}
            onClose={() => setIsSearchOpen(false)}
          />
        </div>
      </div>
    </section>
  );
};
