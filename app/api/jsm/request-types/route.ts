import { NextRequest, NextResponse } from "next/server";
import { MOCK_REQUEST_TYPES } from "@/lib/mock-data";
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
    words.has("techology");

  if (isITAlias(expectedWords)) {
    return isITAlias(actualWords);
  }

  const commonWords = [...actualWords].filter((w) => expectedWords.has(w));
  return commonWords.length > 0;
};

export async function GET(req: NextRequest) {
  const authCtx = await getJiraAuthContext();

  const searchParams = req.nextUrl.searchParams;
  const serviceDeskIdParam = searchParams.get("serviceDeskId");
  const spaceCategory = searchParams.get("spaceCategory");
  const serviceDeskId = serviceDeskIdParam || (spaceCategory ? "all" : undefined);

  // If credentials are not configured, seamlessly return mock data filtered by space
  if (!authCtx.isConfigured || !serviceDeskId) {
    let mockList: RequestTypeWithGroup[] = MOCK_REQUEST_TYPES.map((rt) => {
      const deskId = rt.serviceDeskId || "1";
      return {
        ...rt,
        serviceDeskId: deskId,
        portalUrl: `https://emsmc.atlassian.net/servicedesk/customer/portal/${deskId}/create/${rt.id}`,
      };
    });

    if (serviceDeskId && serviceDeskId !== "all") {
      mockList = mockList.filter(
        (rt) => String(rt.serviceDeskId) === String(serviceDeskId),
      );
    } else if (spaceCategory) {
      const itSpaceIds = new Set(["1", "4"]);
      mockList = mockList.filter((rt) => rt.serviceDeskId && itSpaceIds.has(rt.serviceDeskId));
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

    const rawBase = process.env.JIRA_BASE_URL?.replace(/\/+$/, "");
    const baseUrl =
      !rawBase || rawBase.includes("sandbox") || rawBase.includes("emsmc1")
        ? "https://emsmc.atlassian.net"
        : rawBase;

    // =========================================================================
    // SCENARIO 1: SINGLE SPECIFIC SERVICE DESK (e.g. /?space=2 for Billing)
    // Strictly fetch and categorize ONLY for this specific service desk
    // =========================================================================
    if (isSingleSpace) {
      // 1. Check if this specific service desk is IT or non-IT
      let isIT = false;
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
          const name = (sdData.projectName || "").toLowerCase();
          const key = (sdData.projectKey || "").toUpperCase();

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
                if (matchesCategory(proj.projectCategory?.name, "Information Technology")) {
                  isIT = true;
                }
              }
            } catch {
              // Ignore project check failure
            }
          }
        }
      } catch (err) {
        console.warn(`Could not verify service desk ${serviceDeskId} details:`, err);
      }

      // If URL explicitly asked for spaceCategory=Information Technology, treat as IT
      if (spaceCategory && matchesCategory(spaceCategory, "Information Technology")) {
        isIT = true;
      }

      // 2. Fetch request types for THIS service desk ONLY
      const rtRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype?limit=100`,
        { headers: jiraHeaders, cache: "no-store" },
      );

      if (!rtRes.ok) {
        const text = await rtRes.text().catch(() => "");
        console.error(`Failed to fetch request types for SD ${serviceDeskId}:`, text);
        return NextResponse.json([]);
      }

      const rtData = (await rtRes.json()) as { values?: JiraRequestTypeItem[] };
      const rawTypes = rtData.values || [];

      // 3. For non-IT boards (Billing, HR, etc.), fetch native Jira portal groups
      const nativeGroupMap: Record<string, string> = {};
      if (!isIT) {
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
          console.warn(`Failed to fetch native portal groups for SD ${serviceDeskId}:`, err);
        }
      }

      // 4. Map request types
      const mappedTypes: RequestTypeWithGroup[] = rawTypes.map((rt) => {
        let groupName = "General Requests";

        if (isIT) {
          // Keep the 4 IT categories intact for IT teams
          const categoryKey = classifyRequestType({
            name: rt.name,
            description: rt.description,
            helpText: rt.helpText,
          });

          switch (categoryKey) {
            case "WORK_ORDERS":
              groupName = "Work Orders";
              break;
            case "PROBLEMS":
              groupName = "Problems";
              break;
            case "AUTOMATIONS":
              groupName = "Automations and Reports";
              break;
            case "SUGGESTIONS":
              groupName = "Suggestions";
              break;
          }
        } else {
          // Native Jira Portal Groups configured in Jira for this board
          if (rt.groupIds && rt.groupIds.length > 0) {
            for (const gid of rt.groupIds) {
              if (nativeGroupMap[String(gid)]) {
                groupName = nativeGroupMap[String(gid)];
                break;
              }
            }
          }
        }

        const portalUrl = `${baseUrl}/servicedesk/customer/portal/${serviceDeskId}/create/${rt.id}`;

        return {
          id: String(rt.id),
          name: rt.name,
          description: rt.description,
          group: groupName,
          portalUrl,
          serviceDeskId: String(serviceDeskId),
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
      if (!isIT) {
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
      }

      const mapped = (rtData.values || []).map((rt: JiraRequestTypeItem) => {
        let groupName = "General Requests";

        if (isIT) {
          const categoryKey = classifyRequestType({
            name: rt.name,
            description: rt.description,
            helpText: rt.helpText,
          });

          switch (categoryKey) {
            case "WORK_ORDERS":
              groupName = "Work Orders";
              break;
            case "PROBLEMS":
              groupName = "Problems";
              break;
            case "AUTOMATIONS":
              groupName = "Automations and Reports";
              break;
            case "SUGGESTIONS":
              groupName = "Suggestions";
              break;
          }
        } else {
          if (rt.groupIds && rt.groupIds.length > 0) {
            for (const gid of rt.groupIds) {
              if (nativeGroupMap[String(gid)]) {
                groupName = nativeGroupMap[String(gid)];
                break;
              }
            }
          }
        }

        const portalUrl = `${baseUrl}/servicedesk/customer/portal/${currentSdId}/create/${rt.id}`;

        return {
          id: String(rt.id),
          name: rt.name,
          description: rt.description,
          group: groupName,
          portalUrl,
          serviceDeskId: currentSdId,
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
