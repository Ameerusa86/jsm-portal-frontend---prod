"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, ArrowRight, Home, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <Card className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
        {/* Header Accent Bar */}
        <div className="h-2 bg-linear-to-r from-emerald-500 via-blue-500 to-indigo-600" />

        <CardContent className="p-6 sm:p-10 text-center">
          {/* Animated Success Badge */}
          <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm shadow-emerald-500/10 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
            <CheckCircle2 className="size-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Request Successfully Created
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Your request for{" "}
            <span className="font-semibold text-foreground">
              {requestTypeName || "IT Support"}
            </span>{" "}
            has been logged and dispatched into our queue.
          </p>

          {/* Reference Badge Box */}
          <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border inline-flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              Ticket Reference:
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-base font-bold text-blue-700 bg-background border-border px-3 py-1 rounded-md shadow-sm tracking-wider"
              >
                {issueKey}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="cursor-pointer gap-1.5 h-8 active:scale-95 transition-all"
                title="Copy reference key"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/tickets?id=${encodeURIComponent(issueKey)}`}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full sm:w-auto cursor-pointer gap-2 shadow-md"
              )}
            >
              <Ticket className="size-4" />
              <span>Track in Custom Tickets</span>
            </Link>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onBackToCatalog}
              className="w-full sm:w-auto cursor-pointer gap-2"
            >
              <Home className="size-4" />
              <span>Back to Help Center</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onSubmitAnother}
              className="w-full sm:w-auto cursor-pointer gap-2"
            >
              <span>Submit Another</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
