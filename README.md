# Wix ↔ HubSpot Integration (Self-Hosted)

This project implements the assignment using a self-hosted app architecture compatible with Wix integration patterns.

## Features implemented

- OAuth connect/disconnect flow for HubSpot.
- Secure backend token storage (encrypted in-process secret vault abstraction).
- Configurable Wix-to-HubSpot field mappings with validation.
- Bi-directional contact sync engine with:
  - external ID mapping (`wixContactId ↔ hubspotContactId`)
  - source tracking (`wix` or `hubspot`)
  - dedupe window (5 seconds)
  - idempotency hash (skip identical payloads)
- Wix form submission capture to HubSpot with attribution fields:
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
  - `page_url`, `referrer`, `captured_at`
- Observability log for form events.
- Protected sync endpoints via `x-api-token`.

## APIs used

### Feature #1: Bi-directional contact sync

- Wix contacts webhook trigger endpoint (self-hosted receiver): `POST /api/events/wix-contact-updated`
- HubSpot webhook receiver endpoint: `POST /api/hubspot-webhook`
- HubSpot CRM Contacts API:
  - `POST /crm/v3/objects/contacts/search`
  - `POST /crm/v3/objects/contacts`
  - `PATCH /crm/v3/objects/contacts/{id}`
- HubSpot Properties API:
  - `GET /crm/v3/properties/contacts`
- Persistence collections:
  - `contactIdMap`, `fieldMappings`, `syncLog`, `formEvents` (in `storage/app-data.json`)

### Feature #2: Form & lead capture

- Wix form submission trigger endpoint (self-hosted receiver): `POST /api/events/wix-form-submitted`
- HubSpot contact upsert via CRM Contacts API (`search + create/update`)
- UTM and attribution mapping persisted as HubSpot contact properties payload

### Security and connection

- HubSpot OAuth endpoints:
  - authorize URL: `https://app.hubspot.com/oauth/authorize`
  - token exchange/refresh: `https://api.hubapi.com/oauth/v1/token`
- Backend-only token handling and encryption at rest in app process memory abstraction.
- Sync and mapping APIs require `x-api-token` authentication.

## Project structure

- `src/backend/api/hubspot-oauth/api.ts`: OAuth connect/callback/disconnect/status
- `src/backend/api/hubspot-webhook/api.ts`: inbound HubSpot webhook events
- `src/backend/events/contacts/events.ts`: Wix contact update event handling
- `src/backend/events/forms/events.ts`: Wix form submission event handling
- `src/backend/lib/hubspot-client.ts`: HubSpot API wrapper + webhook signature helper
- `src/backend/lib/sync-engine.ts`: bi-directional sync with loop prevention
- `src/backend/lib/data-store.ts`: collection persistence
- `src/backend/lib/token-manager.ts`: encrypted token manager
- `src/data/extensions.ts`: collection definitions
- `src/server.ts`: dashboard pages + API routes

## Local run

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   - `npm install`
3. Run server:
   - `npm run dev`
4. Open:
   - `http://localhost:3000/dashboard/connect`
   - `http://localhost:3000/dashboard/field-mapping`

## API auth

Send `x-api-token: <APP_API_TOKEN>` header to:

- `GET /api/mappings`
- `POST /api/mappings`
- `POST /api/events/wix-contact-updated`
- `POST /api/events/wix-form-submitted`
- `GET /api/observability/forms`

## Test identity for connection

- Test username: `demo_hubspot_wix_user`

## Wix direct import helper

Use:
- `WIX_IMPORT_CHECKLIST.md`
- `wix/self-hosted-app-values.template.md`

These files contain exact URL mappings and field values to configure the app in Wix Developer Center for installation on a Wix site.

## Deploy on Render

This repository includes `render.yaml` for Blueprint deploy.

1. Open [Render Blueprint New](https://dashboard.render.com/blueprints/new).
2. Connect GitHub and select this repo:
   - `usamarazzaq114/wix-hubspot-integration`
3. Render reads `render.yaml` automatically.
4. In environment variables, set:
   - `HUBSPOT_CLIENT_ID`
   - `HUBSPOT_CLIENT_SECRET`
   - `HUBSPOT_REDIRECT_URI` = `https://<your-render-domain>/api/hubspot-oauth/callback`
5. Deploy.
6. Verify:
   - `https://<your-render-domain>/health`
   - `https://<your-render-domain>/dashboard/connect`
   - `https://<your-render-domain>/dashboard/field-mapping`

After deploy, use the Render base URL in Wix using `WIX_IMPORT_CHECKLIST.md`.
