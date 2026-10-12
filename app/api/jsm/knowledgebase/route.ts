import { NextRequest, NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    
    // We optionally require a query to search for. If empty, we can return empty results.
    if (!query || query.trim() === "") {
      return NextResponse.json({ results: [] });
    }

    const { isConfigured, authHeader, baseUrl, serviceDeskId: defaultServiceDeskId } =
      await getJiraAuthContext();

    const serviceDeskId = searchParams.get("serviceDeskId") || defaultServiceDeskId;

    if (!isConfigured || !serviceDeskId) {
      return NextResponse.json(
        { error: "Jira Service Management API is not configured or Service Desk ID is missing" },
        { status: 503 }
      );
    }

    // Strip common stop words before searching the KB. 
    // If a user types "I have a wifi issue", words like "I", "have", "a" are in every article, 
    // which dilutes the relevance ranking and pushes the actual article down.
    const stopWords = /\b(i|me|my|myself|we|our|ours|ourselves|you|your|yours|he|him|his|she|her|hers|it|its|they|them|their|what|which|who|whom|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now|cant|cannot)\b/gi;
    
    let cleanQuery = query.replace(stopWords, '').replace(/\s+/g, ' ').trim();
    if (cleanQuery.length === 0) {
      cleanQuery = query.trim(); // fallback if they literally searched a stop word
    }

    // To make search more intuitive (like native JSM portal), create an OR query
    // e.g., "wifi issue" becomes "wifi OR issue"
    const fuzzyQuery = cleanQuery
      .split(/\s+/)
      .join(" OR ");

    // Call the Service Desk Knowledge Base API
    // GET /rest/servicedeskapi/servicedesk/{serviceDeskId}/knowledgebase/article?query={query}
    const apiUrl = `${baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}/knowledgebase/article?query=${encodeURIComponent(
      fuzzyQuery
    )}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      // Cache briefly to avoid spamming the API on every keystroke
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("JSM Knowledge Base API error:", response.status, errorData);
      // If the API returns an error (e.g. 403 or KB not linked), we gracefully return empty results
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    
    // Inject the proper customer portal URL for each article so they can be opened safely
    const articles = (data.values || []).map((article: any) => {
      const articleId = article.source?.pageId || article.id;
      // Route internally to our custom Article viewer page
      const portalUrl = `/article/${articleId}?serviceDeskId=${serviceDeskId}`;
      
      return {
        ...article,
        portalUrl,
      };
    });

    return NextResponse.json({
      results: articles,
    });
  } catch (error) {
    console.error("Error fetching knowledge base articles:", error);
    // Return empty results on failure to avoid breaking the form
    return NextResponse.json({ results: [] });
  }
}
