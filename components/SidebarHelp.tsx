"use client";

import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface SidebarHelpProps {
  requestTypeName?: string;
}

export const SidebarHelp: React.FC<SidebarHelpProps> = () => {
  return (
    <div className="space-y-6">
      {/* Quick Self-Service Guidance Box */}
      <div className="bg-linear-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-blue-100 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Before Submitting</span>
        </div>
        <ul className="space-y-2.5 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              Have relevant error messages or screenshots ready to attach.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              For hardware issues, specify the asset tag on the bottom of your machine.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              Track progress, milestones, and communicate with technicians directly in <strong>My Tickets</strong>.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
