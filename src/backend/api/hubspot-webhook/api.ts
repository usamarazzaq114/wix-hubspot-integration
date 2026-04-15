import { Router } from "express";
import { z } from "zod";
import { SyncEngine } from "../../lib/sync-engine";

const webhookSchema = z.array(
  z.object({
    objectId: z.number(),
    subscriptionType: z.string(),
    propertyName: z.string().optional(),
    propertyValue: z.unknown().optional()
  })
);

export function createHubSpotWebhookRouter(syncEngine: SyncEngine): Router {
  const router = Router();
  router.post("/", async (req, res) => {
    const parse = webhookSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "Invalid webhook payload." });

    for (const event of parse.data) {
      if (!event.subscriptionType.includes("contact")) continue;
      await syncEngine.syncFromHubSpot(String(event.objectId), {
        [event.propertyName || "last_changed"]: event.propertyValue
      });
    }
    res.json({ ok: true });
  });
  return router;
}
