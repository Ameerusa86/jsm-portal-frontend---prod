/**
 * ============================================================================
 * CONFLUENCE KNOWLEDGE BASE — FOLDER LOCK CONFIGURATION
 * ============================================================================
 * Use this file to lock portal Knowledge Base search results and article
 * viewing to specific Confluence folders (or parent pages).
 *
 * HOW TO MANAGE FOLDERS:
 * - Add a new folder: append an object with `{ id, name, url }` to
 *   `ALLOWED_CONFLUENCE_FOLDERS` below.
 * - Temporarily disable a folder: set `enabled: false` on that entry.
 * - Delete a folder: remove its object from `ALLOWED_CONFLUENCE_FOLDERS`.
 * - If you only paste the `url` (or only the `id`), the numeric Confluence
 *   Folder ID is extracted automatically.
 *
 * ENVIRONMENT VARIABLE OVERRIDE (OPTIONAL):
 * You can also pass comma-separated folder IDs or URLs via `.env.local`:
 *   CONFLUENCE_FOLDER_IDS=123456789,987654321
 * Any IDs in `CONFLUENCE_FOLDER_IDS` are merged with enabled entries below.
 */

export interface ConfluenceFolderConfig {
  /** Human-readable folder name (for easy identification) */
  name: string;
  /**
   * Confluence Folder ID or Parent Page ID (e.g. "123456789").
   * If omitted, it will be automatically extracted from `url`.
   */
  id?: string;
  /**
   * Full Confluence URL to the folder or parent page, e.g.:
   * "https://emsmc1.atlassian.net/wiki/spaces/ITSD/folder/123456789"
   */
  url?: string;
  /**
   * Quickly enable/disable this folder without deleting the entry.
   * @default true
   */
  enabled?: boolean;
  /**
   * Optional: Lock this folder to a specific JSM Service Desk ID (e.g. "1" or "4").
   * Leave omitted/undefined so the folder applies across the entire portal.
   */
  serviceDeskId?: string;
}

/**
 * Set to `true` if you want to block ALL articles even when the folder list
 * below is empty. When `false` (default), locking activates automatically as
 * soon as at least one enabled folder is configured below (or in `.env.local`).
 */
export const STRICT_EMPTY_FOLDER_LOCK = false;

/**
 * List of Confluence folders allowed in the portal.
 * Add, edit, disable (`enabled: false`), or remove folders here at any time.
 */
export const ALLOWED_CONFLUENCE_FOLDERS: ConfluenceFolderConfig[] = [
  // --------------------------------------------------------------------------
  // Add your Confluence folders below:
  // --------------------------------------------------------------------------
  // {
  //   id: "123456789",
  //   name: "IT Support Knowledge Base",
  //   url: "https://emsmc1.atlassian.net/wiki/spaces/ITSD/folder/123456789",
  //   enabled: true,
  // },
  // {
  //   id: "987654321",
  //   name: "Network & VPN Guides",
  //   url: "https://emsmc1.atlassian.net/wiki/spaces/ITSD/folder/987654321",
  //   enabled: true,
  // },
];

/**
 * Extracts a numeric Confluence content/folder ID from a raw ID string or full Confluence URL.
 * Supports:
 * - Direct numeric IDs: "123456789"
 * - Folder URLs: ".../wiki/spaces/KEY/folder/123456789"
 * - Page URLs: ".../wiki/spaces/KEY/pages/123456789/..."
 * - Legacy query URLs: "...?pageId=123456789"
 */
export function extractConfluenceFolderId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct numeric ID
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Match /folder/{id} or /pages/{id} or /pages/edit-v2/{id}
  const pathMatch = trimmed.match(
    /\/(?:folder|folders|pages(?:\/edit(?:-v2)?)?)\/(\d+)(?:[/?#]|$)/i,
  );
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  // 3. Match ?pageId={id} or ?folderId={id}
  const queryMatch = trimmed.match(/[?&](?:pageId|folderId|contentId)=(\d+)/i);
  if (queryMatch?.[1]) {
    return queryMatch[1];
  }

  return null;
}

export interface ResolvedConfluenceFolder {
  id: string;
  name: string;
  url?: string;
  serviceDeskId?: string;
}

/**
 * Resolves all currently active Confluence folders (combining `ALLOWED_CONFLUENCE_FOLDERS`
 * and optional `CONFLUENCE_FOLDER_IDS` env var), filtered by `serviceDeskId` if specified.
 */
export function getActiveConfluenceFolders(
  serviceDeskId?: string | null,
): ResolvedConfluenceFolder[] {
  const resolvedMap = new Map<string, ResolvedConfluenceFolder>();

  // 1. Load from ALLOWED_CONFLUENCE_FOLDERS config array
  for (const entry of ALLOWED_CONFLUENCE_FOLDERS) {
    if (entry.enabled === false) continue;

    if (
      entry.serviceDeskId &&
      serviceDeskId &&
      String(entry.serviceDeskId).trim() !== String(serviceDeskId).trim()
    ) {
      continue;
    }

    const folderId =
      extractConfluenceFolderId(entry.id) ||
      extractConfluenceFolderId(entry.url);

    if (folderId) {
      resolvedMap.set(folderId, {
        id: folderId,
        name: entry.name || `Folder ${folderId}`,
        url: entry.url,
        serviceDeskId: entry.serviceDeskId,
      });
    }
  }

  // 2. Load optional comma-separated IDs or URLs from process.env.CONFLUENCE_FOLDER_IDS
  const envFoldersRaw = process.env.CONFLUENCE_FOLDER_IDS;
  if (envFoldersRaw && envFoldersRaw.trim() !== "") {
    const parts = envFoldersRaw.split(/[,;\n]+/);
    for (const part of parts) {
      const folderId = extractConfluenceFolderId(part);
      if (folderId && !resolvedMap.has(folderId)) {
        resolvedMap.set(folderId, {
          id: folderId,
          name: `Env Folder ${folderId}`,
          url: part.trim().startsWith("http") ? part.trim() : undefined,
        });
      }
    }
  }

  return Array.from(resolvedMap.values());
}

/**
 * Returns the list of allowed numeric Confluence folder IDs and whether folder locking is active.
 */
export function getConfluenceFolderLockContext(serviceDeskId?: string | null): {
  isLocked: boolean;
  folderIds: string[];
  folders: ResolvedConfluenceFolder[];
} {
  const folders = getActiveConfluenceFolders(serviceDeskId);
  const folderIds = folders.map((f) => f.id);
  const isLocked = folderIds.length > 0 || STRICT_EMPTY_FOLDER_LOCK;

  return {
    isLocked,
    folderIds,
    folders,
  };
}
