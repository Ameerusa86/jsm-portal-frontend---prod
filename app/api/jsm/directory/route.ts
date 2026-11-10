import { NextResponse } from "next/server";
import { getJiraAuthContext } from "@/lib/jira";
import { Choice } from "@/types/jsm";

interface JiraUserItem {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  avatarUrl?: string;
  name?: string;
  active?: boolean;
}

interface JiraGroupItem {
  groupId?: string;
  name?: string;
  html?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const query = url.searchParams.get("query")?.trim() || "";

  if (type !== "user" && type !== "group") {
    return NextResponse.json(
      { error: "Invalid directory type. Expected 'user' or 'group'." },
      { status: 400 },
    );
  }

  const authCtx = await getJiraAuthContext();

  if (!authCtx.isConfigured) {
    return NextResponse.json(
      { error: "Jira credentials are not configured.", choices: [] },
      { status: 401 },
    );
  }

  try {
    const choices: Choice[] = [];

    if (type === "user") {
      // 1. Try Jira Core User Picker
      let liveUsers: JiraUserItem[] = [];

      try {
        const pickerRes = await fetch(
          `${authCtx.baseUrl}/rest/api/3/user/picker?query=${encodeURIComponent(query)}&maxResults=25&showAvatar=true`,
          {
            headers: {
              Authorization: authCtx.authHeader,
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        if (pickerRes.ok) {
          const pickerData = await pickerRes.json();
          if (pickerData && Array.isArray(pickerData.users)) {
            liveUsers = pickerData.users;
          }
        }
      } catch (err) {
        console.warn("User picker endpoint failed, attempting fallback:", err);
      }

      // 2. Fallback to /rest/api/3/user/search if picker returned 0
      if (liveUsers.length === 0) {
        try {
          const searchRes = await fetch(
            `${authCtx.baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=25`,
            {
              headers: {
                Authorization: authCtx.authHeader,
                Accept: "application/json",
              },
              cache: "no-store",
            },
          );

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (Array.isArray(searchData)) {
              liveUsers = searchData;
            }
          }
        } catch (err) {
          console.warn("User search endpoint failed:", err);
        }
      }

      // 3. Fallback to Service Desk customer/user search if still empty and serviceDeskId is available
      if (liveUsers.length === 0 && authCtx.serviceDeskId) {
        try {
          const sdUserRes = await fetch(
            `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${authCtx.serviceDeskId}/user?query=${encodeURIComponent(query)}`,
            {
              headers: {
                Authorization: authCtx.authHeader,
                Accept: "application/json",
              },
              cache: "no-store",
            },
          );

          if (sdUserRes.ok) {
            const sdUserData = await sdUserRes.json();
            if (sdUserData && Array.isArray(sdUserData.values)) {
              liveUsers = sdUserData.values;
            }
          }
        } catch (err) {
          console.warn("Service Desk user search failed:", err);
        }
      }

      if (liveUsers.length > 0) {
        liveUsers.forEach((user) => {
          const accountId = user.accountId || user.name;
          if (accountId) {
            choices.push({
              id: accountId,
              value: accountId,
              accountId: accountId,
              label: user.displayName || user.emailAddress || accountId,
              name: user.displayName,
              email: user.emailAddress,
              avatarUrl:
                user.avatarUrls?.["48x48"] ||
                user.avatarUrls?.["32x32"] ||
                user.avatarUrl,
            });
          }
        });
      }
    } else {
      // Group search
      let liveGroups: JiraGroupItem[] = [];

      try {
        const groupRes = await fetch(
          `${authCtx.baseUrl}/rest/api/3/group/picker?query=${encodeURIComponent(query)}&maxResults=25`,
          {
            headers: {
              Authorization: authCtx.authHeader,
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData && Array.isArray(groupData.groups)) {
            liveGroups = groupData.groups;
          }
        }
      } catch (err) {
        console.warn("Group picker endpoint failed:", err);
      }

      if (liveGroups.length > 0) {
        liveGroups.forEach((group) => {
          const name = group.name;
          if (name) {
            choices.push({
              id: group.groupId || name,
              value: name,
              label: name,
              name: name,
            });
          }
        });
      }
    }

    return NextResponse.json({ choices });
  } catch (error: unknown) {
    console.error("Directory search failed:", error);
    return NextResponse.json(
      { error: "Failed to search directory.", choices: [] },
      { status: 500 },
    );
  }
}

