"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Share2,
  Check,
  Printer,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Compass,
  X,
  ChevronDown,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";

interface ArticleData {
  title: string;
  htmlContent: string;
  mappedRequestTypeId?: string | null;
  baseUrl?: string;
  lastModified?: string | null;
  author?: string | null;
  spaceName?: string | null;
  spaceKey?: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function calculateReadingTime(html: string): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function processHtmlAndExtractToc(rawHtml: string): {
  processedHtml: string;
  toc: TocItem[];
} {
  if (!rawHtml) return { processedHtml: "", toc: [] };

  if (typeof window === "undefined") {
    return { processedHtml: rawHtml, toc: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4");
    const toc: TocItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || "";
      if (!text) return;

      const slug =
        text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 40) || `section-${index}`;
      const id = `heading-${index}-${slug}`;

      heading.setAttribute("id", id);
      const level = parseInt(heading.tagName.substring(1), 10);

      // Only include h2 and h3 in TOC for clean hierarchy
      if (level === 2 || level === 3) {
        toc.push({ id, text, level });
      }
    });

    return {
      processedHtml: doc.body.innerHTML,
      toc,
    };
  } catch (err) {
    console.error("Error parsing article HTML for TOC:", err);
    return { processedHtml: rawHtml, toc: [] };
  }
}

function ArticleSkeletonLoader() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="h-16 sm:h-18 bg-slate-900 w-full animate-pulse" />
      {/* Sub-bar skeleton */}
      <div className="h-12 border-b border-slate-200/80 bg-white w-full animate-pulse" />
      {/* Hero skeleton */}
      <div className="border-b border-slate-200/80 bg-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-6 w-36 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-10 sm:h-12 w-3/4 max-w-2xl bg-slate-200 rounded-xl animate-pulse" />
          <div className="flex items-center gap-4 pt-1">
            <div className="h-5 w-28 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
      {/* Body skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full flex flex-col lg:flex-row gap-10">
        <div className="flex-1 max-w-4xl space-y-6">
          <div className="h-4 w-full bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-11/12 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-56 w-full bg-slate-200/60 rounded-2xl animate-pulse my-8" />
          <div className="h-4 w-full bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-200/70 rounded animate-pulse" />
        </div>
        <div className="w-80 hidden lg:block space-y-5">
          <div className="h-44 bg-slate-200/60 rounded-2xl animate-pulse" />
          <div className="h-40 bg-slate-200/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ArticleViewerContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const serviceDeskId = searchParams.get("serviceDeskId");
  const requestTypeId = searchParams.get("requestTypeId");

  const { status } = useSession();
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not-helpful" | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Configuration Toggle:
  // If true, redirects to Native Atlassian Portal (Option A)
  // If false, renders our Custom Next.js Form (Option B)
  const USE_NATIVE_PORTAL = true;

  const isPageLoading = loading;
  const displayedError = error;

  // Fetch Space Name for breadcrumbs if serviceDeskId is available
  useEffect(() => {
    if (!serviceDeskId) return;
    let isMounted = true;
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (isMounted && data.values && Array.isArray(data.values)) {
          const match = data.values.find(
            (s: { id: string | number; projectName?: string }) =>
              String(s.id) === String(serviceDeskId)
          );
          if (match?.projectName) {
            setSpaceName(match.projectName);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch space details", err));

    return () => {
      isMounted = false;
    };
  }, [serviceDeskId]);

  // Fetch article data
  useEffect(() => {
    if (!articleId) {
      setError("Article ID is missing.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetch(
      `/api/jsm/knowledgebase/articleUrl?articleId=${articleId}&serviceDeskId=${serviceDeskId || ""}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load article");
        if (isMounted) {
          setArticleData({
            title: data.title,
            htmlContent: data.htmlContent,
            mappedRequestTypeId: data.mappedRequestTypeId,
            baseUrl: data.baseUrl,
            lastModified: data.lastModified,
            author: data.author,
            spaceName: data.spaceName,
            spaceKey: data.spaceKey,
          });
          setError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load article", err);
        if (isMounted) {
          setError(
            "Unable to load this knowledge base article. Please check your network or permissions."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [articleId, serviceDeskId]);

  // Process HTML content and extract Table of Contents
  const { processedHtml, toc } = useMemo(() => {
    if (!articleData?.htmlContent) return { processedHtml: "", toc: [] };
    return processHtmlAndExtractToc(articleData.htmlContent);
  }, [articleData?.htmlContent]);

  // Estimated reading time
  const readingTime = useMemo(() => {
    return calculateReadingTime(articleData?.htmlContent || "");
  }, [articleData?.htmlContent]);

  // Formatted date
  const formattedDate = useMemo(() => {
    return formatDate(articleData?.lastModified);
  }, [articleData?.lastModified]);

  // Scroll spy for Table of Contents
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-90px 0px -65% 0px",
        threshold: 0,
      }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

  // Navigation handlers
  const handleHomeClick = useCallback(() => {
    const fromHome = searchParams.get("fromHome") === "true";
    if (fromHome) {
      router.push("/");
    } else {
      router.push(serviceDeskId ? `/?space=${serviceDeskId}` : "/");
    }
  }, [router, searchParams, serviceDeskId]);

  const handleSpaceClick = useCallback(() => {
    if (serviceDeskId) {
      router.push(`/?space=${serviceDeskId}`);
    } else {
      router.push("/");
    }
  }, [router, serviceDeskId]);

  const handleSubmitTicket = useCallback(() => {
    const finalRequestTypeId =
      requestTypeId || articleData?.mappedRequestTypeId;

    if (USE_NATIVE_PORTAL && articleData?.baseUrl) {
      // Option A: Redirect to Native Atlassian Portal in a new tab
      if (finalRequestTypeId && serviceDeskId) {
        window.open(
          `${articleData.baseUrl}/servicedesk/customer/portal/${serviceDeskId}/create/${finalRequestTypeId}`,
          "_blank"
        );
      } else if (serviceDeskId) {
        window.open(
          `${articleData.baseUrl}/servicedesk/customer/portal/${serviceDeskId}`,
          "_blank"
        );
      } else {
        window.open(
          `${articleData.baseUrl}/servicedesk/customer/portals`,
          "_blank"
        );
      }
    } else {
      // Option B: Stay in custom Next.js portal
      if (finalRequestTypeId && serviceDeskId) {
        router.push(
          `/?space=${serviceDeskId}&request=${finalRequestTypeId}&forceForm=true`
        );
      } else if (serviceDeskId) {
        router.push(`/?space=${serviceDeskId}`);
      } else {
        router.push("/");
      }
    }
  }, [
    USE_NATIVE_PORTAL,
    articleData?.baseUrl,
    articleData?.mappedRequestTypeId,
    requestTypeId,
    router,
    serviceDeskId,
  ]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveTocId(id);
      setMobileTocOpen(false);
    }
  }, []);

  // Delegate click for inline images to open lightbox
  const handleArticleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === "img") {
        const img = target as HTMLImageElement;
        if (img.src) {
          setLightboxImage(img.src);
        }
      }
    },
    []
  );

  if (isPageLoading) {
    return <ArticleSkeletonLoader />;
  }

  const effectiveSpaceName = spaceName || articleData?.spaceName || "Knowledge Base";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* 1. Primary Global Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* 2. Sub-Navigation Breadcrumb & Quick Actions Bar */}
      <section className="w-full bg-slate-50/90 border-b border-slate-200 sticky top-16 sm:top-18 z-40 backdrop-blur-md transition-shadow">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb Hierarchy */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5"
          >
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Help Center</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <button
              onClick={handleSpaceClick}
              className="font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {effectiveSpaceName}
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <span className="font-semibold text-slate-900 max-w-[200px] sm:max-w-[340px] md:max-w-[480px] truncate">
              {articleData?.title || "Article Details"}
            </span>
          </nav>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              type="button"
              onClick={handleHomeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Help Center</span>
              <span className="sm:hidden">Back</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs min-h-[36px]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print article"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs min-h-[36px] hidden md:inline-flex"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Error Banner */}
      {displayedError && !isPageLoading && (
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 py-16">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Article Unavailable
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              {displayedError}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleHomeClick}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
              >
                Return to Help Center
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 4. Full Page Article Document */}
      {articleData && !isPageLoading && !displayedError && (
        <>
          {/* Article Hero Banner */}
          <header className="w-full bg-white border-b border-slate-100 pt-8 pb-8 sm:pb-10">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 max-w-7xl mx-auto">
              <div className="space-y-4 max-w-4xl">
                {/* Space & Category Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>{effectiveSpaceName}</span>
                </div>

                {/* Article Main Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {articleData.title}
                </h1>

                {/* Article Metadata Bar */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs sm:text-sm text-slate-500 pt-1">
                  <div className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    <Check className="w-3.5 h-3.5" />
                    <span>Verified Guide</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{readingTime} min read</span>
                  </div>

                  {formattedDate && (
                    <div className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Updated {formattedDate}</span>
                    </div>
                  )}

                  {articleData.author && (
                    <div className="inline-flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{articleData.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Document Content & Sticky Sidebar Grid */}
          <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 max-w-7xl mx-auto py-8 sm:py-12 flex-1">
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-14 w-full">
              {/* Left/Center Column: Article Body & Interactive Actions */}
              <div className="flex-1 min-w-0 w-full max-w-4xl">
                {/* Mobile Table of Contents Accordion */}
                {toc.length > 0 && (
                  <div className="block lg:hidden mb-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setMobileTocOpen((prev) => !prev)}
                      className="w-full px-4 py-3 bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Table of Contents ({toc.length} sections)</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          mobileTocOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileTocOpen && (
                      <nav className="p-3 space-y-1 divide-y divide-slate-100">
                        {toc.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={`block w-full text-left py-2 text-xs transition-colors cursor-pointer ${
                              item.level === 3 ? "pl-5" : "pl-2"
                            } ${
                              activeTocId === item.id
                                ? "text-blue-600 font-semibold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {item.text}
                          </button>
                        ))}
                      </nav>
                    )}
                  </div>
                )}

                {/* Article Content Container - True Page Flow */}
                <article
                  onClick={handleArticleClick}
                  className="w-full"
                >
                  <div
                    className="kb-article-content overflow-x-auto text-slate-800 leading-relaxed max-w-none text-base"
                    dangerouslySetInnerHTML={{ __html: processedHtml }}
                  />
                </article>

                {/* Feedback Deflection Widget */}
                <section
                  aria-labelledby="feedback-heading"
                  className="mt-8 p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3
                        id="feedback-heading"
                        className="text-base sm:text-lg font-bold text-slate-900"
                      >
                        Was this article helpful?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Your feedback helps our team maintain and improve our knowledge base.
                      </p>
                    </div>

                    {feedbackGiven ? (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-semibold animate-in fade-in">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Thank you for your feedback!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setFeedbackGiven("helpful")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[40px]"
                        >
                          <ThumbsUp className="w-4 h-4 text-emerald-600" />
                          <span>Yes, it helped</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackGiven("not-helpful")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[40px]"
                        >
                          <ThumbsDown className="w-4 h-4 text-rose-500" />
                          <span>No, need help</span>
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Support Escalation Banner */}
                <section className="mt-6 p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-blue-300 text-xs font-bold tracking-wider uppercase">
                      <HelpCircle className="w-4 h-4" />
                      <span>Dedicated Support</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      Still need help with this issue?
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                      If this article didn&apos;t fully resolve your problem, you can
                      submit a support ticket directly to our helpdesk team.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitTicket}
                    className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm whitespace-nowrap cursor-pointer shrink-0 min-h-[44px]"
                  >
                    <span>Submit a Ticket</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </section>
              </div>

              {/* Right Column: Desktop Sticky Sidebar */}
              <aside className="w-full lg:w-72 xl:w-80 shrink-0 hidden lg:block sticky top-36 self-start space-y-6">
                {/* 1. On This Page (Table of Contents) */}
                {toc.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>On this page</span>
                    </div>
                    <nav className="space-y-1">
                      {toc.map((item) => {
                        const isActive = activeTocId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={`block w-full text-left py-1.5 text-xs transition-colors cursor-pointer ${
                              item.level === 3 ? "pl-4" : "pl-1"
                            } ${
                              isActive
                                ? "text-blue-600 font-semibold border-l-2 border-blue-600 -ml-[1px]"
                                : "text-slate-600 hover:text-slate-900 font-normal"
                            }`}
                          >
                            <span className="line-clamp-1">{item.text}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* 2. Direct Support Ticket Shortcut */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Need Direct Assistance?
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Our helpdesk specialists are ready to help you with technical requests.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitTicket}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <span>Submit Support Request</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3. Document Utilities */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Article Tools
                  </h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <span className="flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy share link</span>
                      </span>
                      {copiedLink ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="text-slate-400">URL</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Print or save PDF</span>
                      </span>
                      <span className="text-slate-400">PDF</span>
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </>
      )}

      {/* 5. Image Lightbox Preview Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Expanded preview"
              className="w-auto h-auto max-h-[86vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}

export default function ArticleViewerPage() {
  return (
    <Suspense fallback={<ArticleSkeletonLoader />}>
      <ArticleViewerContent />
    </Suspense>
  );
}
