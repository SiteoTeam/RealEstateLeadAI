# Route: Website

**File**: `scraper-agent/src/routes/website.ts`

Public endpoint serving agent website data.

---

## `GET /api/website/:slug`

- Calls `getLeadBySlug(slug)` — queries `scraped_agents` where `website_slug = slug AND website_published = true`
- Returns the full agent record
- **No auth required** — this is a public endpoint for visitors to agent websites

Used by `Page-PublicWebsite` on initial load to populate the page.

---

## Related Notes
- [[Page-PublicWebsite]]
- [[Service-Database]]
- [[Table-ScrapedAgents]]
