# Wix Self-Hosted App Values Template

Copy these values into Wix Developer Center fields when configuring your app.

## Core

- App type: `Self-hosted`
- App name: `HubSpot Contact Sync`
- Base URL: `https://your-app-domain.com`

## Dashboard URLs

- Connection page URL: `https://your-app-domain.com/dashboard/connect`
- Field mapping page URL: `https://your-app-domain.com/dashboard/field-mapping`

## OAuth

- Provider: `HubSpot`
- Redirect URL: `https://your-app-domain.com/api/hubspot-oauth/callback`

## Webhooks / Event endpoints

- HubSpot webhook endpoint: `https://your-app-domain.com/api/hubspot-webhook`
- Wix contact event receiver: `https://your-app-domain.com/api/events/wix-contact-updated`
- Wix form event receiver: `https://your-app-domain.com/api/events/wix-form-submitted`

## Required header for protected endpoints

- Header key: `x-api-token`
- Header value: `<APP_API_TOKEN>`

## HubSpot scopes

- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.schemas.contacts.read`
