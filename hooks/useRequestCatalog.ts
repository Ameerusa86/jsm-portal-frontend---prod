"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { JsmSpace, RequestTypeWithGroup, CatalogGroup, ProjectGroupSection } from "@/types/jsm";

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

function searchRequestTypes(
  rawQuery: string,
  allItems: RequestTypeWithGroup[],
): RequestTypeWithGroup[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return allItems;

  const terms = query
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return allItems;

  const scoredResults: { item: RequestTypeWithGroup; score: number }[] = [];

  for (const rt of allItems) {
    const nameLower = rt.name.toLowerCase();
    const descLower = (rt.description || "").toLowerCase();
    const groupLower = (rt.group || "").toLowerCase();
    const spaceLower = `${rt.spaceName || ""} ${rt.spaceKey || ""}`.toLowerCase();
    const fullText = `${nameLower} ${descLower} ${groupLower} ${spaceLower}`;

    // Precision requirement: all search terms must match somewhere in the item's metadata
    const matchesAll = terms.every((term) => fullText.includes(term));
    if (!matchesAll) continue;

    let score = 0;
    // Boost exact matches in name
    if (nameLower === query) {
      score += 100;
    } else if (nameLower.startsWith(query)) {
      score += 60;
    } else if (nameLower.includes(query)) {
      score += 40;
    }

    // Boost items where terms appear in name
    if (terms.every((t) => nameLower.includes(t))) {
      score += 30;
    } else if (terms.some((t) => nameLower.includes(t))) {
      score += 15;
    }

    // Boost items matching space or group
    if (terms.some((t) => spaceLower.includes(t))) {
      score += 10;
    }
    if (terms.some((t) => groupLower.includes(t))) {
      score += 5;
    }

    scoredResults.push({ item: rt, score });
  }

  return scoredResults.sort((a, b) => b.score - a.score).map((r) => r.item);
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

  const enrichWithSpace = useCallback(
    (list: RequestTypeWithGroup[]) => {
      if (!spaces || spaces.length === 0) return list;
      const spaceMap = new Map(spaces.map((s) => [String(s.id), s]));
      return list.map((rt) => {
        const sp = rt.serviceDeskId ? spaceMap.get(String(rt.serviceDeskId)) : undefined;
        return {
          ...rt,
          spaceName: rt.spaceName || sp?.projectName,
          spaceKey: rt.spaceKey || (sp?.projectKey as string | undefined),
        };
      });
    },
    [spaces]
  );

  const enrichedGlobalRequestTypes = useMemo(() => {
    const pool = globalRequestTypes.length > 0 ? globalRequestTypes : requestTypes;
    return enrichWithSpace(pool);
  }, [globalRequestTypes, requestTypes, enrichWithSpace]);

  const enrichedBaseRequestTypes = useMemo(() => {
    return enrichWithSpace(baseRequestTypes);
  }, [baseRequestTypes, enrichWithSpace]);

  const searchResults = useMemo(() => {
    return searchRequestTypes(searchQuery, enrichedBaseRequestTypes);
  }, [searchQuery, enrichedBaseRequestTypes]);

  const availableBoards = useMemo(() => {
    // Never show cross-board filters when viewing a single specific space
    if (spaceParamId && spaceParamId !== "all") {
      return [];
    }

    const boards = new Set<string>();
    searchResults.forEach((rt) => {
      const cat = rt.category || rt.group || "General Requests";
      const groupName = rt.group || "General Requests";
      if (
        selectedCategory === "all" ||
        cat.toLowerCase() === selectedCategory.toLowerCase() ||
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
      const cat = rt.category || rt.group || "General Requests";
      const groupName = rt.group || "General Requests";
      const categoryMatch =
        selectedCategory === "all" ||
        cat.toLowerCase() === selectedCategory.toLowerCase() ||
        groupName.toLowerCase() === selectedCategory.toLowerCase();

      let localSearchMatch = true;
      if (localSearchQuery.trim()) {
        const query = localSearchQuery.toLowerCase();
        localSearchMatch =
          rt.name.toLowerCase().includes(query) ||
          (rt.description || "").toLowerCase().includes(query) ||
          groupName.toLowerCase().includes(query) ||
          (rt.portalGroup || "").toLowerCase().includes(query);
      }

      let boardMatch = true;
      if (boardFilter !== "all") {
        const space = spaces.find((s) => String(s.id) === String(rt.serviceDeskId));
        const bName = space ? space.projectName : rt.spaceName || "Other Boards";
        boardMatch = bName === boardFilter;
      }

      return categoryMatch && localSearchMatch && boardMatch;
    });
  }, [searchResults, selectedCategory, localSearchQuery, boardFilter, spaces]);

  const searchDropdownResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchRequestTypes(searchQuery, enrichedGlobalRequestTypes);
  }, [searchQuery, enrichedGlobalRequestTypes]);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enrichedBaseRequestTypes.length };
    enrichedBaseRequestTypes.forEach((rt) => {
      const g = rt.category || rt.group || "General Requests";
      counts[g] = (counts[g] || 0) + 1;
    });

    const result = [{ name: "all", count: enrichedBaseRequestTypes.length }];
    Object.entries(counts).forEach(([name, count]) => {
      if (name !== "all") {
        result.push({ name, count });
      }
    });

    return result;
  }, [enrichedBaseRequestTypes]);

  const projectSections = useMemo<ProjectGroupSection[]>(() => {
    const projectMap = new Map<
      string,
      {
        serviceDeskId: string;
        projectName: string;
        projectKey?: string;
        category?: string;
        groupMap: Map<string, CatalogGroup>;
      }
    >();

    for (const rt of filteredTypes) {
      const sdId = rt.serviceDeskId ? String(rt.serviceDeskId) : "general";
      const space = spaces.find((s) => String(s.id) === sdId);
      const projectName = rt.spaceName || space?.projectName || "General Service Desk";
      const projectKey = rt.spaceKey || (space?.projectKey as string | undefined);
      const category = space?.category;
      const groupName = rt.portalGroup || rt.group || "General Requests";
      const groupKey = `${sdId}__${groupName}`;

      if (!projectMap.has(sdId)) {
        projectMap.set(sdId, {
          serviceDeskId: sdId,
          projectName,
          projectKey,
          category,
          groupMap: new Map(),
        });
      }

      const pEntry = projectMap.get(sdId)!;
      if (!pEntry.groupMap.has(groupKey)) {
        pEntry.groupMap.set(groupKey, {
          groupKey,
          groupName,
          serviceDeskId: sdId,
          spaceName: projectName,
          spaceKey: projectKey,
          requestTypes: [],
        });
      }

      pEntry.groupMap.get(groupKey)!.requestTypes.push(rt);
    }

    return Array.from(projectMap.values()).map((p) => ({
      serviceDeskId: p.serviceDeskId,
      projectName: p.projectName,
      projectKey: p.projectKey,
      category: p.category,
      groups: Array.from(p.groupMap.values()),
    }));
  }, [filteredTypes, spaces]);

  const groupedRequests = useMemo(() => {
    const map: Record<string, RequestTypeWithGroup[]> = {};
    for (const p of projectSections) {
      for (const g of p.groups) {
        map[g.groupKey] = g.requestTypes;
      }
    }
    return map;
  }, [projectSections]);

  return {
    requestTypes: enrichedBaseRequestTypes,
    globalRequestTypes: enrichedGlobalRequestTypes,
    requestTypesLoading,
    apiError,
    setApiError,
    baseRequestTypes: enrichedBaseRequestTypes,
    searchResults,
    filteredTypes,
    availableBoards,
    categoriesWithCounts,
    projectSections,
    groupedRequests,
    searchDropdownResults,
  };
}
