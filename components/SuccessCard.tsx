"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, ArrowRight, Home } from "lucide-react";

interface SuccessCardProps {
  issueKey: string;
  requestTypeName?: string;
  onBackToCatalog: () => void;
  onSubmitAnother: () => void;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({
  issueKey,
  requestTypeName,
  onBackToCatalog,
  onSubmitAnother,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(issueKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
        {/* Header Accent Bar */}
        <div className="h-2 bg-linear-to-r from-emerald-500 via-blue-500 to-indigo-600" />

        <div className="p-6 sm:p-10 text-center">
          {/* Animated Success Badge */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Request Successfully Created
          </h2>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            Your request for{" "}
            <span className="font-semibold text-slate-800">
              {requestTypeName || "IT Support"}
            </span>{" "}
            has been logged and dispatched into our queue.
          </p>

          {/* Reference Badge Box */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 inline-flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Ticket Reference:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-blue-700 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm tracking-wider">
                {issueKey}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Copy reference key"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBackToCatalog}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Help Center</span>
            </button>

            <button
              onClick={onSubmitAnother}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Another Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
