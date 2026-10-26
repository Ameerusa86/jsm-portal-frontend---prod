# Production Deployment Runbook — EMSMC JSM Portal

Operational deployment procedures, environment configuration, and verification steps for the EMSMC Jira Service Management custom portal.

## 1. Atlassian Developer Console Configuration
1. Open the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/).
2. **Distribution**: Set application status to **Sharing** so internal organization accounts can authenticate via OAuth 2.0 (3LO).
3. **Authorization**: Register the production callback URL:
   ```
   https://<production-domain>/api/auth/callback/atlassian
   ```
4. **Permissions / Scopes**: Confirm the following scopes are enabled:
   - `read:me`
   - `read:jira-user`
   - `read:jira-work`
   - `write:jira-work`
   - `read:servicedesk-request`
   - `write:servicedesk-request`
   - `read:knowledgebase:jira-service-management`
   - `read:confluence-space.summary`
   - `read:confluence-content.summary`
   - `offline_access`
5. Maintain dedicated OAuth applications per tier (Development / Sandbox vs. Production) to isolate user authorization grants and client secrets.

## 2. Production Environment Variables
Configure the following environment variables in the production deployment target:

| Variable | Description | Example / Format |
|---|---|---|
| `AUTH_SECRET` | Encryption key for Auth.js sessions and JWTs. | 32+ char base64 string (`openssl rand -base64 33`) |
| `AUTH_URL` | Canonical root URL of the production deployment. | `https://portal.emsmc.com` |
| `AUTH_TRUST_HOST` | Trust upstream reverse proxy headers (`X-Forwarded-Host`, `X-Forwarded-Proto`). | `true` |
| `ATLASSIAN_CLIENT_ID` | Production OAuth 2.0 client ID from Atlassian Console. | Atlassian Client ID string |
| `ATLASSIAN_CLIENT_SECRET` | Production OAuth 2.0 client secret. | Atlassian Client Secret string |
| `JIRA_BASE_URL` | Production Atlassian Cloud instance URL. | `https://emsmc.atlassian.net` |
| `JIRA_USER_EMAIL` | Service account email used for Confluence KB body proxying. | `svc-jsm-portal@emsmc.com` |
| `JIRA_API_TOKEN` | Service account API token with Confluence read permissions. | API token string |
| `JIRA_SERVICE_DESK_ID` | Primary JSM Service Desk ID. | Numeric ID (e.g. `4`) |

## 3. Host & Runtime Requirements
- **Protocol**: HTTPS is mandatory. Atlassian OAuth rejects plain HTTP redirect URIs outside `localhost`.
- **Node.js**: Node 20+ runtime environment.
- **Request Proxy**: Next.js 16 `proxy.ts` handles all incoming route protection. Unauthenticated requests to portal routes are redirected to `/login`, while unauthorized API requests receive `401`.

## 4. Post-Deployment Verification
1. Access the production portal URL. Confirm unauthenticated sessions redirect to `/login`.
2. Select **Sign In with Atlassian** and complete OAuth authorization with the production tenant.
3. Confirm redirection lands on `/` and loads the active service desk catalog.
4. Submit a test ticket through the request catalog.
5. Confirm the generated ticket key appears in the live Jira Service Management queue.
6. Confirm sign-out clears the active session and returns to `/login`.
