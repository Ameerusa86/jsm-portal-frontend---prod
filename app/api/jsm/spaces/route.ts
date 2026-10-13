import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { MOCK_SPACES } from "@/lib/mock-data";

type JiraProject = {
  id?: string | number;
  projectCategory?: {
    name?: string;
  };
};

type JiraServiceDesk = {
  projectId?: string | number;
  [key: string]: unknown;
};

type JiraServiceDeskResponse = {
  values?: JiraServiceDesk[];
  [key: string]: unknown;
};

export async function GET() {
  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    return NextResponse.json({ values: MOCK_SPACES });
  }

  try {
    const res = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to fetch service desks", details: text },
        { status: res.status },
      );
    }

    const data = (await res.json()) as JiraServiceDeskResponse;

    // Fetch projects to get their categories
    const projectsRes = await fetch(`${authCtx.baseUrl}/rest/api/3/project`, {
      headers: {
        Authorization: authCtx.authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const projectMap: Record<string, string> = {};
    if (projectsRes.ok) {
      const projects = (await projectsRes.json()) as JiraProject[];
      if (Array.isArray(projects)) {
        projects.forEach((proj: JiraProject) => {
          if (proj.id !== undefined) {
            projectMap[String(proj.id)] =
              proj.projectCategory?.name || "Uncategorized";
          }
        });
      }
    }

    // Attach category to each service desk
    const enrichedValues = (data.values || []).map((sd: JiraServiceDesk) => ({
      ...sd,
      category:
        sd.projectId !== undefined
          ? projectMap[String(sd.projectId)] || "Uncategorized"
          : "Uncategorized",
    }));

    return NextResponse.json({ ...data, values: enrichedValues });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch service desks",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
