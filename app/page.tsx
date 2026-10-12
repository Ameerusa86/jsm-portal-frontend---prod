"use client";

import {
  useEffect,
  useState,
  useMemo,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Fuse from "fuse.js";
import { JsmField, RequestTypeWithGroup, SubmitResponse } from "@/types/jsm";
import { DynamicForm } from "@/components/DynamicForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { TechnologyCard } from "@/components/TechnologyCard";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SidebarHelp } from "@/components/SidebarHelp";
import { SuccessCard } from "@/components/SuccessCard";
import { RequestFinderModal } from "@/components/RequestFinderModal";
import { QuickSearchDropdown } from "@/components/QuickSearchDropdown";
import {
  Search,
  X,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Zap,
  KeyRound,
  Wifi,
  Laptop,
  Wrench,
  Layers,
  Users,
  FileText,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

// Removed SYNONYM_MAP in favor of fuse.js fuzzy search



function HelpCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestParamId = searchParams.get("request");
  const spaceParamId = searchParams.get("space");
  const forceFormParam = searchParams.get("forceForm") === "true";
  const { data: session } = useSession();

  const [spaces, setSpaces] = useState<any[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const [requestTypes, setRequestTypes] = useState<RequestTypeWithGroup[]>([]);
  const [fields, setFields] = useState<JsmField[]>([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittedKey, setSubmittedKey] = useState<string | null>(null);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [spacesViewMode, setSpacesViewMode] = useState<"all" | "categories">("categories");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCatalog, setShowCatalog] = useState(false);

  // Search typeahead dropdown state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [kbResults, setKbResults] = useState<any[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  // KB Intercept state
  const intentParam = searchParams.get("intent") || "";
  const [deflectionQuery, setDeflectionQuery] = useState("");
  const [suggestedArticles, setSuggestedArticles] = useState<any[]>([]);
  const [suggestedArticlesLoading, setSuggestedArticlesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Spaces on mount
  useEffect(() => {
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (data.values) {
          setSpaces(data.values);
          if (data.values.length === 1 && !spaceParamId) {
            router.replace(`/?space=${data.values[0].id}`);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load spaces", err);
      })
      .finally(() => setSpacesLoading(false));
  }, [spaceParamId, router]);

  // 2. Fetch Request Types when space is selected
  useEffect(() => {
    if (!spaceParamId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/jsm/request-types?serviceDeskId=${spaceParamId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || (data && data.error)) {
          throw new Error(data?.error || "Failed to load request catalog");
        }
        setRequestTypes(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load request catalog";
        setApiError(message);
      })
      .finally(() => setLoading(false));
  }, [spaceParamId]);

  // Fetch KB articles when search query changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setKbResults([]);
      return;
    }

    setKbLoading(true);
    const timer = setTimeout(() => {
      let url = `/api/jsm/knowledgebase?query=${encodeURIComponent(q)}`;
      if (spaceParamId) {
        url += `&serviceDeskId=${spaceParamId}`;
      }

      fetch(url, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setKbResults(data.results || []);
        })
        .catch((err) => {
          console.error("Failed to fetch KB articles", err);
          setKbResults([]);
        })
        .finally(() => {
          setKbLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, spaceParamId]);

  // Derive selected request type from URL parameter
  const selectedType = useMemo(() => {
    if (!requestParamId || requestTypes.length === 0) return null;
    return requestTypes.find((rt) => rt.id === requestParamId) || null;
  }, [requestParamId, requestTypes]);

  // Intercept flow: fetch KB articles when deflectionQuery changes
  useEffect(() => {
    if (!selectedType || !spaceParamId) {
      setSuggestedArticles([]);
      setShowForm(false);
      return;
    }

    if (forceFormParam) {
      setShowForm(true);
      return;
    }

    const queryToSearch = deflectionQuery.trim();
    if (!queryToSearch) {
      setSuggestedArticles([]);
      setShowForm(false);
      return;
    }

    const timer = setTimeout(() => {
      setSuggestedArticlesLoading(true);
      fetch(`/api/jsm/knowledgebase?query=${encodeURIComponent(queryToSearch)}&serviceDeskId=${spaceParamId}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestedArticles(data.results || []);
          setShowForm(false);
        })
        .catch((err) => {
          console.error("Failed to fetch suggested articles", err);
          setShowForm(true); 
        })
        .finally(() => {
          setSuggestedArticlesLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedType, spaceParamId, forceFormParam, deflectionQuery]);

  // Fetch form fields asynchronously when requestParamId changes
  useEffect(() => {
    if (!requestParamId || !spaceParamId) {
      return;
    }

    let isCancelled = false;

    fetch(`/api/jsm/fields/${requestParamId}?serviceDeskId=${spaceParamId}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          fields?: JsmField[];
          formId?: string | null;
        };
        if (!isCancelled) {
          setFields(data.fields || []);
          setCurrentFormId(data.formId || null);
          setFormLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error("Failed to load form fields:", err);
          setApiError("Failed to load fields for this request.");
          setFormLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [requestParamId]);

  const handleSelectType = useCallback(
    (rt: RequestTypeWithGroup & { portalUrl?: string }) => {
      setFormLoading(true);
      const currentQuery = searchQuery.trim();
      setSearchQuery("");
      setIsSearchOpen(false);

      // Option A / Option B Toggle
      // If we want to use the old Native Atlassian portal for all catalog items, uncomment this:
      if (rt.portalUrl) {
        window.location.href = rt.portalUrl;
        return;
      }

      let url = `/?space=${spaceParamId}&request=${rt.id}`;
      if (currentQuery) {
        url += `&intent=${encodeURIComponent(currentQuery)}`;
      }
      router.push(url);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, spaceParamId, searchQuery],
  );

  const handleBackToCatalog = () => {
    setSubmittedKey(null);
    if (spaceParamId) {
      router.push(`/?space=${spaceParamId}`);
    } else {
      router.push("/");
    }
  };

  const handleBackToSpaces = () => {
    setSubmittedKey(null);
    router.push("/");
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    const res = await fetch("/api/jsm/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceDeskId: spaceParamId,
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
        result.error || "Ticket creation failed. Please try again.",
      );
    }
  };

  const handleReloadFields = () => {
    setSubmittedKey(null);
    if (selectedType && spaceParamId) {
      setFormLoading(true);
      fetch(`/api/jsm/fields/${selectedType.id}?serviceDeskId=${spaceParamId}`)
        .then(async (res) => {
          const data = (await res.json()) as {
            fields?: JsmField[];
            formId?: string | null;
          };
          setFields(data.fields || []);
          setCurrentFormId(data.formId || null);
        })
        .catch((err: unknown) => {
          console.error("Failed to reload form fields:", err);
          setApiError("Failed to reload fields for this request.");
        })
        .finally(() => setFormLoading(false));
    }
  };

  const fuse = useMemo(() => {
    return new Fuse(requestTypes, {
      keys: ["name", "description", "group"],
      threshold: 0.5, // Increased from 0.3 to allow looser natural language matches
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [requestTypes]);

  const searchResults = useMemo(() => {
    let query = searchQuery.trim();
    if (!query) return requestTypes;
    
    // Remove common stop words to improve fuzzy matching on natural language sentences
    const stopWords = /\b(i|me|my|myself|we|our|ours|ourselves|you|your|yours|he|him|his|she|her|hers|it|its|they|them|their|what|which|who|whom|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now|cant|cannot)\b/gi;
    const cleanQuery = query.replace(stopWords, '').replace(/\s+/g, ' ').trim();
    
    // If we stripped everything (e.g. they literally just searched "what is it"), fallback to original query
    const finalQuery = cleanQuery.length > 2 ? cleanQuery : query;
    
    return fuse.search(finalQuery).map((result) => result.item);
  }, [fuse, searchQuery, requestTypes]);

  // Filtered Request Types
  const filteredTypes = useMemo(() => {
    return searchResults.filter((rt) => {
      const groupName = rt.group || "General Requests";
      const categoryMatch =
        selectedCategory === "all" ||
        groupName.toLowerCase() === selectedCategory.toLowerCase();
      return categoryMatch;
    });
  }, [searchResults, selectedCategory]);

  // Live Search dropdown items (filtered from all request types regardless of active category)
  const searchDropdownResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];
    return searchResults;
  }, [searchQuery, searchResults]);



  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requestTypes.length };
    requestTypes.forEach((rt) => {
      const g = rt.group || "General Requests";
      counts[g] = (counts[g] || 0) + 1;
    });

    const result = [{ name: "all", count: requestTypes.length }];
    Object.entries(counts).forEach(([name, count]) => {
      if (name !== "all") {
        result.push({ name, count });
      }
    });

    return result;
  }, [requestTypes]);

  // Grouped Requests for Display
  const groupedRequests = useMemo(() => {
    return filteredTypes.reduce(
      (acc, rt) => {
        const group = rt.group || "General Requests";
        if (!acc[group]) acc[group] = [];
        acc[group].push(rt);
        return acc;
      },
      {} as Record<string, RequestTypeWithGroup[]>,
    );
  }, [filteredTypes]);

  const spacesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    spaces.forEach((s) => {
      const cat = s.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    // Sort categories alphabetically
    return Object.keys(grouped).sort().reduce((obj, key) => {
      obj[key] = grouped[key];
      return obj;
    }, {} as Record<string, any[]>);
  }, [spaces]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Keyboard navigation for search dropdown
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

  const handleChipClick = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory("all");
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* GLOBAL ENTERPRISE HEADER */}
      <Header onHomeClick={handleBackToSpaces} />


      {/* HERO SEARCH SECTION (Only on catalog view) */}
      {!selectedType && !submittedKey && (
        <section className="relative w-full bg-linear-to-b from-slate-900 via-slate-900 to-slate-800 text-white pb-16 pt-12 sm:pt-16 sm:pb-20 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 overflow-visible border-b border-slate-800">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[24px_24px]" />
          <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {spaceParamId
                ? spaces.find((s) => s.id === spaceParamId)?.projectName ||
                  "How can we support you today?"
                : "Welcome to the EMS|MC Help Center"}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto font-normal leading-relaxed">
              {spaceParamId
                ? "Submit service requests, report issues, or get instant help from our team."
                : "Search for solutions or select a category below to get started."}
            </p>

            {/* Omni Search Bar with Floating Typeahead Dropdown */}
            <div className="max-w-3xl xl:max-w-4xl mx-auto mt-6 sm:mt-8 relative z-50">
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
                  placeholder={spaceParamId ? "Describe your issue in detail..." : "Search for help, articles, or request types..."}
                  className="block w-full bg-white pl-12 sm:pl-16 pr-12 py-4 sm:py-5 rounded-2xl border-0 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/30 text-sm sm:text-base md:text-lg outline-none shadow-xl transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Floating Live Search Dropdown (Only on global home) */}
              {!spaceParamId && (
                <QuickSearchDropdown
                  isOpen={isSearchOpen}
                  query={searchQuery}
                  results={searchDropdownResults}
                  kbResults={kbResults}
                  kbLoading={kbLoading}
                  selectedIndex={selectedSearchIndex}
                  onSelect={handleSelectType}
                  onClose={() => setIsSearchOpen(false)}
                  onOpenFinder={() => {
                    setIsSearchOpen(false);
                    setIsFinderOpen(true);
                  }}
                />
              )}


            </div>
          </div>
        </section>
      )}

      {/* MAIN BODY AREA */}
      <main className="grow w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
        {/* Error Alert */}
        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-8 flex items-start gap-3 shadow-sm max-w-4xl mx-auto">
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

        {/* =========================================================================
            STATE 1: TICKET SUBMISSION SUCCESS CONFIRMATION
           ========================================================================= */}
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
          /* =========================================================================
             STATE 2: ENTERPRISE FORM DETAILS VIEW (RESPONSIVE FULL-WIDTH 12-COL LAYOUT)
             ========================================================================= */
          <div className="w-full">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
              <button
                onClick={handleBackToCatalog}
                className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Service Catalog</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">
                {selectedType.group || "General Requests"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
                {selectedType.name}
              </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
              {/* Left Column: The Form Card */}
              <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-sm">
                <div className="border-b border-slate-100 pb-6 mb-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {selectedType.group || "Service Request"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                      Standard Workflow
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    {selectedType.name}
                  </h1>

                  {selectedType.description && (
                    <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed">
                      {selectedType.description}
                    </p>
                  )}
                </div>

                {suggestedArticlesLoading || formLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                    <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {suggestedArticlesLoading ? "Checking for known solutions..." : "Loading form configuration from Jira Service Management..."}
                    </p>
                  </div>
                ) : !showForm ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Search className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-indigo-900 mb-1">Briefly describe your issue</h3>
                            <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                              We might have a quick fix for you. Enter keywords like &quot;printer jammed&quot; or &quot;keyboard&quot; to check our knowledge base:
                            </p>
                            <input
                              type="text"
                              value={deflectionQuery}
                              onChange={(e) => setDeflectionQuery(e.target.value)}
                              placeholder="e.g. keyboard is not working"
                              className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {suggestedArticles.length > 0 && (
                        <div className="mt-6 space-y-3 pl-11 border-t border-indigo-100/50 pt-5">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Suggested Solutions</h4>
                          {suggestedArticles.slice(0, 3).map((article) => (
                            <a
                              key={article.title}
                              href={`${article.portalUrl}&requestTypeId=${selectedType.id}`}
                              className="block bg-white border border-indigo-100 hover:border-indigo-300 rounded-lg p-4 transition-all shadow-sm hover:shadow-md group"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {article.title}
                                </h4>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              {article.excerpt && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {article.excerpt.replace(/<[^>]+>/g, '')}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {suggestedArticles.length === 0 && deflectionQuery.trim() !== "" && (
                        <div className="mt-4 pl-11 text-sm text-indigo-500 italic">
                          No matching articles found for &quot;{deflectionQuery}&quot;.
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center pt-4 border-t border-slate-100 gap-3">
                      <p className="text-sm text-slate-500">Ready to submit your ticket?</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors text-sm shadow-sm cursor-pointer"
                      >
                        Continue to Ticket
                      </button>
                    </div>
                  </div>
                ) : (
                  <DynamicForm
                    fields={fields}
                    onSubmit={handleFormSubmit}
                    onCancel={handleBackToCatalog}
                    submitLabel="Submit Service Request"
                  />
                )}
              </div>

              {/* Right Column: Contextual Support Sidebar */}
              <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 lg:sticky lg:top-24">
                <SidebarHelp requestTypeName={selectedType.name} />
              </div>
            </div>
          </div>
        ) : !spaceParamId ? (
          <div className="space-y-12 sm:space-y-16 w-full max-w-7xl mx-auto">
            {/* TECHNOLOGY SOLUTIONS */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Technology Solutions
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <TechnologyCard
                  title="Work Orders"
                  description="Submit standard IT requests, equipment needs, and general inquiries."
                  icon={FileText}
                  href="/?space=all&category=Work%20Orders"
                  gradientFrom="from-blue-500"
                  gradientTo="to-indigo-600"
                />
                <TechnologyCard
                  title="Problems"
                  description="Report hardware issues, software errors, or account access problems."
                  icon={AlertCircle}
                  href="/?space=all&category=Problems"
                  gradientFrom="from-rose-500"
                  gradientTo="to-orange-500"
                />
                <TechnologyCard
                  title="Automations and Reports"
                  description="Request new automated workflows, reports, and data exports."
                  icon={Zap}
                  href="/?space=all&category=Automations%20and%20Reports"
                  gradientFrom="from-emerald-500"
                  gradientTo="to-teal-600"
                />
                <TechnologyCard
                  title="Suggestions"
                  description="Share ideas for system improvements and new technology initiatives."
                  icon={Sparkles}
                  href="/?space=all&category=Suggestions"
                  gradientFrom="from-purple-500"
                  gradientTo="to-fuchsia-600"
                />
              </div>
            </section>

            {/* OTHER SOLUTIONS */}
            <section>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-sm">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Other Solutions
                  </h2>
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-sm border border-slate-200">
                  <button
                    onClick={() => setSpacesViewMode("categories")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      spacesViewMode === "categories"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    By Department
                  </button>
                  <button
                    onClick={() => setSpacesViewMode("all")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      spacesViewMode === "all"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    All Boards
                  </button>
                </div>
              </div>

              {spacesLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                  <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Loading Boards...
                  </p>
                </div>
              ) : spaces.length > 0 ? (
                spacesViewMode === "all" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6">
                    {spaces.map((space) => (
                      <button
                        key={space.id}
                        onClick={() => router.push(`/?space=${space.id}`)}
                        className="group flex flex-col items-start bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 text-left cursor-pointer h-full"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0 border border-slate-100">
                          <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col grow">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
                            {space.projectName}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                            Browse requests for {space.projectName}.
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(spacesByCategory).map(([catName, catSpaces]) => {
                      const isExpanded = expandedCategories.includes(catName);
                      return (
                        <div key={catName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <button
                            onClick={() => toggleCategory(catName)}
                            className="w-full flex items-center justify-between p-5 sm:p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <LayoutGrid className="w-6 h-6" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-bold text-slate-900">
                                  {catName}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                  {catSpaces.length} {catSpaces.length === 1 ? 'board' : 'boards'} available
                                </p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {catSpaces.map((space) => (
                                  <button
                                    key={space.id}
                                    onClick={() => router.push(`/?space=${space.id}`)}
                                    className="group flex flex-col items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3 mb-2 w-full">
                                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xs border border-slate-100 group-hover:text-blue-600">
                                        <Layers className="w-4 h-4" />
                                      </div>
                                      <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-700 flex-1">
                                        {space.projectName}
                                      </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                      Browse {space.projectName} requests.
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-medium">No other boards available.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* =========================================================================
             STATE 3: SERVICE CATALOG & CATEGORY BROWSER
             ========================================================================= */
          <div className="space-y-8 sm:space-y-10 w-full">
            {/* Category Navigation Bar & View Mode Toggle */}

            {/* Category Navigation Bar & View Mode Toggle */}
            {!loading && requestTypes.length > 0 && (showCatalog || searchQuery) && (
              <div className="w-full">
                <CategoryTabs
                  categories={categoriesWithCounts}
                  activeCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                  }}
                  onOpenFinder={() => setIsFinderOpen(true)}
                  viewMode={viewMode}
                  onToggleViewMode={(mode) => setViewMode(mode)}
                />
              </div>
            )}

            {/* Active Search / Filter Status indicator */}
            {searchQuery && (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
                <p className="text-xs sm:text-sm text-slate-700">
                  Showing results matching &ldquo;
                  <span className="font-semibold text-blue-700">
                    {searchQuery}
                  </span>
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-5 sm:gap-6">
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
            ) : !searchQuery && !showCatalog ? (
              /* Search-First Deflection Placeholder */
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  How can we help?
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  Please describe your issue or request in the search bar above. We will instantly search our knowledge base and service catalog for solutions.
                </p>
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => setShowCatalog(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer"
                  >
                    Or browse all {requestTypes.length} request types
                  </button>
                </div>
              </div>
            ) : (
              /* Results View (Catalog or Search Results) */
              <div className="space-y-12">
                {/* Knowledge Base Results (Only show when searching) */}
                {searchQuery && (kbResults.length > 0 || kbLoading) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-indigo-200/80 pb-3.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
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
                          href={article.portalUrl || article.content?.iframeSrc || "#"}
                          className="group flex flex-col bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed flex-1">
                              {article.excerpt.replace(/<[^>]+>/g, '')}
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
                {filteredTypes.length === 0 && (!kbResults || kbResults.length === 0) && !kbLoading && searchQuery && (
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
                    {Object.entries(groupedRequests).map(
                      ([groupName, groupTypes]) => (
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
                              {groupTypes.map((rt) => (
                                <ServiceCard
                                  key={rt.id}
                                  requestType={rt}
                                  onClick={() => handleSelectType(rt)}
                                  variant="list"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-5 sm:gap-6 w-full">
                              {groupTypes.map((rt) => (
                                <ServiceCard
                                  key={rt.id}
                                  requestType={rt}
                                  onClick={() => handleSelectType(rt)}
                                  variant="grid"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
