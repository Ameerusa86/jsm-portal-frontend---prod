"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SuccessCard } from "@/components/SuccessCard";

import { HeroSearch } from "@/components/home/HeroSearch";
import { TechnologySection } from "@/components/home/TechnologySection";
import { OtherSolutionsSection } from "@/components/home/OtherSolutionsSection";
import { FormViewContainer } from "@/components/home/FormViewContainer";
import { CatalogBrowser } from "@/components/home/CatalogBrowser";

import { useJsmSpaces } from "@/hooks/useJsmSpaces";
import { useRequestCatalog } from "@/hooks/useRequestCatalog";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { useFormFields } from "@/hooks/useFormFields";

import { RequestTypeWithGroup, SubmitResponse } from "@/types/jsm";

function HelpCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestParamId = searchParams.get("request");
  const spaceParamId = searchParams.get("space");
  const spaceCategoryParam = searchParams.get("spaceCategory");
  const { data: session } = useSession();

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
  const [submittedKey, setSubmittedKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync category and filters whenever space or URL changes
  const [prevParamsKey, setPrevParamsKey] = useState(
    `${spaceParamId}-${spaceCategoryParam}-${searchParams.get("category") || "all"}`
  );
  const currentParamsKey = `${spaceParamId}-${spaceCategoryParam}-${searchParams.get("category") || "all"}`;

  if (prevParamsKey !== currentParamsKey) {
    setPrevParamsKey(currentParamsKey);
    setSelectedCategory(searchParams.get("category") || "all");
    setBoardFilter("all");
    setLocalSearchQuery("");
  }

  useEffect(() => {
    if (searchParams.get("focusSearch") === "1") {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  const currentSpace =
    spaceParamId && spaceParamId !== "all"
      ? spaces.find((s) => String(s.id) === String(spaceParamId))
      : null;

  // 3. Request Types & Catalog Hook
  const {
    requestTypes,
    globalRequestTypes,
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

  // Selected request type derived from URL param
  const selectedType = useMemo(() => {
    if (!requestParamId) return null;
    return (
      requestTypes.find((rt) => rt.id === requestParamId) ||
      globalRequestTypes.find((rt) => rt.id === requestParamId) ||
      null
    );
  }, [requestParamId, requestTypes, globalRequestTypes]);

  // 4. Knowledge Base Hook (Global across all spaces)
  const { kbResults, kbLoading } = useKnowledgeBase({
    searchQuery,
  });

  // Resolve target space ID for form fields
  const targetSpaceId =
    (spaceParamId && spaceParamId !== "all" ? spaceParamId : null) ||
    selectedType?.serviceDeskId ||
    null;

  // 5. Form Fields & Dynamic Form Hook
  const {
    fields,
    currentFormId,
    formLoading,
    setFormLoading,
    reloadFields,
  } = useFormFields({
    requestParamId,
    spaceParamId: targetSpaceId,
    setApiError,
  });

  // Navigation handlers
  const handleSelectType = useCallback(
    (rt: RequestTypeWithGroup) => {
      setFormLoading(true);
      setSearchQuery("");
      setIsSearchOpen(false);

      if (rt.portalUrl) {
        window.open(rt.portalUrl, "_blank");
        return;
      }

      const targetDeskId =
        rt.serviceDeskId || (spaceParamId && spaceParamId !== "all" ? spaceParamId : "") || "";
      let url = `/?request=${rt.id}`;
      if (targetDeskId) {
        url = `/?space=${targetDeskId}&request=${rt.id}`;
      }
      router.push(url);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, spaceParamId, setFormLoading]
  );

  const handleBackToCatalog = () => {
    setSubmittedKey(null);
    if (spaceParamId && spaceParamId !== "all") {
      router.push(`/?space=${spaceParamId}`);
    } else if (spaceCategoryParam) {
      router.push(
        `/?space=all&spaceCategory=${encodeURIComponent(spaceCategoryParam)}`
      );
    } else {
      router.push("/");
    }
  };

  const handleBackToSpaces = () => {
    setSubmittedKey(null);
    router.push("/");
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    const effectiveServiceDeskId =
      targetSpaceId || selectedType?.serviceDeskId || spaceParamId || undefined;

    const res = await fetch("/api/jsm/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceDeskId: effectiveServiceDeskId,
        requestTypeId: selectedType?.id,
        requestTypeName: selectedType?.name,
        formId: currentFormId,
        fieldValues: values,
        fields,
        userEmail: session?.user?.email || undefined,
      }),
    });

    const result = (await res.json()) as SubmitResponse;
    if (result.success && result.issueKey) {
      setSubmittedKey(result.issueKey);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      throw new Error(
        result.error || "Ticket creation failed. Please try again."
      );
    }
  };

  const handleReloadFields = () => {
    setSubmittedKey(null);
    reloadFields();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* GLOBAL ENTERPRISE HEADER */}
      <Header
        onHomeClick={handleBackToSpaces}
        currentSpaceName={currentSpace?.projectName}
        onSearchFocus={() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }}
      />

      {/* GLOBAL HERO SEARCH SECTION (Available everywhere: Home, Spaces/Boards, and Ticket Forms) */}
      {!submittedKey && (
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
          compact={Boolean(selectedType)}
        />
      )}

      {/* MAIN BODY AREA */}
      <main className="grow w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
        {/* Error Alert */}
        {apiError && (
          <Card className="bg-destructive/10 border-destructive/20 text-destructive p-4 rounded-xl mb-8 flex flex-row items-start gap-3 shadow-xs max-w-4xl mx-auto">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-destructive">Unable to connect to Service Desk</p>
              <p className="text-xs text-destructive/80 mt-0.5">{apiError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setApiError(null)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-auto p-1 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* STATE 1: TICKET SUBMISSION SUCCESS CONFIRMATION */}
        {submittedKey ? (
          <div className="max-w-3xl xl:max-w-4xl mx-auto w-full">
            <SuccessCard
              issueKey={submittedKey}
              requestTypeName={selectedType?.name}
              onBackToCatalog={handleBackToCatalog}
              onSubmitAnother={handleReloadFields}
            />
          </div>
        ) : selectedType ? (
          /* STATE 2: ENTERPRISE FORM DETAILS VIEW */
          <FormViewContainer
            selectedType={selectedType}
            fields={fields}
            formLoading={formLoading}
            onBackToCatalog={handleBackToCatalog}
            onSubmit={handleFormSubmit}
          />
        ) : !spaceParamId ? (
          /* STATE 3: GLOBAL HELP CENTER VIEW */
          <div className="space-y-12 sm:space-y-16 max-w-7xl mx-auto w-full">
            <TechnologySection />
            <OtherSolutionsSection
              spaces={spaces}
              spacesLoading={spacesLoading}
              spacesByCategory={spacesByCategory}
            />
          </div>
        ) : (
          /* STATE 4: SERVICE CATALOG & CATEGORY BROWSER */
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
