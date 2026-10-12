"use client";

import { useState, useEffect } from "react";
import { KnowledgeBaseArticle, RequestTypeWithGroup } from "@/types/jsm";

interface UseKnowledgeBaseProps {
  searchQuery: string;
  spaceParamId: string | null;
  selectedType: RequestTypeWithGroup | null;
  forceFormParam: boolean;
  deflectionQuery: string;
}

export function useKnowledgeBase({
  searchQuery,
  spaceParamId,
  selectedType,
  forceFormParam,
  deflectionQuery,
}: UseKnowledgeBaseProps) {
  // Omni-search KB results
  const [kbResults, setKbResults] = useState<KnowledgeBaseArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  // Deflection flow suggested articles
  const [suggestedArticles, setSuggestedArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [suggestedArticlesLoading, setSuggestedArticlesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 1. Fetch KB articles when omni search query changes
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

  // 2. Intercept flow: fetch KB articles when deflectionQuery changes
  useEffect(() => {
    if (!selectedType || !spaceParamId) {
      const timeoutId = window.setTimeout(() => {
        setSuggestedArticles([]);
        setShowForm(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (forceFormParam) {
      const timeoutId = window.setTimeout(() => {
        setShowForm(true);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const queryToSearch = deflectionQuery.trim();
    if (!queryToSearch) {
      const timeoutId = window.setTimeout(() => {
        setSuggestedArticles([]);
        setShowForm(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timer = setTimeout(() => {
      setSuggestedArticlesLoading(true);
      fetch(
        `/api/jsm/knowledgebase?query=${encodeURIComponent(queryToSearch)}&serviceDeskId=${spaceParamId}`,
      )
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

  return {
    kbResults,
    kbLoading,
    suggestedArticles,
    suggestedArticlesLoading,
    showForm,
    setShowForm,
  };
}
