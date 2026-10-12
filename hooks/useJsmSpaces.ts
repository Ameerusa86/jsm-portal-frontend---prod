"use client";

import { useEffect, useState, useMemo } from "react";
import { JsmSpace } from "@/types/jsm";

export function useJsmSpaces() {
  const [spaces, setSpaces] = useState<JsmSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jsm/spaces")
      .then(async (res) => {
        const data = await res.json();
        if (data.values) {
          setSpaces(data.values);
        }
      })
      .catch((err) => {
        console.error("Failed to load spaces", err);
      })
      .finally(() => setSpacesLoading(false));
  }, []);

  const spacesByCategory = useMemo(() => {
    const grouped: Record<string, JsmSpace[]> = {};
    spaces.forEach((s) => {
      const cat = s.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    // Sort categories alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce(
        (obj, key) => {
          obj[key] = grouped[key];
          return obj;
        },
        {} as Record<string, JsmSpace[]>,
      );
  }, [spaces]);

  return {
    spaces,
    spacesLoading,
    spacesByCategory,
  };
}
