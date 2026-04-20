# Workflow: Email Funnel

The 4-email sequence that converts a scraped agent into a paying subscriber.

---

## Email Journey

```
Email 1: Welcome Email
   ↓ (agent opens & clicks link)
   Resend webhook: email.clicked
   → trial_started_at = NOW()

Email 2: Admin Access Email (automatic)
   ↓ (agent visits admin panel)

Email 3: Trial Expiry Reminder (day 20 cron)
   "10 days left to keep your site active"
   ↓

Email 4: Payment Success Email (Stripe webhook)
   "Payment Successful - Siteo Receipt"
```

---

## Email 1: Welcome Email

- **Trigger**: Admin manually clicks "Notify Agent" OR cron batch job
- **Subject**: `Your agent profile on Google`
- **Content**: Shows their generated website, soft CTA
- **Tracking**: `resend_id` stored in `email_logs`, status updated by webhook

## Email 2: Admin Access Email

- **Trigger**: Automatic — `email.clicked` webhook for Email 1
- **Subject**: `Admin access to your website`
- **Content**: Admin panel URL + default password
- **Logic**: Only sent once — checks `trial_started_at IS NULL`

## Email 3: Trial Expiry Reminder

- **Trigger**: Day 20 cron (`/api/admin/cron/trial-expiry-reminders`)
- **Subject**: `${daysLeft} days left to keep your site active`
- **Recipients**: All agents with `is_paid = false AND trial_started_at NOT NULL AND trial_expires_at > NOW()`

## Email 4: Payment Success

- **Trigger**: `invoice.payment_succeeded` Stripe webhook
- **Subject**: `Payment Successful - Siteo Receipt`
- **Content**: Amount, date, invoice link

---

## Bot Detection

`email.opened` events within 15 seconds of `created_at` are ignored — email security scanners pre-click links immediately. The click-to-trial trigger would fire incorrectly without this check.

---

## Status Hierarchy

```
sent(0) → delivered(1) → opened(2) → clicked(3)
bounced(-1) complained(-1)  — terminal, never overwritten
```

Out-of-order webhook delivery is handled gracefully — status only moves forward.

---

## Related Notes
- [[Route-Webhooks]]
- [[Service-Email]]
- [[Table-EmailLogs]]
- [[Lead-Lifecycle]]
- [[Cron-Jobs]]
