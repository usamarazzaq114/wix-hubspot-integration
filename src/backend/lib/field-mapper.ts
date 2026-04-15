import { createHash } from "node:crypto";
import { FieldMapping } from "../../types";

function applyTransform(value: unknown, transform: FieldMapping["transform"]): unknown {
  if (typeof value !== "string") return value;
  if (transform === "trim") return value.trim();
  if (transform === "lowercase") return value.toLowerCase();
  return value;
}

export function mapWixToHubSpot(wixFields: Record<string, unknown>, mappings: FieldMapping[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const mapping of mappings) {
    if (mapping.direction === "hubspot_to_wix") continue;
    result[mapping.hubspotProperty] = applyTransform(wixFields[mapping.wixField], mapping.transform);
  }
  return result;
}

export function mapHubSpotToWix(
  hubspotFields: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const mapping of mappings) {
    if (mapping.direction === "wix_to_hubspot") continue;
    result[mapping.wixField] = applyTransform(hubspotFields[mapping.hubspotProperty], mapping.transform);
  }
  return result;
}

export function hashPayload(payload: Record<string, unknown>): string {
  const normalized = Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)));
  return createHash("sha256").update(JSON.stringify(normalized), "utf8").digest("hex");
}
