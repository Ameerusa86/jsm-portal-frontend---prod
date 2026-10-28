import { NextRequest, NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { getConfluenceFolderLockContext } from "@/lib/confluence-folders";

export const dynamic = "force-dynamic";

/**
 * Extracts substantive search terms and handles conversational phrases
 * e.g., "I can't connect to vpn" -> ["connect", "vpn"]
 */
function extractSearchTerms(rawQuery: string): {
  cleanKeywords: string[];
  sanitizedText: string;
} {
  const stopWords = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "he",
    "him",
    "his",
    "she",
    "her",
    "hers",
    "it",
    "its",
    "they",
    "them",
    "their",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "a",
    "an",
    "the",
    "and",
    "but",
    "if",
    "or",
    "because",
    "as",
    "until",
    "while",
    "of",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "to",
    "from",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "can",
    "cant",
    "cannot",
    "will",
    "wont",
    "just",
    "don",
    "dont",
    "should",
    "shouldnt",
    "now",
    "keeps",
    "keep",
    "kept",
    "getting",
    "got",
    "please",
    "help",
    "tried",
    "trying",
    "im",
    "ive",
    "id",
    "having",
    "trouble",
    "need",
    "want",
    "like",
    "tell",
    "show",
    "give",
    "thanks",
    "thank",
  ]);

  // Strip contractions, punctuation, and special characters into clean text
  const sanitized = rawQuery
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = sanitized.split(/\s+/).filter(Boolean);
  const keywords = tokens.filter(
    (token) => !stopWords.has(token) && token.length > 1,
  );

  const uniqueKeywords = Array.from(new Set(keywords));
  const fallback = tokens.filter((t) => t.length > 1);
  const finalKeywords = uniqueKeywords.length > 0 ? uniqueKeywords : fallback;

  return {
    cleanKeywords: finalKeywords,
    sanitizedText: sanitized,
  };
}

/**
 * Spaces or labels reserved for internal governance/compliance that should not be exposed.
 */
const RESTRICTED_SPACES = [
  "compliance",
  "comp",
  "legal",
  "audit",
  "grc",
  "soc2",
  "iso",
  "confidential",
  "governance",
];

const RESTRICTED_SPACES_SET = new Set(RESTRICTED_SPACES);

function isComplianceOrRestricted(article: {
  title?: string;
  source?: { spaceKey?: string };
  spaceKey?: string;
  spaceName?: string;
}): boolean {
  const spaceKey = (
    article.source?.spaceKey ||
    article.spaceKey ||
    ""
  ).toLowerCase();
  const spaceName = (article.spaceName || "").toLowerCase();
  const title = (article.title || "").toLowerCase();

  if (RESTRICTED_SPACES_SET.has(spaceKey)) return true;
  if (
    spaceName.includes("compliance") ||
    spaceName.includes("legal & governance") ||
    spaceName.includes("internal audit")
  ) {
    return true;
  }
  if (
    title.startsWith("[compliance]") ||
    title.startsWith("[internal]") ||
    title.startsWith("[confidential]")
  ) {
    return true;
  }
  return false;
}

interface JsmRawArticle {
  id?: string | number;
  title: string;
  excerpt?: string;
  source?: {
    type?: string;
    pageId?: string | number;
    spaceKey?: string;
  };
  content?: {
    iframeSrc?: string;
  };
  spaceKey?: string;
  spaceName?: string;
  [key: string]: unknown;
}

interface ConfluenceCqlResult {
  content?: {
    id?: string | number;
    type?: string;
    title?: string;
    space?: {
      key?: string;
      name?: string;
    };
  };
  title?: string;
  excerpt?: string;
  resultGlobalContainer?: {
    title?: string;
  };
}

function escapeCqlTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
}

function cleanSnippetText(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/@@@hl@@@/g, "")
    .replace(/@@@endhl@@@/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query || query.trim() === "") {
      return NextResponse.json({ results: [] });
    }

    const {
      isConfigured,
      authHeader,
      baseUrl,
      siteUrl,
      serviceDeskId: defaultServiceDeskId,
    } = await getJiraAuthContext();

    const requestedServiceDeskId = searchParams.get("serviceDeskId");
    const serviceDeskId = requestedServiceDeskId || defaultServiceDeskId;

    if (!isConfigured || !serviceDeskId || !authHeader) {
      return NextResponse.json({ results: [] });
    }

    // 1. Process search terms
    const { cleanKeywords, sanitizedText } = extractSearchTerms(query);
    const searchQuery =
      cleanKeywords.length > 0
        ? cleanKeywords.join(" ")
        : sanitizedText || query.trim();

    if (!searchQuery) {
      return NextResponse.json({ results: [] });
    }

    // 2. Check if Confluence Folder Lock is active
    const folderLock = getConfluenceFolderLockContext(serviceDeskId);

    if (folderLock.isLocked) {
      // If strict lock is active but 0 folder IDs are configured, block all articles
      if (folderLock.folderIds.length === 0) {
        return NextResponse.json({
          results: [],
          serviceDeskId,
          lockedFolderIds: [],
          source: "confluence-folder-lock",
        });
      }

      const wikiBaseUrl = (siteUrl || process.env.JIRA_BASE_URL || baseUrl)
        .replace(/\/+$/, "")
        .replace(/\/wiki$/, "");

      const { JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;
      const wikiAuthHeader =
        JIRA_USER_EMAIL && JIRA_API_TOKEN
          ? `Basic ${Buffer.from(
              `${JIRA_USER_EMAIL.trim()}:${JIRA_API_TOKEN.trim()}`,
            ).toString("base64")}`
          : authHeader;

      const folderList = folderLock.folderIds.join(", ");
      const folderClause = `(ancestor IN (${folderList}) OR id IN (${folderList}))`;

      const terms =
        cleanKeywords.length > 0
          ? cleanKeywords
          : [sanitizedText || query.trim()];
      const termClauses = terms
        .map((t) => escapeCqlTerm(t))
        .filter(Boolean)
        .map((t) => `(title ~ "${t}" OR text ~ "${t}")`);

      if (termClauses.length === 0) {
        return NextResponse.json({ results: [] });
      }

      // Primary CQL: require all substantive keywords within the locked folders
      const primaryCql = `type = page AND ${folderClause} AND (${termClauses.join(
        " AND ",
      )})`;
      const primaryUrl = `${wikiBaseUrl}/wiki/rest/api/search?cql=${encodeURIComponent(
        primaryCql,
      )}&excerpt=highlight&limit=15&expand=content.space`;

      let cqlRes = await fetch(primaryUrl, {
        method: "GET",
        headers: {
          Authorization: wikiAuthHeader,
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      });

      let cqlResults: ConfluenceCqlResult[] = [];
      if (cqlRes.ok) {
        const cqlData = await cqlRes.json();
        cqlResults = (cqlData.results || []) as ConfluenceCqlResult[];
      }

      // Fallback CQL: if multi-keyword AND query returned 0 matches, try OR across keywords inside locked folders
      if (cqlResults.length === 0 && termClauses.length > 1) {
        const fallbackCql = `type = page AND ${folderClause} AND (${termClauses.join(
          " OR ",
        )})`;
        const fallbackUrl = `${wikiBaseUrl}/wiki/rest/api/search?cql=${encodeURIComponent(
          fallbackCql,
        )}&excerpt=highlight&limit=15&expand=content.space`;

        cqlRes = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            Authorization: wikiAuthHeader,
            Accept: "application/json",
          },
          next: { revalidate: 60 },
        });

        if (cqlRes.ok) {
          const fallbackData = await cqlRes.json();
          cqlResults = (fallbackData.results || []) as ConfluenceCqlResult[];
        }
      }

      const seenIds = new Set<string>();
      const lockedArticles = cqlResults
        .filter((item) => {
          const pageId = String(item.content?.id || "");
          if (!pageId || seenIds.has(pageId)) return false;
          seenIds.add(pageId);

          const spaceKey = item.content?.space?.key;
          const spaceName =
            item.content?.space?.name || item.resultGlobalContainer?.title;
          const title = item.title || item.content?.title;

          return !isComplianceOrRestricted({
            title,
            spaceKey,
            spaceName,
          });
        })
        .map((item) => {
          const pageId = String(item.content?.id || "");
          const spaceKey = item.content?.space?.key;
          const title = cleanSnippetText(item.title || item.content?.title);
          const excerpt = cleanSnippetText(item.excerpt);

          let portalUrl = `/article/${pageId}?serviceDeskId=${serviceDeskId}`;
          if (!requestedServiceDeskId) {
            portalUrl += "&fromHome=true";
          }

          return {
            id: pageId,
            title,
            excerpt,
            source: {
              pageId,
              spaceKey,
              type: "confluence",
            },
            spaceKey,
            portalUrl,
          };
        });

      return NextResponse.json({
        results: lockedArticles,
        serviceDeskId,
        lockedFolderIds: folderLock.folderIds,
        source: "confluence-folder-lock",
      });
    }

    // 3. Default (Unrestricted) Mode: Fetch from JSM Service Desk Knowledge Base API
    // This API queries the entire Confluence space(s) linked to this service desk in JSM.
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const jsmUrl = `${cleanBaseUrl}/rest/servicedeskapi/servicedesk/${encodeURIComponent(
      serviceDeskId,
    )}/knowledgebase/article?query=${encodeURIComponent(searchQuery)}&highlight=true&limit=15`;

    let res = await fetch(jsmUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    // Fallback: If the path-based endpoint returns 404, try the query-parameter endpoint
    if (res.status === 404) {
      const fallbackUrl = `${cleanBaseUrl}/rest/servicedeskapi/knowledgebase/article?query=${encodeURIComponent(
        searchQuery,
      )}&serviceDeskId=${encodeURIComponent(serviceDeskId)}&highlight=true&limit=15`;

      res = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      });
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn("JSM Knowledge Base Search warning:", res.status, errorText);
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    let rawResults = (data.values || []) as JsmRawArticle[];

    // If multi-keyword search returned no results and distinct from original query, try original query as fallback
    if (rawResults.length === 0 && query.trim() !== searchQuery) {
      const queryFallbackUrl = `${cleanBaseUrl}/rest/servicedeskapi/servicedesk/${encodeURIComponent(
        serviceDeskId,
      )}/knowledgebase/article?query=${encodeURIComponent(query.trim())}&highlight=true&limit=15`;

      const secondaryRes = await fetch(queryFallbackUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      });

      if (secondaryRes.ok) {
        const secondaryData = await secondaryRes.json();
        if (
          Array.isArray(secondaryData?.values) &&
          secondaryData.values.length > 0
        ) {
          rawResults = secondaryData.values;
        }
      }
    }

    // 4. Format and filter articles
    const seenIds = new Set<string>();
    const articles = rawResults
      .filter((item) => {
        const pageId = String(item.source?.pageId || item.id || "");
        if (!pageId || seenIds.has(pageId)) return false;
        seenIds.add(pageId);

        return !isComplianceOrRestricted({
          title: item.title,
          source: item.source,
          spaceKey: item.source?.spaceKey || item.spaceKey,
          spaceName: item.spaceName,
        });
      })
      .map((item) => {
        const pageId = String(item.source?.pageId || item.id);
        const title = cleanSnippetText(item.title);
        const excerpt = cleanSnippetText(item.excerpt);

        let portalUrl = `/article/${pageId}?serviceDeskId=${serviceDeskId}`;
        if (!requestedServiceDeskId) {
          portalUrl += "&fromHome=true";
        }

        return {
          id: pageId,
          title,
          excerpt,
          source: {
            pageId,
            spaceKey: item.source?.spaceKey,
            type: item.source?.type || "confluence",
          },
          spaceKey: item.source?.spaceKey,
          portalUrl,
          content: item.content,
        };
      });

    return NextResponse.json({
      results: articles,
      serviceDeskId,
      source: "jsm-service-desk-knowledgebase",
    });
  } catch (error) {
    console.error("Error fetching knowledge base articles via JSM API:", error);
    return NextResponse.json({ results: [] });
  }
}
