import { z } from "zod";
import { SyncEngine } from "../../lib/sync-engine";

const formEventSchema = z.object({
  formId: z.string(),
  submissionId: z.string(),
  email: z.string().email(),
  fields: z.record(z.string(), z.unknown()),
  context: z.object({
    pageUrl: z.string().optional(),
    referrer: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional()
  })
});

export async function handleWixFormSubmitted(rawEvent: unknown, syncEngine: SyncEngine): Promise<string> {
  const parsed = formEventSchema.parse(rawEvent);
  return syncEngine.captureWixFormSubmission({
    formId: parsed.formId,
    submissionId: parsed.submissionId,
    email: parsed.email,
    fields: parsed.fields,
    utm: {
      utm_source: parsed.context.utm_source,
      utm_medium: parsed.context.utm_medium,
      utm_campaign: parsed.context.utm_campaign,
      utm_term: parsed.context.utm_term,
      utm_content: parsed.context.utm_content,
      page_url: parsed.context.pageUrl,
      referrer: parsed.context.referrer,
      captured_at: new Date().toISOString()
    }
  });
}
