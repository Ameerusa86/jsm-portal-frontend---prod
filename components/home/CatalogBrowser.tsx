"use client";

import React from "react";
import { ArrowRight, FileText, Search, ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ServiceCard } from "@/components/ServiceCard";
import { JsmSpace, KnowledgeBaseArticle, RequestTypeWithGroup } from "@/types/jsm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CatalogBrowserProps {
  spaceParamId?: string | null;
  spaceCategoryParam?: string | null;
  onBackToSpaces?: () => void;
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
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  spaceParamId,
  spaceCategoryParam,
  onBackToSpaces,
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
}) => {
  const currentSpace = React.useMemo(() => {
    if (!spaceParamId || spaceParamId === "all") return null;
    return spaces.find((s) => String(s.id) === String(spaceParamId)) || null;
  }, [spaceParamId, spaces]);

  const isITSection = spaceCategoryParam && spaceParamId === "all";

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-7xl mx-auto">
      {/* NATIVE SPACE BANNER & BREADCRUMBS */}
      {(currentSpace || isITSection) && (
        <Card className="p-6 sm:p-8 bg-card border-border shadow-xs gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2.5">
                <button
                  type="button"
                  onClick={onBackToSpaces}
                  className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Help Center</span>
                </button>
                <span>/</span>
                <span className="text-foreground font-bold">
                  {currentSpace ? currentSpace.projectName : "Technology Solutions"}
                </span>
                {currentSpace?.category && (
                  <Badge variant="secondary" className="ml-2 text-[11px] font-semibold">
                    {currentSpace.category}
                  </Badge>
                )}
                {isITSection && (
                  <Badge variant="secondary" className="ml-2 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                    IT Teams
                  </Badge>
                )}
              </div>

              {/* Space Title & Subtitle */}
              <div className="flex items-center gap-3">
                <div className="size-10 sm:size-11 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0 shadow-xs">
                  {isITSection ? (
                    <ShieldCheck className="size-5 text-blue-400" />
                  ) : (
                    <Layers className="size-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {currentSpace ? currentSpace.projectName : "Technology Solutions"}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {currentSpace
                      ? `Browse available request types, services, and raise tickets for ${currentSpace.projectName}.`
                      : "Submit standard IT requests, report incidents, request automations, or propose improvements."}
                  </p>
                </div>
              </div>
            </div>

            {onBackToSpaces && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onBackToSpaces}
                className="shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Browse other boards</span>
              </Button>
            )}
          </div>
        </Card>
      )}

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
            viewMode={viewMode}
            onToggleViewMode={(mode) => setViewMode(mode)}
          />

          {/* Local Toolbar: Text Filter & Board Dropdown */}
          {(selectedCategory !== "all" || filteredTypes.length > 0) && (
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-card border-border shadow-xs gap-0">
              {/* Local Search Input */}
              <div className="relative w-full sm:max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter requests within this category..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-10 bg-muted/30 border-border text-sm"
                />
              </div>

              {/* Board Filter Dropdown */}
              {selectedCategory !== "all" && availableBoards.length > 1 && (
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Board:
                  </span>
                  <select
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    className="w-full sm:w-auto bg-muted/40 border border-border text-foreground text-sm rounded-lg focus:outline-none focus:border-ring py-2 px-3 cursor-pointer h-10"
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
            </Card>
          )}
        </div>
      )}

      {/* Active Search / Filter Status indicator */}
      {searchQuery && (
        <Card className="flex flex-row items-center justify-between px-4 py-3 bg-card border-border shadow-xs gap-0">
          <p className="text-xs sm:text-sm text-foreground">
            Showing results matching &ldquo;
            <span className="font-semibold text-primary">{searchQuery}</span>
            &rdquo; ({filteredTypes.length} found)
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer h-auto p-0"
          >
            Clear search
          </Button>
        </Card>
      )}

      {/* Loading Skeleton */}
      {requestTypesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card
              key={i}
              className="p-6 sm:p-7 min-h-[175px] sm:min-h-[190px] animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="size-14 rounded-2xl bg-muted" />
                <div className="w-3/4 h-5 bg-muted rounded" />
              </div>
              <div className="w-1/2 h-4 bg-muted/60 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        /* Results View (Catalog or Search Results) */
        <div className="space-y-12">
          {/* Knowledge Base Results (Only show when searching) */}
          {searchQuery && (kbResults.length > 0 || kbLoading) && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-indigo-200/80 pb-3.5">
                <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="size-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Suggested Solutions
                </h2>
                {kbLoading && (
                  <div className="size-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin ml-2" />
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
                    className="group flex flex-col"
                  >
                    <Card className="h-full p-5 bg-card hover:bg-muted/30 border-border hover:border-indigo-400 transition-all shadow-xs hover:shadow-md cursor-pointer gap-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                            {article.excerpt.replace(/<[^>]+>/g, "")}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/60 flex items-center text-primary font-semibold text-xs gap-1 group-hover:translate-x-1 transition-transform w-max">
                        <span>Read Article</span>
                        <ArrowRight className="size-4" />
                      </div>
                    </Card>
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
              <Card className="text-center py-20 p-8 shadow-sm max-w-xl mx-auto space-y-4 bg-card border-border gap-0">
                <div className="size-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-2">
                  <Search className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  No matching services found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We couldn&apos;t find any service request matching &ldquo;
                  {searchQuery}&rdquo;. Try another keyword or clear your filters to browse all available services.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    variant="default"
                    size="sm"
                    className="cursor-pointer shadow-sm"
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            )}

          {/* Grouped Services Sections */}
          {filteredTypes.length > 0 && (
            <div className="space-y-12">
              {Object.entries(groupedRequests).map(([groupName, groupTypes]) => (
                <div key={groupName} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        {searchQuery ? "Recommended Request Types" : groupName}
                      </h2>
                      {!searchQuery && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {groupTypes.length}
                        </Badge>
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
                            isIT={Boolean(isITSection)}
                            onClick={() => handleSelectType(rt)}
                            variant="list"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8 w-full">
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
                            isIT={Boolean(isITSection)}
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
