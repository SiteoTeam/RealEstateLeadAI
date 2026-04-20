# Service: Vercel

**File**: `scraper-agent/src/services/vercel.ts`

Wrapper around the Vercel REST API for custom domain management.

---

## Configuration

```
VERCEL_AUTH_TOKEN — Bearer token
VERCEL_PROJECT_ID — Which project to attach domains to
VERCEL_TEAM_ID    — Optional team scope
```

---

## Methods

| Method | Vercel API Endpoint | Description |
|--------|---------------------|-------------|
| `addDomain(domain)` | `POST /v10/projects/:id/domains` | Attach a custom domain |
| `getDomainStatus(domain)` | `GET /v10/projects/:id/domains/:domain` | Check verification + DNS status |
| `verifyDomain(domain)` | `POST /v10/projects/:id/domains/:domain/verify` | Re-trigger verification check |
| `removeDomain(domain)` | `DELETE /v10/projects/:id/domains/:domain` | Detach domain from project |

All methods propagate `error.details` and `error.status` from Vercel's API response for better client error messages.

---

## How Custom Domains Work

1. Admin calls `POST /api/admin/domains` with `{ domain, slug }`
2. Backend adds domain to Vercel project via `addDomain()`
3. Agent sets up DNS (CNAME to `cname.vercel-dns.com` or A record)
4. `getDomainStatus()` polls until `verified: true`
5. Domain is stored in `website_config.custom_domain`
6. `DomainRouter.tsx` calls `/api/website/domain/:hostname` to resolve slug → renders correct agent site

---

## Related Notes
- [[Vercel-Domains]]
- [[Route-Admin]]
- [[DomainRouter]]
