import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";

export async function GET() {
  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    return NextResponse.json({ values: [] });
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
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to fetch service desks", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Fetch projects to get their categories
    const projectsRes = await fetch(
      `${authCtx.baseUrl}/rest/api/3/project`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let projectMap: Record<string, string> = {};
    if (projectsRes.ok) {
      const projects = await projectsRes.json();
      if (Array.isArray(projects)) {
        projects.forEach((proj: any) => {
          projectMap[proj.id] = proj.projectCategory?.name || "Uncategorized";
        });
      }
    }

    // Attach category to each service desk
    const enrichedValues = (data.values || []).map((sd: any) => ({
      ...sd,
      category: projectMap[sd.projectId] || "Uncategorized"
    }));

    return NextResponse.json({ ...data, values: enrichedValues });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch service desks", details: err.message },
      { status: 500 }
    );
  }
}
