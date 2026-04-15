import { Router } from "express";
import { HubSpotClient } from "../../lib/hubspot-client";
import { tokenManager } from "../../lib/token-manager";

export function createHubSpotOAuthRouter(instanceId: string): Router {
  const router = Router();
  const client = new HubSpotClient(instanceId);

  router.get("/connect", (_req, res) => {
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || "http://localhost:3000/api/hubspot-oauth/callback";
    const params = new URLSearchParams({
      client_id: process.env.HUBSPOT_CLIENT_ID || "",
      redirect_uri: redirectUri,
      scope: [
        "crm.objects.contacts.read",
        "crm.objects.contacts.write",
        "crm.schemas.contacts.read"
      ].join(" "),
      response_type: "code"
    });
    res.json({ authorizeUrl: `https://app.hubspot.com/oauth/authorize?${params.toString()}` });
  });

  router.get("/callback", async (req, res) => {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).json({ error: "Missing OAuth code." });
    try {
      const redirectUri = process.env.HUBSPOT_REDIRECT_URI || "http://localhost:3000/api/hubspot-oauth/callback";
      const tokens = await client.exchangeCode(code, redirectUri);
      tokenManager.store(instanceId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000
      });
      res.redirect("/dashboard/connect?connected=1");
    } catch {
      res.status(500).json({ error: "OAuth exchange failed." });
    }
  });

  router.post("/disconnect", (_req, res) => {
    tokenManager.remove(instanceId);
    res.json({ ok: true });
  });

  router.get("/status", (_req, res) => {
    res.json({ connected: Boolean(tokenManager.get(instanceId)) });
  });

  return router;
}
