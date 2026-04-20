# Table: email_logs

Tracks every email sent through the system and its current delivery status.

---

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `lead_id` | UUID FK → `scraped_agents.id` | Nullable — some emails aren't tied to a lead |
| `recipient` | TEXT | Email address sent to |
| `subject` | TEXT | Email subject line |
| `status` | TEXT | Current delivery status |
| `resend_id` | TEXT | Resend API email ID — used to correlate webhooks |
| `created_at` | TIMESTAMPTZ | When the send was attempted |

---

## Status Values

`sent → delivered → opened → clicked` (progression)
`bounced`, `complained` (terminal)
`failed` (Resend API error)

---

## How It Works

1. `services/email.ts` inserts a row with `status: 'sent'` and `resend_id` after every send
2. `routes/webhooks.ts` receives Resend webhook events and calls `UPDATE email_logs SET status=? WHERE resend_id=?`
3. Status hierarchy prevents downgrades (see [[Route-Webhooks]])

---

## Related Notes
- [[Service-Email]]
- [[Route-Webhooks]]
- [[Components-EmailLogs]]
- [[Email-Funnel]]
