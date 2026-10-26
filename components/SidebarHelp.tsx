"use client";

import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SidebarHelpProps {
  requestTypeName?: string;
}

export const SidebarHelp: React.FC<SidebarHelpProps> = () => {
  return (
    <div className="space-y-6">
      {/* Quick Self-Service Guidance Box */}
      <Card className="bg-linear-to-br from-muted/50 to-blue-50/40 dark:to-blue-950/20 rounded-2xl border-blue-100 dark:border-blue-900/40 p-5 sm:p-6 shadow-xs gap-0">
        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Before Submitting</span>
        </div>
        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <span>
              Have relevant error messages or screenshots ready to attach.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <span>
              For hardware issues, specify the asset tag on the bottom of your machine.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <span>
              Track progress, milestones, and communicate with technicians directly in <strong className="text-foreground">My Tickets</strong>.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
