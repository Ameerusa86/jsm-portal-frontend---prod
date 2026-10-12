"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ArrowLeft, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ArticleViewerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const serviceDeskId = searchParams.get("serviceDeskId");
  const requestTypeId = searchParams.get("requestTypeId");

  const { status } = useSession();
  const [articleData, setArticleData] = useState<{
    title: string;
    htmlContent: string;
    mappedRequestTypeId?: string | null;
    baseUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration Toggle
  // If true, redirects to Native Atlassian Portal (Option A)
  // If false, renders our Custom Next.js Form (Option B)
  const USE_NATIVE_PORTAL = true; // Change this to true if you want to redirect to the native Atlassian portal, true for Option A, false for Option B, Option A is the default behavior, Option B is the custom Next.js form. false is the default behavior, true is the custom Next.js form.

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setError("Please sign in to view this article.");
      setLoading(false);
      return;
    }

    if (articleId) {
      // Fetch the raw HTML content of the article from our Confluence API proxy
      fetch(
        `/api/jsm/knowledgebase/articleUrl?articleId=${articleId}&serviceDeskId=${serviceDeskId}`,
        { cache: "no-store" },
      )
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to load article");
          setArticleData({
            title: data.title,
            htmlContent: data.htmlContent,
            mappedRequestTypeId: data.mappedRequestTypeId,
            baseUrl: data.baseUrl,
          });
        })
        .catch((err) => {
          console.error("Failed to load article", err);
          setError(
            "Unable to load the article. Please check your permissions.",
          );
        })
        .finally(() => setLoading(false));
    } else {
      setError("Article ID is missing.");
      setLoading(false);
    }
  }, [articleId, serviceDeskId, status]);

  const handleHomeClick = () => {
    router.push(serviceDeskId ? `/?space=${serviceDeskId}` : "/");
  };

  const handleSubmitTicket = () => {
    const finalRequestTypeId =
      requestTypeId || articleData?.mappedRequestTypeId;

    const baseUrl =
      articleData?.baseUrl && !articleData.baseUrl.includes("sandbox")
        ? articleData.baseUrl
        : "https://emsmc.atlassian.net";

    const sdId = serviceDeskId || "1";
    const targetUrl = `${baseUrl}/servicedesk/customer/portal/${sdId}/create/${finalRequestTypeId}`;

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-600 selection:text-white w-full">
      <Header onHomeClick={handleHomeClick} />

      <main className="grow flex flex-col w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center justify-between gap-4 text-sm text-slate-500 mb-6 max-w-6xl mx-auto w-full">
          <button
            onClick={handleHomeClick}
            className="inline-flex items-center gap-2 hover:text-blue-600 font-semibold transition-colors cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Help Center</span>
          </button>
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 font-semibold">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Knowledge Base Article</span>
          </div>
        </nav>

        {/* Article Container */}
        <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex-grow flex flex-col min-h-[600px] p-8 sm:p-12">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="font-medium text-slate-600">
                Loading article securely...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Access Denied
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
              <button
                onClick={handleHomeClick}
                className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold shadow-sm hover:bg-slate-800 transition-colors"
              >
                Return to Homepage
              </button>
            </div>
          )}

          {articleData && !loading && !error && (
            <div className="flex flex-col flex-1">
              <article className="prose prose-slate prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 flex-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-8 border-b border-slate-100 pb-6">
                  {articleData.title}
                </h1>
                <div
                  className="mt-6"
                  dangerouslySetInnerHTML={{ __html: articleData.htmlContent }}
                />
              </article>

              {(requestTypeId || articleData.mappedRequestTypeId) && (
                <div className="mt-16 p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl mb-1">
                      Still need help with this issue?
                    </h3>
                    <p className="text-slate-500 text-sm">
                      If this article didn't resolve your problem, you can
                      securely submit a support request to our team.
                    </p>
                  </div>
                  <button
                    onClick={handleSubmitTicket}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    Submit a Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
