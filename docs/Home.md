# RealEstateLeadAI — Knowledge Base

> Full-stack automation platform for extracting Coldwell Banker agent profiles, managing leads in a CRM, and generating personal agent websites with email funnels and Stripe billing.

**Domain**: siteo.io | **Backend**: Render | **Frontend**: Vercel | **DB**: Supabase

---

## Quick Navigation

### Start Here
- [[System-Overview]] — High-level architecture and component responsibilities
- [[Data-Flow]] — How data moves from scrape → DB → email → payment
- [[Tech-Stack]] — All libraries, services, and versions
- [[Environment-Variables]] — Every env var with purpose and location

### Backend
- [[Server-Entry]] — Express app bootstrap and route mounting
- [[Routes-Overview]] — All 34 API endpoints in one reference table
- [[Auth-Middleware]] — Dual-strategy JWT auth (Supabase + agent JWT)
- [[Service-Database]] — All Supabase CRUD functions
- [[Service-Email]] — All 6 email send functions
- [[Extractor-ColdwellBanker]] — CB profile parsing pipeline

### Frontend
- [[Frontend-Overview]] — Vite app, route tree, three personas served from one build
- [[DomainRouter]] — How custom domains resolve to agent sites
- [[App-Platform]] — Dashboard tabs, auth session management
- [[Page-PublicWebsite]] — Dual-mode: public view + visual editor
- [[Services-API]] — `DBProfile` interface + all fetch wrappers

### Database
- [[Schema-Overview]] — ERD + table list
- [[Table-ScrapedAgents]] — Primary table, all columns explained
- [[Table-EmailLogs]] — Email tracking table
- [[Table-Audits]] — Lead audit feature table

### Integrations
- [[Stripe-Integration]] — Subscriptions, billing portal, cancellation
- [[Resend-Email]] — Transactional email + webhook tracking
- [[Firecrawl-Scraping]] — Headless scraping service
- [[Vercel-Domains]] — Custom domain management API

### Workflows (Start-to-Finish Flows)
- [[Lead-Lifecycle]] — Scraped → contacted → trial → paid/expired
- [[Email-Funnel]] — Welcome → clicked → admin access → trial started
- [[Audit-Flow]] — Create audit → agent completes → score computed
- [[Subscription-Flow]] — Checkout → Stripe webhook → DB update
- [[Cron-Jobs]] — 3 cron endpoints + GitHub Actions keep-alive

### DevOps
- [[Deployment]] — Render (backend) + Vercel (frontend) setup
- [[CI-CD]] — keep-alive.yml workflow

---

## Repository Structure

```
automation agent/
├── scraper-agent/    # Node.js/Express/TypeScript backend
├── web/              # React 19 + Vite + Tailwind frontend
├── supabase/         # Schema SQL + migrations
├── .github/          # CI/CD workflows
└── docs/             # This Obsidian vault
```
