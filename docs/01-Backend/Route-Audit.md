# Route: Audit

**File**: `scraper-agent/src/routes/audit.ts`

Audit funnel — lets admins send a personalized "website audit" to agents, who complete a 3-question form and receive a score.

---

## Feature Flag

All audit endpoints check `isFeatureEnabled('audit_feature_enabled')` first. If disabled, returns `403`.

---

## `POST /api/audit/create` (Protected)

1. Checks feature flag
2. Calls `createAudit(leadId)` — idempotent (returns existing pending audit if valid one exists)
3. Token is a `crypto.randomUUID()`, expires in 7 days
4. Calls `sendAuditEmail()` with the tokenized link `CLIENT_URL/audit/:token`

---

## `GET /api/audit/:token` (Public)

- Returns audit record joined with lead (`full_name`, `brokerage`, `website_slug`, `primary_email`)
- Checks expiry — returns `410 Gone` if expired
- Used by `AuditPage.tsx` to display the form

---

## `POST /api/audit/:token/submit` (Public)

Accepts answers, computes score server-side:

```
answers = { hasWebsite: bool, hasFollowUp: bool, noZillowRel: bool }

positives = count of true answers

3 positives → score ~88 (±3)
2 positives → score ~63 (±3)
1 positive  → score ~42 (±3)
0 positives → score ~22 (±3)

Final score clamped to [15, 95]
```

Uses optimistic locking: `UPDATE ... WHERE status = 'pending'` — prevents double-submission.

---

## Related Notes
- [[Audit-Flow]]
- [[Service-Database]]
- [[Service-Email]]
- [[Table-Audits]]
- [[Page-AuditPage]]
