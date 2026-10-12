// app/api/jsm/submit/route.ts
import { NextResponse } from "next/server";
import { JsmField, SubmitPayload } from "@/types/jsm";
import { getJiraAuthContext, getCloudId } from "@/lib/jira";

export async function POST(req: Request) {
  const authCtx = await getJiraAuthContext();

  try {
    const payload = (await req.json()) as SubmitPayload;
    const {
      serviceDeskId,
      requestTypeId,
      formId,
      fieldValues,
      fields,
      userEmail,
      requestTypeName,
    } = payload;
    
    const sdId = serviceDeskId || authCtx.serviceDeskId;

    // If live credentials are not configured, simulate a successful ticket creation for local testing
    if (!authCtx.isConfigured || !sdId) {
      console.info(
        "ℹ️ Simulating mock ticket submission for request:",
        requestTypeName || requestTypeId,
      );
      const mockIssueNum = Math.floor(1000 + Math.random() * 9000);
      const issueKey = `ITSD-${mockIssueNum}`;

      await new Promise((resolve) => setTimeout(resolve, 350));

      return NextResponse.json({
        success: true,
        issueKey,
        isMock: true,
      });
    }

    // 1. Separate standard Jira fields from ProForma questions
    const standardPayload: Record<string, unknown> = {};
    const proformaAnswers: Record<
      string,
      {
        text?: string;
        choices?: string[];
        users?: string[];
        groups?: string[];
        date?: string;
        time?: string;
        number?: number;
      }
    > = {};

    const fieldsById = new Map<string, JsmField>();
    (fields || []).forEach((field) => {
      fieldsById.set(field.id, field);
      if (field.jiraField) fieldsById.set(field.jiraField, field);
    });

    const extraFieldsDescriptionLines: string[] = [];

    Object.entries(fieldValues || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      const field = fieldsById.get(key);
      const targetJiraKey = field?.jiraField || key;

      // Check if this key is a standard valid Jira field (summary, description, customfield_*, components, priority)
      const isValidJiraKey =
        targetJiraKey === "summary" ||
        targetJiraKey === "description" ||
        targetJiraKey === "components" ||
        targetJiraKey === "priority" ||
        targetJiraKey.startsWith("customfield_");

      if (field?.source === "jira" && isValidJiraKey) {
        if (
          (field?.type === "cascading" || field?.type === "cascading-select") &&
          typeof value === "object" &&
          value !== null
        ) {
          const cascadingValue = value as {
            parent?: string;
            child?: string;
          };
          if (cascadingValue.parent) {
            standardPayload[targetJiraKey] = {
              id: cascadingValue.parent,
              ...(cascadingValue.child
                ? { child: { id: cascadingValue.child } }
                : {}),
            };
          }
        } else if (field?.type === "multi-user-picker") {
          const userList = Array.isArray(value) ? value : [value];
          standardPayload[targetJiraKey] = userList.map((u) =>
            typeof u === "object" && u !== null && "accountId" in (u as Record<string, unknown>)
              ? u
              : { accountId: String(u) },
          );
        } else if (field?.type === "user-picker") {
          standardPayload[targetJiraKey] =
            typeof value === "object" && value !== null && "accountId" in (value as Record<string, unknown>)
              ? value
              : { accountId: String(value) };
        } else if (field?.type === "multi-group-picker") {
          const groupList = Array.isArray(value) ? value : [value];
          standardPayload[targetJiraKey] = groupList.map((g) =>
            typeof g === "object" && g !== null && "name" in (g as Record<string, unknown>)
              ? g
              : { name: String(g) },
          );
        } else if (field?.type === "group-picker") {
          standardPayload[targetJiraKey] =
            typeof value === "object" && value !== null && "name" in (value as Record<string, unknown>)
              ? value
              : { name: String(value) };
        } else if (field?.type === "checkbox" || field?.type === "multiselect") {
          const choiceList = Array.isArray(value) ? value : [value];
          standardPayload[targetJiraKey] = choiceList.map((c) => ({ id: String(c) }));
        } else if (field?.type === "dropdown" || field?.type === "radio" || field?.type === "choice") {
          standardPayload[targetJiraKey] = { id: String(value) };
        } else if (field?.type === "labels") {
          standardPayload[targetJiraKey] = Array.isArray(value)
            ? value.map(String)
            : String(value).split(",").map((s) => s.trim()).filter(Boolean);
        } else if (field?.type === "asset") {
          standardPayload[targetJiraKey] = Array.isArray(value)
            ? value.map((a) => (typeof a === "object" ? a : { key: String(a) }))
            : [{ key: String(value) }];
        } else if (field?.type === "number") {
          standardPayload[targetJiraKey] = Number(value);
        } else {
          standardPayload[targetJiraKey] = value;
        }
      } else {
        // Collect for ProForma or issue description summary
        const label = field?.label || field?.name || key;
        const isFile = field?.type === "file" || field?.type === "attachment";
        if (!isFile) {
          extraFieldsDescriptionLines.push(
            `*${label}*: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
          );
        }

        // ProForma Question formatting
        if (field?.type === "user-picker" || field?.type === "multi-user-picker") {
          const userList = Array.isArray(value) ? value.map(String) : [String(value)];
          proformaAnswers[key] = { users: userList };
        } else if (
          field?.type === "group-picker" ||
          field?.type === "multi-group-picker"
        ) {
          const groupList = Array.isArray(value) ? value.map(String) : [String(value)];
          proformaAnswers[key] = { groups: groupList };
        } else if (field?.type === "cascading" || field?.type === "cascading-select") {
          const cascadingValue =
            typeof value === "object" && value !== null
              ? (value as { parent?: string; child?: string })
              : null;
          if (cascadingValue?.parent) {
            proformaAnswers[key] = {
              choices: [
                cascadingValue.parent,
                ...(cascadingValue.child ? [cascadingValue.child] : []),
              ],
            };
          }
        } else if (
          field?.type === "dropdown" ||
          field?.type === "radio" ||
          field?.type === "checkbox" ||
          field?.type === "labels" ||
          field?.type === "choice"
        ) {
          const choiceList = Array.isArray(value) ? value.map(String) : [String(value)];
          proformaAnswers[key] = { choices: choiceList };
        } else if (field?.type === "date") {
          proformaAnswers[key] = { date: String(value) };
        } else if (field?.type === "time") {
          proformaAnswers[key] = { time: String(value) };
        } else if (field?.type === "number") {
          proformaAnswers[key] = {
            number: Number(value),
            text: String(value),
          };
        } else if (!isFile) {
          proformaAnswers[key] = { text: String(value) };
        }
      }
    });

    // Ensure summary is ALWAYS present for Jira Service Management request
    if (!standardPayload.summary) {
      const explicitSummary =
        (fieldValues?.summary as string) ||
        (fieldValues?.title as string) ||
        (fieldValues?.subject as string);

      standardPayload.summary =
        explicitSummary ||
        `${requestTypeName || "Service Request"} - ${new Date().toLocaleDateString()}`;
    }

    // Append extra custom fields or answers into description if standard description is empty
    if (!standardPayload.description && extraFieldsDescriptionLines.length > 0) {
      standardPayload.description = extraFieldsDescriptionLines.join("\n");
    }

    // 2. Create the Base Ticket in live JSM
    const requestBody: Record<string, unknown> = {
      serviceDeskId: sdId,
      requestTypeId: String(requestTypeId),
      requestFieldValues: standardPayload,
    };

    // Include raiseOnBehalfOf if provided for Basic auth
    if (userEmail && userEmail !== authCtx.userEmail && authCtx.authType === "basic") {
      requestBody.raiseOnBehalfOf = userEmail;
    }

    let createRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/request`,
      {
        method: "POST",
        headers: {
          Authorization: authCtx.authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    // If request failed because of raiseOnBehalfOf, retry without raiseOnBehalfOf
    if (!createRes.ok && requestBody.raiseOnBehalfOf) {
      console.warn("Retrying ticket creation without raiseOnBehalfOf parameter...");
      delete requestBody.raiseOnBehalfOf;
      createRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/request`,
        {
          method: "POST",
          headers: {
            Authorization: authCtx.authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );
    }

    const createText = await createRes.text();
    let createData: {
      issueId?: string;
      issueKey?: string;
      message?: string;
      errorMessage?: string;
      i18nErrorMessage?: { parameters?: string[] };
      errors?: Record<string, string>;
    } = {};

    try {
      createData = JSON.parse(createText) as typeof createData;
    } catch {
      // Non-JSON response
    }

    if (!createRes.ok) {
      console.error(
        "Jira request creation failed:",
        createRes.status,
        createText,
      );


      const jiraError = [
        createData.errorMessage,
        createData.i18nErrorMessage?.parameters?.[0],
        createData.message,
        createData.errors ? Object.entries(createData.errors).map(([k, v]) => `${k}: ${v}`).join(", ") : undefined,
        createText,
      ].find((msg) => msg && msg.trim());

      return NextResponse.json(
        {
          error: jiraError || `Ticket creation failed (HTTP ${createRes.status})`,
          details: createData,
        },
        { status: createRes.status },
      );
    }

    const issueId = createData.issueId;
    const issueKey = createData.issueKey;

    // 3. Attach the ProForma form template and save answers if formId is provided
    if (formId && !String(formId).startsWith("mock-") && issueId) {
      try {
        const cloudId = authCtx.cloudId || (await getCloudId(authCtx.baseUrl));
        const formsApiUrl = `https://api.atlassian.com/jira/forms/cloud/${cloudId}`;
        const formHeaders = {
          Authorization: authCtx.authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-ExperimentalApi": "opt-in",
        };

        const attachRes = await fetch(`${formsApiUrl}/issue/${issueId}/form`, {
          method: "POST",
          headers: formHeaders,
          body: JSON.stringify({ formTemplate: { id: String(formId) } }),
        });

        if (attachRes.ok) {
          const attachData = (await attachRes.json()) as { id?: string };
          if (attachData.id && Object.keys(proformaAnswers).length > 0) {
            await fetch(
              `${formsApiUrl}/issue/${issueId}/form/${attachData.id}`,
              {
                method: "PUT",
                headers: formHeaders,
                body: JSON.stringify({ answers: proformaAnswers }),
              },
            );
          }
        }
      } catch (formErr) {
        console.warn("ProForma form submission skipped or failed:", formErr);
      }
    }

    return NextResponse.json({ success: true, issueKey });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown submission error occurred";
    console.error("Submission handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
