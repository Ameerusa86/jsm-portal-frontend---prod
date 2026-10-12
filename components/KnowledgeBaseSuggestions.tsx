"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";

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
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 3) {
        setArticles([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/jsm/knowledgebase?query=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setArticles(data.results || []);
        } else {
          setArticles([]);
        }
      } catch (error) {
        console.error("Failed to fetch knowledge base articles", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [debouncedQuery]);

  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Suggested Articles</h3>
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600" />}
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
                className="group block rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700">
                      {article.title}
                    </h4>
                    <p 
                      className="mt-1 line-clamp-2 text-xs text-slate-600"
                      dangerouslySetInnerHTML={{ __html: article.excerpt || "" }}
                    />
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600 mt-1" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
