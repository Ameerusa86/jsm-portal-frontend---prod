"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  // If already authenticated, redirect to callbackUrl or home
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [status, session, callbackUrl, router]);

  const handleMicrosoftSignIn = async () => {
    try {
      setIsMicrosoftLoading(true);
      await signIn("microsoft-entra-id", { callbackUrl });
    } catch (err) {
      console.error("Microsoft sign in error:", err);
      setIsMicrosoftLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("atlassian", { callbackUrl });
    } catch (err) {
      console.error("Sign in error:", err);
      setIsLoading(false);
    }
  };

  // Translate NextAuth error codes to user-facing messages
  const getErrorMessage = (error: string | null) => {
    if (!error) return null;
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
        return "Failed to establish a secure connection with Atlassian. Please try again.";
      case "OAuthCreateAccount":
      case "Callback":
        return "An error occurred during Atlassian authorization. Please try again.";
      case "AccessDenied":
        return "Access was denied. Please ensure your Atlassian account has access to this portal.";
      case "SessionRequired":
        return "Please sign in to access the service desk.";
      default:
        return "An unexpected authentication error occurred. Please try again.";
    }
  };

  const errorMessage = getErrorMessage(errorParam);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-blue-500" />
          <p className="text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 size-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 size-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-96 bg-sky-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
              EMS|MC
            </span>
            <span className="hidden sm:inline-block h-4 w-px bg-slate-700" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Service Desk
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="size-3.5 text-blue-400" />
            <span>Secure Enterprise Access</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <Card className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-sky-400" />

            {/* Logo & Header */}
            <CardHeader className="text-center p-0 mb-6">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner mx-auto">
                <ShieldCheck className="size-7" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to Service Desk
              </CardTitle>
              <CardDescription className="text-sm text-slate-400 mt-2 leading-relaxed">
                Please sign in with your Microsoft 365 work account or Atlassian account to access IT services, submit requests, and manage tickets.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Sign In Buttons */}
              <div className="space-y-3.5">
                {/* Microsoft 365 / Entra ID SSO Button */}
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={handleMicrosoftSignIn}
                  disabled={isMicrosoftLoading || isLoading}
                  className="w-full h-12 cursor-pointer text-sm font-semibold gap-3 shadow-lg shadow-blue-600/25 active:scale-[0.98] group bg-blue-600 hover:bg-blue-500"
                >
                  {isMicrosoftLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Connecting to Microsoft 365...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Microsoft 4-Square Logo SVG */}
                      <svg
                        className="size-4 shrink-0"
                        viewBox="0 0 21 21"
                        aria-hidden="true"
                      >
                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                      </svg>
                      <span>Sign In with Microsoft 365</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative py-1.5 flex items-center justify-center">
                  <div className="w-full border-t border-slate-800" />
                  <span className="bg-slate-900 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 shrink-0">
                    Or
                  </span>
                  <div className="w-full border-t border-slate-800" />
                </div>

                {/* Atlassian OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  disabled={isLoading || isMicrosoftLoading}
                  className="w-full h-11 cursor-pointer text-sm font-semibold gap-3 border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-100 active:scale-[0.98] group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Connecting to Atlassian...</span>
                    </>
                  ) : (
                    <>
                      {/* Atlassian Official Symbol SVG */}
                      <svg
                        className="size-4 fill-current shrink-0 text-blue-400"
                        viewBox="0 0 32 32"
                        aria-hidden="true"
                      >
                        <path d="M15.54 13.06c-.4 0-.82.17-1.1.48L5.7 23.36c-.45.5-.3 1.29.3 1.6l4.63 2.37c.36.19.8.14 1.1-.14l6.19-6.38a1.35 1.35 0 0 0 .39-.96v-5.42c0-.75-.6-1.37-1.37-1.37h-.4zm.92-8.38c-.76 0-1.38.62-1.38 1.38v5.42c0 .36.14.71.39.96l6.19 6.38c.3.28.74.33 1.1.14l4.63-2.37c.6-.31.75-1.1.3-1.6L19.05 5.16a1.52 1.52 0 0 0-1.1-.48h-1.49z" />
                      </svg>
                      <span>Sign In with Atlassian</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] text-slate-400">
        <p>© {new Date().getFullYear()} EMS|MC Service Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
          <Loader2 className="size-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
