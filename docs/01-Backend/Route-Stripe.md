# Route: Stripe

**File**: `scraper-agent/src/routes/stripe.ts`

Handles Stripe subscription lifecycle from the frontend.

---

## `POST /api/stripe/create-checkout-session`

1. Creates a Stripe Checkout Session in `subscription` mode
2. Sets `metadata.leadId` so the webhook can identify which agent paid
3. Sets `success_url` and `cancel_url` back to the returnUrl
4. Returns `{ url }` — frontend redirects to this Stripe-hosted page

```typescript
const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { leadId },
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`
});
```

---

## `POST /api/stripe/cancel-subscription`

- Uses `cancel_at_period_end: true` (graceful — agent keeps access until billing period ends)
- Looks up `stripe_subscription_id` from the agent record
- Ownership check: only the agent's own leadId can be cancelled

---

## `POST /api/stripe/create-portal-session`

- Uses stored `stripe_customer_id` to create a Stripe Billing Portal session
- Returns `{ url }` for frontend redirect
- Agent can self-manage payment methods and invoices

---

## Ownership Check Pattern

All endpoints verify the requesting user actually owns the leadId:
- Platform admin: can access any leadId
- Agent JWT: `req.user.id` must match the lead record

---

## Related Notes
- [[Route-Webhooks]]
- [[Subscription-Flow]]
- [[Stripe-Integration]]
- [[Table-ScrapedAgents]]
