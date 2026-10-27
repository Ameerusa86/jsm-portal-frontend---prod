"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delay={200}>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </TooltipProvider>
    </SessionProvider>
  );
}
