// app/api/jsm/fields/[id]/route.ts
import { NextResponse } from "next/server";
import {
  MOCK_FIELDS_BY_REQUEST_TYPE,
  DEFAULT_MOCK_FIELDS,
} from "@/lib/mock-data";
import { getJiraAuthContext, getCloudId } from "@/lib/jira";
import {
  Choice,
  JsmField,
  ProformaQuestionItem,
  ProformaFormSummary,
} from "@/types/jsm";

interface JiraSchemaInfo {
  type?: string;
  items?: string;
  custom?: string;
}

interface JiraValidValue {
  value?: string;
  label?: string;
  children?: JiraValidValue[];
  parentId?: string;
}

interface JiraFieldItem {
  fieldId: string;
  name: string;
  description?: string;
  required?: boolean;
  jiraSchema?: JiraSchemaInfo;
  validValues?: JiraValidValue[];
}

const normalizeFieldKey = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getFormRequestTypeMatches = (
  form: ProformaFormSummary,
  requestTypeId: string,
): boolean => {
  const values = [
    ...(form.requestTypeIds || []),
    ...(form.portalRequestTypeIds || []),
    ...(form.publish?.portalRequestTypeIds || []),
    ...(form.design?.settings?.portalRequestTypeIds || []),
    ...(form.design?.requestTypeIds || []),
    ...(form.design?.settings?.requestTypeIds || []),
  ].map((value) => String(value));

  return values.some((value) => value === String(requestTypeId));
};

interface JiraServiceDeskFieldsResponse {
  requestTypeFields?: JiraFieldItem[];
}

const mapChoice = (choice: JiraValidValue): Choice => ({
  id: choice.value,
  label: choice.label || choice.value,
  children: choice.children?.map(mapChoice),
  parentId: choice.parentId,
});

/**
 * Deeply and recursively extracts all question IDs from any Atlassian ProForma Form layout tree
 * (supporting standard layouts, ADF document formats, sections, grids, columns, and extension nodes)
 * while strictly preserving the top-to-bottom, left-to-right visual order.
 */
const extractOrderedQuestionIds = (
  node: unknown,
  seen = new Set<string>(),
): string[] => {
  const ids: string[] = [];
  if (!node) return ids;

  if (Array.isArray(node)) {
    for (const item of node) {
      for (const id of extractOrderedQuestionIds(item, seen)) {
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    return ids;
  }

  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;

    // 1. Direct ProForma questionId
    if (obj.questionId !== undefined && obj.questionId !== null) {
      const qId = String(obj.questionId);
      if (!seen.has(qId)) {
        seen.add(qId);
        ids.push(qId);
      }
    }

    // 2. Node of type "question" with id
    if (obj.type === "question" && obj.id !== undefined && obj.id !== null) {
      const qId = String(obj.id);
      if (!seen.has(qId)) {
        seen.add(qId);
        ids.push(qId);
      }
    }

    // 3. Atlassian ADF Extension node format
    if (obj.attrs && typeof obj.attrs === "object") {
      const attrs = obj.attrs as Record<string, unknown>;
      const params =
        attrs.parameters && typeof attrs.parameters === "object"
          ? (attrs.parameters as Record<string, unknown>)
          : null;
      const paramId =
        params?.id ?? params?.questionId ?? attrs.questionId ?? attrs.id;

      if (paramId !== undefined && paramId !== null) {
        const qId = String(paramId);
        if (!seen.has(qId)) {
          seen.add(qId);
          ids.push(qId);
        }
      }
    }

    // 4. Recurse through all potential container properties in layout / ADF
    const containerKeys = [
      "items",
      "content",
      "columns",
      "children",
      "sections",
      "rows",
      "elements",
      "nodes",
      "layout",
    ];

    for (const key of containerKeys) {
      if (obj[key]) {
        for (const id of extractOrderedQuestionIds(obj[key], seen)) {
          if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
          }
        }
      }
    }
  }

  return ids;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: requestTypeId } = await params;
  const authCtx = await getJiraAuthContext();

  const searchParams = new URL(req.url).searchParams;
  const serviceDeskId =
    searchParams.get("serviceDeskId") || authCtx.serviceDeskId;

  // Fallback to mock data if credentials are not configured
  if (!authCtx.isConfigured || !serviceDeskId) {
    console.info(
      `ℹ️ Serving mock form fields for request type: ${requestTypeId}`,
    );
    const mockData = MOCK_FIELDS_BY_REQUEST_TYPE[requestTypeId] || {
      formId: `mock-form-${requestTypeId}`,
      fields: DEFAULT_MOCK_FIELDS,
    };
    return NextResponse.json(mockData);
  }

  let standardFields: JsmField[] = [];
  let formId: string | null = null;
  let proformaQuestions: JsmField[] = [];

  try {
    // 1. Fetch Standard Visible Jira Fields in exact JSM order
    const fieldsRes = await fetch(
      `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`,
      {
        headers: {
          Authorization: authCtx.authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!fieldsRes.ok) {
      const bodyText = await fieldsRes.text().catch(() => "");
      console.error(
        "Live Jira fields returned non-OK.",
        fieldsRes.status,
        bodyText,
      );
      return NextResponse.json(
        {
          error: `Jira fields request failed (${fieldsRes.status})`,
          details: bodyText || undefined,
        },
        { status: fieldsRes.status },
      );
    }

    const standardFieldsData =
      (await fieldsRes.json()) as JiraServiceDeskFieldsResponse;

    standardFields = (standardFieldsData.requestTypeFields || []).map(
      (f: JiraFieldItem) => {
        let mappedType = "text";
        const jType = (f.jiraSchema?.type || "").toLowerCase();
        const jItems = (f.jiraSchema?.items || "").toLowerCase();
        const jCustom = (f.jiraSchema?.custom || "").toLowerCase();

        if (
          jCustom.includes("multiuserpicker") ||
          (jType === "array" && jItems === "user")
        )
          mappedType = "multi-user-picker";
        else if (
          jType === "user" ||
          jCustom.includes("userpicker") ||
          jCustom.includes("user-picker") ||
          jCustom.includes("user picker")
        )
          mappedType = "user-picker";
        else if (
          jCustom.includes("multigrouppicker") ||
          (jType === "array" && jItems === "group")
        )
          mappedType = "multi-group-picker";
        else if (
          jType === "group" ||
          jCustom.includes("grouppicker") ||
          jCustom.includes("group-picker") ||
          jCustom.includes("group picker")
        )
          mappedType = "group-picker";
        else if (
          jCustom.includes("cascadingselect") ||
          jCustom.includes("cascading")
        )
          mappedType = "cascading";
        else if (
          jCustom.includes("multicheckboxes") ||
          jCustom.includes("multiselect") ||
          (jType === "array" && jItems === "option")
        )
          mappedType = "checkbox";
        else if (jCustom.includes("radiobuttons")) mappedType = "radio";
        else if (
          jCustom.includes("select") ||
          jType === "option" ||
          f.fieldId === "priority" ||
          f.fieldId === "resolution"
        )
          mappedType = "dropdown";
        else if (
          jCustom.includes("labels") ||
          (jType === "array" && jItems === "string") ||
          f.fieldId === "labels"
        )
          mappedType = "labels";
        else if (jCustom.includes("url") || jType === "url") mappedType = "url";
        else if (jCustom.includes("email") || jType === "email")
          mappedType = "email";
        else if (
          jCustom.includes("float") ||
          jCustom.includes("number") ||
          jType === "number"
        )
          mappedType = "number";
        else if (
          jType === "date" ||
          jCustom.includes("datepicker") ||
          f.fieldId === "duedate"
        )
          mappedType = "date";
        else if (
          jType === "datetime" ||
          jCustom.includes("datetimepicker") ||
          jCustom.includes("datetime")
        )
          mappedType = "datetime-local";
        else if (
          jCustom.includes("cmdb") ||
          jCustom.includes("insight") ||
          jCustom.includes("asset")
        )
          mappedType = "asset";
        else if (
          (jType === "array" && jItems === "attachment") ||
          f.fieldId === "attachment"
        )
          mappedType = "file";
        else if (
          jCustom.includes("textarea") ||
          f.fieldId === "description" ||
          f.fieldId === "environment"
        )
          mappedType = "paragraph";
        else if (f.fieldId === "components") mappedType = "components";

        return {
          id: f.fieldId,
          name: f.name,
          description: f.description || "",
          required: Boolean(f.required),
          type: mappedType,
          choices: (f.validValues || []).map(mapChoice),
          source: "jira",
        };
      },
    );

    let debugInfo: any = {};

    try {
      const cloudId = authCtx.cloudId || (await getCloudId(authCtx.baseUrl));
      debugInfo.cloudId = cloudId;

      const sdRes = await fetch(
        `${authCtx.baseUrl}/rest/servicedeskapi/servicedesk/${serviceDeskId}`,
        {
          headers: {
            Authorization: authCtx.authHeader,
            Accept: "application/json",
          },
        },
      );
      debugInfo.sdStatus = sdRes.status;
      const sdBody = await sdRes.text();
      let projectId;
      try {
        const sdJson = JSON.parse(sdBody);
        projectId = sdJson.projectId;
        debugInfo.projectId = projectId;
      } catch (e) {
        debugInfo.sdError = sdBody;
      }

      if (projectId) {
        const formsRes = await fetch(
          `https://api.atlassian.com/jira/forms/cloud/${cloudId}/project/${projectId}/form`,
          {
            headers: {
              Authorization: authCtx.authHeader,
              Accept: "application/json",
              "X-ExperimentalApi": "opt-in",
            },
            cache: "no-store",
          },
        );

        debugInfo.formsApiStatus = formsRes.status;
        debugInfo.formsApiBody = await formsRes.text();

        if (formsRes.ok) {
          const formsList = JSON.parse(debugInfo.formsApiBody);
          const attached = formsList.find((f: ProformaFormSummary) =>
            getFormRequestTypeMatches(f, String(requestTypeId)),
          );

          debugInfo.attachedForm = attached;

          if (attached) {
            formId = String(attached.id);
            const formSchemaRes = await fetch(
              `https://api.atlassian.com/jira/forms/cloud/${cloudId}/project/${projectId}/form/${formId}`,
              {
                headers: {
                  Authorization: authCtx.authHeader,
                  Accept: "application/json",
                  "X-ExperimentalApi": "opt-in",
                },
                cache: "no-store",
              },
            );

            debugInfo.formSchemaStatus = formSchemaRes.status;

            if (formSchemaRes.ok) {
              const formData =
                (await formSchemaRes.json()) as ProformaFormSummary;
              const questionsMap = formData.design?.questions || {};
              const layout = formData.design?.layout || [];

              // Extract question IDs in exact visual layout order
              const orderedQuestionIds = extractOrderedQuestionIds(layout);
              const allQuestionIds = Object.keys(questionsMap);
              const sortedIds = [
                ...orderedQuestionIds,
                ...allQuestionIds.filter(
                  (id) => !orderedQuestionIds.includes(id),
                ),
              ];

              proformaQuestions = sortedIds
                .map((qId: string): JsmField | null => {
                  const q: ProformaQuestionItem | undefined = questionsMap[qId];
                  if (!q) return null;

                  let mappedType = q.type || "text";
                  const rawType = String(q.type).toLowerCase();
                  const normalizedType = rawType.replace(/[\s_-]/g, "");

                  if (
                    rawType === "um" ||
                    rawType === "multiuser" ||
                    (normalizedType.includes("user") && q.allowMultiple)
                  )
                    mappedType = "multi-user-picker";
                  else if (
                    ["us", "user", "userpicker"].includes(normalizedType)
                  )
                    mappedType = "user-picker";
                  else if (
                    rawType === "gm" ||
                    rawType === "multigroup" ||
                    (normalizedType.includes("group") && q.allowMultiple)
                  )
                    mappedType = "multi-group-picker";
                  else if (
                    ["gr", "group", "grouppicker"].includes(normalizedType)
                  )
                    mappedType = "group-picker";
                  else if (
                    rawType === "cm" ||
                    (rawType === "choice" && q.allowMultiple) ||
                    rawType === "checkbox"
                  )
                    mappedType = "checkbox";
                  else if (rawType === "cs" || rawType === "cascading")
                    mappedType = "cascading";
                  else if (
                    rawType === "cd" ||
                    (rawType === "choice" && !q.allowMultiple) ||
                    rawType === "dropdown" ||
                    rawType === "select"
                  )
                    mappedType = "dropdown";
                  else if (rawType === "cr" || rawType === "radio")
                    mappedType = "radio";
                  else if (
                    rawType === "pa" ||
                    rawType === "paragraph" ||
                    rawType === "textarea" ||
                    rawType === "tl"
                  )
                    mappedType = "paragraph";
                  else if (
                    rawType === "te" ||
                    rawType === "text" ||
                    rawType === "ts"
                  )
                    mappedType = "text";
                  else if (rawType === "em" || rawType === "email")
                    mappedType = "email";
                  else if (rawType === "url") mappedType = "url";
                  else if (
                    rawType === "da" ||
                    rawType === "df" ||
                    rawType === "date"
                  )
                    mappedType = "date";
                  else if (rawType === "dt" || rawType === "datetime")
                    mappedType = "datetime-local";
                  else if (rawType === "ti" || rawType === "time")
                    mappedType = "time";
                  else if (rawType === "nu" || rawType === "number")
                    mappedType = "number";
                  else if (rawType === "labels" || rawType === "tags")
                    mappedType = "labels";
                  else if (rawType === "asset" || rawType === "insight")
                    mappedType = "asset";
                  else if (
                    rawType === "at" ||
                    rawType === "file" ||
                    rawType === "attachment"
                  )
                    mappedType = "file";
                  else if (
                    rawType === "in" ||
                    rawType === "message" ||
                    rawType === "info"
                  )
                    mappedType = "info";

                  return {
                    id: qId,
                    jiraField: q.jiraField,
                    name: q.label,
                    label: q.label,
                    description: q.description || "",
                    required: Boolean(
                      q.validation?.required ?? q.validation?.rq,
                    ),
                    type: mappedType,
                    allowMultiple: q.allowMultiple,
                    choices: (q.choices || []).map((c) => ({
                      id: c.id !== undefined ? String(c.id) : undefined,
                      label: c.label || c.value || "",
                      value: c.value,
                      parentId:
                        c.parentId !== undefined
                          ? String(c.parentId)
                          : undefined,
                      children: c.children?.map((child) => ({
                        id:
                          child.id !== undefined ? String(child.id) : undefined,
                        label: child.label || child.value || "",
                        value: child.value,
                      })),
                    })),
                    source: "proforma",
                  };
                })
                .filter((item): item is JsmField => item !== null);
            } else {
              debugInfo.formSchemaBody = await formSchemaRes.text();
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("Forms retrieval skipped:", err);
      debugInfo.error = err instanceof Error ? err.message : String(err);
    }

    // 3. Merge & deduplicate Jira and ProForma fields while preserving order
    let finalFields: JsmField[] = [];

    if (proformaQuestions.length > 0) {
      const formFieldKeys = new Set(
        proformaQuestions.flatMap((q) => {
          const keys = [
            q.jiraField,
            q.id,
            q.name,
            q.label,
            q.source === "jira" ? q.id : undefined,
          ]
            .filter((value): value is string => Boolean(value))
            .map((value) => normalizeFieldKey(value));

          return keys;
        }),
      );

      const mappedStandardFields = standardFields.filter((field) => {
        const fieldKeys = [field.jiraField, field.id, field.name, field.label]
          .filter((value): value is string => Boolean(value))
          .map((value) => normalizeFieldKey(value));

        return fieldKeys.some((key) => formFieldKeys.has(key));
      });

      const remainingStandardFields = standardFields.filter(
        (field) => !mappedStandardFields.includes(field),
      );

      const summaryField = remainingStandardFields.find(
        (field) =>
          normalizeFieldKey(field.id) === "summary" ||
          normalizeFieldKey(field.name) === "summary",
      );

      const otherStandardFields = remainingStandardFields.filter(
        (field) =>
          normalizeFieldKey(field.id) !== "summary" &&
          normalizeFieldKey(field.name) !== "summary",
      );

      finalFields = [
        ...(summaryField ? [summaryField] : []),
        ...proformaQuestions,
        ...otherStandardFields,
      ];
    } else {
      // If NO ProForma form is attached:
      // Strictly PRESERVE the exact order configured in Jira Service Management
      finalFields = [...standardFields];
    }

    return NextResponse.json({ formId, fields: finalFields, debugInfo });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Field loading error:", message);
    return NextResponse.json({
      formId: null,
      fields: standardFields,
      error: message,
    });
  }
}
