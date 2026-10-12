import { NextRequest, NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "articleId is missing" }, { status: 400 });
    }

    // To bypass the restrictive OAuth scope requirements for Confluence,
    // we use the System Account API token if available in the environment.
    const { JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;

    if (!JIRA_BASE_URL || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json({
        error: "System Account API token is missing.",
        message: "To render Knowledge Base articles natively, please add JIRA_API_TOKEN and JIRA_USER_EMAIL to your .env.local file. Otherwise, we must revert to opening articles in a new tab."
      }, { status: 501 });
    }

    const cleanBaseUrl = JIRA_BASE_URL.replace(/\/+$/, "");
    
    // Confluence API using Basic Auth
    // Expand body.view for content, and metadata.labels to parse rt-* labels
    const apiUrl = `${cleanBaseUrl}/wiki/rest/api/content/${articleId}?expand=body.view,metadata.labels`;
    
    const basicAuthHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: basicAuthHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Confluence article with Basic Auth. Status:", response.status);
      const err = await response.text();
      return NextResponse.json({ 
        error: `Atlassian rejected your Basic Auth (Email + API Token) with Status ${response.status}. This usually means your API Token is invalid, or the email account (${JIRA_USER_EMAIL}) does not have a Confluence product license.`,
        status: response.status, 
        atlassianError: err
      }, { status: response.status });
    }

    const data = await response.json();
    let htmlContent = data.body?.view?.value || "<p>No content available.</p>";
    const title = data.title || "Knowledge Base Article";

    // --- REWRITE IMAGE URLS TO USE OUR PROXY ---
    // Match relative Confluence images (e.g. /wiki/download/attachments/...)
    htmlContent = htmlContent.replace(
      /src=["'](\/wiki\/[^"']+)["']/g, 
      (match: string, url: string) => `src="/api/jsm/knowledgebase/image?url=${encodeURIComponent(url)}"`
    );
    
    // Match absolute Atlassian images (e.g. https://emsmc-sandbox.atlassian.net/wiki/...)
    // Safely escape the cleanBaseUrl for regex
    const escapedBaseUrl = cleanBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const absoluteRegex = new RegExp(`src=["'](${escapedBaseUrl}[^"']+)["']`, "g");
    htmlContent = htmlContent.replace(
      absoluteRegex, 
      (match: string, url: string) => `src="/api/jsm/knowledgebase/image?url=${encodeURIComponent(url)}"`
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

    // Return the HTML content, title, mapping, and baseUrl as JSON
    return NextResponse.json({
      title,
      htmlContent,
      mappedRequestTypeId,
      baseUrl: cleanBaseUrl
    });
  } catch (error) {
    console.error("Error generating knowledge base article URL:", error);
    return NextResponse.json(
      { error: "Failed to generate article URL" },
      { status: 500 }
    );
  }
}
