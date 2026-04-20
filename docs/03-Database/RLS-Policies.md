# Row-Level Security (RLS) Policies

---

## Overview

RLS is enabled on `scraped_agents`. Two policies are defined in `supabase/schema.sql`:

```sql
-- Service Role: full access (backend)
CREATE POLICY "Enable all access for service role"
    ON public.scraped_agents AS PERMISSIVE FOR ALL
    TO service_role USING (true) WITH CHECK (true);

-- Public Read: for frontend/public access
CREATE POLICY "Enable read access for all users"
    ON public.scraped_agents FOR SELECT
    TO public USING (true);
```

---

## In Practice

- **Backend** always uses `SUPABASE_SERVICE_KEY` → service role → bypasses all RLS
- **Frontend** (agent websites, public) uses `SUPABASE_ANON_KEY` → public role → read-only
- Agent ownership is enforced at the **application layer** in route handlers, not the DB level

---

## Security Considerations

- `SUPABASE_SERVICE_KEY` must never be exposed to clients
- The public read policy allows anyone with the anon key to `SELECT *` on `scraped_agents` — personal data is visible
- Future hardening: restrict public read to `website_published = true` rows only

---

## Related Notes
- [[Auth-Middleware]]
- [[Environment-Variables]]
- [[Schema-Overview]]
