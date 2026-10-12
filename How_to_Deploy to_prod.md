# EMSMC IT - Jira Service Management Custom Portal

This repository contains the Next.js custom frontend portal for EMSMC IT, built using Atlassian's REST APIs and Auth.js for OAuth 2.0 (3LO) authentication. 

## 1. Atlassian Developer Console Preparation
* Navigate to the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/).
* Select the **Distribution** tab and change the app's status from private to "Sharing" to allow internal employee authentication.
* Under the **Authorization** menu, update the Callback URL to your production domain (e.g., `https://your-portal-domain.com/api/auth/callback/atlassian`). 
* Verify under the **Permissions** tab that the necessary Classic Scopes (`read:me`, `write:servicedesk-request`, `read:confluence-content.summary`, `offline_access`) are active.
* Create a completely separate OAuth app in the console for your production environment to keep development and production user bases isolated.

## 2. Next.js Production Environment Variables
Set the following environment variables in your production hosting provider's secure dashboard before building the application:

* `AUTH_SECRET`: A cryptographically secure random string used to encrypt session data. Generate this via terminal using `openssl rand -base64 33` or `npm exec auth secret`.
* `AUTH_URL`: The absolute canonical URL of your production deployment (e.g., `https://your-portal-domain.com`).
* `ATLASSIAN_CLIENT_ID`: The public identifier for your production Atlassian OAuth app.
* `ATLASSIAN_CLIENT_SECRET`: The secure token for your production Atlassian OAuth app.
* `JSM_SERVICE_DESK_ID`: The numeric ID for your active production JSM instance.
* `JSM_REQUEST_TYPE_ID`: The numeric ID for the specific ticket type in production.
* `AUTH_TRUST_HOST`: Set this to `true` if your production application is deployed behind a reverse proxy (this ensures proxy headers like `X-Forwarded-Host` are trusted by Auth.js).

## 3. Deployment & Hosting Configuration
* Deploy your application to your chosen platform (e.g., Vercel, AWS, Azure, Cloudflare Pages). 
* Ensure your application is served over HTTPS, as Atlassian OAuth providers will reject non-HTTPS redirect URIs in production.
* Ensure your `middleware.ts` is configured to intercept and protect ticketing and dashboard routes so unauthenticated traffic is redirected to the login page.

## 4. Production Smoke Testing
* Navigate to your live production URL and click login to initiate the OAuth flow.
* On the Atlassian consent screen, explicitly select your **production** JSM environment from the site dropdown.
* Submit a test ticket through the Next.js UI.
* Confirm that the generated issue key matches the live JSM project queues.