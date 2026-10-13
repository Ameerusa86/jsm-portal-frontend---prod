"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { HeroSearch } from "@/components/home/HeroSearch";
import { TechnologySection } from "@/components/home/TechnologySection";
import { OtherSolutionsSection } from "@/components/home/OtherSolutionsSection";
import { CatalogBrowser } from "@/components/home/CatalogBrowser";

import { useJsmSpaces } from "@/hooks/useJsmSpaces";
import { useRequestCatalog } from "@/hooks/useRequestCatalog";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

import { RequestTypeWithGroup } from "@/types/jsm";

function HelpCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceParamId = searchParams.get("space");
  const spaceCategoryParam = searchParams.get("spaceCategory");

  // 1. Spaces & Departments Hook
  const { spaces, spacesLoading, spacesByCategory } = useJsmSpaces();

  // 2. View & Local Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync category and filters whenever space or URL changes
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setBoardFilter("all");
    setLocalSearchQuery("");
  }, [spaceParamId, spaceCategoryParam, searchParams]);

  // 3. Request Types & Catalog Hook
  const {
    requestTypes,
    requestTypesLoading,
    apiError,
    setApiError,
    filteredTypes,
    availableBoards,
    categoriesWithCounts,
    groupedRequests,
    searchDropdownResults,
  } = useRequestCatalog({
    spaceParamId,
    spaceCategoryParam,
    spaces,
    spacesLoading,
    selectedCategory,
    searchQuery,
    localSearchQuery,
    boardFilter,
  });

  // 4. Knowledge Base Hook (Global across all spaces)
  const { kbResults, kbLoading } = useKnowledgeBase({
    searchQuery,
  });

  // Navigation handlers: strictly open Jira Production form in a new tab
  const handleSelectType = useCallback(
    (rt: RequestTypeWithGroup & { portalUrl?: string; serviceDeskId?: string }) => {
      setSearchQuery("");
      setIsSearchOpen(false);

      const prodDomain = "https://emsmc.atlassian.net";
      const deskId =
        rt.serviceDeskId ||
        (spaceParamId && spaceParamId !== "all" ? spaceParamId : "") ||
        "1";

      let targetUrl = rt.portalUrl;
      if (!targetUrl || targetUrl.includes("sandbox") || targetUrl.includes("emsmc1")) {
        targetUrl = `${prodDomain}/servicedesk/customer/portal/${deskId}/create/${rt.id}`;
      } else {
        // Enforce canonical production domain
        targetUrl = targetUrl.replace(/https:\/\/[^/]+/, prodDomain);
      }

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    },
    [spaceParamId]
  );

  const handleBackToSpaces = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* GLOBAL ENTERPRISE HEADER */}
      <Header onHomeClick={handleBackToSpaces} />

      {/* GLOBAL HERO SEARCH SECTION */}
      <HeroSearch
        spaceParamId={spaceParamId}
        spaceCategoryParam={spaceCategoryParam}
        spaces={spaces}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        selectedSearchIndex={selectedSearchIndex}
        setSelectedSearchIndex={setSelectedSearchIndex}
        searchDropdownResults={searchDropdownResults}
        kbResults={kbResults}
        kbLoading={kbLoading}
        handleSelectType={handleSelectType}
        searchInputRef={searchInputRef}
        compact={false}
      />

      {/* MAIN BODY AREA */}
      <main className="grow w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
        {/* Error Alert */}
        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-8 flex items-start gap-3 shadow-xs max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Unable to connect to Service Desk</p>
              <p className="text-xs text-rose-700 mt-0.5">{apiError}</p>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {!spaceParamId ? (
          /* STATE 1: GLOBAL HELP CENTER VIEW */
          <div className="space-y-12 sm:space-y-16 max-w-7xl mx-auto w-full">
            <TechnologySection />
            <OtherSolutionsSection
              spaces={spaces}
              spacesLoading={spacesLoading}
              spacesByCategory={spacesByCategory}
            />
          </div>
        ) : (
          /* STATE 2: SERVICE CATALOG & CATEGORY BROWSER */
          <CatalogBrowser
            spaceParamId={spaceParamId}
            spaceCategoryParam={spaceCategoryParam}
            onBackToSpaces={handleBackToSpaces}
            requestTypesLoading={requestTypesLoading}
            totalRequestTypesCount={requestTypes.length}
            categoriesWithCounts={categoriesWithCounts}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            boardFilter={boardFilter}
            setBoardFilter={setBoardFilter}
            availableBoards={availableBoards}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredTypes={filteredTypes}
            groupedRequests={groupedRequests}
            kbResults={kbResults}
            kbLoading={kbLoading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            spaces={spaces}
            handleSelectType={handleSelectType}
          />
        )}
      </main>

      {/* GLOBAL ENTERPRISE FOOTER */}
      <Footer />
    </div>
  );
}

export default function HelpCenter() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
            <span className="text-sm font-medium">Loading Service Desk...</span>
          </div>
        </div>
      }
    >
      <HelpCenterContent />
    </Suspense>
  );
}
