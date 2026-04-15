import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { AppCollections, ContactIdMap, FieldMapping, FormEvent, SyncLog } from "../../types";

const DB_PATH = process.env.APP_DB_PATH || "storage/app-data.json";

const defaultDb: AppCollections = {
  contactIdMap: [],
  fieldMappings: [
    { id: uuidv4(), wixField: "email", hubspotProperty: "email", direction: "bidirectional", transform: "none" },
    { id: uuidv4(), wixField: "firstName", hubspotProperty: "firstname", direction: "bidirectional", transform: "trim" },
    { id: uuidv4(), wixField: "lastName", hubspotProperty: "lastname", direction: "bidirectional", transform: "trim" },
    { id: uuidv4(), wixField: "phone", hubspotProperty: "phone", direction: "bidirectional", transform: "trim" }
  ],
  syncLog: [],
  formEvents: []
};

function ensureDb(): void {
  const parent = dirname(DB_PATH);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

function readDb(): AppCollections {
  ensureDb();
  return JSON.parse(readFileSync(DB_PATH, "utf8")) as AppCollections;
}

function writeDb(db: AppCollections): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export const dataStore = {
  getMappings(): FieldMapping[] {
    return readDb().fieldMappings;
  },
  saveMappings(mappings: FieldMapping[]): void {
    const db = readDb();
    db.fieldMappings = mappings;
    writeDb(db);
  },
  findMapByWixId(wixContactId: string): ContactIdMap | undefined {
    return readDb().contactIdMap.find((item) => item.wixContactId === wixContactId);
  },
  findMapByHubSpotId(hubspotContactId: string): ContactIdMap | undefined {
    return readDb().contactIdMap.find((item) => item.hubspotContactId === hubspotContactId);
  },
  upsertIdMap(entry: ContactIdMap): void {
    const db = readDb();
    const index = db.contactIdMap.findIndex(
      (item) => item.wixContactId === entry.wixContactId || item.hubspotContactId === entry.hubspotContactId
    );
    if (index >= 0) {
      db.contactIdMap[index] = entry;
    } else {
      db.contactIdMap.push(entry);
    }
    writeDb(db);
  },
  addSyncLog(record: SyncLog): void {
    const db = readDb();
    db.syncLog.unshift(record);
    db.syncLog = db.syncLog.slice(0, 5000);
    writeDb(db);
  },
  addFormEvent(record: FormEvent): void {
    const db = readDb();
    db.formEvents.unshift(record);
    db.formEvents = db.formEvents.slice(0, 2000);
    writeDb(db);
  },
  getFormEvents(): FormEvent[] {
    return readDb().formEvents;
  }
};
