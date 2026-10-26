# JSM Portal Frontend — Complete API Reference & List

Internal Application Route Handlers and External Atlassian / Jira Cloud REST APIs utilized by the portal.

---

## 1. Internal Application API Endpoints (`/api/jsm/*`)

These endpoints are implemented as Next.js Route Handlers in `app/api/` and consumed by the frontend client components.

| # | Route | Method | File Location | Purpose & Functionality |
|---|---|---|---|---|
| 1 | `/api/jsm/portal` | `GET` | `app/api/jsm/portal/route.ts` | Returns service desk portal metadata (name, project key, description, auth context status). |
| 2 | `/api/jsm/request-types` | `GET` | `app/api/jsm/request-types/route.ts` | Fetches grouped request types and categories for the main portal catalog. |
| 3 | `/api/jsm/fields/[id]` | `GET` | `app/api/jsm/fields/[id]/route.ts` | Resolves standard visible Jira fields and merges attached ProForma (Jira Forms) designs. |
| 4 | `/api/jsm/directory` | `GET` | `app/api/jsm/directory/route.ts` | Typeahead search for User Picker (`type=user`) and Group Picker (`type=group`) fields. |
| 5 | `/api/jsm/submit` | `POST` | `app/api/jsm/submit/route.ts` | Validates and submits tickets to JSM, converts fields to Jira format, attaches ProForma forms, and submits form answers. |
| 6 | `/api/jsm/tickets` | `GET` | `app/api/jsm/tickets/route.ts` | Fetches customer tickets filtered by reporter email or project JQL. |
| 7 | `/api/jsm/tickets/[id]` | `GET` | `app/api/jsm/tickets/[id]/route.ts` | Retrieves complete ticket details, SLA, status timeline, custom fields, and public customer comments. |
| 8 | `/api/jsm/tickets/[id]/comment` | `POST` | `app/api/jsm/tickets/[id]/comment/route.ts` | Adds a public customer comment or reply to an existing ticket. |
| 9 | `/api/auth/[...nextauth]` | `GET`, `POST` | `app/api/auth/[...nextauth]/route.ts` | NextAuth.js OAuth 2.0 (3LO) authentication handlers for Atlassian Cloud. |
| 10 | `/api/jsm/knowledgebase` | `GET` | `app/api/jsm/knowledgebase/route.ts` | Searches Confluence knowledge base articles linked to service desks for self-service deflection. |

---

## 2. External Atlassian Service Desk REST APIs (`/rest/servicedeskapi/*`)

Interactions with Jira Service Management service desks, request types, customer requests, and comments.

| # | Jira Cloud Endpoint | Method | Used In | Purpose | Upstream Reference |
|---|---|---|---|---|---|
| 1 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}` | `GET` | `app/api/jsm/fields/[id]/route.ts` | Resolves the underlying `projectId` from `serviceDeskId`. | [Get Service Desk](https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/#about) |
| 2 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttypegroup` | `GET` | `app/api/jsm/request-types/route.ts` | Retrieves request type categories/groups. | [Get Request Type Groups](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-servicedesk/#api-rest-servicedeskapi-servicedesk-servicedeskid-requesttypegroup-get) |
| 3 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype` | `GET` | `app/api/jsm/request-types/route.ts` | Fetches all active request types for the service desk catalog. | [Get Request Types](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-servicedesk/#api-rest-servicedeskapi-servicedesk-servicedeskid-requesttype-get) |
| 4 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/field` | `GET` | `app/api/jsm/fields/[id]/route.ts` | Fetches standard visible request type fields, validation schemas, and valid choices. | [Get Request Type Fields](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-servicedesk/#api-rest-servicedeskapi-servicedesk-servicedeskid-requesttype-requesttypeid-field-get) |
| 5 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}/user?query={query}` | `GET` | `app/api/jsm/directory/route.ts` | Directory search fallback to find Service Desk customers. | [Get Customers](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-servicedesk/#api-rest-servicedeskapi-servicedesk-servicedeskid-user-get) |
| 6 | `/rest/servicedeskapi/request` | `POST` | `app/api/jsm/submit/route.ts` | Creates a new customer ticket with `requestFieldValues` and optional `raiseOnBehalfOf`. | [Create Request](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-request/#api-rest-servicedeskapi-request-post) |
| 7 | `/rest/servicedeskapi/request/{issueIdOrKey}` | `GET` | `app/api/jsm/tickets/[id]/route.ts` | Fetches ticket summary, SLA metrics, current status, and reporter details. | [Get Request](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-request/#api-rest-servicedeskapi-request-issueidorkey-get) |
| 8 | `/rest/servicedeskapi/request/{issueIdOrKey}/status` | `GET` | `app/api/jsm/tickets/[id]/route.ts` | Fetches customer-facing status transition history. | [Get Status History](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-request/#api-rest-servicedeskapi-request-issueidorkey-status-get) |
| 9 | `/rest/servicedeskapi/request/{issueIdOrKey}/comment` | `GET` | `app/api/jsm/tickets/[id]/route.ts` | Retrieves public customer comments on a ticket. | [Get Comments](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-request/#api-rest-servicedeskapi-request-issueidorkey-comment-get) |
| 10 | `/rest/servicedeskapi/request/{issueIdOrKey}/comment` | `POST` | `app/api/jsm/tickets/[id]/comment/route.ts` | Posts a public comment to the ticket (`{ body, public: true }`). | [Add Comment](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-request/#api-rest-servicedeskapi-request-issueidorkey-comment-post) |
| 11 | `/rest/servicedeskapi/info` | `GET` | `lib/jira.ts` | Service Desk API connectivity check. | [Get Info](https://developer.atlassian.com/cloud/jira/service-desk/rest/api-group-info/#api-rest-servicedeskapi-info-get) |
| 12 | `/rest/servicedeskapi/servicedesk/{serviceDeskId}/knowledgebase/article` | `GET` | `app/api/jsm/knowledgebase/route.ts` | Searches for knowledge base articles linked to the service desk. | [Get Articles](https://developer.atlassian.com/cloud/jira/service-management/rest/api-group-knowledgebase/) |

---

## 3. External Jira Cloud Platform REST APIs (`/rest/api/3/*`)

Directory lookups, JQL ticket queries, and issue metadata resolution.

| # | Jira Cloud Endpoint | Method | Used In | Purpose | Upstream Reference |
|---|---|---|---|---|---|
| 1 | `/rest/api/3/user/picker?query={query}&showAvatar=true` | `GET` | `app/api/jsm/directory/route.ts` | Primary typeahead search for User Picker fields (returns avatar URLs, display names, `accountId`). | [Find Users for Picker](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-user-search/#api-rest-api-3-user-picker-get) |
| 2 | `/rest/api/3/user/search?query={query}` | `GET` | `app/api/jsm/directory/route.ts` | Fallback search for Jira users and assignees. | [Find Users](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-user-search/#api-rest-api-3-user-search-get) |
| 3 | `/rest/api/3/group/picker?query={query}` | `GET` | `app/api/jsm/directory/route.ts` | Typeahead search for Jira IAM and Security Group picker fields. | [Find Groups](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-groups/#api-rest-api-3-group-picker-get) |
| 4 | `/rest/api/3/search/jql?jql={jql}` | `GET` | `app/api/jsm/tickets/route.ts` | Jira Cloud v3 JQL ticket queries (e.g. `reporter = 'user@email.com' ORDER BY created DESC`). | [Search JQL (POST/GET)](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/) |
| 5 | `/rest/api/3/search?jql={jql}` | `GET` | `app/api/jsm/tickets/route.ts` | Standard JQL query fallback endpoint. | [Search Issues](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-get) |
| 6 | `/rest/api/3/issue/{issueIdOrKey}` | `GET` | `app/api/jsm/tickets/[id]/route.ts` | Detailed issue metadata resolution (status category, custom fields, components, attachments). | [Get Issue](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-get) |
| 7 | `/_edge/tenant_info` | `GET` | `lib/jira.ts` | Resolves Jira Cloud ID (`cloudId`) when running in OAuth context. | Atlassian Identity Edge |

---

## 4. External Atlassian Forms (ProForma) Cloud APIs

Dynamic form rendering and structured form submissions attached to request types.

| # | ProForma Cloud Endpoint | Method | Used In | Purpose | Upstream Reference |
|---|---|---|---|---|---|
| 1 | `https://api.atlassian.com/jira/forms/cloud/{cloudId}/project/{projectId}/form` | `GET` | `app/api/jsm/fields/[id]/route.ts` | Lists all ProForma forms in the project and identifies attached request types. | [Forms Cloud API](https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/) |
| 2 | `https://api.atlassian.com/jira/forms/cloud/{cloudId}/project/{projectId}/form/{formId}` | `GET` | `app/api/jsm/fields/[id]/route.ts` | Fetches full form design schema (questions, layouts, choices, conditional logic, types). | [Forms Cloud API](https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/) |
| 3 | `https://api.atlassian.com/jira/forms/cloud/{cloudId}/issue/{issueIdOrKey}/form` | `POST` | `app/api/jsm/submit/route.ts` | Attaches a form template to a newly created ticket (`{ formTemplate: { id: formId } }`). | [Forms Cloud API](https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/) |
| 4 | `https://api.atlassian.com/jira/forms/cloud/{cloudId}/issue/{issueIdOrKey}/form/{formId}/answers` | `PUT` | `app/api/jsm/submit/route.ts` | Submits structured question answers (`answers: { [qId]: { text, choices, users, date, time } }`). | [Forms Cloud API](https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/) |

---

## 5. Supported Field Format Payload Mappings

| Field Format | JSM Schema Type / ProForma Code | Standard Jira Format (`requestFieldValues`) | ProForma Answers Format (`answers`) |
|---|---|---|---|
| **Single User Picker** | `user` / `us` | `{ accountId: "usr-1001" }` | `{ users: ["usr-1001"] }` |
| **Multi User Picker** | `array<user>` / `um` | `[{ accountId: "usr-1001" }, { accountId: "usr-1002" }]` | `{ users: ["usr-1001", "usr-1002"] }` |
| **Single Group Picker** | `group` / `gr` | `{ name: "engineering-team" }` | `{ groups: ["engineering-team"] }` |
| **Multi Group Picker** | `array<group>` / `gm` | `[{ name: "grp-1" }, { name: "grp-2" }]` | `{ groups: ["grp-1", "grp-2"] }` |
| **Cascading Select** | `cascadingselect` / `cs` | `{ id: "parent_id", child: { id: "child_id" } }` | `{ choices: ["parent_id", "child_id"] }` |
| **Single Choice / Dropdown** | `option` / `cd` | `{ id: "opt_101" }` | `{ choices: ["opt_101"] }` |
| **Radio Buttons** | `radiobuttons` / `cr` | `{ id: "opt_101" }` | `{ choices: ["opt_101"] }` |
| **Checkboxes / Multi-Select** | `array<option>` / `cm` | `[{ id: "opt_1" }, { id: "opt_2" }]` | `{ choices: ["opt_1", "opt_2"] }` |
| **Labels / Tags** | `array<string>` / `labels` | `["security", "cloud", "audit"]` | `{ choices: ["security", "cloud"] }` |
| **Date Picker** | `date` / `da`, `df` | `"2026-09-01"` | `{ date: "2026-09-01" }` |
| **DateTime Picker** | `datetime` / `dt` | `"2026-09-01T14:30:00.000Z"` | `{ text: "2026-09-01T14:30" }` |
| **Time Picker** | `time` / `ti` | `"14:30"` | `{ time: "14:30" }` |
| **Number** | `number` / `nu` | `42` | `{ number: 42, text: "42" }` |
| **Email** | `email` / `em` | `"user@enterprise.com"` | `{ text: "user@enterprise.com" }` |
| **URL** | `url` / `url` | `"https://status.company.com"` | `{ text: "https://..." }` |
| **Asset / Insight** | `asset` / `cmdb` | `[{ key: "AST-10021" }]` | `{ text: "AST-10021" }` |
| **Paragraph / Textarea** | `textarea` / `pa`, `tl` | `"Detailed multi-line description..."` | `{ text: "..." }` |
| **Text (Single Line)** | `string` / `te`, `ts` | `"Summary text"` | `{ text: "..." }` |
| **File Upload** | `attachment` / `at` | Uploaded via attachment pipeline | Attachment ID |
| **Info / Banner** | `info` / `in`, `message` | Client-side visual callout box | N/A |
