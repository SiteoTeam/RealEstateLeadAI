# Route: Public

**File**: `scraper-agent/src/routes/public.ts`

Open endpoints — no authentication required.

---

## `GET /api/public/unsubscribe/:id`

- Calls `unsubscribeLead(id)` which sets `is_unsubscribed = true` on the agent record
- Returns an HTML page (not JSON) confirming unsubscription
- Linked from `List-Unsubscribe` headers in all marketing emails

---

## `POST /api/public/intake`

Landing page intake form submission.

- Receives: name, email, phone, company, message
- Sends the submission via Resend to `siteoteam@gmail.com`
- No DB storage — pure email notification
- Used by `Page-LandingPage` contact form

---

## Related Notes
- [[Page-LandingPage]]
- [[Service-Email]]
- [[Table-ScrapedAgents]]
