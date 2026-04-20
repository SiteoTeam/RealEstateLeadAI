# Page: Audit Page

**File**: `web/src/pages/AuditPage.tsx`

Token-based audit form. Accessible at `/audit/:token` — linked from `sendAuditEmail()`.

---

## Flow

1. On mount: `GET /api/audit/:token` — fetches audit state and agent info
2. If expired: shows "This link has expired" message
3. If completed: shows already-submitted message
4. Otherwise: renders 3-question form

---

## Questions

```
1. Do you currently have a personal agent website? (Yes/No)
2. Do you have a follow-up system for leads? (Yes/No)
3. Are you NOT dependent on Zillow for leads? (Yes/No)
```

On submit: `POST /api/audit/:token/submit` with `{ hasWebsite, hasFollowUp, noZillowRel }`.

---

## Results Display

Score (15–95) shown as animated progress bar. Copy changes based on which scenario (1–4) was computed server-side.

---

## Related Notes
- [[Route-Audit]]
- [[Audit-Flow]]
- [[Table-Audits]]
