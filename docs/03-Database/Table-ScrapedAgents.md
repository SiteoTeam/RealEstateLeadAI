# Table: scraped_agents

The primary table. Every extracted Coldwell Banker agent is a row here.

---

## Column Reference

### Identity
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `full_name` | TEXT NOT NULL | Agent display name |
| `brokerage` | TEXT | Always `'Coldwell Banker Realty'` for CB extractions |

### Location
| Column | Type | Notes |
|--------|------|-------|
| `city` | TEXT | Extracted from `office_address` |
| `state` | TEXT | 2-letter state code from `office_address` |

### Source
| Column | Type | Notes |
|--------|------|-------|
| `source_platform` | TEXT NOT NULL | Always `'coldwellbanker'` |
| `source_url` | TEXT NOT NULL UNIQUE | CB profile URL — unique constraint drives UPSERT |

### Contact
| Column | Type | Notes |
|--------|------|-------|
| `primary_email` | TEXT | Extracted email |
| `primary_phone` | TEXT | Mobile phone preferred over office |
| `office_phone` | TEXT | Office line |
| `license_number` | TEXT | RE license number |

### Visuals
| Column | Type | Notes |
|--------|------|-------|
| `headshot_url` | TEXT | Agent photo URL |
| `logo_url` | TEXT | Agent or team logo |
| `brokerage_logo_url` | TEXT | Coldwell Banker brand logo |

### Content
| Column | Type | Notes |
|--------|------|-------|
| `bio` | TEXT | Agent biography |
| `office_name` | TEXT | Office branch name |
| `office_address` | TEXT | Full office address string |

### Socials
| Column | Type | Notes |
|--------|------|-------|
| `facebook_url` | TEXT | — |
| `linkedin_url` | TEXT | — |
| `instagram_url` | TEXT | — |
| `twitter_url` | TEXT | Also handles Twitter/X |
| `youtube_url` | TEXT | — |

### Website
| Column | Type | Notes |
|--------|------|-------|
| `website_slug` | TEXT | URL-safe identifier, e.g. `john-smith` |
| `website_published` | BOOLEAN | Defaults to `true` on creation |
| `website_config` | JSONB | All visual customizations (see [[Components-WebsiteEditor]]) |

### Billing
| Column | Type | Notes |
|--------|------|-------|
| `is_paid` | BOOLEAN | Set to `true` by Stripe webhook |
| `stripe_subscription_id` | TEXT | Stripe sub object ID |
| `stripe_customer_id` | TEXT | Stripe customer object ID |

### Trial
| Column | Type | Notes |
|--------|------|-------|
| `trial_started_at` | TIMESTAMPTZ | Set when agent first clicks welcome email |
| `trial_expires_at` | TIMESTAMPTZ | `trial_started_at + 30 days` |

### Auth
| Column | Type | Notes |
|--------|------|-------|
| `password_hash` | TEXT | bcrypt hash for agent admin login |
| `last_login_at` | TIMESTAMPTZ | Updated on successful agent login |

### CRM
| Column | Type | Notes |
|--------|------|-------|
| `last_contacted_at` | TIMESTAMPTZ | Set when welcome email is sent |
| `cold_call_status` | TEXT | `queued/contacted/interested/not_interested/callback` |
| `cold_call_notes` | TEXT | Free-form notes |
| `cold_call_date` | TEXT | Date of last cold call attempt |

### Metadata
| Column | Type | Notes |
|--------|------|-------|
| `is_unsubscribed` | BOOLEAN | Set via unsubscribe link |
| `raw_profile` | JSONB | Full `CBAgentProfile` extraction result |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Updated on every write |

---

## Related Notes
- [[Schema-Overview]]
- [[Service-Database]]
- [[RLS-Policies]]
