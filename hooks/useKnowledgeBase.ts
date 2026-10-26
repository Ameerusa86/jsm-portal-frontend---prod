"use client";

import { useState, useEffect } from "react";
import { KnowledgeBaseArticle } from "@/types/jsm";

interface UseKnowledgeBaseProps {
  searchQuery: string;
}

export function useKnowledgeBase({ searchQuery }: UseKnowledgeBaseProps) {
  // Knowledge Base articles queried via Confluence Query Language (CQL)
  const [kbResults, setKbResults] = useState<KnowledgeBaseArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setKbResults([]);
        setKbLoading(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setKbLoading(true);
      const url = `/api/jsm/knowledgebase?query=${encodeURIComponent(q)}`;

      fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setKbResults(data.results || []);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Failed to fetch KB articles via CQL:", err);
            setKbResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setKbLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  return {
    kbResults,
    kbLoading,
  };
}
