import { NextRequest, NextResponse } from "next/server";
import { MOCK_REQUEST_TYPES, MOCK_SPACES } from "@/lib/mock-data";
import { getJiraAuthContext } from "@/lib/jira";
import { JiraRequestTypeItem, RequestTypeWithGroup } from "@/types/jsm";
import { classifyRequestType } from "@/lib/classifier";

const normalizeCategoryName = (value?: string) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matchesCategory = (actual?: string, expected?: string) => {
  const normalizedActual = normalizeCategoryName(actual);
  const normalizedExpected = normalizeCategoryName(expected);

  if (!normalizedActual || !normalizedExpected) return false;
  if (normalizedActual === normalizedExpected) return true;

  const actualWords = new Set(normalizedActual.split(/\s+/));
  const expectedWords = new Set(normalizedExpected.split(/\s+/));

  const isITAlias = (words: Set<string>) =>
    words.has("it") ||
    words.has("technology") ||
    words.has("information") ||
    words.has("solutions") ||
    words.has("technology");

  if (isITAlias(expectedWords)) {
    return isITAlias(actualWords);
  }

  const commonWords = [...actualWords].filter((w) => expectedWords.has(w));
  return commonWords.length > 0;
};

/**
 * Determines whether a Jira Service Management request type is visible on the customer portal.
 * In JSM, a request type is marked as "Hidden from portal" by removing it from all portal groups,
 * causing `groupIds` to be empty ([]), null, or undefined.
 */

/**
 * Resolves the customer-facing Jira Portal ID for a given service desk / project.
 * In Jira Cloud (emsmc1.atlassian.net), the ITSD service desk (API ID: 1, key: ITSD)
 * is hosted at customer portal ID 4 (/servicedesk/customer/portal/4).
 * All other service desks use their native serviceDeskId directly.
 */
export function inferPortalGroup(name: string, description?: string, category?: string): string {
  const text = `${name} ${description || ""}`.toLowerCase();
  if (
    text.includes("password") ||
    text.includes("mfa") ||
    text.includes("vpn") ||
    text.includes("access") ||
    text.includes("account") ||
    text.includes("login") ||
    text.includes("credential") ||
    text.includes("permission")
  ) {
    return "Logins & Accounts";
  }
  if (
    text.includes("laptop") ||
    text.includes("computer") ||
    text.includes("monitor") ||
    text.includes("hardware") ||
    text.includes("equipment") ||
    text.includes("repair") ||
    text.includes("workstation")
  ) {
    return "Computers & Hardware";
  }
  if (
    text.includes("software") ||
    text.includes("license") ||
    text.includes("tool") ||
    text.includes("saas") ||
    text.includes("app") ||
    text.includes("github")
  ) {
    return "Applications & Software";
  }
  if (
    text.includes("badge") ||
    text.includes("building") ||
    text.includes("office") ||
    text.includes("desk") ||
    text.includes("facility")
  ) {
    return "Facilities & Access";
  }
  if (
    text.includes("database") ||
    text.includes("sql") ||
    text.includes("table") ||
    text.includes("schema") ||
    text.includes("warehouse")
  ) {
    return "Data & Systems";
  }
  if (
    text.includes("outage") ||
    text.includes("down") ||
    text.includes("incident") ||
    text.includes("wifi") ||
    text.includes("network") ||
    text.includes("problem")
  ) {
    return "Incidents & Outages";
  }
  if (
    text.includes("report") ||
    text.includes("data") ||
    text.includes("pipeline") ||
    text.includes("automation") ||
    text.includes("dashboard") ||
    text.includes("etl")
  ) {
    return "Data & Analytics";
  }
  if (
    text.includes("suggest") ||
    text.includes("idea") ||
    text.includes("feedback") ||
    text.includes("improv")
  ) {
    return "Feedback & Ideas";
  }
  return category === "Work Orders" ? "General Work Orders" : "General Support";
}

export function resolveCustomerPortalId(
  serviceDeskId?: string | number | null,
  projectKey?: string | null,
  projectName?: string | null,
): string {
  const sdId = String(serviceDeskId || "");
  const key = String(projectKey || "").toUpperCase();
  const name = String(projectName || "").toLowerCase();

  if (
    sdId === "1" ||
    sdId === "4" ||
    key === "ITSD" ||
    key === "IT" ||
    key === "TECH" ||
    key === "ITS" ||
    name.includes("information technology") ||
    name.includes("it service") ||
    name.includes("it support") ||
    name.includes("it helpdesk")
  ) {
    return "4";
  }

  return sdId || "4";
}

const isPortalVisibleRequestType = (
  rt: JiraRequestTypeItem,
  activeGroupMap?: Record<string, string>,
): boolean => {
  // 1. Explicit Jira hidden or portalVisible flags if present
  if (rt.hidden === true || rt.portalVisible === false) {
    return false;
  }

  // 2. In Jira Service Management, request types hidden from the portal have no assigned portal groups
  if (!rt.groupIds || !Array.isArray(rt.groupIds) || rt.groupIds.length === 0) {
    return false;
  }

  // 3. When active portal groups exist for the service desk, require at least one group match
  if (activeGroupMap && Object.keys(activeGroupMap).length > 0) {
    const hasValidPortalGroup = rt.groupIds.some((gid) =>
      Boolean(activeGroupMap[String(gid)]),
    );
    if (!hasValidPortalGroup) {
      return false;
    }
  }

  return true;
};

export async function GET(req: NextRequest) {
  const authCtx = await getJiraAuthContext();

  const searchParams = req.nextUrl.searchParams;
  const serviceDeskIdParam = searchParams.get("serviceDeskId");
  const spaceCategory = searchParams.get("spaceCategory");
  const includeHidden = searchParams.get("includeHidden") === "true";
  const serviceDeskId =
    serviceDeskIdParam || (spaceCategory ? "all" : undefined);

  // If credentials are not configured, seamlessly return mock data filtered by space
  if (!authCtx.isConfigured || !serviceDeskId) {
    let mockList: RequestTypeWithGroup[] = MOCK_REQUEST_TYPES.filter(
      (rt) =>
        includeHidden ||
        (!rt.hiddenFromPortal && (rt.groupIds ? rt.groupIds.length > 0 : true)),
    ).map((rt) => {
      const space = MOCK_SPACES.find(
        (s) => String(s.id) === String(rt.serviceDeskId || "4"),
      );
      const deskId = resolveCustomerPortalId(
        rt.serviceDeskId,
        space?.projectKey,
        space?.projectName,
      );
      const fallbackUrl = `https://emsmc1.atlassian.net/servicedesk/customer/portal/${deskId}/create/${rt.id}`;

      return {
        ...rt,
        serviceDeskId: deskId,
        spaceName: space?.projectName || "Information Technology",
        spaceKey: space?.projectKey || "IT",
        portalUrl: rt.portalUrl || fallbackUrl,
        isLocked: Boolean(
          rt.canCreate === false ||
          rt.restricted === true ||
          rt.isLocked === true,
        ),
        restricted: rt.restricted ?? Boolean(rt.isLocked),
        canCreate: rt.canCreate ?? !Boolean(rt.isLocked),
      };
    });

    if (serviceDeskId && serviceDeskId !== "all") {
      mockList = mockList.filter(
        (rt) => String(rt.serviceDeskId) === String(serviceDeskId),
      );
    } else if (spaceCategory) {
      const itSpaceIds = new Set(["1", "4"]);
      mockList = mockList.filter(
        (rt) => rt.serviceDeskId && itSpaceIds.has(rt.serviceDeskId),
      );
    }

    return NextResponse.json(mockList);
  }

  try {
    const isSingleSpace = serviceDeskId !== "all";

    // Common headers for Jira API calls
    const jiraHeaders: Record<string, string> = {
      Authorization: authCtx.authHeader,
      Accept: "application/json",
    };
    const jiraExperimentalHeaders: Record<string, string> = {
      ...jiraHeaders,
      "X-ExperimentalApi": "opt-in",
    };

    const baseUrl =
      process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
      (authCtx.baseUrl.startsWith("http") &&
      !authCtx.baseUrl.includes("api.atlassian.com")
        ? authCtx.baseUrl.replace(/\/+$/, "")
        : "https://emsmc1.atlassian.net");

    // =========================================================================
    // SCENARIO 1: SINGLE SPECIFIC SERVICE DESK (e.g. /?space=2 for Billing)
    // Strictly fetch and categorize ONLY for this specific service desk
    // =========================================================================
    if (isSingleSpace) {
      // 1. Check if this specific service desk is IT or non-IT
      let isIT = false;
      let singleSdProjectName = "";
      let singleSdProjectKey = "";
      try {
        const singleSdRes = await fetch(
          `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}`,
          { headers: jiraHeaders, cache: "no-store" },
        );
        if (singleSdRes.ok) {
          const sdData = (await singleSdRes.json()) as {
            projectId?: string | number;
            projectName?: string;
            projectKey?: string;
          };
          singleSdProjectName = sdData.projectName || "";
          singleSdProjectKey = sdData.projectKey || "";
          const name = singleSdProjectName.toLowerCase();
          const key = singleSdProjectKey.toUpperCase();

          isIT =
            key === "IT" ||
            key === "TECH" ||
            key === "ITS" ||
            name.includes("information technology") ||
            name.includes("it support") ||
            name.includes("it service") ||
            name.includes("it helpdesk");

          if (!isIT && sdData.projectId) {
            try {
              const projRes = await fetch(
                `${authCtx.baseUrl}/rest/api/3/project/${sdData.projectId}`,
                { headers: jiraHeaders, cache: "no-store" },
              );
              if (projRes.ok) {
                const proj = (await projRes.json()) as {
                  projectCategory?: { name?: string };
                };
                if (
                  matchesCategory(
                    proj.projectCategory?.name,
                    "Information Technology",
                  )
                ) {
                  isIT = true;
                }
              }
            } catch {
              // Ignore project check failure
            }
          }
        }
      } catch (err) {
        console.warn(
          `Could not verify service desk ${serviceDeskId} details:`,
          err,
        );
      }

      // If URL explicitly asked for spaceCategory=Information Technology, treat as IT
      if (
        spaceCategory &&
        matchesCategory(spaceCategory, "Information Technology")
      ) {
        isIT = true;
      }

      // 2. Fetch request types for THIS service desk ONLY
      const rtRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype?limit=100`,
        { headers: jiraHeaders, cache: "no-store" },
      );

      if (!rtRes.ok) {
        const text = await rtRes.text().catch(() => "");
        console.error(
          `Failed to fetch request types for SD ${serviceDeskId}:`,
          text,
        );
        return NextResponse.json([]);
      }

      const rtData = (await rtRes.json()) as { values?: JiraRequestTypeItem[] };
      const rawTypes = rtData.values || [];

      // 3. Fetch native Jira portal groups for this board
      const nativeGroupMap: Record<string, string> = {};
      try {
        const groupRes = await fetch(
          `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttypegroup?limit=100`,
          { headers: jiraExperimentalHeaders, cache: "no-store" },
        );

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData.values && Array.isArray(groupData.values)) {
            groupData.values.forEach(
              (g: { id?: string | number; name?: string }) => {
                if (g.id !== undefined && g.name) {
                  nativeGroupMap[String(g.id)] = g.name;
                }
              },
            );
          }
        }
      } catch (err) {
        console.warn(
          `Failed to fetch native portal groups for SD ${serviceDeskId}:`,
          err,
        );
      }

      // 4. Filter out request types that are marked as Hidden from Portal in JSM
      const visibleTypes = includeHidden
        ? rawTypes
        : rawTypes.filter((rt) =>
            isPortalVisibleRequestType(rt, nativeGroupMap),
          );

      // 5. Map request types
      const mappedTypes: RequestTypeWithGroup[] = visibleTypes.map((rt) => {
        let itCategory = "Work Orders";

        if (isIT) {
          // Keep the 4 IT categories intact for IT teams
          const categoryKey = classifyRequestType({
            name: rt.name,
            description: rt.description,
            helpText: rt.helpText,
          });

          switch (categoryKey) {
            case "WORK_ORDERS":
              itCategory = "Work Orders";
              break;
            case "PROBLEMS":
              itCategory = "Problems";
              break;
            case "AUTOMATIONS":
              itCategory = "Automations and Reports";
              break;
            case "SUGGESTIONS":
              itCategory = "Suggestions";
              break;
          }
        }

        let specificGroup = "";
        if (rt.groupIds && rt.groupIds.length > 0) {
          for (const gid of rt.groupIds) {
            if (nativeGroupMap[String(gid)]) {
              specificGroup = nativeGroupMap[String(gid)];
              break;
            }
          }
        }

        if (!specificGroup) {
          specificGroup = isIT
            ? inferPortalGroup(rt.name, rt.description, itCategory)
            : "General Requests";
        }

        const targetPortalId = resolveCustomerPortalId(
          serviceDeskId,
          singleSdProjectKey,
          singleSdProjectName,
        );
        const portalUrl = `${baseUrl}/servicedesk/customer/portal/${targetPortalId}/create/${rt.id}`;

        return {
          id: String(rt.id),
          name: rt.name,
          description: rt.description,
          category: isIT ? itCategory : undefined,
          group: specificGroup,
          portalGroup: specificGroup,
          portalUrl,
          serviceDeskId: String(serviceDeskId),
          spaceName:
            singleSdProjectName ||
            (isIT ? "Information Technology" : undefined),
          spaceKey: singleSdProjectKey || (isIT ? "IT" : undefined),
          isLocked: Boolean(
            rt.canCreate === false ||
            rt.restricted === true ||
            rt.restrictionStatus === "RESTRICTED",
          ),
          restricted: rt.restricted ?? rt.restrictionStatus === "RESTRICTED",
          restrictionStatus: rt.restrictionStatus,
          canCreate: rt.canCreate,
        };
      });

      return NextResponse.json(mappedTypes);
    }

    // =========================================================================
    // SCENARIO 2: ALL BOARDS (e.g. 4 IT Cards or Home Omni-Search)
    // =========================================================================
    const sdRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk`,
      { headers: jiraHeaders, cache: "no-store" },
    );

    let allServiceDesks: Array<{
      id?: string | number;
      projectId?: string | number;
      projectName?: string;
      projectKey?: string;
    }> = [];

    if (sdRes.ok) {
      const sdData = (await sdRes.json()) as {
        values?: Array<{
          id?: string | number;
          projectId?: string | number;
          projectName?: string;
          projectKey?: string;
        }>;
      };
      allServiceDesks = sdData.values || [];
    }

    // Fetch projects to map categories
    const projectsRes = await fetch(`${authCtx.baseUrl}/rest/api/3/project`, {
      headers: jiraHeaders,
      cache: "no-store",
    });

    const projectCategoryMap: Record<string, string> = {};
    if (projectsRes.ok) {
      const projects = (await projectsRes.json()) as Array<{
        id?: string | number;
        projectCategory?: { name?: string };
      }>;
      projects.forEach((project) => {
        if (project.id !== undefined) {
          projectCategoryMap[String(project.id)] =
            project.projectCategory?.name || "Uncategorized";
        }
      });
    }

    const isITServiceDesk = (sd: {
      projectId?: string | number;
      projectName?: string;
      projectKey?: string;
    }) => {
      const category =
        sd.projectId !== undefined
          ? projectCategoryMap[String(sd.projectId)] || "Uncategorized"
          : "Uncategorized";
      if (matchesCategory(category, "Information Technology")) return true;
      const name = (sd.projectName || "").toLowerCase();
      const key = (sd.projectKey || "").toUpperCase();
      if (key === "IT" || key === "TECH" || key === "ITS") return true;
      if (
        name.includes("information technology") ||
        name.includes("it support") ||
        name.includes("it service") ||
        name.includes("it helpdesk")
      ) {
        return true;
      }
      return false;
    };

    // Filter service desks if spaceCategory is specified
    let targetServiceDesks = allServiceDesks;
    if (spaceCategory) {
      targetServiceDesks = allServiceDesks.filter((sd) => {
        const category =
          sd.projectId !== undefined
            ? projectCategoryMap[String(sd.projectId)] || "Uncategorized"
            : "Uncategorized";
        return matchesCategory(category, spaceCategory);
      });
    }

    const allMappedTypes: RequestTypeWithGroup[] = [];

    for (const sd of targetServiceDesks) {
      if (sd.id === undefined) continue;
      const currentSdId = String(sd.id);
      const isIT = isITServiceDesk(sd);

      const rtRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${currentSdId}/requesttype?limit=100`,
        { headers: jiraHeaders, cache: "no-store" },
      );

      if (!rtRes.ok) continue;

      const rtData = (await rtRes.json()) as { values?: JiraRequestTypeItem[] };

      const nativeGroupMap: Record<string, string> = {};
      try {
        const groupRes = await fetch(
          `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${currentSdId}/requesttypegroup?limit=100`,
          { headers: jiraExperimentalHeaders, cache: "no-store" },
        );

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData.values && Array.isArray(groupData.values)) {
            groupData.values.forEach(
              (g: { id?: string | number; name?: string }) => {
                if (g.id !== undefined && g.name) {
                  nativeGroupMap[String(g.id)] = g.name;
                }
              },
            );
          }
        }
      } catch {
        // Ignore
      }

      // Filter out request types marked as Hidden from Portal in JSM
      const visibleTypes = includeHidden
        ? rtData.values || []
        : (rtData.values || []).filter((rt: JiraRequestTypeItem) =>
            isPortalVisibleRequestType(rt, nativeGroupMap),
          );

      const mapped = visibleTypes.map((rt: JiraRequestTypeItem) => {
        let itCategory = "Work Orders";

        if (isIT) {
          const categoryKey = classifyRequestType({
            name: rt.name,
            description: rt.description,
            helpText: rt.helpText,
          });

          switch (categoryKey) {
            case "WORK_ORDERS":
              itCategory = "Work Orders";
              break;
            case "PROBLEMS":
              itCategory = "Problems";
              break;
            case "AUTOMATIONS":
              itCategory = "Automations and Reports";
              break;
            case "SUGGESTIONS":
              itCategory = "Suggestions";
              break;
          }
        }

        let specificGroup = "";
        if (rt.groupIds && rt.groupIds.length > 0) {
          for (const gid of rt.groupIds) {
            if (nativeGroupMap[String(gid)]) {
              specificGroup = nativeGroupMap[String(gid)];
              break;
            }
          }
        }

        if (!specificGroup) {
          specificGroup = isIT
            ? inferPortalGroup(rt.name, rt.description, itCategory)
            : "General Requests";
        }

        const targetPortalId = resolveCustomerPortalId(
          currentSdId,
          sd.projectKey,
          sd.projectName,
        );
        const portalUrl = `${baseUrl}/servicedesk/customer/portal/${targetPortalId}/create/${rt.id}`;

        return {
          id: String(rt.id),
          name: rt.name,
          description: rt.description,
          category: isIT ? itCategory : undefined,
          group: specificGroup,
          portalGroup: specificGroup,
          portalUrl,
          serviceDeskId: currentSdId,
          spaceName: sd.projectName,
          spaceKey: sd.projectKey,
          isLocked: Boolean(
            rt.canCreate === false ||
            rt.restricted === true ||
            rt.restrictionStatus === "RESTRICTED",
          ),
          restricted: rt.restricted ?? rt.restrictionStatus === "RESTRICTED",
          restrictionStatus: rt.restrictionStatus,
          canCreate: rt.canCreate,
        };
      });

      allMappedTypes.push(...mapped);
    }

    return NextResponse.json(allMappedTypes);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Live Jira request types fetch error:", message);
    return NextResponse.json(
      { error: "Failed to load Jira request types.", details: message },
      { status: 500 },
    );
  }
}
