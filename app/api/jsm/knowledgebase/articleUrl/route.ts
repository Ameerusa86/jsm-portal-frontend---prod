import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConfluenceFolderLockContext } from "@/lib/confluence-folders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get("articleId");
    const serviceDeskId = searchParams.get("serviceDeskId");

    if (!articleId) {
      return NextResponse.json({ error: "articleId is missing" }, { status: 400 });
    }

    // Determine target site dynamically from active user session (Prod vs Sandbox),
    // falling back to JIRA_BASE_URL from environment variables.
    const session = await auth();
    const rawBaseUrl =
      session?.siteUrl ||
      process.env.JIRA_BASE_URL ||
      "";

    const { JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;

    if (!rawBaseUrl || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json({
        error: "System Account credentials or target site URL are missing.",
        message: "To render Knowledge Base articles natively, please ensure JIRA_API_TOKEN and JIRA_USER_EMAIL are set in your environment."
      }, { status: 501 });
    }

    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "").replace(/\/wiki$/, "");
    const basicAuthHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

    // Check if Confluence Folder Lock is active
    const folderLock = getConfluenceFolderLockContext(serviceDeskId);
    if (folderLock.isLocked && folderLock.folderIds.length === 0) {
      return NextResponse.json(
        {
          error: "Access restricted: No Confluence Knowledge Base folders are currently enabled.",
          status: 403,
        },
        { status: 403 }
      );
    }

    // Confluence API using Basic Auth
    // Expand body.view for content, metadata.labels to parse rt-* labels, plus version, history, space, ancestors
    const apiUrl = `${cleanBaseUrl}/wiki/rest/api/content/${encodeURIComponent(articleId)}?expand=body.view,metadata.labels,version,history.lastUpdated,space,ancestors`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: basicAuthHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Confluence article (${articleId}) from ${cleanBaseUrl}. Status:`, response.status);
      const err = await response.text();

      let detailedMsg = `Confluence rejected the request on ${cleanBaseUrl} with Status ${response.status}.`;
      if (response.status === 404) {
        detailedMsg += ` The article (ID: ${articleId}) was not found on ${cleanBaseUrl}, or the account (${JIRA_USER_EMAIL}) does not have permission to view it.`;
      } else if (response.status === 401 || response.status === 403) {
        detailedMsg += ` Authentication failed or access was denied for account (${JIRA_USER_EMAIL}). Please verify your API token and Confluence permissions.`;
      }

      return NextResponse.json({ 
        error: detailedMsg,
        status: response.status, 
        atlassianError: err,
        requestedSite: cleanBaseUrl
      }, { status: response.status });
    }

    const data = await response.json();

    // Enforce Confluence Folder Lock if configured
    if (folderLock.isLocked && folderLock.folderIds.length > 0) {
      const allowedSet = new Set(folderLock.folderIds.map(String));
      const v1Ancestors: Array<{ id?: string | number }> = Array.isArray(data.ancestors)
        ? data.ancestors
        : [];

      let isAllowed =
        allowedSet.has(String(articleId)) ||
        v1Ancestors.some((ancestor) => ancestor?.id && allowedSet.has(String(ancestor.id)));

      // Fallback check via Confluence v2 ancestors API & CQL (in case v1 `ancestors` omitted `type: "folder"` nodes)
      if (!isAllowed) {
        try {
          const v2Res = await fetch(
            `${cleanBaseUrl}/wiki/api/v2/pages/${encodeURIComponent(articleId)}/ancestors`,
            {
              method: "GET",
              headers: {
                Authorization: basicAuthHeader,
                Accept: "application/json",
              },
            }
          );
          if (v2Res.ok) {
            const v2Data = await v2Res.json();
            const v2Ancestors: Array<{ id?: string | number }> = Array.isArray(v2Data?.results)
              ? v2Data.results
              : [];
            isAllowed = v2Ancestors.some(
              (ancestor) => ancestor?.id && allowedSet.has(String(ancestor.id))
            );
          }
        } catch {
          // Proceed to CQL verification fallback if v2 endpoint is unavailable
        }
      }

      if (!isAllowed && /^\d+$/.test(String(articleId))) {
        try {
          const folderList = folderLock.folderIds.join(", ");
          const verifyCql = `id = ${articleId} AND (ancestor IN (${folderList}) OR id IN (${folderList}))`;
          const cqlVerifyRes = await fetch(
            `${cleanBaseUrl}/wiki/rest/api/search?cql=${encodeURIComponent(verifyCql)}&limit=1`,
            {
              method: "GET",
              headers: {
                Authorization: basicAuthHeader,
                Accept: "application/json",
              },
            }
          );
          if (cqlVerifyRes.ok) {
            const cqlVerifyData = await cqlVerifyRes.json();
            if (Array.isArray(cqlVerifyData?.results) && cqlVerifyData.results.length > 0) {
              isAllowed = true;
            }
          }
        } catch {
          // Ignore network error on fallback check
        }
      }

      if (!isAllowed) {
        return NextResponse.json(
          {
            error: "This article is outside the authorized Confluence Knowledge Base folders for this portal.",
            status: 403,
          },
          { status: 403 }
        );
      }
    }

    let htmlContent = data.body?.view?.value || "<p>No content available.</p>";
    const title = data.title || "Knowledge Base Article";

    // --- REWRITE IMAGE & ATTACHMENT URLS FOR INTERNAL IMAGE PROXY ---
    // Proxy image URL through local backend endpoint
    const proxyImageUrl = (rawUrl: string, forceFull: boolean = false) => {
      let fullUrl = rawUrl;
      // If URL is relative, prepend base URL
      if (fullUrl.startsWith("/")) {
        fullUrl = `${cleanBaseUrl}${fullUrl}`;
      }
      if (forceFull) {
        fullUrl = fullUrl
          .replace(/\/thumbnails\//g, "/attachments/")
          .replace(/([?&])(width|height|maxWidth|maxHeight)=\d+(&?)/gi, "$1")
          .replace(/[?&]$/, "");
      }
      return `/api/jsm/knowledgebase/image?url=${encodeURIComponent(fullUrl)}${forceFull ? "&full=1" : ""}`;
    };

    // 1. Rewrite <img ... src="..." ...> tags to add data-full-src and proxy src
    htmlContent = htmlContent.replace(
      /<img\b([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match: string, pre: string, src: string, post: string) => {
        // Only rewrite Atlassian / wiki images
        if (
          src.startsWith("/") ||
          src.includes(".atlassian.net") ||
          src.includes(cleanBaseUrl)
        ) {
          const fullProxied = proxyImageUrl(src, true);
          const normalProxied = proxyImageUrl(src, false);
          return `<img ${pre}src="${normalProxied}" data-full-src="${fullProxied}" ${post}>`;
        }
        return match;
      }
    );

    // 2. Rewrite any data-image-src or data-original-src attributes
    htmlContent = htmlContent.replace(
      /\b(data-image-src|data-original-src)=["']([^"']+)["']/gi,
      (match: string, attr: string, val: string) => {
        if (
          val.startsWith("/") ||
          val.includes(".atlassian.net") ||
          val.includes(cleanBaseUrl)
        ) {
          return `${attr}="${proxyImageUrl(val, true)}"`;
        }
        return match;
      }
    );

    // 3. Rewrite thumbnail / attachment anchor links so clicking them doesn't 404
    htmlContent = htmlContent.replace(
      /\bhref=["']([^"']*(?:\/wiki\/download\/(?:attachments|thumbnails)\/)[^"']*)["']/gi,
      (match: string, href: string) => `href="${proxyImageUrl(href, true)}"`
    );

    // Scan Confluence labels for an rt-{id} tag (e.g. 'rt-45')
    let mappedRequestTypeId = null;
    const labels = data.metadata?.labels?.results || [];
    for (const label of labels) {
      if (label.name && label.name.startsWith("rt-")) {
        mappedRequestTypeId = label.name.substring(3);
        break;
      }
    }

    // Extract additional metadata
    const lastModified = data.version?.when || data.history?.lastUpdated?.when || null;
    const author = data.version?.by?.displayName || data.history?.lastUpdated?.by?.displayName || null;
    const spaceName = data.space?.name || null;
    const spaceKey = data.space?.key || null;

    // Return the HTML content, title, mapping, baseUrl, and metadata as JSON
    return NextResponse.json({
      title,
      htmlContent,
      mappedRequestTypeId,
      baseUrl: cleanBaseUrl,
      lastModified,
      author,
      spaceName,
      spaceKey,
    });
  } catch (error) {
    console.error("Error generating knowledge base article URL:", error);
    return NextResponse.json(
      { error: "Failed to generate article URL" },
      { status: 500 }
    );
  }
}
