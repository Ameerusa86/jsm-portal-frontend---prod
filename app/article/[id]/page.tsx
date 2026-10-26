"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Share2,
  Check,
  ChevronRight,
  MessageSquare,
  Compass,
  X,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
  if (typeof window === "undefined") return { processedHtml: rawHtml, toc: [] };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    // Automatically wrap all standalone tables in a responsive scrolling container
    const tables = doc.querySelectorAll("table, .confluenceTable");
    tables.forEach((table) => {
      const parent = table.parentElement;
      if (
        !parent?.classList.contains("table-wrap") &&
        !parent?.classList.contains("confluenceTableWrapper")
      ) {
        const wrapper = doc.createElement("div");
        wrapper.className = "table-wrap";
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
    const headings = doc.querySelectorAll("h1, h2, h3, h4");
    const toc: TocItem[] = [];
    const usedIds = new Set<string>();

    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || "";
      if (!text) return;

      const slug =
        text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 40) || `section-${index}`;

      const existingId = heading.getAttribute("id");
      let id = existingId;
      if (!id || usedIds.has(id)) {
        id = `heading-${index}-${slug}`;
        heading.setAttribute("id", id);
      }
      usedIds.add(id);

      heading.setAttribute("data-slug", slug);
      if (existingId && existingId !== id) {
        heading.setAttribute("data-original-id", existingId);
      }

      const level = parseInt(heading.tagName.substring(1), 10);
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
    <div className="min-h-screen flex flex-col bg-slate-50/50 w-full">
      <div className="h-16 sm:h-18 bg-slate-900 w-full animate-pulse" />
      <div className="h-12 border-b border-slate-200/80 bg-white w-full animate-pulse" />
      <div className="border-b border-slate-200/80 bg-white py-10 w-full">
        <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 space-y-4">
          <div className="h-6 w-36 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-10 sm:h-12 w-3/4 max-w-4xl bg-slate-200 rounded-xl animate-pulse" />
          <div className="flex items-center gap-4 pt-1">
            <div className="h-5 w-28 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
      <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-10 flex-1 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-6">
          <div className="h-4 w-full bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-11/12 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-72 w-full bg-slate-200/60 rounded-2xl animate-pulse my-8" />
          <div className="h-4 w-full bg-slate-200/70 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-200/70 rounded animate-pulse" />
        </div>
        <div className="w-80 2xl:w-96 hidden lg:block space-y-5">
          <div className="h-56 bg-slate-200/60 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-200/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ArticleViewerContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params?.id as string | undefined;
  const serviceDeskId = searchParams.get("serviceDeskId");
  const requestTypeId = searchParams.get("requestTypeId");

  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const openLightbox = useCallback((src: string) => {
    let fullUrl = src;
    if (fullUrl.includes("/api/jsm/knowledgebase/image")) {
      try {
        const u = new URL(fullUrl, window.location.origin);
        u.searchParams.set("full", "1");
        const raw = u.searchParams.get("url");
        if (raw) {
          const clean = decodeURIComponent(raw)
            .replace(/\/thumbnails\//g, "/attachments/")
            .replace(/([?&])(width|height|maxWidth|maxHeight)=\d+(&?)/gi, "$1")
            .replace(/[?&]$/, "");
          u.searchParams.set("url", clean);
        }
        fullUrl = u.pathname + u.search;
      } catch {
        // keep fullUrl as is
      }
    }
    setLightboxImage(fullUrl);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // Prevent background scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [lightboxImage]);

  // Keyboard shortcuts for lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        setZoom((z) => {
          const newZ = Math.max(0.5, +(z - 0.25).toFixed(2));
          if (newZ <= 1) setPan({ x: 0, y: 0 });
          return newZ;
        });
      } else if (e.key === "0") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, closeLightbox]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)));
    } else {
      setZoom((z) => {
        const newZ = Math.max(0.5, +(z - 0.2).toFixed(2));
        if (newZ <= 1) setPan({ x: 0, y: 0 });
        return newZ;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const USE_NATIVE_PORTAL = true;

  // Derive missing ID synchronously during render to prevent cascading re-renders
  const displayedError = !articleId ? "Article ID is missing." : fetchError;
  const isPageLoading = Boolean(articleId) && loading;

  // Fetch Space Name for breadcrumbs
  useEffect(() => {
    if (!serviceDeskId) return;
    let isMounted = true;
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (isMounted && data.values && Array.isArray(data.values)) {
          const match = data.values.find(
            (s: { id: string | number; projectName?: string }) =>
              String(s.id) === String(serviceDeskId),
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

  // Fetch article data asynchronously
  useEffect(() => {
    if (!articleId) return;

    let isMounted = true;

    fetch(
      `/api/jsm/knowledgebase/articleUrl?articleId=${articleId}&serviceDeskId=${serviceDeskId || ""}`,
      { cache: "no-store" },
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
          setFetchError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load article", err);
        if (isMounted) {
          setFetchError(
            err?.message ||
              "Unable to load this knowledge base article. Please check your network or permissions.",
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

  const htmlContent = articleData?.htmlContent;
  const { processedHtml, toc } = useMemo(() => {
    if (!htmlContent) return { processedHtml: "", toc: [] };
    return processHtmlAndExtractToc(htmlContent);
  }, [htmlContent]);

  const readingTime = useMemo(() => {
    return calculateReadingTime(articleData?.htmlContent || "");
  }, [articleData?.htmlContent]);

  const formattedDate = useMemo(() => {
    return formatDate(articleData?.lastModified);
  }, [articleData?.lastModified]);

  // Scroll spy for TOC
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
        rootMargin: "-140px 0px -65% 0px",
        threshold: 0,
      },
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

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
      if (finalRequestTypeId && serviceDeskId) {
        const isMockId = /^(1\d\d|2\d\d|3\d\d|5\d\d)$/.test(String(finalRequestTypeId));
        const targetUrl = isMockId
          ? `${articleData.baseUrl}/servicedesk/customer/portal/${serviceDeskId}`
          : `${articleData.baseUrl}/servicedesk/customer/portal/${serviceDeskId}/create/${finalRequestTypeId}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else if (serviceDeskId) {
        window.open(
          `${articleData.baseUrl}/servicedesk/customer/portal/${serviceDeskId}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        window.open(
          `${articleData.baseUrl}/servicedesk/customer/portals`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } else {
      if (finalRequestTypeId && serviceDeskId) {
        router.push(
          `/?space=${serviceDeskId}&request=${finalRequestTypeId}&forceForm=true`,
        );
      } else if (serviceDeskId) {
        router.push(`/?space=${serviceDeskId}`);
      } else {
        router.push("/");
      }
    }
  }, [USE_NATIVE_PORTAL, articleData, requestTypeId, router, serviceDeskId]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, []);

  const scrollToHeading = useCallback((id: string) => {
    if (!id || typeof window === "undefined") return;

    const cleanId = id.replace(/^#/, "").trim();
    if (!cleanId) return;

    let element = document.getElementById(cleanId);
    if (!element) {
      try {
        element = document.getElementById(decodeURIComponent(cleanId));
      } catch {}
    }

    if (!element) {
      const lower = cleanId.toLowerCase();
      element =
        document.querySelector(`[data-slug="${lower}"]`) ||
        document.querySelector(`[data-original-id="${cleanId}"]`) ||
        document.querySelector(`[name="${cleanId}"]`) ||
        document.querySelector(`[name="${lower}"]`) ||
        document.querySelector(`[id*="${lower}"]`) ||
        null;
    }

    if (!element) {
      const lower = cleanId.toLowerCase();
      const allHeadings = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".kb-article-content h1, .kb-article-content h2, .kb-article-content h3, .kb-article-content h4, .kb-article-content h5, .kb-article-content h6",
        ),
      );
      element =
        allHeadings.find((h) => {
          const headingText = h.textContent?.trim().toLowerCase() || "";
          return headingText === lower || headingText.includes(lower);
        }) || null;
    }

    if (element) {
      const header = document.querySelector("header");
      const subNav = document.querySelector("section.sticky");
      const headerHeight = header ? header.getBoundingClientRect().height : 72;
      const subNavHeight = subNav ? subNav.getBoundingClientRect().height : 54;
      const totalStickyHeight = headerHeight + subNavHeight;
      const extraBuffer = 28;

      const elementRect = element.getBoundingClientRect();
      const targetScrollY =
        window.scrollY + elementRect.top - totalStickyHeight - extraBuffer;

      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: "smooth",
      });

      if (element.id) {
        setActiveTocId(element.id);
        if (window.history?.pushState) {
          window.history.pushState(null, "", `#${element.id}`);
        }
      }
      setMobileTocOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && articleData && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace(/^#/, "");
        const timer = setTimeout(() => {
          scrollToHeading(id);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, articleData, scrollToHeading]);

  const handleArticleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // 1. Check if an image was clicked
      const img =
        target.tagName.toLowerCase() === "img"
          ? (target as HTMLImageElement)
          : target.closest("img");

      if (img) {
        e.preventDefault();
        e.stopPropagation();

        const fullSrc =
          img.getAttribute("data-full-src") ||
          img.getAttribute("data-image-src") ||
          img.getAttribute("data-original-src") ||
          img.getAttribute("src") ||
          img.src;

        const parentLink = img.closest("a");
        const linkHref = parentLink?.getAttribute("href");
        const effectiveSrc = fullSrc || linkHref;

        if (effectiveSrc) {
          openLightbox(effectiveSrc);
        }
        return;
      }

      // 2. Check if a thumbnail or attachment anchor was clicked
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (
          href &&
          (href.includes("/api/jsm/knowledgebase/image") ||
            href.includes("/attachments/") ||
            href.includes("/thumbnails/") ||
            href.match(/\.(png|jpe?g|gif|webp|svg)($|\?)/i))
        ) {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(href);
          return;
        }

        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetId = href.substring(1);
          if (targetId) {
            scrollToHeading(targetId);
          }
        }
      }
    },
    [scrollToHeading, openLightbox],
  );

  if (isPageLoading) {
    return <ArticleSkeletonLoader />;
  }

  const effectiveSpaceName =
    spaceName || articleData?.spaceName || "Knowledge Base";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 font-sans selection:bg-blue-600 selection:text-white w-full">
      {/* 1. Global Header */}
      <Header
        onHomeClick={handleHomeClick}
        currentSpaceName={
          effectiveSpaceName !== "Knowledge Base"
            ? effectiveSpaceName
            : undefined
        }
        onSearchFocus={() => router.push("/?focusSearch=1")}
      />

      {/* 2. Full-Width Sub-Navigation Breadcrumb Bar */}
      <section className="w-full bg-white/95 border-b border-slate-200/80 sticky top-16 sm:top-18 z-40 backdrop-blur-md transition-shadow">
        <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-3 flex items-center justify-between gap-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="h-7 px-2 text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Help Center</span>
            </Button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpaceClick}
              className="h-7 px-2 text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
            >
              {effectiveSpaceName}
            </Button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <span className="font-semibold text-slate-900 max-w-[280px] sm:max-w-md md:max-w-xl truncate px-1">
              {articleData?.title || "Article Details"}
            </span>
          </nav>
        </div>
      </section>

      {/* 3. Error Banner */}
      {displayedError && !isPageLoading && (
        <main className="flex-1 w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-16 flex items-center justify-center">
          <Card className="max-w-2xl w-full p-8 sm:p-12 text-center space-y-4 shadow-sm border-rose-200/80 bg-white">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Article Unavailable
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {displayedError}
            </p>
            <div className="pt-2 flex items-center justify-center">
              <Button
                type="button"
                onClick={handleHomeClick}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
              >
                Return to Help Center
              </Button>
            </div>
          </Card>
        </main>
      )}

      {/* 4. Full Page Article View */}
      {articleData && !isPageLoading && !displayedError && (
        <>
          {/* Article Header Canvas */}
          <header className="w-full bg-white border-b border-slate-200 py-10 lg:py-12">
            <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24">
              <div className="space-y-5 max-w-5xl">
                <Badge
                  variant="secondary"
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>{effectiveSpaceName}</span>
                </Badge>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  {articleData.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 pt-1">
                  <div className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{readingTime} min read</span>
                  </div>

                  {formattedDate && (
                    <div className="inline-flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Updated {formattedDate}</span>
                    </div>
                  )}

                  {articleData.author && (
                    <div className="inline-flex items-center gap-1.5 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{articleData.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Full-Bleed Content Grid */}
          <main className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-10 flex-1">
            <div className="flex flex-col lg:flex-row items-start gap-10 xl:gap-16 w-full">
              {/* Document Container */}
              <Card className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 xl:p-12 shadow-xs">
                {/* Mobile TOC Accordion */}
                {toc.length > 0 && (
                  <Card className="block lg:hidden mb-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMobileTocOpen((prev) => !prev)}
                      className="w-full px-4 py-3 h-auto bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider rounded-none cursor-pointer"
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
                    </Button>
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
                  </Card>
                )}

                {/* Article Document Body */}
                <article onClick={handleArticleClick} className="w-full">
                  <div
                    className="kb-article-content overflow-x-auto text-slate-800 leading-relaxed max-w-none text-base"
                    dangerouslySetInnerHTML={{ __html: processedHtml }}
                  />
                </article>
              </Card>

              {/* Sticky Sidebar */}
              <aside className="w-full lg:w-80 2xl:w-96 shrink-0 hidden lg:block sticky top-36 self-start space-y-6">
                {/* On This Page (Table of Contents) */}
                {toc.length > 0 && (
                  <Card className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>On this page</span>
                    </div>
                    <nav className="space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                      {toc.map((item) => {
                        const isActive = activeTocId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={`block w-full text-left py-1.5 text-xs transition-colors cursor-pointer rounded-md ${
                              item.level === 3 ? "pl-4" : "pl-2"
                            } ${
                              isActive
                                ? "text-blue-600 font-semibold bg-blue-50/70 border-l-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                            }`}
                          >
                            <span className="line-clamp-1">{item.text}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </Card>
                )}

                {/* Direct Support Shortcut */}
                <Card className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-3.5 border border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Need Direct Assistance?
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Our helpdesk specialists are ready to help you with
                      technical requests.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSubmitTicket}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <span>Submit Support Request</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Card>

                {/* Document Utilities */}
                <Card className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Article Tools
                  </h4>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 h-auto text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer border border-slate-200"
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
                        <Badge variant="secondary" className="text-slate-500 font-mono text-[10px] px-1.5 py-0">
                          URL
                        </Badge>
                      )}
                    </Button>
                  </div>
                </Card>
              </aside>
            </div>
          </main>
        </>
      )}

      {/* 5. Enhanced Interactive Image Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none overflow-hidden"
          onClick={closeLightbox}
          onWheel={handleWheel}
        >
          {/* Top Header Bar */}
          <div
            className="w-full flex items-center justify-between text-white z-20 px-2 sm:px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title / Help Info */}
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
                Full-Resolution Preview
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">
                Scroll to zoom · Drag to pan · Double-click to expand
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={lightboxImage}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer shadow-md"
                title="Open original image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Original</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 shadow-md"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Central Image Canvas */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeLightbox();
              }
            }}
          >
            <Image
              src={lightboxImage}
              alt="Full size preview"
              width={1920}
              height={1080}
              unoptimized
              priority
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                maxHeight: zoom <= 1 ? "82vh" : "none",
                maxWidth: zoom <= 1 ? "92vw" : "none",
                width: "auto",
                height: "auto",
              }}
              className="object-contain rounded-lg shadow-2xl transition-shadow select-none pointer-events-auto"
              draggable={false}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick();
              }}
            />
          </div>

          {/* Bottom Floating Controls Toolbar */}
          <div
            className="z-20 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 sm:gap-2 text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setZoom((z) => {
                  const newZ = Math.max(0.5, +(z - 0.25).toFixed(2));
                  if (newZ <= 1) setPan({ x: 0, y: 0 });
                  return newZ;
                });
              }}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <span className="text-xs font-mono font-medium px-2 min-w-[54px] text-center text-slate-300">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
              disabled={zoom >= 4}
              className="text-white hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1.5 h-auto text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Fit to Screen (0)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fit</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoom(2);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1.5 h-auto text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="200% Zoom"
            >
              2x
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
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
