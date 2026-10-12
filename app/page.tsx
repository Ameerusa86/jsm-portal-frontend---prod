"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RequestFinderModal } from "@/components/RequestFinderModal";

import { HeroSearch } from "@/components/home/HeroSearch";
import { TechnologySection } from "@/components/home/TechnologySection";
import { OtherSolutionsSection } from "@/components/home/OtherSolutionsSection";
import { CatalogBrowser } from "@/components/home/CatalogBrowser";

import { useJsmSpaces } from "@/hooks/useJsmSpaces";
import { useRequestCatalog } from "@/hooks/useRequestCatalog";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

import { RequestTypeWithGroup } from "@/types/jsm";

function HelpCenterContent() {
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
    searchParams.get("category") || "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // 4. Knowledge Base Hook
  const { kbResults, kbLoading } = useKnowledgeBase({
    searchQuery,
    spaceParamId,
    selectedType: null,
    forceFormParam: false,
    deflectionQuery: "",
  });

  // 5. Open request type form directly in a NEW TAB (Pure Production)
  const handleSelectType = useCallback(
    (
      rt: RequestTypeWithGroup & { portalUrl?: string; serviceDeskId?: string },
    ) => {
      setSearchQuery("");
      setIsSearchOpen(false);

      const baseUrl = "https://emsmc1.atlassian.net";
      const sdId = rt.serviceDeskId || spaceParamId || "1";

      const targetPortalUrl =
        rt.portalUrl && !rt.portalUrl.includes("sandbox")
          ? rt.portalUrl
          : `${baseUrl}/servicedesk/customer/portal/${sdId}/create/${rt.id}`;

      // Open Jira request creation form in a new tab
      window.open(targetPortalUrl, "_blank", "noopener,noreferrer");
    },
    [spaceParamId],
  );

  const handleBackToSpaces = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* GLOBAL ENTERPRISE HEADER */}
      <Header onHomeClick={handleBackToSpaces} />

      {/* HERO SEARCH SECTION */}
      <HeroSearch
        spaceParamId={spaceParamId}
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
        setIsFinderOpen={setIsFinderOpen}
        searchInputRef={searchInputRef}
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
          /* GLOBAL HELP CENTER VIEW */
          <div className="space-y-12 sm:space-y-16 max-w-7xl mx-auto w-full">
            <TechnologySection />
            <OtherSolutionsSection
              spaces={spaces}
              spacesLoading={spacesLoading}
              spacesByCategory={spacesByCategory}
            />
          </div>
        ) : (
          /* SERVICE CATALOG & CATEGORY BROWSER */
          <CatalogBrowser
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
            setIsFinderOpen={setIsFinderOpen}
          />
        )}
      </main>

      {/* GLOBAL ENTERPRISE FOOTER */}
      <Footer />

      {/* 2-Step Request Finder Modal */}
      <RequestFinderModal
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
        requestTypes={requestTypes}
        onSelectRequestType={handleSelectType}
      />
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
