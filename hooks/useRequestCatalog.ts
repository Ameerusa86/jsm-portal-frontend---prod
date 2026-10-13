"use client";

import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { JsmSpace, RequestTypeWithGroup } from "@/types/jsm";

const normalizeCategoryName = (value?: string) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const matchesCategory = (actual?: string, expected?: string) => {
  const normalizedActual = normalizeCategoryName(actual);
  const normalizedExpected = normalizeCategoryName(expected);

  if (!normalizedActual || !normalizedExpected) return false;

  if (normalizedActual === normalizedExpected) return true;

  const actualWords = new Set(normalizedActual.split(/\s+/));
  const expectedWords = new Set(normalizedExpected.split(/\s+/));

  const isITAlias = (words: Set<string>) =>
    words.has("it") ||
    words.has("technology") ||
    words.has("information") ||
    words.has("techology");

  if (isITAlias(expectedWords)) {
    return isITAlias(actualWords);
  }

  const commonWords = [...actualWords].filter((w) => expectedWords.has(w));
  return commonWords.length > 0;
};

interface UseRequestCatalogProps {
  spaceParamId: string | null;
  spaceCategoryParam: string | null;
  spaces: JsmSpace[];
  spacesLoading: boolean;
  selectedCategory: string;
  searchQuery: string;
  localSearchQuery: string;
  boardFilter: string;
}

export function useRequestCatalog({
  spaceParamId,
  spaceCategoryParam,
  spaces,
  spacesLoading,
  selectedCategory,
  searchQuery,
  localSearchQuery,
  boardFilter,
}: UseRequestCatalogProps) {
  const [requestTypes, setRequestTypes] = useState<RequestTypeWithGroup[]>([]);
  const [globalRequestTypes, setGlobalRequestTypes] = useState<RequestTypeWithGroup[]>([]);
  const [requestTypesLoading, setRequestTypesLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch Global Request Types once for Omni-Search (available on all pages/spaces)
  useEffect(() => {
    fetch(`/api/jsm/request-types?serviceDeskId=all`)
      .then(async (res) => {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGlobalRequestTypes(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Request Types for current view (scoped to specific space or department)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRequestTypesLoading(true);
      const params = new URLSearchParams({
        serviceDeskId: spaceParamId || "all",
      });
      if (spaceCategoryParam) {
        params.set("spaceCategory", spaceCategoryParam);
      }

      fetch(`/api/jsm/request-types?${params.toString()}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || (data && data.error)) {
            throw new Error(data?.error || "Failed to load request catalog");
          }
          const list = Array.isArray(data) ? data : [];
          setRequestTypes(list);
          if (!spaceParamId || spaceParamId === "all") {
            setGlobalRequestTypes(list);
          }
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load request catalog";
          setApiError(message);
        })
        .finally(() => setRequestTypesLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [spaceParamId, spaceCategoryParam]);

  const baseRequestTypes = useMemo(() => {
    // 1. If viewing a specific space (e.g. /?space=2 for Billing), strictly restrict to that space
    if (spaceParamId && spaceParamId !== "all") {
      const scoped = requestTypes.filter(
        (rt) => String(rt.serviceDeskId) === String(spaceParamId),
      );
      return scoped;
    }

    // 2. If viewing a department/category (e.g. 4 IT cards with spaceCategory=Information Technology)
    if (spaceCategoryParam) {
      if (spacesLoading) {
        return [];
      }

      if (spaces.length === 0) {
        return requestTypes;
      }

      const filtered = requestTypes.filter((rt) => {
        const space = spaces.find(
          (s) => String(s.id) === String(rt.serviceDeskId),
        );

        return space
          ? matchesCategory(space.category, spaceCategoryParam)
          : matchesCategory("Information Technology", spaceCategoryParam);
      });

      return filtered;
    }

    return requestTypes;
  }, [requestTypes, spaces, spacesLoading, spaceParamId, spaceCategoryParam]);

  const globalFuse = useMemo(() => {
    const pool = globalRequestTypes.length > 0 ? globalRequestTypes : requestTypes;
    return new Fuse(pool, {
      keys: ["name", "description", "group"],
      threshold: 0.5,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [globalRequestTypes, requestTypes]);

  const fuse = useMemo(() => {
    return new Fuse(baseRequestTypes, {
      keys: ["name", "description", "group"],
      threshold: 0.5,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [baseRequestTypes]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return baseRequestTypes;

    const stopWords =
      /\b(i|me|my|myself|we|our|ours|ourselves|you|your|yours|he|him|his|she|her|hers|it|its|they|them|their|what|which|who|whom|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now|cant|cannot)\b/gi;
    const cleanQuery = query.replace(stopWords, "").replace(/\s+/g, " ").trim();
    const finalQuery = cleanQuery.length > 2 ? cleanQuery : query;

    return fuse.search(finalQuery).map((result) => result.item);
  }, [fuse, searchQuery, baseRequestTypes]);

  const availableBoards = useMemo(() => {
    // Never show cross-board filters when viewing a single specific space
    if (spaceParamId && spaceParamId !== "all") {
      return [];
    }

    const boards = new Set<string>();
    searchResults.forEach((rt) => {
      const groupName = rt.group || "General Requests";
      if (
        selectedCategory === "all" ||
        groupName.toLowerCase() === selectedCategory.toLowerCase()
      ) {
        const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
        boards.add(space ? space.projectName : "Other Boards");
      }
    });
    return Array.from(boards).sort();
  }, [searchResults, selectedCategory, spaces, spaceParamId]);

  const filteredTypes = useMemo(() => {
    return searchResults.filter((rt) => {
      const groupName = rt.group || "General Requests";
      const categoryMatch =
        selectedCategory === "all" ||
        groupName.toLowerCase() === selectedCategory.toLowerCase();

      let localSearchMatch = true;
      if (localSearchQuery.trim()) {
        const query = localSearchQuery.toLowerCase();
        localSearchMatch =
          rt.name.toLowerCase().includes(query) ||
          (rt.description || "").toLowerCase().includes(query);
      }

      let boardMatch = true;
      if (boardFilter !== "all") {
        const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
        const bName = space ? space.projectName : "Other Boards";
        boardMatch = bName === boardFilter;
      }

      return categoryMatch && localSearchMatch && boardMatch;
    });
  }, [searchResults, selectedCategory, localSearchQuery, boardFilter, spaces]);

  const searchDropdownResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    const stopWords =
      /\b(i|me|my|myself|we|our|ours|ourselves|you|your|yours|he|him|his|she|her|hers|it|its|they|them|their|what|which|who|whom|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now|cant|cannot)\b/gi;
    const cleanQuery = query.replace(stopWords, "").replace(/\s+/g, " ").trim();
    const finalQuery = cleanQuery.length > 2 ? cleanQuery : query;

    return globalFuse.search(finalQuery).map((result) => result.item);
  }, [globalFuse, searchQuery]);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { all: baseRequestTypes.length };
    baseRequestTypes.forEach((rt) => {
      const g = rt.group || "General Requests";
      counts[g] = (counts[g] || 0) + 1;
    });

    const result = [{ name: "all", count: baseRequestTypes.length }];
    Object.entries(counts).forEach(([name, count]) => {
      if (name !== "all") {
        result.push({ name, count });
      }
    });

    return result;
  }, [baseRequestTypes]);

  const groupedRequests = useMemo(() => {
    return filteredTypes.reduce(
      (acc, rt) => {
        const groupName = rt.group || "General Requests";
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(rt);
        return acc;
      },
      {} as Record<string, RequestTypeWithGroup[]>,
    );
  }, [filteredTypes]);

  return {
    requestTypes,
    globalRequestTypes,
    requestTypesLoading,
    apiError,
    setApiError,
    baseRequestTypes,
    searchResults,
    filteredTypes,
    availableBoards,
    categoriesWithCounts,
    groupedRequests,
    searchDropdownResults,
  };
}
