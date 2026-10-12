"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RequestTypeWithGroup } from "@/types/jsm";
import { getGroupIcon, getGroupColor } from "@/lib/wizard-data";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  HelpCircle,
  FileCheck,
} from "lucide-react";

interface RequestFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestTypes: RequestTypeWithGroup[];
  onSelectRequestType: (requestType: RequestTypeWithGroup) => void;
}

export const RequestFinderModal: React.FC<RequestFinderModalProps> = ({
  isOpen,
  onClose,
  requestTypes,
  onSelectRequestType,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeWithGroup | null>(null);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setSelectedCategoryId(null);
    setSelectedRequestType(null);
    onClose();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Dynamically group requestTypes into categories
  const wizardCategories = useMemo(() => {
    const groupsMap = new Map<string, RequestTypeWithGroup[]>();
    
    requestTypes.forEach(rt => {
      const groupName = rt.group || "General Requests";
      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, []);
      }
      groupsMap.get(groupName)!.push(rt);
    });

    return Array.from(groupsMap.entries()).map(([groupName, items], index) => {
      return {
        id: `group-${index}`,
        title: groupName,
        description: `Select from ${items.length} request type${items.length > 1 ? 's' : ''} related to ${groupName}`,
        badge: groupName,
        icon: getGroupIcon(groupName),
        color: getGroupColor(groupName),
        subOptions: items
      };
    });
  }, [requestTypes]);

  const selectedCategory = useMemo(() => {
    return wizardCategories.find(c => c.id === selectedCategoryId) || null;
  }, [wizardCategories, selectedCategoryId]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = wizardCategories.find(c => c.id === categoryId);
    
    // If only 1 sub-option, jump straight to result
    if (category && category.subOptions.length === 1) {
      setSelectedRequestType(category.subOptions[0]);
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const handleSubOptionSelect = (rt: RequestTypeWithGroup) => {
    setSelectedRequestType(rt);
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep === 3) {
      if (selectedCategory && selectedCategory.subOptions.length === 1) {
        setCurrentStep(1);
        setSelectedCategoryId(null);
        setSelectedRequestType(null);
      } else {
        setCurrentStep(2);
        setSelectedRequestType(null);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedCategoryId(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedCategoryId(null);
    setSelectedRequestType(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Request Finder Wizard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  2-Step Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentStep === 1 && "Step 1 of 2: What is your primary goal or issue?"}
                {currentStep === 2 && `Step 2 of 2: ${selectedCategory?.title}`}
                {currentStep === 3 && "Recommended Request Type"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Start over"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Start Over</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className={`h-full bg-blue-600 transition-all duration-300 ${
              currentStep === 1
                ? "w-1/3"
                : currentStep === 2
                  ? "w-2/3"
                  : "w-full"
            }`}
          />
        </div>

        {/* MODAL BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: SELECT CATEGORY */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  What do you need assistance with today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose the option that best describes your request. We&apos;ll
                  pinpoint the right form in one click.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wizardCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`group text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer bg-white hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 ${cat.color.ring} ${cat.color.hoverBg} border-slate-200/90 flex flex-col justify-between`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-lg border flex items-center justify-center ${cat.color.bg} ${cat.color.text} ${cat.color.border}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                            {cat.subOptions.length} option{cat.subOptions.length !== 1 && 's'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cat.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px] font-medium text-slate-500">
                          {cat.badge}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Select</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
                {wizardCategories.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 py-10 text-center text-slate-500 text-sm">
                    No categories found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SPECIFIC ISSUE DRILLDOWN */}
          {currentStep === 2 && selectedCategory && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Categories</span>
                </button>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Which specific scenario matches your need?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Category:{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedCategory.title}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {selectedCategory.subOptions.map((rt) => {
                  const SubIcon = selectedCategory.icon;
                  return (
                    <button
                      key={rt.id}
                      onClick={() => handleSubOptionSelect(rt)}
                      className="group w-full text-left p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <SubIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {rt.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                            {rt.description || "No detailed description available."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs shrink-0 group-hover:translate-x-1 transition-transform self-center">
                        <span className="hidden sm:inline">Choose</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: RECOMMENDATION RESULT */}
          {currentStep === 3 && selectedRequestType && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Options</span>
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Match Found</span>
                </span>
              </div>

              {/* Matched Request Card */}
              <div className="bg-linear-to-br from-slate-50 to-blue-50/50 rounded-2xl border-2 border-blue-200 p-6 sm:p-8 shadow-md">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    {selectedRequestType.group || "Service Request"}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedRequestType.name}
                </h3>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {selectedRequestType.description || "This request type will guide you through submitting your request to the appropriate team."}
                </p>

                {/* Why this matches section (Dynamic approximation) */}
                <div className="mt-6 pt-5 border-t border-blue-200/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Why this is the right request type:</span>
                  </h4>
                  <ul className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>This form directly maps to your selected category and issue.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>It includes all the fields required by the team to process your request efficiently.</span>
                    </li>
                  </ul>
                </div>

                {/* Action CTA */}
                <div className="mt-7 pt-4 border-t border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4 cursor-pointer"
                  >
                    Not what you need? Start over
                  </button>

                  <button
                    onClick={() => {
                      onSelectRequestType(selectedRequestType);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Open This Request Form</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              Need human assistance? IT Helpdesk Phone:{" "}
              <span className="font-semibold text-slate-700">123-123-1234</span>
            </span>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
