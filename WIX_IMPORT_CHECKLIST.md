# Wix Import and Install Checklist (Self-Hosted App)

This guide gives you the exact values and flow to register this project in Wix Developer Center and install it on a Wix site.

## 1) Deploy this app first

Deploy the server from this repo to a public HTTPS URL.

Required base URL format:
- `https://your-app-domain.com`

After deploy, verify these URLs respond:
- `GET https://your-app-domain.com/dashboard/connect`
- `GET https://your-app-domain.com/dashboard/field-mapping`
- `GET https://your-app-domain.com/api/hubspot-oauth/status`

## 2) Set production environment variables

Use `.env.example` as source and set:
- `PORT`
- `APP_INSTANCE_ID`
- `APP_API_TOKEN` (long random token)
- `APP_ENCRYPTION_SECRET` (32+ chars)
- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_REDIRECT_URI=https://your-app-domain.com/api/hubspot-oauth/callback`

## 3) Create Wix self-hosted app

In Wix Developer Center:
- Create New App
- App type: **Self-hosted**
- Save the generated Wix App ID

Use this naming:
- App name: `HubSpot Contact Sync`
- Test account user: `demo_hubspot_wix_user`

## 4) Configure app URLs in Wix

Set the following URLs:

- Dashboard connect page URL:
  - `https://your-app-domain.com/dashboard/connect`
- Dashboard field mapping page URL:
  - `https://your-app-domain.com/dashboard/field-mapping`
- OAuth callback URL:
  - `https://your-app-domain.com/api/hubspot-oauth/callback`
- HubSpot webhook URL:
  - `https://your-app-domain.com/api/hubspot-webhook`

## 5) Register HubSpot OAuth app settings

In HubSpot developer app:
- Redirect URL:
  - `https://your-app-domain.com/api/hubspot-oauth/callback`
- Required scopes:
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
  - `crm.schemas.contacts.read`

Copy HubSpot client credentials into your deployment environment variables.

## 6) Configure Wix event/webhook routing

For Wix-side events, route to these endpoints (your middleware or Wix event config):

- Wix contact updated/created event ->  
  `POST https://your-app-domain.com/api/events/wix-contact-updated`
- Wix form submission created event ->  
  `POST https://your-app-domain.com/api/events/wix-form-submitted`

Include header:
- `x-api-token: <APP_API_TOKEN>`

## 7) Install app on a Wix test site

In Wix Developer Center:
- Open your app
- Choose **Test on site / Install**
- Select target Wix site
- Install

After install:
- Open app dashboard page
- Connect HubSpot account
- Open field mapping page and save mappings

## 8) Smoke-test after install

1. Create/update a contact in Wix.
2. Confirm it appears/updates in HubSpot.
3. Trigger HubSpot contact change and verify callback path processes event.
4. Submit a Wix form and verify UTM fields appear in HubSpot contact properties.
5. Confirm no ping-pong loop on single update.

## 9) Required API endpoints in this repo

- `GET /dashboard/connect`
- `GET /dashboard/field-mapping`
- `GET /api/hubspot-oauth/connect`
- `GET /api/hubspot-oauth/callback`
- `POST /api/hubspot-oauth/disconnect`
- `GET /api/hubspot-oauth/status`
- `POST /api/hubspot-webhook`
- `POST /api/events/wix-contact-updated` (requires `x-api-token`)
- `POST /api/events/wix-form-submitted` (requires `x-api-token`)
- `GET /api/mappings` (requires `x-api-token`)
- `POST /api/mappings` (requires `x-api-token`)
- `GET /api/observability/forms` (requires `x-api-token`)
