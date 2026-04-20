# Route: Admin

**File**: `scraper-agent/src/routes/admin.ts`

Administrative operations for the platform: config management, image uploads, domain management, agent notification, batch processing.

---

## Config Management

**`GET /api/admin/config/:id`** — returns `website_config` JSONB for an agent

**`PATCH /api/admin/config/:id`** — merges the provided fields into the existing `website_config` rather than overwriting entirely. This prevents one editor (e.g. theme) from wiping changes made by another (e.g. content).

---

## Image Upload

**`POST /api/admin/upload/:slug`** — handled by `multer` middleware

- Max file size: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Storage: Supabase Storage bucket `agent-assets`
- Path pattern: `{slug}/{timestamp}.{ext}` — e.g. `john-smith/1720000000000.jpg`
- Returns the public CDN URL for the uploaded file

---

## Domain Management

Proxies to the Vercel API via `services/vercel.ts`:

| Endpoint | Action |
|----------|--------|
| `POST /api/admin/domains` | Add domain to Vercel project |
| `GET /api/admin/domains/:domain` | Check verification status |
| `POST /api/admin/domains/:domain/verify` | Re-trigger verification |
| `DELETE /api/admin/domains/:domain` | Remove domain from Vercel |

Domain is also saved into `website_config.custom_domain` on the agent record.

---

## Agent Notification

**`POST /api/admin/notify-agent/:id`**

1. Fetches agent by ID
2. Builds `websiteUrl` = `CLIENT_URL/w/:slug`
3. Builds `adminUrl` = `CLIENT_URL/w/:slug/admin`
4. Calls `sendWelcomeEmail()`
5. Updates `last_contacted_at = NOW()`

---

## Email Log Management

- `GET /api/admin/emails` — returns all `email_logs` rows
- `DELETE /api/admin/emails/:recipient` — deletes all logs for an email address

---

## Batch Operations

| Endpoint | Auth | Batch Size | Description |
|----------|------|-----------|-------------|
| `POST /api/admin/trigger-batch` | Required | 5 | Welcome emails to uncontacted leads |
| `POST /api/admin/trigger-batch-audit` | Required | 5 | Audit emails |
| `POST /api/admin/prune-expired` | Required | All | Delete unpaid leads >30 days since trial start |
| `POST /api/admin/cron/run-batch` | CRON | 5 | Same as trigger-batch, cron-secured |
| `POST /api/admin/cron/trial-expiry-reminders` | CRON | All | 10-day trial warning emails |
| `POST /api/admin/cron/prune-expired` | CRON | All | Same as prune-expired, cron-secured |

Batch emails have a 500ms delay between sends to avoid hitting Resend rate limits.

---

## Related Notes
- [[Service-Vercel]]
- [[Service-Email]]
- [[Service-Database]]
- [[Cron-Jobs]]
- [[Table-EmailLogs]]
