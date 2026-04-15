export type SyncDirection = "wix_to_hubspot" | "hubspot_to_wix" | "bidirectional";
export type SyncSource = "wix" | "hubspot";

export interface FieldMapping {
  id: string;
  wixField: string;
  hubspotProperty: string;
  direction: SyncDirection;
  transform?: "trim" | "lowercase" | "none";
}

export interface ContactIdMap {
  id: string;
  wixContactId: string;
  hubspotContactId: string;
  lastSyncSource: SyncSource;
  lastSyncId: string;
  lastSyncTimestamp: string;
  dataHash: string;
}

export interface SyncLog {
  id: string;
  eventType: "contact_sync" | "form_capture";
  source: SyncSource;
  syncId: string;
  wixContactId?: string;
  hubspotContactId?: string;
  status: "success" | "error" | "skipped";
  details: string;
  timestamp: string;
}

export interface FormEvent {
  id: string;
  formId: string;
  submissionId: string;
  email: string;
  hubspotContactId?: string;
  utmData: string;
  status: "success" | "error";
  timestamp: string;
}

export interface AppCollections {
  contactIdMap: ContactIdMap[];
  fieldMappings: FieldMapping[];
  syncLog: SyncLog[];
  formEvents: FormEvent[];
}

export interface ContactPayload {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  updatedAt: string;
  fields: Record<string, unknown>;
}
