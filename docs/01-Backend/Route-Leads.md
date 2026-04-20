# Route: Leads

**File**: `scraper-agent/src/routes/leads.ts`

Core lead operations — extraction and CRUD.

---

## `POST /api/extract`

1. Validates the URL includes `coldwellbanker.com/agents/`
2. Calls `extractCBProfile(url)` from `extractors/coldwellbanker.ts`
3. If extraction succeeds, calls `saveProfile(profile)` → UPSERT to DB
4. Returns the full `CBAgentProfile` plus `saved_to_db: true` and the generated `id`
5. Returns `422` with `extraction_errors[]` if parsing fails critical fields

## `GET /api/leads`

- Calls `getLeads()` from `services/db.ts`
- Returns all `scraped_agents` rows ordered by `updated_at DESC`, limit 1000
- Used by `Components-LeadsList` to populate the CRM dashboard

## `DELETE /api/leads/:id`

- Calls `deleteLead(id)` — which first cancels Stripe subscription if present
- Then deletes the row from `scraped_agents`

## `PATCH /api/leads/:id/config`

Only updates `website_slug` and `website_published`. Uses `updateLeadConfig()`.

> This is intentionally narrow — it prevents accidentally overwriting billing/trial fields.

## `PATCH /api/leads/:id`

Updates whitelisted profile fields via `updateLead()`. The `LeadUpdateData` interface in `db.ts` is the whitelist:

```typescript
interface LeadUpdateData {
    full_name?, primary_email?, primary_phone?, bio?,
    city?, state?, office_name?, office_address?,
    facebook_url?, linkedin_url?, instagram_url?,
    twitter_url?, youtube_url?, headshot_url?,
    password_hash?, is_paid?, trial_started_at?,
    is_unsubscribed?
}
```

Fields NOT in the whitelist (e.g. `stripe_subscription_id`, `stripe_customer_id`) cannot be set via this endpoint.

---

## Related Notes
- [[Extractor-ColdwellBanker]]
- [[Service-Database]]
- [[Table-ScrapedAgents]]
- [[Routes-Overview]]
