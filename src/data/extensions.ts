export const collectionDefinitions = {
  contactIdMap: {
    fields: [
      { key: "wixContactId", type: "TEXT", indexed: true },
      { key: "hubspotContactId", type: "TEXT", indexed: true },
      { key: "lastSyncSource", type: "TEXT" },
      { key: "lastSyncId", type: "TEXT" },
      { key: "lastSyncTimestamp", type: "DATE" },
      { key: "dataHash", type: "TEXT" }
    ]
  },
  fieldMappings: {
    fields: [
      { key: "wixField", type: "TEXT" },
      { key: "hubspotProperty", type: "TEXT" },
      { key: "direction", type: "TEXT" },
      { key: "transform", type: "TEXT" }
    ]
  },
  syncLog: {
    fields: [
      { key: "eventType", type: "TEXT" },
      { key: "source", type: "TEXT" },
      { key: "syncId", type: "TEXT" },
      { key: "wixContactId", type: "TEXT" },
      { key: "hubspotContactId", type: "TEXT" },
      { key: "status", type: "TEXT" },
      { key: "details", type: "TEXT" },
      { key: "timestamp", type: "DATE" }
    ]
  },
  formEvents: {
    fields: [
      { key: "formId", type: "TEXT" },
      { key: "submissionId", type: "TEXT" },
      { key: "email", type: "TEXT" },
      { key: "hubspotContactId", type: "TEXT" },
      { key: "utmData", type: "TEXT" },
      { key: "status", type: "TEXT" },
      { key: "timestamp", type: "DATE" }
    ]
  }
};
