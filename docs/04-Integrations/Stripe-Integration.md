# Integration: Stripe

Handles agent subscription billing.

---

## Configuration

```
STRIPE_SECRET_KEY      — server-side Stripe secret
STRIPE_PRICE_ID        — subscription price ID (monthly recurring)
STRIPE_WEBHOOK_SECRET  — for verifying webhook events
```

API version: `2023-10-16` (in webhooks.ts)

---

## Subscription Flow

1. Agent clicks **Upgrade** in `AdminDashboard`
2. Frontend calls `createCheckoutSession(leadId, returnUrl)`
3. Backend creates Stripe Checkout Session with `metadata.leadId`
4. Agent completes payment on Stripe-hosted page
5. Stripe fires `checkout.session.completed` webhook
6. Backend sets `is_paid = true`, stores `stripe_subscription_id` and `stripe_customer_id`
7. Stripe fires `invoice.payment_succeeded` → backend sends payment success email

---

## Cancellation

`cancel_at_period_end: true` — agent keeps access until end of billing period. The `customer.subscription.deleted` event (when it finally ends) should set `is_paid = false` (TODO in webhooks.ts).

---

## Billing Portal

Agent can self-manage via `create-portal-session` — Stripe-hosted page for changing payment method, viewing invoices, updating billing info.

---

## Delete Lead → Cancel Subscription

`deleteLead(id)` in `services/db.ts` checks for a `stripe_subscription_id` and calls `stripe.subscriptions.cancel()` before deleting the DB row to avoid orphaned subscriptions.

---

## Related Notes
- [[Route-Stripe]]
- [[Route-Webhooks]]
- [[Subscription-Flow]]
- [[Table-ScrapedAgents]]
