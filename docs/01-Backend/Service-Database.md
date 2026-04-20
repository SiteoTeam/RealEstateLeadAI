# Service: Database

**File**: `scraper-agent/src/services/db.ts`

All Supabase CRUD operations. Single source of truth for DB access in the backend.

---

## Singleton Client

```typescript
function getSupabaseClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;  // reuse existing
    // init from env vars
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    return supabaseClient;
}
export const getDb = getSupabaseClient;
```

Returns `null` (not crash) if env vars are missing — allows graceful degradation.
Always uses `SUPABASE_SERVICE_KEY` which bypasses RLS.

---

## Function Reference

| Function | Description |
|----------|-------------|
| `saveProfile(profile)` | UPSERT to `scraped_agents` on `source_url` conflict |
| `getLeads()` | All rows ordered by `updated_at DESC`, limit 1000 |
| `getUncontactedLeads(limit)` | Rows where `last_contacted_at IS NULL` |
| `markLeadAsContacted(id)` | Sets `last_contacted_at = NOW()` |
| `deleteLead(id)` | Cancels Stripe sub first, then deletes row |
| `updateLeadConfig(id, config)` | Updates `website_slug` / `website_published` |
| `updateLead(id, data)` | Updates whitelisted fields (see `LeadUpdateData`) |
| `getLeadBySlug(slug)` | Requires `website_published = true` |
| `getAgentBySlug(slug)` | Ignores `website_published` — used for login |
| `getLeadById(id)` | Fetch by UUID |
| `unsubscribeLead(id)` | Sets `is_unsubscribed = true` |
| `isFeatureEnabled(key)` | Checks `feature_flags` table |
| `createAudit(leadId)` | Creates `lead_audits` record (idempotent) |
| `getAuditByToken(token)` | Joins with lead record |
| `submitAudit(token, answers, score)` | Updates audit with computed score |
| `logLoginAttempt(data)` | Inserts into `login_logs` |

---

## `saveProfile` — UPSERT Logic

1. Check for existing record by `source_url`
2. If exists: preserve `primary_email` if user edited it, preserve `website_slug` to avoid breaking links
3. Upsert with `onConflict: 'source_url'`
4. New records get `website_published: true` by default

---

## Related Notes
- [[Table-ScrapedAgents]]
- [[Table-EmailLogs]]
- [[Table-Audits]]
- [[Route-Leads]]
