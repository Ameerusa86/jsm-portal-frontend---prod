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
    <Card className="mb-6 rounded-xl border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-4 shadow-sm gap-0">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Suggested Articles</h3>
        {loading && <Loader2 className="ml-2 size-4 animate-spin text-blue-600 dark:text-blue-400" />}
      </div>
      
      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            These articles might help you resolve your issue without submitting a ticket:
          </p>
          <div className="grid gap-3">
            {articles.slice(0, 5).map((article, index) => (
              <a
                key={index}
                href={article.portalUrl || article.content?.iframeSrc || article.url || "#"}
                className="group block"
              >
                <Card className="rounded-lg border-border bg-card p-3 transition-colors hover:border-blue-300 hover:bg-muted/40 gap-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p 
                        className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: article.excerpt || "" }}
                      />
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary mt-1 transition-transform group-hover:translate-x-0.5" />
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
