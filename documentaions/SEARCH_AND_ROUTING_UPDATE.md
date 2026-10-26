# JSM Portal Architecture: Global Search & Deflection Routing

Technical specification for the Confluence Query Language (CQL) search integration and label-based ticket deflection routing.

## 1. Confluence Query Language (CQL) Search Engine

Knowledge Base search queries Confluence Cloud directly via CQL (`/wiki/rest/api/content/search`) rather than maintaining a local search index or relying on client-side fuzzy matching libraries.

### Design Details
- **Native Relevance & Stemming**: Confluence handles text tokenization, language stemming, and relevance ranking upstream, avoiding desynchronized local indexes.
- **Payload Optimization**: Search requests query with `expand=space,version` to retrieve metadata without loading heavy rendered HTML bodies (`body.view.value`) during search. Full article bodies are fetched on-demand only when a user navigates to `/article/[id]`.
- **Targeted Query Construction**: Queries filter on article titles and full-text indexes (`title ~ "..." OR siteSearch ~ "..."`), preventing noisy single-word matches.
- **Governance Filtering**: Internal audit, legal, and compliance spaces (`audit`, `legal`, `soc2`, `compliance`) are explicitly excluded from user search queries.

## 2. Label-Based Ticket Routing (`rt-[id]`)

### Problem
Native Jira Service Management portals frequently disconnect article viewing from form submission: when an article fails to resolve a user issue, users must navigate back to the root catalog and search for the corresponding request form.

### Deflection Architecture
The portal establishes a direct 1:1 bridge between troubleshooting articles and target ticket forms using Confluence metadata labels:

1. **User Search**: The user enters a natural-language query in the search bar (e.g. *"vpn connection failure"*).
2. **Article Navigation**: The search returns matching Confluence articles. Selecting an article loads the rendered troubleshooting guide at `/article/[id]`.
3. **Escalation Trigger**: If the article does not resolve the issue, a persistent action at the bottom of the article offers **"Submit a Ticket"**.
4. **Direct Form Routing**: Clicking the action bypasses catalog browsing and opens the specific ticket form associated with that issue.

### Metadata Implementation
Articles in Confluence are tagged with an internal label following the format:
```
rt-<requestTypeId>
```
*Example: `rt-45` maps the article directly to Request Type `45`.*

When `/article/[id]` fetches article metadata from Confluence:
1. It parses `metadata.labels`.
2. It extracts the `rt-` identifier regex (`/^rt-(\d+)$/i`).
3. If an `rt-[id]` label is present, the escalation button links to `/?request=<requestTypeId>` (or opens the form directly).
4. If no label is present, the button falls back to the main portal catalog.

## 3. High-Deflection Category Mapping

Standard label mapping for high-volume deflection categories:

| Support Domain | Common Deflection Articles | Confluence Label Format |
|---|---|---|
| VPN & Network Access | GlobalProtect / Cisco VPN Setup | `rt-<vpn_request_type_id>` |
| Account & Password | Okta / Active Directory Self-Reset | `rt-<password_request_type_id>` |
| Hardware Issues | Laptop Docking / Monitor Troubleshooting | `rt-<hardware_request_type_id>` |
| Software & Access | Cloud & SaaS License Requests | `rt-<software_request_type_id>` |

### Article Configuration Steps
1. Identify the target Request Type ID from the JSM portal URL or the `/api/jsm/request-types` endpoint.
2. Edit the troubleshooting article in Confluence.
3. Add the label `rt-<id>` (e.g. `rt-101`) to the article labels.
4. Publish the article. The portal immediately maps the escalation action to the designated form.
