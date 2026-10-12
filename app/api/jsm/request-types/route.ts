import { NextRequest, NextResponse } from "next/server";
import { MOCK_REQUEST_TYPES } from "@/lib/mock-data";
import { getJiraAuthContext } from "@/lib/jira";
import {
  JiraRequestTypeGroup,
  JiraRequestTypeItem,
  RequestTypeWithGroup,
} from "@/types/jsm";
import { classifyRequestType } from "@/lib/classifier";

export async function GET(req: NextRequest) {
  const authCtx = await getJiraAuthContext();
  
  const searchParams = req.nextUrl.searchParams;
  const serviceDeskId = searchParams.get("serviceDeskId") || authCtx.serviceDeskId;

  // If credentials are not configured, seamlessly return mock data for local testing
  if (!authCtx.isConfigured || !serviceDeskId) {
    console.info(
      "ℹ️ Jira credentials not configured or no service desk specified. Serving local mock request types.",
    );
    return NextResponse.json(MOCK_REQUEST_TYPES);
  }

  try {
    let serviceDeskIdsToFetch: string[] = [];
    
    if (serviceDeskId === "all") {
      // Fetch all service desks
      const sdRes = await fetch(`${authCtx.baseUrl}/rest/servicedeskapi/servicedesk`, {
        headers: { Authorization: authCtx.authHeader, Accept: "application/json" },
        cache: "no-store",
      });
      if (sdRes.ok) {
        const sdData = await sdRes.json();
        serviceDeskIdsToFetch = (sdData.values || []).map((sd: any) => String(sd.id));
      } else {
        serviceDeskIdsToFetch = [authCtx.serviceDeskId || "1"]; // fallback
      }
    } else {
      serviceDeskIdsToFetch = [serviceDeskId];
    }

    let allMappedTypes: RequestTypeWithGroup[] = [];

    for (const currentSdId of serviceDeskIdsToFetch) {
      // 1. Fetch the Request Types from live Jira instance
      const rtRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${currentSdId}/requesttype`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      if (!rtRes.ok) {
        console.error(`Failed to fetch request types for SD ${currentSdId}`);
        continue;
      }

      const rtData = (await rtRes.json()) as { values?: JiraRequestTypeItem[] };

      // 2. Map Groups to Request Types
      const mappedTypes: RequestTypeWithGroup[] = (rtData.values || []).map(
        (rt: JiraRequestTypeItem) => {
          const categoryKey = classifyRequestType({
            name: rt.name,
            description: rt.description,
            helpText: rt.helpText,
          });

          let groupName = "General Requests";
          switch (categoryKey) {
            case 'WORK_ORDERS':
              groupName = "Work Orders";
              break;
            case 'PROBLEMS':
              groupName = "Problems";
              break;
            case 'AUTOMATIONS':
              groupName = "Automations and Reports";
              break;
            case 'SUGGESTIONS':
              groupName = "Suggestions";
              break;
          }

          const baseUrl =
            process.env.JIRA_BASE_URL?.replace(/\/+$/, "") ||
            "https://emsmc.atlassian.net";
          const portalUrl = `${baseUrl}/servicedesk/customer/portal/${currentSdId}/create/${rt.id}`;

          return {
            id: String(rt.id),
            name: rt.name,
            description: rt.description,
            group: groupName,
            portalUrl,
            // Track the original service desk ID for cross-board scenarios
            serviceDeskId: currentSdId
          };
        },
      );
      allMappedTypes = [...allMappedTypes, ...mappedTypes];
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
