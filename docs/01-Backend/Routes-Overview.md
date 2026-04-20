# Routes Overview

All API endpoints. Auth column: **Required** = Supabase token, **Agent JWT** = agent session, **Signed** = webhook signature, **CRON** = `x-cron-secret` header, **None** = public.

---

## Leads & Extraction

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/extract` | Required | Extract CB profile + auto-save to DB |
| `GET` | `/api/leads` | Required | Get all leads (ordered by `updated_at`, limit 1000) |
| `DELETE` | `/api/leads/:id` | Required | Delete lead + cancel Stripe subscription |
| `PATCH` | `/api/leads/:id/config` | Required | Update `website_slug` and `website_published` only |
| `PATCH` | `/api/leads/:id` | Required | Update whitelisted profile fields |

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/config/:id` | Required | Get `website_config` JSONB |
| `PATCH` | `/api/admin/config/:id` | Required | Merge-update `website_config` |
| `POST` | `/api/admin/upload/:slug` | Required | Upload image to Supabase Storage |
| `POST` | `/api/admin/domains` | Required | Add custom domain via Vercel API |
| `GET` | `/api/admin/domains/:domain` | Required | Check domain verification status |
| `POST` | `/api/admin/domains/:domain/verify` | Required | Trigger domain verification |
| `DELETE` | `/api/admin/domains/:domain` | Required | Remove domain from Vercel |
| `POST` | `/api/admin/notify-agent/:id` | Required | Send welcome email to agent |
| `GET` | `/api/admin/emails` | Required | Fetch `email_logs` |
| `DELETE` | `/api/admin/emails/:recipient` | Required | Delete email logs for recipient |
| `POST` | `/api/admin/trigger-batch` | Required | Manual: send welcome to 5 uncontacted leads |
| `POST` | `/api/admin/trigger-batch-audit` | Required | Manual: send audit emails |
| `POST` | `/api/admin/prune-expired` | Required | Manual: delete expired trials |
| `POST` | `/api/admin/cron/run-batch` | CRON | Automated batch welcome emails |
| `POST` | `/api/admin/cron/trial-expiry-reminders` | CRON | 10-day trial reminders |
| `POST` | `/api/admin/cron/prune-expired` | CRON | Delete unpaid agents >30 days |

## Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/audit/create` | Required | Create audit record + send audit email |
| `GET` | `/api/audit/:token` | None | Fetch audit by token (checks expiry) |
| `POST` | `/api/audit/:token/submit` | None | Submit audit answers + compute score |

## Stripe

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/stripe/create-checkout-session` | Required | Start Stripe subscription checkout |
| `POST` | `/api/stripe/cancel-subscription` | Required | Cancel at period end |
| `POST` | `/api/stripe/create-portal-session` | Required | Billing portal session URL |

## Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/webhooks/resend` | Svix-Signed | Email status updates |
| `POST` | `/api/webhooks/resend/inbound` | None | Inbound email forwarding |
| `POST` | `/api/webhooks/stripe` | Stripe-Signed | Payment events |

## Public & Website

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/website/:slug` | None | Public agent website data |
| `GET` | `/api/public/unsubscribe/:id` | None | Unsubscribe from emails (HTML response) |
| `POST` | `/api/public/intake` | None | Landing page intake form |
| `POST` | `/api/contact` | None | Contact form from agent website |
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/admin/seed-passwords` | Required | Seed default agent passwords |

---

## Related Notes
- [[Route-Leads]]
- [[Route-Admin]]
- [[Route-Webhooks]]
- [[Auth-Middleware]]
