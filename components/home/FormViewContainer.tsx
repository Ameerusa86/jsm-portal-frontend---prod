"use client";

import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { DynamicForm } from "@/components/DynamicForm";
import { SidebarHelp } from "@/components/SidebarHelp";
import { FormField, RequestTypeWithGroup } from "@/types/jsm";

interface FormViewContainerProps {
  selectedType: RequestTypeWithGroup;
  fields: FormField[];
  formLoading: boolean;
  onBackToCatalog: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export const FormViewContainer: React.FC<FormViewContainerProps> = ({
  selectedType,
  fields,
  formLoading,
  onBackToCatalog,
  onSubmit,
}) => {
  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Service Catalog</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-medium">
          {selectedType.group || "General Requests"}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-50 sm:max-w-md">
          {selectedType.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
        {/* Left Column: The Form Card */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm">
          <div className="border-b border-slate-100 pb-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {selectedType.group || "Service Request"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                Standard Workflow
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {selectedType.name}
            </h1>

            {selectedType.description && (
              <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed">
                {selectedType.description}
              </p>
            )}
          </div>

          {formLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Loading form configuration from Jira Service Management...
              </p>
            </div>
          ) : (
            <DynamicForm
              fields={fields}
              onSubmit={onSubmit}
              onCancel={onBackToCatalog}
              submitLabel="Submit Service Request"
            />
          )}
        </div>

        {/* Right Column: Contextual Support Sidebar */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 lg:sticky lg:top-24">
          <SidebarHelp requestTypeName={selectedType.name} />
        </div>
      </div>
    </div>
  );
};
