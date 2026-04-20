# Workflow: Cron Jobs

Scheduled tasks and how to trigger them.

---

## Keep-Alive (GitHub Actions)

**File**: `.github/workflows/keep-alive.yml`

Runs every 14 minutes to prevent Render's free tier from sleeping (Render sleeps after 15 minutes of inactivity).

```yaml
schedule:
  - cron: '*/14 * * * *'
jobs:
  ping:
    steps:
      - run: curl -I https://realestateleadai.onrender.com/api/health
```

---

## Cron API Endpoints

Secured with `x-cron-secret: <CRON_SECRET>` header. Without the correct secret, returns `401`.

| Endpoint | Purpose | Recommended Schedule |
|----------|---------|---------------------|
| `POST /api/admin/cron/run-batch` | Send welcome emails to 5 uncontacted leads | Daily |
| `POST /api/admin/cron/trial-expiry-reminders` | Send 10-day warning to expiring trials | Daily |
| `POST /api/admin/cron/prune-expired` | Delete unpaid agents >30 days past trial start | Daily |

---

## Calling Cron Endpoints

```bash
curl -X POST https://realestateleadai.onrender.com/api/admin/cron/run-batch \
  -H "x-cron-secret: your_cron_secret_here"
```

Can be called from any external cron service (GitHub Actions, Cron-job.org, etc.).

---

## Batch Email Rate Limiting

Batch send functions include a 500ms delay between each email to avoid hitting Resend's rate limits:

```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

---

## Manual Equivalents

For immediate manual triggering (requires Supabase auth):
- `POST /api/admin/trigger-batch` — same as cron batch
- `POST /api/admin/prune-expired` — same as cron prune

---

## Related Notes
- [[Route-Admin]]
- [[CI-CD]]
- [[Email-Funnel]]
- [[Lead-Lifecycle]]
