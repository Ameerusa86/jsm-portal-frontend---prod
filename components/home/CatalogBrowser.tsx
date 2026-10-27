"use client";

import React from "react";
import { ArrowRight, FileText, Search, ArrowLeft, Layers, ShieldCheck, FolderTree } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ServiceCard } from "@/components/ServiceCard";
import { GroupCard, getGroupTheme } from "@/components/home/GroupCard";
import { JsmSpace, KnowledgeBaseArticle, RequestTypeWithGroup, ProjectGroupSection, CatalogGroup } from "@/types/jsm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CatalogBrowserProps {
  spaceParamId?: string | null;
  spaceCategoryParam?: string | null;
  spaces: JsmSpace[];
  spacesLoading?: boolean;
  requestTypesLoading: boolean;
  totalRequestTypesCount?: number;
  filteredTypes: RequestTypeWithGroup[];
  availableBoards: string[];
  categoriesWithCounts: { name: string; count: number }[];
  projectSections?: ProjectGroupSection[];
  groupedRequests: Record<string, RequestTypeWithGroup[]>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  localSearchQuery: string;
  setLocalSearchQuery: (query: string) => void;
  boardFilter: string;
  setBoardFilter: (board: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  handleSelectType: (type: RequestTypeWithGroup) => void;
  kbResults: KnowledgeBaseArticle[];
  kbLoading: boolean;
  onBackToSpaces?: () => void;
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  spaceParamId,
  spaceCategoryParam,
  spaces,
  requestTypesLoading,
  filteredTypes,
  availableBoards,
  categoriesWithCounts,
  projectSections,
  groupedRequests,
  searchQuery,
  setSearchQuery,
  localSearchQuery,
  setLocalSearchQuery,
  boardFilter,
  setBoardFilter,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  handleSelectType,
  kbResults,
  kbLoading,
  onBackToSpaces,
}) => {
  const currentSpace = React.useMemo(() => {
    if (!spaceParamId || spaceParamId === "all") return null;
    return spaces.find((s) => String(s.id) === String(spaceParamId)) || null;
  }, [spaceParamId, spaces]);

  const isITSection = spaceCategoryParam && spaceParamId === "all";
  const isSingleSpace = Boolean(spaceParamId && spaceParamId !== "all");

  const [viewGrouping, setViewGrouping] = React.useState<"groups" | "all">("groups");
  const [groupSelection, setGroupSelection] = React.useState(() => ({
    selectedCategory,
    spaceParamId,
    spaceCategoryParam,
    boardFilter,
    groupKey: null as string | null,
  }));

  if (
    groupSelection.selectedCategory !== selectedCategory ||
    groupSelection.spaceParamId !== spaceParamId ||
    groupSelection.spaceCategoryParam !== spaceCategoryParam ||
    groupSelection.boardFilter !== boardFilter
  ) {
    setGroupSelection({
      selectedCategory,
      spaceParamId,
      spaceCategoryParam,
      boardFilter,
      groupKey: null,
    });
  }

  const selectedGroup = groupSelection.groupKey;
  const setSelectedGroup = (groupKey: string | null) => {
    setGroupSelection({
      selectedCategory,
      spaceParamId,
      spaceCategoryParam,
      boardFilter,
      groupKey,
    });
  };

  // Guaranteed projectSections grouped strictly by service desk / board
  const effectiveProjectSections = React.useMemo<ProjectGroupSection[]>(() => {
    if (projectSections && projectSections.length > 0) {
      return projectSections;
    }
    const projectMap = new Map<string, ProjectGroupSection>();
    for (const rt of filteredTypes) {
      const sdId = rt.serviceDeskId ? String(rt.serviceDeskId) : "general";
      const space = spaces.find((s) => String(s.id) === sdId);
      const projectName = rt.spaceName || space?.projectName || currentSpace?.projectName || "General Service Desk";
      const projectKey = rt.spaceKey || (space?.projectKey as string | undefined);
      const groupName = rt.portalGroup || rt.group || "General Requests";
      const groupKey = `${sdId}__${groupName}`;

      if (!projectMap.has(sdId)) {
        projectMap.set(sdId, {
          serviceDeskId: sdId,
          projectName,
          projectKey,
          category: space?.category,
          groups: [],
        });
      }

      const p = projectMap.get(sdId)!;
      let g = p.groups.find((grp) => grp.groupKey === groupKey);
      if (!g) {
        g = {
          groupKey,
          groupName,
          serviceDeskId: sdId,
          spaceName: projectName,
          spaceKey: projectKey,
          requestTypes: [],
        };
        p.groups.push(g);
      }
      g.requestTypes.push(rt);
    }
    return Array.from(projectMap.values());
  }, [projectSections, filteredTypes, spaces, currentSpace]);

  // Flattened list of all groups across projects for instant lookup
  const allGroups = React.useMemo<CatalogGroup[]>(() => {
    return effectiveProjectSections.flatMap((p) => p.groups);
  }, [effectiveProjectSections]);

  const totalGroupsCount = allGroups.length;

  const activeGroup = React.useMemo(() => {
    if (!selectedGroup) return null;
    return allGroups.find((g) => g.groupKey === selectedGroup) || null;
  }, [allGroups, selectedGroup]);

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-7xl mx-auto">
      {/* NATIVE SPACE BANNER & BREADCRUMBS */}
      {(currentSpace || isITSection) && (
        <Card className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                <button
                  type="button"
                  onClick={onBackToSpaces}
                  className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Help Center</span>
                </button>
                <span>/</span>
                <span className="text-slate-800 font-bold">
                  {currentSpace ? currentSpace.projectName : "Technology Solutions"}
                </span>
                {currentSpace?.category && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 h-auto"
                  >
                    {currentSpace.category}
                  </Badge>
                )}
                {isITSection && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 h-auto"
                  >
                    IT Teams
                  </Badge>
                )}
              </div>

              {/* Space Title & Subtitle */}
              <div className="flex items-center gap-3">
                <div className="size-10 sm:size-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isITSection ? (
                    <ShieldCheck className="size-5 text-blue-400" />
                  ) : (
                    <Layers className="size-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {currentSpace ? currentSpace.projectName : "Technology Solutions"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {currentSpace
                      ? `Browse available request types, services, and raise tickets for ${currentSpace.projectName}.`
                      : "Submit standard IT requests, report incidents, request automations, or propose improvements."}
                  </p>
                </div>
              </div>
            </div>

            {/* Back to All Spaces Button */}
            {onBackToSpaces && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToSpaces}
                className="self-start sm:self-center cursor-pointer text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200/80 rounded-xl px-4 py-2 h-auto text-xs sm:text-sm font-semibold shadow-2xs"
              >
                <ArrowLeft className="size-4" />
                <span>Browse other boards</span>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* FILTER TABS & SEARCH CONTROLS */}
      <div className="space-y-4">
        {/* Category Tabs & View Switcher */}
        <CategoryTabs
          categories={categoriesWithCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setSelectedGroup(null);
            setLocalSearchQuery("");
            setSearchQuery("");
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          viewGrouping={viewGrouping}
          onViewGroupingChange={(mode) => {
            setViewGrouping(mode);
            if (mode === "all") setSelectedGroup(null);
          }}
        />

        {/* Board Dropdown and Search Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Board Selector */}
          {availableBoards.length > 0 && (
            <div className="w-full sm:w-72">
              <select
                aria-label="Filter by Service Board"
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className="w-full h-10 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="all">All Service Boards</option>
                {availableBoards.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Filter Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search request types in this category..."
              value={localSearchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs h-10"
            />
          </div>
        </div>
      </div>

      {/* SERVICE REQUESTS CATALOG / SEARCH RESULTS */}
      {requestTypesLoading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs animate-pulse flex flex-col justify-between min-h-[175px] sm:min-h-[190px]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-14 rounded-2xl bg-slate-100" />
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-2 mt-auto">
                <div className="w-full h-5 bg-slate-100 rounded" />
                <div className="w-3/4 h-5 bg-slate-100 rounded" />
              </div>
              <div className="w-1/2 h-4 bg-slate-100/60 rounded" />
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
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Suggested Solutions
                </h2>
                {kbLoading && (
                  <div className="size-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin ml-2" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {kbResults.map((article) => (
                  <Card
                    key={article.title}
                    render={
                      <a
                        href={
                          article.portalUrl ||
                          article.content?.iframeSrc ||
                          "#"
                        }
                      />
                    }
                    className="group bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-indigo-400 p-5 transition-all shadow-xs hover:shadow-md cursor-pointer h-full flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      {article.excerpt && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {article.excerpt.replace(/<[^>]+>/g, "")}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-blue-600 font-semibold text-xs gap-1 group-hover:translate-x-1 transition-transform w-max">
                      <span>Read Article</span>
                      <ArrowRight className="size-4" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results Fallback */}
          {filteredTypes.length === 0 &&
            (!kbResults || kbResults.length === 0) &&
            !kbLoading &&
            searchQuery && (
              <Card className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-xl mx-auto space-y-4">
                <div className="size-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  No matching services found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
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

          {/* Active Search Results: Show directly */}
          {filteredTypes.length > 0 && (searchQuery || localSearchQuery) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Search Results
                  </h2>
                  <Badge
                    variant="secondary"
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 h-auto"
                  >
                    {filteredTypes.length} {filteredTypes.length === 1 ? "match" : "matches"}
                  </Badge>
                </div>
              </div>

              {viewMode === "list" ? (
                <div className="flex flex-col gap-3 w-full">
                  {filteredTypes.map((rt) => {
                    const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                    const boardName = rt.spaceName || space?.projectName;
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
                  {filteredTypes.map((rt) => {
                    const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                    const boardName = rt.spaceName || space?.projectName;
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
          )}

          {/* MODE 1: Show Per Group (Grouped Mode, not searching) */}
          {filteredTypes.length > 0 && !searchQuery && !localSearchQuery && viewGrouping === "groups" && (
            <>
              {/* SUBCASE A: Group Cards Grid (Organized per Project / Space) */}
              {!selectedGroup ? (
                <div className="space-y-8">
                  {/* Service Groups Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <FolderTree className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Service Groups
                          </h2>
                          <Badge
                            variant="secondary"
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 h-auto"
                          >
                            {totalGroupsCount}{" "}
                            {totalGroupsCount === 1 ? "group" : "groups"}
                            {effectiveProjectSections.length > 1 &&
                              ` across ${effectiveProjectSections.length} boards`}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          {isSingleSpace
                            ? `Browse available service groups for ${currentSpace?.projectName || "this space"}.`
                            : "Browse service groups organized by service board."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Render Groups Organized per Project / Board */}
                  <div className="space-y-8">
                    {effectiveProjectSections.map((project) => {
                      if (project.groups.length === 0) return null;

                      return (
                        <div
                          key={project.serviceDeskId}
                          className="space-y-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs"
                        >
                          {/* Project Section Header Banner */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Layers className="size-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                                    {project.projectName}
                                  </h3>
                                  {project.projectKey && (
                                    <Badge
                                      variant="outline"
                                      className="text-[11px] font-semibold bg-white text-slate-600 border-slate-200 shadow-2xs"
                                    >
                                      {project.projectKey}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 h-auto"
                                  >
                                    {project.groups.length}{" "}
                                    {project.groups.length === 1 ? "group" : "groups"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Service requests and groups managed by{" "}
                                  <span className="font-semibold text-slate-700">
                                    {project.projectName}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Group Cards Grid for this specific Project */}
                          {viewMode === "list" ? (
                            <div className="flex flex-col gap-3 w-full">
                              {project.groups.map((group) => (
                                <GroupCard
                                  key={group.groupKey}
                                  groupName={group.groupName}
                                  requestTypes={group.requestTypes}
                                  spaceName={project.projectName}
                                  variant="list"
                                  onClick={() => setSelectedGroup(group.groupKey)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 w-full">
                              {project.groups.map((group) => (
                                <GroupCard
                                  key={group.groupKey}
                                  groupName={group.groupName}
                                  requestTypes={group.requestTypes}
                                  spaceName={project.projectName}
                                  variant="grid"
                                  onClick={() => setSelectedGroup(group.groupKey)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* SUBCASE B: Selected Group Drilled-Down View */
                (() => {
                  const activeGroupTypes = activeGroup ? activeGroup.requestTypes : (groupedRequests[selectedGroup] || []);
                  const activeGroupName = activeGroup?.groupName || selectedGroup.split("__").pop() || selectedGroup;
                  const activeSpaceName = activeGroup?.spaceName || currentSpace?.projectName || activeGroupTypes[0]?.spaceName;
                  const theme = getGroupTheme(activeGroupName);
                  const GroupIcon = theme.icon;

                  return (
                    <div className="space-y-6">
                      {/* Clean, Unified Group Header Card */}
                      <Card className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                        {/* Top Meta Bar: Breadcrumbs & Back Button */}
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <button
                              type="button"
                              onClick={() => setSelectedGroup(null)}
                              className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                            >
                              <ArrowLeft className="size-3.5" />
                              <span>All Groups</span>
                            </button>
                            <span>/</span>
                            {activeSpaceName && !currentSpace && (
                              <>
                                <span className="text-slate-600 font-semibold">{activeSpaceName}</span>
                                <span>/</span>
                              </>
                            )}
                            <span className="text-slate-900 font-bold">{activeGroupName}</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGroup(null)}
                            className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200/90 rounded-xl h-8 px-3 gap-1.5 shadow-2xs"
                          >
                            <ArrowLeft className="size-3.5" />
                            <span>Back to group cards</span>
                          </Button>
                        </div>

                        {/* Main Group Info: Icon, Title, Badges & Description */}
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "size-12 sm:size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-0.5",
                              theme.bg
                            )}
                          >
                            <GroupIcon className="size-6 sm:size-7 text-white" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                {activeGroupName}
                              </h2>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs",
                                  theme.badgeBg
                                )}
                              >
                                {activeGroupTypes.length}{" "}
                                {activeGroupTypes.length === 1 ? "request type" : "request types"}
                              </Badge>
                              {activeSpaceName && (
                                <Badge
                                  variant="secondary"
                                  className="text-slate-600 bg-slate-100 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                >
                                  {activeSpaceName}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                              Browse and raise requests available under{" "}
                              <span className="font-semibold text-slate-700">{activeGroupName}</span>
                              {activeSpaceName ? (
                                <span>
                                  {" "}for <span className="font-semibold text-slate-700">{activeSpaceName}</span>
                                </span>
                              ) : null}.
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* Request Type Cards */}
                      {viewMode === "list" ? (
                        <div className="flex flex-col gap-3 w-full">
                          {activeGroupTypes.map((rt) => {
                            const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                            const boardName = rt.spaceName || space?.projectName;
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
                          {activeGroupTypes.map((rt) => {
                            const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                            const boardName = rt.spaceName || space?.projectName;
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
                  );
                })()
              )}
            </>
          )}

          {/* MODE 2: Show All Cards Flat / Grouped Sections */}
          {filteredTypes.length > 0 && !searchQuery && !localSearchQuery && viewGrouping === "all" && (
            <div className="space-y-12">
              {effectiveProjectSections.map((project) => (
                <div
                  key={project.serviceDeskId}
                  className="space-y-8 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs"
                >
                  {/* Project Section Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Layers className="size-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                            {project.projectName}
                          </h3>
                          {project.projectKey && (
                            <Badge
                              variant="outline"
                              className="text-[11px] font-semibold bg-white text-slate-600 border-slate-200 shadow-2xs"
                            >
                              {project.projectKey}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Groups */}
                  <div className="space-y-8">
                    {project.groups.map((group) => (
                      <div key={group.groupKey} className="space-y-3">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                          <h4 className="text-base font-bold text-slate-800">
                            {group.groupName}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                          >
                            {group.requestTypes.length}
                          </Badge>
                        </div>

                        {viewMode === "list" ? (
                          <div className="flex flex-col gap-3 w-full">
                            {group.requestTypes.map((rt) => {
                              const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                              const boardName = rt.spaceName || space?.projectName;
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 w-full">
                            {group.requestTypes.map((rt) => {
                              const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
                              const boardName = rt.spaceName || space?.projectName;
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
