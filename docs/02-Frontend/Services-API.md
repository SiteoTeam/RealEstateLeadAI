# Services: API

**File**: `web/src/services/api.ts`

All backend fetch calls. `DBProfile` interface is the canonical shape for agent data in the frontend.

---

## `DBProfile` Interface

The frontend's type definition for a `scraped_agents` row:

```typescript
interface DBProfile {
    id: string
    full_name: string
    brokerage: string
    city: string | null
    state: string | null
    primary_email: string | null
    primary_phone: string | null
    headshot_url: string | null
    logo_url: string | null
    brokerage_logo_url: string | null
    bio: string | null
    office_name: string | null
    office_address: string | null
    office_phone: string | null
    license_number: string | null
    facebook_url, linkedin_url, instagram_url, twitter_url, youtube_url: string | null
    source_url: string
    website_slug: string | null
    website_published: boolean
    website_config: any | null
    is_paid?: boolean
    stripe_subscription_id?: string | null
    stripe_customer_id?: string | null
    trial_started_at?: string | null
    last_contacted_at?: string | null
    is_unsubscribed?: boolean
    cold_call_status?: string | null
    cold_call_notes?: string | null
    cold_call_date?: string | null
    last_login_at?: string | null
    created_at: string
    updated_at: string
}
```

---

## Function Reference

| Function | HTTP | Description |
|----------|------|-------------|
| `extractProfile(url)` | `POST /api/extract` | Extract CB profile (requires auth) |
| `getLeads()` | `GET /api/leads` | All leads |
| `deleteLead(id)` | `DELETE /api/leads/:id` | Delete lead |
| `updateLeadConfig(id, config)` | `PATCH /api/leads/:id/config` | slug / published |
| `updateLead(id, data)` | `PATCH /api/leads/:id` | Profile fields |
| `getWebsiteBySlug(slug)` | `GET /api/website/:slug` | Public — no auth |
| `getEmailLogs()` | `GET /api/admin/emails` | Email log list |
| `deleteEmailLogs(recipient)` | `DELETE /api/admin/emails/:recipient` | — |
| `createCheckoutSession(leadId, url)` | `POST /api/stripe/create-checkout-session` | — |
| `cancelSubscription(leadId)` | `POST /api/stripe/cancel-subscription` | — |
| `pruneExpiredLeads()` | `POST /api/admin/prune-expired` | — |
| `markAsColdCall(id, status)` | `PATCH /api/leads/:id` | Sets `cold_call_status` |
| `updateColdCallStatus(id, status, notes?)` | `PATCH /api/leads/:id` | — |

---

## Auth Headers

```typescript
import { getAuthHeaders } from '../utils/auth'
// Returns { Authorization: 'Bearer <supabase-session-token>' }
```

All protected endpoints attach this header.

---

## Related Notes
- [[Auth-Middleware]]
- [[Routes-Overview]]
- [[Table-ScrapedAgents]]
