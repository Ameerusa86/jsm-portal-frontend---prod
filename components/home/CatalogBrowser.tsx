"use client";

import React from "react";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ServiceCard } from "@/components/ServiceCard";
import { JsmSpace, KnowledgeBaseArticle, RequestTypeWithGroup } from "@/types/jsm";

interface CatalogBrowserProps {
  requestTypesLoading: boolean;
  totalRequestTypesCount: number;
  categoriesWithCounts: Array<{
    name: string;
    count: number;
  }>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  localSearchQuery: string;
  setLocalSearchQuery: (query: string) => void;
  boardFilter: string;
  setBoardFilter: (board: string) => void;
  availableBoards: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTypes: RequestTypeWithGroup[];
  groupedRequests: Record<string, RequestTypeWithGroup[]>;
  kbResults: KnowledgeBaseArticle[];
  kbLoading: boolean;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  spaces: JsmSpace[];
  handleSelectType: (requestType: RequestTypeWithGroup) => void;
  setIsFinderOpen: (open: boolean) => void;
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  requestTypesLoading,
  totalRequestTypesCount,
  categoriesWithCounts,
  selectedCategory,
  setSelectedCategory,
  localSearchQuery,
  setLocalSearchQuery,
  boardFilter,
  setBoardFilter,
  availableBoards,
  searchQuery,
  setSearchQuery,
  filteredTypes,
  groupedRequests,
  kbResults,
  kbLoading,
  viewMode,
  setViewMode,
  spaces,
  handleSelectType,
  setIsFinderOpen,
}) => {
  return (
    <div className="space-y-8 sm:space-y-10 w-full">
      {/* Category Navigation Bar & View Mode Toggle */}
      {!requestTypesLoading && totalRequestTypesCount > 0 && (
        <div className="w-full flex flex-col gap-4">
          <CategoryTabs
            categories={categoriesWithCounts}
            activeCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setLocalSearchQuery(""); // reset local search
              setBoardFilter("all"); // reset board filter
            }}
            onOpenFinder={() => setIsFinderOpen(true)}
            viewMode={viewMode}
            onToggleViewMode={(mode) => setViewMode(mode)}
          />

          {/* Local Toolbar: Text Filter & Board Dropdown */}
          {(selectedCategory !== "all" || filteredTypes.length > 0) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              {/* Local Search Input */}
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter requests within this category..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[44px]"
                />
              </div>

              {/* Board Filter Dropdown */}
              {selectedCategory !== "all" && availableBoards.length > 1 && (
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                    Board:
                  </span>
                  <select
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-base sm:text-sm rounded-lg focus:ring-2 focus:ring-blue-500 outline-none py-2.5 sm:py-2 px-3 cursor-pointer min-h-[44px]"
                  >
                    <option value="all">All Boards</option>
                    {availableBoards.map((board) => (
                      <option key={board} value={board}>
                        {board}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Search / Filter Status indicator */}
      {searchQuery && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
          <p className="text-xs sm:text-sm text-slate-700">
            Showing results matching &ldquo;
            <span className="font-semibold text-blue-700">{searchQuery}</span>
            &rdquo; ({filteredTypes.length} found)
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {requestTypesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 h-52 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="w-3/4 h-5 bg-slate-200 rounded" />
                <div className="w-full h-3.5 bg-slate-100 rounded" />
              </div>
              <div className="w-1/2 h-3.5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        /* Results View (Catalog or Search Results) */
        <div className="space-y-12">
          {/* Knowledge Base Results (Only show when searching) */}
          {searchQuery && (kbResults.length > 0 || kbLoading) && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-indigo-200/80 pb-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Suggested Solutions
                </h2>
                {kbLoading && (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin ml-2" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {kbResults.map((article) => (
                  <a
                    key={article.title}
                    href={
                      article.portalUrl ||
                      article.content?.iframeSrc ||
                      "#"
                    }
                    className="group flex flex-col bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    {article.excerpt && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed flex-1">
                        {article.excerpt.replace(/<[^>]+>/g, "")}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-indigo-600 font-semibold text-xs gap-1 group-hover:translate-x-1 transition-transform w-max">
                      <span>Read Article</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No Results Fallback */}
          {filteredTypes.length === 0 &&
            (!kbResults || kbResults.length === 0) &&
            !kbLoading &&
            searchQuery && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  No matching services found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  We couldn&apos;t find any service request matching &ldquo;
                  {searchQuery}&rdquo;. Try another keyword or use our 2-step
                  decision finder.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsFinderOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch 2-Step Request Finder</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

          {/* Grouped Services Sections */}
          {filteredTypes.length > 0 && (
            <div className="space-y-12">
              {Object.entries(groupedRequests).map(([groupName, groupTypes]) => (
                <div key={groupName} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {searchQuery ? "Recommended Request Types" : groupName}
                      </h2>
                      {!searchQuery && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200/70 text-slate-700">
                          {groupTypes.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render in Selected View Mode: Grid or List */}
                  {viewMode === "list" ? (
                    <div className="flex flex-col gap-3 w-full">
                      {groupTypes.map((rt) => {
                        const space = spaces.find(
                          (s) => s.id === rt.serviceDeskId
                        );
                        const boardName = space ? space.projectName : undefined;
                        return (
                          <ServiceCard
                            key={rt.id}
                            requestType={rt}
                            boardName={boardName}
                            onClick={() => handleSelectType(rt)}
                            variant="list"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 sm:gap-6 w-full">
                      {groupTypes.map((rt) => {
                        const space = spaces.find(
                          (s) => s.id === rt.serviceDeskId
                        );
                        const boardName = space ? space.projectName : undefined;
                        return (
                          <ServiceCard
                            key={rt.id}
                            requestType={rt}
                            boardName={boardName}
                            onClick={() => handleSelectType(rt)}
                            variant="grid"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
