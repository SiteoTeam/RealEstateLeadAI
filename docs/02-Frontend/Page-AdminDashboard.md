# Page: Admin Dashboard

**File**: `web/src/pages/admin/AdminDashboard.tsx`

Agent-facing admin panel at `/w/:slug/admin`. Protected by agent JWT.

---

## Sub-Sections

| Section | Component | Description |
|---------|-----------|-------------|
| Content Editor | `ContentEditor` | Edit headline, tagline, bio, services |
| Theme Editor | `ThemeEditor` | Pick color scheme, font |
| Domain Manager | `DomainManager` | Add/verify/remove custom domain |
| Website Settings | `WebsiteConfigModal` | Toggle published, change slug |
| Billing | Inline | Upgrade button → Stripe checkout; Cancel → Stripe cancel |

---

## Config Save Flow

1. Agent edits config in the UI
2. Click Save → `PATCH /api/admin/config/:id` (merge update)
3. `website_config` JSONB is updated without overwriting unrelated keys

---

## Image Upload

Upload button → file picker → `POST /api/admin/upload/:slug` → returns CDN URL → updates `headshot_url` or `logo_url` in config.

---

## Billing Buttons

- **Upgrade**: calls `createCheckoutSession(leadId, returnUrl)` → redirects to Stripe
- **Cancel**: calls `cancelSubscription(leadId)` → `cancel_at_period_end: true`

---

## Related Notes
- [[Route-Admin]]
- [[Route-Stripe]]
- [[Components-WebsiteEditor]]
- [[Subscription-Flow]]
