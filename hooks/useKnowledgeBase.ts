"use client";

import { useState, useEffect } from "react";
import { KnowledgeBaseArticle } from "@/types/jsm";

interface UseKnowledgeBaseProps {
  searchQuery: string;
}

export function useKnowledgeBase({ searchQuery }: UseKnowledgeBaseProps) {
  // Omni-search KB results (Global across all spaces)
  const [kbResults, setKbResults] = useState<KnowledgeBaseArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  // Fetch KB articles globally across all service desks when omni search query changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      const timeoutId = window.setTimeout(() => {
        setKbResults([]);
        setKbLoading(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timer = window.setTimeout(() => {
      setKbLoading(true);
      const url = `/api/jsm/knowledgebase?query=${encodeURIComponent(q)}`;

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
  }, [searchQuery]);

  return {
    kbResults,
    kbLoading,
  };
}
