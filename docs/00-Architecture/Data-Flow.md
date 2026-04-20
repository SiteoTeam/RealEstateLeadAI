# Data Flow

End-to-end sequence of how data moves through the system from URL input to email delivery.

---

## Full Extraction + Notification Flow

```mermaid
sequenceDiagram
    participant Admin as Platform Admin
    participant FE as Frontend (App.tsx)
    participant API as Express API
    participant FC as Firecrawl
    participant CB as coldwellbanker.com
    participant DB as Supabase DB
    participant RS as Resend

    Admin->>FE: Paste CB profile URL
    FE->>API: POST /api/extract {url}
    API->>FC: scrapePage(url)
    FC->>CB: Fetch HTML
    CB-->>FC: Raw HTML
    FC-->>API: Markdown + HTML
    API->>API: extractCBProfile(html) — cheerio parse
    API->>DB: UPSERT scraped_agents ON source_url
    DB-->>API: {id, slug}
    API-->>FE: CBAgentProfile + saved_to_db: true
    Admin->>FE: Click "Notify Agent"
    FE->>API: POST /api/admin/notify-agent/:id
    API->>DB: SELECT agent
    API->>RS: sendWelcomeEmail()
    RS-->>API: {resend_id}
    API->>DB: INSERT email_logs (status: sent)
    API->>DB: UPDATE last_contacted_at
    RS->>API: Webhook email.delivered
    API->>DB: UPDATE email_logs (status: delivered)
    RS->>API: Webhook email.clicked
    API->>DB: UPDATE email_logs (status: clicked)
    API->>DB: UPDATE trial_started_at = NOW()
    API->>RS: sendAdminAccessEmail()
```

---

## Key Data Transformations

| Step | Input | Output | File |
|------|-------|--------|------|
| Scrape | CB profile URL | Raw HTML | `firecrawl-js` |
| Parse | Raw HTML | `CBAgentProfile` struct | `extractors/coldwellbanker.ts` |
| Save | `CBAgentProfile` | `scraped_agents` row | `services/db.ts:saveProfile` |
| Slug gen | `full_name` | `website_slug` e.g. `john-smith` | `services/db.ts:generateSlug` |
| Email log | Resend API response | `email_logs` row | `services/email.ts` |
| Trial start | `email.clicked` webhook | `trial_started_at = NOW()` | `routes/webhooks.ts` |

---

## Related Notes
- [[Lead-Lifecycle]]
- [[Email-Funnel]]
- [[Extractor-ColdwellBanker]]
- [[Service-Database]]
- [[Route-Webhooks]]
