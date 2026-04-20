# Table: lead_audits

Stores audit funnel records for the lead qualification feature.

---

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `lead_id` | UUID FK → `scraped_agents.id` | Which agent this audit is for |
| `token` | TEXT UNIQUE | `crypto.randomUUID()` — used in the audit URL |
| `status` | TEXT | `pending` or `completed` |
| `answers` | JSONB | `{ hasWebsite, hasFollowUp, noZillowRel }` |
| `computed_score` | INTEGER | 15–95 range |
| `expires_at` | TIMESTAMPTZ | 7 days after creation |
| `completed_at` | TIMESTAMPTZ | When agent submitted answers |

---

## Idempotency

`createAudit(leadId)` checks for an existing `pending` audit not yet expired before creating a new one. Re-triggering the audit email sends the same token link.

---

## Score Computation

Done server-side in `routes/audit.ts` (see [[Route-Audit]]). The `answers` JSONB is stored as-is for reference.

---

## Related Notes
- [[Route-Audit]]
- [[Audit-Flow]]
- [[Page-AuditPage]]
- [[Schema-Overview]]
