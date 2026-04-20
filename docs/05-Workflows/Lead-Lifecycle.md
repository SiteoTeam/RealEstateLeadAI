# Workflow: Lead Lifecycle

The full journey of a Coldwell Banker agent through the system.

---

## State Machine

```mermaid
stateDiagram-v2
    [*] --> Scraped: extractCBProfile(url)\n+ saveProfile() UPSERT

    Scraped --> Contacted: Admin clicks Notify Agent\nsendWelcomeEmail()\nlast_contacted_at = NOW()

    Contacted --> TrialActive: Agent clicks link in email\nemail.clicked webhook\ntrial_started_at = NOW()\nsendAdminAccessEmail()

    TrialActive --> Paid: Agent pays via Stripe\ncheckout.session.completed\nis_paid = true

    TrialActive --> TrialWarning: Day 20 cron\nsendTrialExpiryReminderEmail()\n(10 days left)

    TrialWarning --> Paid: Agent upgrades

    TrialWarning --> Expired: Day 30 cron\nprune-expired deletes row

    Paid --> Canceling: cancel_at_period_end = true

    Canceling --> Expired: subscription.deleted event

    Contacted --> Unsubscribed: Agent clicks unsubscribe link\nis_unsubscribed = true

    Expired --> [*]: Row deleted from DB
```

---

## Key Timestamps

| Timestamp | Set When | Used For |
|-----------|----------|----------|
| `created_at` | Row insert | Age of lead |
| `last_contacted_at` | `sendWelcomeEmail()` called | Tracks if emailed, used by batch query |
| `trial_started_at` | First `email.clicked` webhook | Trial start reference |
| `trial_expires_at` | `trial_started_at + 30 days` | Expiry check in cron |
| `last_login_at` | Agent login success | Activity tracking |

---

## Trial Duration

30 days from `trial_started_at`. The 10-day warning fires at day 20 (`trial_started_at + 20 days < NOW() < trial_started_at + 30 days`).

---

## Related Notes
- [[Email-Funnel]]
- [[Subscription-Flow]]
- [[Cron-Jobs]]
- [[Route-Webhooks]]
- [[Table-ScrapedAgents]]
