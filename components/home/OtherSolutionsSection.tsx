"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { JsmSpace } from "@/types/jsm";

interface OtherSolutionsSectionProps {
  spaces: JsmSpace[];
  spacesLoading: boolean;
  spacesByCategory: Record<string, JsmSpace[]>;
}

export const OtherSolutionsSection: React.FC<OtherSolutionsSectionProps> = ({
  spaces,
  spacesLoading,
  spacesByCategory,
}) => {
  const router = useRouter();
  const [spacesViewMode, setSpacesViewMode] = useState<"all" | "categories">(
    "categories",
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <section>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-sm">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Other Solutions
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-sm border border-slate-200">
          <button
            type="button"
            onClick={() => setSpacesViewMode("categories")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              spacesViewMode === "categories"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            By Department
          </button>
          <button
            type="button"
            onClick={() => setSpacesViewMode("all")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              spacesViewMode === "all"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Boards
          </button>
        </div>
      </div>

      {spacesLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Loading Boards...
          </p>
        </div>
      ) : spaces.length > 0 ? (
        spacesViewMode === "all" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => router.push(`/?space=${space.id}`)}
                className="group flex flex-col items-start bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 text-left cursor-pointer h-full"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0 border border-slate-100">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col grow">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {space.projectName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                    Browse requests for {space.projectName}.
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(spacesByCategory).map(([catName, catSpaces]) => {
              const isExpanded = expandedCategories.includes(catName);
              return (
                <div
                  key={catName}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(catName)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-900">
                          {catName}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {catSpaces.length}{" "}
                          {catSpaces.length === 1 ? "board" : "boards"} available
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {catSpaces.map((space) => (
                          <button
                            key={space.id}
                            type="button"
                            onClick={() => router.push(`/?space=${space.id}`)}
                            className="group flex flex-col items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3 mb-2 w-full">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xs border border-slate-100 group-hover:text-blue-600 shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                              <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-700 flex-1">
                                {space.projectName}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              Browse {space.projectName} requests.
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No other boards available.</p>
        </div>
      )}
    </section>
  );
};
