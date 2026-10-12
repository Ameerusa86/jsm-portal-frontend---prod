"use client";

import React from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { DynamicForm } from "@/components/DynamicForm";
import { SidebarHelp } from "@/components/SidebarHelp";
import { FormField, KnowledgeBaseArticle, RequestTypeWithGroup } from "@/types/jsm";

interface FormViewContainerProps {
  selectedType: RequestTypeWithGroup;
  fields: FormField[];
  formLoading: boolean;
  suggestedArticles: KnowledgeBaseArticle[];
  suggestedArticlesLoading: boolean;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  deflectionQuery: string;
  setDeflectionQuery: (q: string) => void;
  onBackToCatalog: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export const FormViewContainer: React.FC<FormViewContainerProps> = ({
  selectedType,
  fields,
  formLoading,
  suggestedArticles,
  suggestedArticlesLoading,
  showForm,
  setShowForm,
  deflectionQuery,
  setDeflectionQuery,
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

          {suggestedArticlesLoading || formLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {suggestedArticlesLoading
                  ? "Checking for known solutions..."
                  : "Loading form configuration from Jira Service Management..."}
              </p>
            </div>
          ) : !showForm ? (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-indigo-900 mb-1">
                        Briefly describe your issue
                      </h3>
                      <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                        We might have a quick fix for you. Enter keywords like
                        &quot;printer jammed&quot; or &quot;keyboard&quot; to check
                        our knowledge base:
                      </p>
                      <input
                        type="text"
                        value={deflectionQuery}
                        onChange={(e) => setDeflectionQuery(e.target.value)}
                        placeholder="e.g. keyboard is not working"
                        className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-base sm:text-sm text-slate-700 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {suggestedArticles.length > 0 && (
                  <div className="mt-6 space-y-3 pl-0 sm:pl-11 border-t border-indigo-100/50 pt-5">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                      Suggested Solutions
                    </h4>
                    {suggestedArticles.slice(0, 3).map((article) => (
                      <a
                        key={article.title}
                        href={`${article.portalUrl}&requestTypeId=${selectedType.id}`}
                        className="block bg-white border border-indigo-100 hover:border-indigo-300 rounded-lg p-4 transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {article.title}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        {article.excerpt && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {article.excerpt.replace(/<[^>]+>/g, "")}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {suggestedArticles.length === 0 &&
                  deflectionQuery.trim() !== "" && (
                    <div className="mt-4 pl-0 sm:pl-11 text-sm text-indigo-500 italic">
                      No matching articles found for &quot;{deflectionQuery}&quot;.
                    </div>
                  )}
              </div>

              <div className="flex flex-col items-center pt-4 border-t border-slate-100 gap-3">
                <p className="text-sm text-slate-500">
                  Ready to submit your ticket?
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors text-sm shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Continue to Ticket
                </button>
              </div>
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
