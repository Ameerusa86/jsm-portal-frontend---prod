"use client";

import React from "react";
import { Zap, FileText, AlertCircle, Sparkles } from "lucide-react";
import { TechnologyCard } from "@/components/TechnologyCard";

export const TechnologySection: React.FC = () => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Technology Solutions
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <TechnologyCard
          title="Work Orders"
          description="Submit standard IT requests, equipment needs, and general inquiries."
          icon={FileText}
          href="/?space=all&spaceCategory=Information%20Technology&category=Work%20Orders"
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
        />
        <TechnologyCard
          title="Problems"
          description="Report hardware issues, software errors, or account access problems."
          icon={AlertCircle}
          href="/?space=all&spaceCategory=Information%20Technology&category=Problems"
          gradientFrom="from-rose-500"
          gradientTo="to-orange-500"
        />
        <TechnologyCard
          title="Automations and Reports"
          description="Request new automated workflows, reports, and data exports."
          icon={Zap}
          href="/?space=all&spaceCategory=Information%20Technology&category=Automations%20and%20Reports"
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
        />
        <TechnologyCard
          title="Suggestions"
          description="Share ideas for system improvements and new technology initiatives."
          icon={Sparkles}
          href="/?space=all&spaceCategory=Information%20Technology&category=Suggestions"
          gradientFrom="from-purple-500"
          gradientTo="to-fuchsia-600"
        />
      </div>
    </section>
  );
};
