import { z } from "zod";
import { SyncEngine } from "../../lib/sync-engine";

const wixContactEventSchema = z.object({
  contactId: z.string(),
  updatedAt: z.string(),
  fields: z.record(z.string(), z.unknown())
});

export async function handleWixContactUpdated(rawEvent: unknown, syncEngine: SyncEngine): Promise<void> {
  const parsed = wixContactEventSchema.parse(rawEvent);
  await syncEngine.syncFromWix({
    id: parsed.contactId,
    updatedAt: parsed.updatedAt,
    fields: parsed.fields,
    email: String(parsed.fields.email || ""),
    firstName: String(parsed.fields.firstName || ""),
    lastName: String(parsed.fields.lastName || ""),
    phone: String(parsed.fields.phone || "")
  });
}
