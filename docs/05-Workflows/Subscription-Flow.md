# Workflow: Subscription Flow

Full Stripe billing lifecycle from upgrade click to payment confirmation.

---

## Checkout Sequence

```mermaid
sequenceDiagram
    participant Agent as Agent Browser
    participant API as Express API
    participant Stripe as Stripe
    participant DB as Supabase DB
    participant Email as Resend

    Agent->>API: POST /api/stripe/create-checkout-session\n{leadId, returnUrl}
    API->>Stripe: checkout.sessions.create(\nmode: subscription,\nmetadata: {leadId}\n)
    Stripe-->>API: {url: 'https://checkout.stripe.com/...'}
    API-->>Agent: {url}
    Agent->>Stripe: Redirect to checkout page
    Agent->>Stripe: Enter card details
    Stripe->>API: Webhook: checkout.session.completed\n{metadata.leadId, subscription, customer}
    API->>DB: UPDATE scraped_agents SET\nis_paid=true,\nstripe_subscription_id,\nstripe_customer_id\nWHERE id=leadId
    Stripe->>API: Webhook: invoice.payment_succeeded\n{customer, customer_email, amount_paid}
    API->>DB: SELECT agent WHERE stripe_customer_id=customer
    API->>Email: sendPaymentSuccessEmail()
    Stripe-->>Agent: Redirect to returnUrl?success=true
```

---

## Cancellation Flow

1. Agent clicks **Cancel** in `AdminDashboard`
2. `POST /api/stripe/cancel-subscription { leadId }`
3. Stripe marks subscription `cancel_at_period_end: true`
4. Agent keeps `is_paid = true` until billing period ends
5. On period end: `customer.subscription.deleted` webhook → `is_paid = false` (TODO)

---

## Race Condition Handling

`invoice.payment_succeeded` may arrive before `checkout.session.completed` sets the `stripe_customer_id`. Backend falls back to lookup by `primary_email = invoice.customer_email` and then updates the missing `stripe_customer_id`.

---

## Related Notes
- [[Stripe-Integration]]
- [[Route-Stripe]]
- [[Route-Webhooks]]
- [[Lead-Lifecycle]]
