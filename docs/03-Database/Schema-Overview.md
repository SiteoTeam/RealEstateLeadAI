# Database Schema Overview

**Platform**: Supabase (managed PostgreSQL)

---

## Tables

| Table | Purpose |
|-------|---------|
| `scraped_agents` | Core — all lead/agent records |
| `email_logs` | Track every email sent and its delivery status |
| `lead_audits` | Audit funnel records with answers and computed scores |
| `login_logs` | Agent login attempt history |
| `password_reset_tokens` | Time-limited password reset links |
| `feature_flags` | Feature toggles (e.g. `audit_feature_enabled`) |

---

## ERD

```mermaid
erDiagram
    scraped_agents {
        uuid id PK
        text full_name
        text brokerage
        text city
        text state
        text source_platform
        text source_url "UNIQUE"
        text primary_email
        text primary_phone
        text website_slug
        boolean website_published
        jsonb website_config
        boolean is_paid
        text stripe_subscription_id
        text stripe_customer_id
        timestamptz trial_started_at
        timestamptz last_contacted_at
        boolean is_unsubscribed
        text cold_call_status
        text cold_call_notes
        text cold_call_date
        text password_hash
        jsonb raw_profile
        timestamptz created_at
        timestamptz updated_at
    }

    email_logs {
        uuid id PK
        uuid lead_id FK
        text recipient
        text subject
        text status
        text resend_id
        timestamptz created_at
    }

    lead_audits {
        uuid id PK
        uuid lead_id FK
        text token "UNIQUE"
        text status
        jsonb answers
        integer computed_score
        timestamptz expires_at
        timestamptz completed_at
    }

    login_logs {
        uuid id PK
        uuid agent_id FK
        text slug
        text ip_address
        text user_agent
        text status
        text failure_reason
        timestamptz created_at
    }

    scraped_agents ||--o{ email_logs : "lead_id"
    scraped_agents ||--o{ lead_audits : "lead_id"
    scraped_agents ||--o{ login_logs : "agent_id"
```

---

## Key Design Decisions

1. **UPSERT on `source_url`** — unique index prevents duplicate agents from the same CB profile URL
2. **`raw_profile JSONB`** — stores the full `CBAgentProfile` extraction result; future fields don't require migrations
3. **`website_config JSONB`** — all website customization in one flexible column
4. **Service role** — backend always uses `SUPABASE_SERVICE_KEY` to bypass RLS

---

## Related Notes
- [[Table-ScrapedAgents]]
- [[Table-EmailLogs]]
- [[Table-Audits]]
- [[RLS-Policies]]
