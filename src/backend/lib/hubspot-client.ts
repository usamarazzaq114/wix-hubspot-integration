import axios, { AxiosInstance } from "axios";
import crypto from "node:crypto";
import { tokenManager } from "./token-manager";

const HUBSPOT_API = "https://api.hubapi.com";
const HUBSPOT_OAUTH = "https://api.hubapi.com/oauth/v1/token";

export interface HubSpotTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class HubSpotClient {
  private client: AxiosInstance;

  constructor(private readonly instanceId: string) {
    this.client = axios.create({ baseURL: HUBSPOT_API, timeout: 20000 });
  }

  private async getAccessToken(): Promise<string> {
    const current = tokenManager.get(this.instanceId);
    if (!current) {
      throw new Error("HubSpot not connected.");
    }
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() < current.expiresAt - fiveMinutes) {
      return current.accessToken;
    }
    const refreshed = await this.refreshToken(current.refreshToken);
    tokenManager.store(this.instanceId, {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || current.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000
    });
    return refreshed.access_token;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<HubSpotTokens> {
    const response = await axios.post(
      HUBSPOT_OAUTH,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID || "",
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        code
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data as HubSpotTokens;
  }

  async refreshToken(refreshToken: string): Promise<HubSpotTokens> {
    const response = await axios.post(
      HUBSPOT_OAUTH,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.HUBSPOT_CLIENT_ID || "",
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
        refresh_token: refreshToken
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data as HubSpotTokens;
  }

  async getContactProperties(): Promise<Array<{ name: string; label: string }>> {
    const token = await this.getAccessToken();
    const response = await this.client.get("/crm/v3/properties/contacts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return (response.data.results || []).map((item: { name: string; label?: string }) => ({
      name: item.name,
      label: item.label || item.name
    }));
  }

  async upsertContactByEmail(email: string, properties: Record<string, unknown>): Promise<string> {
    const token = await this.getAccessToken();
    try {
      const existing = await this.client.post(
        "/crm/v3/objects/contacts/search",
        { filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }], limit: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (existing.data.total > 0) {
        const id = existing.data.results[0].id as string;
        await this.client.patch(
          `/crm/v3/objects/contacts/${id}`,
          { properties },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return id;
      }
    } catch {
      // fallback to create
    }
    const created = await this.client.post(
      "/crm/v3/objects/contacts",
      { properties },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return created.data.id as string;
  }

  async updateContact(contactId: string, properties: Record<string, unknown>): Promise<void> {
    const token = await this.getAccessToken();
    await this.client.patch(
      `/crm/v3/objects/contacts/${contactId}`,
      { properties },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}

export function verifyHubSpotWebhookSignature(
  signature: string | undefined,
  requestBody: string,
  requestUrl: string
): boolean {
  if (!signature) return false;
  const secret = process.env.HUBSPOT_CLIENT_SECRET || "";
  const raw = `${secret}${requestBody}${requestUrl}`;
  const digest = crypto.createHash("sha256").update(raw, "utf8").digest("hex");
  return digest === signature;
}
