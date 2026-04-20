# Workflow: Audit Flow

An optional lead qualification funnel — sends a personalized "website audit" link to the agent.

---

## Steps

```
1. Admin creates audit
   POST /api/audit/create { leadId }
   → Creates lead_audits row (token, expires 7 days)
   → Sends sendAuditEmail() with /audit/:token link

2. Agent receives email, clicks link
   → Resend webhook: email.clicked
   → Trial starts (if not already started)

3. Agent visits /audit/:token
   → Frontend fetches GET /api/audit/:token
   → Renders 3-question form

4. Agent submits answers
   POST /api/audit/:token/submit { hasWebsite, hasFollowUp, noZillowRel }
   → Server computes score
   → Updates lead_audits: status=completed, computed_score, completed_at

5. Agent sees score (15-95) and scenario-based copy
   → CTA to upgrade or book a call
```

---

## Scoring Matrix

| Positives | Score Range | Scenario |
|-----------|-------------|----------|
| 3 | 85–91 | "You're almost there" |
| 2 | 60–66 | "Room to grow" |
| 1 | 39–45 | "Significant gaps" |
| 0 | 19–25 | "Starting from scratch" |

Positive = `true` answer. Scores have ±3 variance, clamped to [15, 95].

---

## Feature Flag

Protected by `isFeatureEnabled('audit_feature_enabled')`. Set in `feature_flags` table.

---

## Related Notes
- [[Route-Audit]]
- [[Page-AuditPage]]
- [[Table-Audits]]
- [[Email-Funnel]]
- [[Lead-Lifecycle]]
