"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Article {
  title: string;
  excerpt: string;
  content?: {
    iframeSrc?: string;
  };
  url?: string;
  portalUrl?: string;
}

interface KnowledgeBaseSuggestionsProps {
  query: string;
}

export const KnowledgeBaseSuggestions: React.FC<KnowledgeBaseSuggestionsProps> = ({ query }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query to avoid spamming the API while typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      const resetTimer = setTimeout(() => {
        setArticles([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const controller = new AbortController();

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/jsm/knowledgebase?query=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setArticles(data.results || []);
        } else {
          setArticles([]);
        }
      } catch (error: unknown) {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error("Failed to fetch knowledge base articles via CQL:", error);
          setArticles([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchArticles();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 sm:p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Suggested Articles</h3>
        {loading && <Loader2 className="ml-2 size-4 animate-spin text-blue-600" />}
      </div>
      
      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-blue-800">
            These articles might help you resolve your issue without submitting a ticket:
          </p>
          <div className="grid gap-3">
            {articles.slice(0, 5).map((article, index) => (
              <a
                key={index}
                href={article.portalUrl || article.content?.iframeSrc || article.url || "#"}
                className="group block"
              >
                <Card className="rounded-xl border border-blue-200/60 bg-white p-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h4>
                      <p 
                        className="mt-1 line-clamp-2 text-xs text-slate-500"
                        dangerouslySetInnerHTML={{ __html: article.excerpt || "" }}
                      />
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-400 group-hover:text-blue-600 mt-1 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
