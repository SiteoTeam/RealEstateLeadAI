# Integration: Vercel Domains

Allows agents to connect their own domain (e.g. `janesmith.com`) to their generated website.

---

## How It Works

```
1. Agent enters "janesmith.com" in DomainManager UI
2. Frontend → POST /api/admin/domains { domain, slug }
3. Backend → addDomain('janesmith.com') via Vercel REST API
4. Vercel: "Add CNAME record: janesmith.com → cname.vercel-dns.com"
5. Agent sets DNS record at their registrar
6. Frontend polls GET /api/admin/domains/:domain → waiting for verified: true
7. When verified: domain is live, stored in website_config.custom_domain
8. Visitor visits janesmith.com → Vercel routes to siteo.io build
9. DomainRouter detects custom hostname → useDomainLookup resolves slug
10. PublicWebsite renders for 'jane-smith'
```

---

## DNS Instructions Given to Agent

- **CNAME**: `@` or `www` → `cname.vercel-dns.com`
- Or **A record**: `@` → `76.76.21.21`

---

## Configuration

```
VERCEL_AUTH_TOKEN  — Personal access token or team token
VERCEL_PROJECT_ID  — Project to attach domains to
VERCEL_TEAM_ID     — Optional (for team-owned projects)
```

---

## Related Notes
- [[Service-Vercel]]
- [[Route-Admin]]
- [[DomainRouter]]
- [[Components-WebsiteEditor]]
