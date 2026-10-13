"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CreditCard,
  Users,
  Headphones,
  Building2,
  ShieldCheck,
  FileText,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { JsmSpace } from "@/types/jsm";

interface OtherSolutionsSectionProps {
  spaces: JsmSpace[];
  spacesLoading: boolean;
  spacesByCategory: Record<string, JsmSpace[]>;
}

interface SpaceTheme {
  icon: LucideIcon;
  iconBg: string;
  deptBadge: string;
  gradient: string;
  borderHover: string;
  glow: string;
}

const getSpaceTheme = (projectName = "", category = ""): SpaceTheme => {
  const text = `${projectName} ${category}`.toLowerCase();

  // 1. Finance, Billing & Accounting
  if (
    text.includes("bill") ||
    text.includes("finance") ||
    text.includes("accounting") ||
    text.includes("revenue") ||
    text.includes("invoice") ||
    text.includes("payroll")
  ) {
    return {
      icon: CreditCard,
      iconBg:
        "bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white",
      deptBadge:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 group-hover:border-emerald-300",
      gradient: "from-emerald-500 to-teal-600",
      borderHover: "hover:border-emerald-300",
      glow: "hover:shadow-emerald-500/10",
    };
  }

  // 2. HR & People & Culture
  if (
    text.includes("hr") ||
    text.includes("human resources") ||
    text.includes("people") ||
    text.includes("talent") ||
    text.includes("culture") ||
    text.includes("recruit") ||
    text.includes("workforce")
  ) {
    return {
      icon: Users,
      iconBg:
        "bg-indigo-50 text-indigo-600 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white",
      deptBadge:
        "bg-indigo-50 text-indigo-700 border-indigo-200/80 group-hover:border-indigo-300",
      gradient: "from-indigo-500 to-purple-600",
      borderHover: "hover:border-indigo-300",
      glow: "hover:shadow-indigo-500/10",
    };
  }

  // 3. Customer Operations & Support
  if (
    text.includes("support") ||
    text.includes("operations") ||
    text.includes("client") ||
    text.includes("customer") ||
    text.includes("success") ||
    text.includes("service desk")
  ) {
    return {
      icon: Headphones,
      iconBg:
        "bg-sky-50 text-sky-600 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white",
      deptBadge:
        "bg-sky-50 text-sky-700 border-sky-200/80 group-hover:border-sky-300",
      gradient: "from-sky-500 to-blue-600",
      borderHover: "hover:border-sky-300",
      glow: "hover:shadow-sky-500/10",
    };
  }

  // 4. Workplace, Facilities & Real Estate
  if (
    text.includes("facilit") ||
    text.includes("workplace") ||
    text.includes("building") ||
    text.includes("office") ||
    text.includes("real estate")
  ) {
    return {
      icon: Building2,
      iconBg:
        "bg-amber-50 text-amber-600 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white",
      deptBadge:
        "bg-amber-50 text-amber-700 border-amber-200/80 group-hover:border-amber-300",
      gradient: "from-amber-500 to-orange-600",
      borderHover: "hover:border-amber-300",
      glow: "hover:shadow-amber-500/10",
    };
  }

  // 5. IT / Technology
  if (
    text.includes("it") ||
    text.includes("tech") ||
    text.includes("engineer") ||
    text.includes("software") ||
    text.includes("infra") ||
    text.includes("security")
  ) {
    return {
      icon: ShieldCheck,
      iconBg:
        "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white",
      deptBadge:
        "bg-blue-50 text-blue-700 border-blue-200/80 group-hover:border-blue-300",
      gradient: "from-blue-600 to-indigo-600",
      borderHover: "hover:border-blue-300",
      glow: "hover:shadow-blue-500/10",
    };
  }

  // 6. Legal & Compliance
  if (
    text.includes("legal") ||
    text.includes("compliance") ||
    text.includes("privacy") ||
    text.includes("contract")
  ) {
    return {
      icon: FileText,
      iconBg:
        "bg-purple-50 text-purple-600 border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white",
      deptBadge:
        "bg-purple-50 text-purple-700 border-purple-200/80 group-hover:border-purple-300",
      gradient: "from-purple-500 to-fuchsia-600",
      borderHover: "hover:border-purple-300",
      glow: "hover:shadow-purple-500/10",
    };
  }

  // 7. Sales & Marketing
  if (
    text.includes("sale") ||
    text.includes("marketing") ||
    text.includes("growth") ||
    text.includes("commercial")
  ) {
    return {
      icon: Sparkles,
      iconBg:
        "bg-rose-50 text-rose-600 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white",
      deptBadge:
        "bg-rose-50 text-rose-700 border-rose-200/80 group-hover:border-rose-300",
      gradient: "from-rose-500 to-pink-600",
      borderHover: "hover:border-rose-300",
      glow: "hover:shadow-rose-500/10",
    };
  }

  // Default / Other
  return {
    icon: Layers,
    iconBg:
      "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-900 group-hover:text-white",
    deptBadge:
      "bg-slate-100 text-slate-600 border-slate-200 group-hover:border-slate-300",
    gradient: "from-slate-600 to-slate-800",
    borderHover: "hover:border-slate-400",
    glow: "hover:shadow-slate-500/10",
  };
};

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

  // Automatically expand categories by default so users see boards immediately
  useEffect(() => {
    const keys = Object.keys(spacesByCategory);
    if (keys.length > 0) {
      setExpandedCategories(keys);
    }
  }, [spacesByCategory]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <section>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-slate-200/70">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Other Solutions
          </h2>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl w-full sm:w-auto shrink-0 shadow-2xs border border-slate-200/80">
          <button
            type="button"
            onClick={() => setSpacesViewMode("categories")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              spacesViewMode === "categories"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>By Department</span>
          </button>
          <button
            type="button"
            onClick={() => setSpacesViewMode("all")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              spacesViewMode === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Boards</span>
          </button>
        </div>
      </div>

      {spacesLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Loading Boards...
          </p>
        </div>
      ) : spaces.length > 0 ? (
        spacesViewMode === "all" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {spaces.map((space) => {
              const theme = getSpaceTheme(space.projectName, space.category);
              const IconComponent = theme.icon;

              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => router.push(`/?space=${space.id}`)}
                  className={`group relative flex flex-col justify-between text-left bg-white hover:bg-linear-to-b hover:from-white hover:to-slate-50/70 rounded-2xl sm:rounded-3xl border border-slate-200/90 ${theme.borderHover} p-5 sm:p-6 shadow-xs hover:shadow-xl ${theme.glow} hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer min-h-[145px] sm:min-h-[155px] w-full`}
                >
                  {/* Top Gradient Accent Bar */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  {/* Top Row: Icon */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-all duration-300 shrink-0 ${theme.iconBg}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Space Name Title (Never cropped, full display) */}
                  <div className="w-full">
                    <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-base sm:text-lg leading-snug tracking-tight mb-3 break-words">
                      {space.projectName}
                    </h3>

                    {/* Footer: Space Name Action */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors pt-2.5 border-t border-slate-100 gap-2">
                      <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors break-words">
                        {space.projectName}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all text-slate-400 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(spacesByCategory).map(([catName, catSpaces]) => {
              const isExpanded = expandedCategories.includes(catName);
              const deptTheme = getSpaceTheme("", catName);
              const DeptIcon = deptTheme.icon;

              return (
                <div
                  key={catName}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(catName)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 bg-slate-50/40 hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${deptTheme.iconBg.replace("group-hover:", "")}`}
                      >
                        <DeptIcon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                          {catName}
                        </h3>
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-white text-slate-600 rounded-full border border-slate-200 shadow-2xs">
                          {catSpaces.length} {catSpaces.length === 1 ? "desk" : "desks"}
                        </span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-2xs transition-colors shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {catSpaces.map((space) => {
                          const spaceTheme = getSpaceTheme(space.projectName, catName);
                          const SpaceIcon = spaceTheme.icon;

                          return (
                            <button
                              key={space.id}
                              type="button"
                              onClick={() => router.push(`/?space=${space.id}`)}
                              className={`group relative flex flex-col justify-between items-start bg-slate-50/60 hover:bg-white p-5 rounded-2xl border border-slate-200/90 ${spaceTheme.borderHover} shadow-2xs hover:shadow-lg ${spaceTheme.glow} hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer min-h-[145px] w-full`}
                            >
                              <div className="w-full flex items-start justify-between gap-2 mb-3">
                                <div
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-all shrink-0 ${spaceTheme.iconBg}`}
                                >
                                  <SpaceIcon className="w-5 h-5" />
                                </div>
                              </div>

                              <div className="w-full">
                                <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors mb-3 break-words">
                                  {space.projectName}
                                </h4>

                                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors pt-2 border-t border-slate-100/80">
                                  <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
                                    {catName}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No other boards or departmental service desks available.</p>
        </div>
      )}
    </section>
  );
};
