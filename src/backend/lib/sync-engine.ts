import { v4 as uuidv4 } from "uuid";
import { ContactPayload, SyncSource } from "../../types";
import { dataStore } from "./data-store";
import { hashPayload, mapHubSpotToWix, mapWixToHubSpot } from "./field-mapper";
import { HubSpotClient } from "./hubspot-client";

const DEDUPE_MS = 5000;

export interface WixContactsAdapter {
  upsertContact(payload: Record<string, unknown>, externalId?: string): Promise<string>;
}

export class SyncEngine {
  constructor(
    private readonly hubSpotClient: HubSpotClient,
    private readonly wixContactsAdapter: WixContactsAdapter,
    private readonly instanceId: string
  ) {}

  private shouldSkipOwnEcho(lastSource: SyncSource, lastTimestamp: string): boolean {
    return Date.now() - new Date(lastTimestamp).getTime() <= DEDUPE_MS && lastSource !== "wix";
  }

  async syncFromWix(contact: ContactPayload): Promise<void> {
    const mappings = dataStore.getMappings();
    const mapped = mapWixToHubSpot(contact.fields, mappings);
    const dataHash = hashPayload(mapped);
    const current = dataStore.findMapByWixId(contact.id);

    if (current) {
      if (current.dataHash === dataHash) return;
      if (this.shouldSkipOwnEcho(current.lastSyncSource, current.lastSyncTimestamp)) return;
    }

    const hubspotId = current?.hubspotContactId
      ? (await this.hubSpotClient.updateContact(current.hubspotContactId, mapped), current.hubspotContactId)
      : await this.hubSpotClient.upsertContactByEmail(String(mapped.email || contact.email || ""), mapped);

    const syncId = uuidv4();
    dataStore.upsertIdMap({
      id: current?.id || uuidv4(),
      wixContactId: contact.id,
      hubspotContactId: hubspotId,
      lastSyncSource: "wix",
      lastSyncId: syncId,
      lastSyncTimestamp: new Date().toISOString(),
      dataHash
    });
    dataStore.addSyncLog({
      id: uuidv4(),
      eventType: "contact_sync",
      source: "wix",
      syncId,
      wixContactId: contact.id,
      hubspotContactId: hubspotId,
      status: "success",
      details: "Synced from Wix to HubSpot.",
      timestamp: new Date().toISOString()
    });
  }

  async syncFromHubSpot(contactId: string, hubspotFields: Record<string, unknown>): Promise<void> {
    const mappings = dataStore.getMappings();
    const mapped = mapHubSpotToWix(hubspotFields, mappings);
    const dataHash = hashPayload(mapped);
    const current = dataStore.findMapByHubSpotId(contactId);

    if (current) {
      const recentlyWix = Date.now() - new Date(current.lastSyncTimestamp).getTime() <= DEDUPE_MS;
      if (current.dataHash === dataHash) return;
      if (recentlyWix && current.lastSyncSource === "wix") return;
    }

    const wixId = await this.wixContactsAdapter.upsertContact(mapped, current?.wixContactId);
    const syncId = uuidv4();
    dataStore.upsertIdMap({
      id: current?.id || uuidv4(),
      wixContactId: wixId,
      hubspotContactId: contactId,
      lastSyncSource: "hubspot",
      lastSyncId: syncId,
      lastSyncTimestamp: new Date().toISOString(),
      dataHash
    });
    dataStore.addSyncLog({
      id: uuidv4(),
      eventType: "contact_sync",
      source: "hubspot",
      syncId,
      wixContactId: wixId,
      hubspotContactId: contactId,
      status: "success",
      details: "Synced from HubSpot to Wix.",
      timestamp: new Date().toISOString()
    });
  }

  async captureWixFormSubmission(payload: {
    formId: string;
    submissionId: string;
    email: string;
    fields: Record<string, unknown>;
    utm: Record<string, unknown>;
  }): Promise<string> {
    const mapped = {
      ...payload.fields,
      ...payload.utm
    };
    const hubspotId = await this.hubSpotClient.upsertContactByEmail(payload.email, mapped);
    dataStore.addFormEvent({
      id: uuidv4(),
      formId: payload.formId,
      submissionId: payload.submissionId,
      email: payload.email,
      hubspotContactId: hubspotId,
      utmData: JSON.stringify(payload.utm),
      status: "success",
      timestamp: new Date().toISOString()
    });
    return hubspotId;
  }
}
