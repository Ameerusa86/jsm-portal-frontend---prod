"use client";

import React from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { DynamicForm } from "@/components/DynamicForm";
import { SidebarHelp } from "@/components/SidebarHelp";
import { FormField, RequestTypeWithGroup } from "@/types/jsm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 hover:text-primary font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5 sm:size-4" />
          <span>Service Catalog</span>
        </button>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground font-medium">
          {selectedType.group || "General Requests"}
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="text-foreground font-semibold truncate max-w-50 sm:max-w-md">
          {selectedType.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
        {/* Left Column: The Form Card */}
        <Card className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm">
          <div className="border-b border-slate-100 pb-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {selectedType.group || "Service Request"}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                Standard Workflow
              </Badge>
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
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-xs sm:text-sm font-medium">
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
        </Card>

        {/* Right Column: Contextual Support Sidebar */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 lg:sticky lg:top-24">
          <SidebarHelp requestTypeName={selectedType.name} />
        </div>
      </div>
    </div>
  );
};
