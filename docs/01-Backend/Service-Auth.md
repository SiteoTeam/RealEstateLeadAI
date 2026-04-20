# Service: Auth

**File**: `scraper-agent/src/services/auth.ts`

Handles the custom agent JWT system (separate from Supabase platform auth).

---

## Agent JWT

Agents get a short-lived JWT when they log in to their admin panel (`/w/:slug/admin`).

The JWT payload:
```typescript
{
    id: string,      // agent UUID from scraped_agents
    slug: string,    // website_slug
    role: 'agent'
}
```

Signed with `JWT_SECRET` env var. Verified by Strategy 2 in [[Auth-Middleware]].

---

## `seedDefaultPasswords()`

Called via `POST /api/admin/seed-passwords`. Sets a bcrypt-hashed version of `DEFAULT_AGENT_PASSWORD` for agents who don't have a password set yet. Used during initial platform setup.

---

## Password Hashing

Agent passwords are stored as bcrypt hashes in the `password_hash` column of `scraped_agents`.

---

## Related Notes
- [[Auth-Middleware]]
- [[Route-Agent]]
- [[Table-ScrapedAgents]]
