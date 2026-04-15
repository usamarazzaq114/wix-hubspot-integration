import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createHubSpotOAuthRouter } from "./backend/api/hubspot-oauth/api";
import { createHubSpotWebhookRouter } from "./backend/api/hubspot-webhook/api";
import { requireApiAuth } from "./backend/lib/auth";
import { dataStore } from "./backend/lib/data-store";
import { HubSpotClient } from "./backend/lib/hubspot-client";
import { SyncEngine, WixContactsAdapter } from "./backend/lib/sync-engine";
import { handleWixContactUpdated } from "./backend/events/contacts/events";
import { handleWixFormSubmitted } from "./backend/events/forms/events";
import { FieldMapping } from "./types";

const app = express();
const instanceId = process.env.APP_INSTANCE_ID || "default-instance";
const port = Number(process.env.PORT || 3000);

const wixContacts = new Map<string, Record<string, unknown>>();
const wixAdapter: WixContactsAdapter = {
  async upsertContact(payload, externalId) {
    const id = externalId || uuidv4();
    wixContacts.set(id, { ...payload, id, updatedAt: new Date().toISOString() });
    return id;
  }
};

const syncEngine = new SyncEngine(new HubSpotClient(instanceId), wixAdapter, instanceId);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => res.redirect("/dashboard/connect"));

app.get("/dashboard/connect", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html><body>
<h1>HubSpot Connection</h1>
<p id="status">Checking...</p>
<button id="connect">Connect</button>
<button id="disconnect">Disconnect</button>
<script>
async function refresh() {
  const status = await fetch('/api/hubspot-oauth/status').then(r => r.json());
  document.getElementById('status').textContent = status.connected ? 'Connected' : 'Not Connected';
}
document.getElementById('connect').onclick = async () => {
  const data = await fetch('/api/hubspot-oauth/connect').then(r => r.json());
  window.location.href = data.authorizeUrl;
};
document.getElementById('disconnect').onclick = async () => {
  await fetch('/api/hubspot-oauth/disconnect', { method: 'POST' });
  refresh();
};
refresh();
</script>
</body></html>`);
});

app.get("/dashboard/field-mapping", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html><body>
<h1>Field Mapping</h1>
<table border="1" cellpadding="6" id="rows"></table>
<button id="add">Add row</button>
<button id="save">Save mapping</button>
<p id="msg"></p>
<script>
let rows = [];
const wixFields = ['email','firstName','lastName','phone','jobTitle','company'];
const directions = ['wix_to_hubspot','hubspot_to_wix','bidirectional'];
const transforms = ['none','trim','lowercase'];
const apiToken = localStorage.getItem('apiToken') || prompt('Enter dashboard API token');
if (apiToken) localStorage.setItem('apiToken', apiToken);
async function load() {
  const data = await fetch('/api/mappings', { headers: { 'x-api-token': apiToken || '' } }).then(r => r.json());
  rows = data.mappings;
  draw();
}
function draw() {
  const table = document.getElementById('rows');
  table.innerHTML = '<tr><th>Wix field</th><th>HubSpot property</th><th>Direction</th><th>Transform</th></tr>';
  rows.forEach((row, index) => {
    table.innerHTML += '<tr>' +
      '<td><select onchange="setVal('+index+',\\'wixField\\',this.value)">' + wixFields.map(f => '<option '+(f===row.wixField?'selected':'')+'>'+f+'</option>').join('') + '</select></td>' +
      '<td><input value="'+(row.hubspotProperty||'')+'" onchange="setVal('+index+',\\'hubspotProperty\\',this.value)"></td>' +
      '<td><select onchange="setVal('+index+',\\'direction\\',this.value)">' + directions.map(d => '<option '+(d===row.direction?'selected':'')+'>'+d+'</option>').join('') + '</select></td>' +
      '<td><select onchange="setVal('+index+',\\'transform\\',this.value)">' + transforms.map(t => '<option '+(t===row.transform?'selected':'')+'>'+t+'</option>').join('') + '</select></td>' +
    '</tr>';
  });
}
window.setVal = (index, key, value) => rows[index][key] = value;
document.getElementById('add').onclick = () => {
  rows.push({ id: crypto.randomUUID(), wixField: 'email', hubspotProperty: '', direction: 'bidirectional', transform: 'none' });
  draw();
};
document.getElementById('save').onclick = async () => {
  const response = await fetch('/api/mappings', {
    method:'POST',
    headers:{'Content-Type':'application/json', 'x-api-token': apiToken || ''},
    body: JSON.stringify({ mappings: rows })
  });
  const json = await response.json();
  document.getElementById('msg').textContent = json.ok ? 'Saved' : json.error;
};
load();
</script>
</body></html>`);
});

app.use("/api/hubspot-oauth", createHubSpotOAuthRouter(instanceId));
app.use("/api/hubspot-webhook", createHubSpotWebhookRouter(syncEngine));

app.get("/api/mappings", requireApiAuth, async (_req, res) => {
  res.json({ mappings: dataStore.getMappings() });
});

app.post("/api/mappings", requireApiAuth, async (req, res) => {
  const mappings = (req.body?.mappings || []) as FieldMapping[];
  const used = new Set<string>();
  for (const mapping of mappings) {
    if (!mapping.hubspotProperty) return res.status(400).json({ error: "HubSpot property is required." });
    if (used.has(mapping.hubspotProperty)) {
      return res.status(400).json({ error: `Duplicate HubSpot property: ${mapping.hubspotProperty}` });
    }
    used.add(mapping.hubspotProperty);
  }
  dataStore.saveMappings(mappings);
  res.json({ ok: true });
});

app.post("/api/events/wix-contact-updated", requireApiAuth, async (req, res) => {
  try {
    await handleWixContactUpdated(req.body, syncEngine);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Failed to process Wix contact event." });
  }
});

app.post("/api/events/wix-form-submitted", requireApiAuth, async (req, res) => {
  try {
    const hubspotContactId = await handleWixFormSubmitted(req.body, syncEngine);
    res.json({ ok: true, hubspotContactId });
  } catch {
    res.status(400).json({ error: "Failed to process Wix form event." });
  }
});

app.get("/api/observability/forms", requireApiAuth, (_req, res) => {
  res.json({ events: dataStore.getFormEvents() });
});

app.listen(port, () => {
  console.log(`wix-hubspot integration server listening on :${port}`);
});
