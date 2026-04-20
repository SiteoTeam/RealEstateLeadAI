# Integration: Resend

Transactional and marketing email provider.

---

## Configuration

```
RESEND_API_KEY         — Resend API key
RESEND_FROM_EMAIL      — Verified sender (George@siteo.io)
RESEND_WEBHOOK_SECRET  — Svix signing secret for webhook verification
```

The `FROM_EMAIL` must be from a domain verified in Resend's dashboard (`siteo.io` domain).

---

## Email Types

| Email | Marketing? | Unsubscribe Link? |
|-------|-----------|-------------------|
| Welcome email | Yes | Yes |
| Admin access email | Transactional | No |
| Password reset | Transactional | No |
| Trial expiry reminder | Marketing | No |
| Payment success | Transactional | No |
| Audit email | Marketing | Yes |
| Contact form notification | Transactional | No |

---

## Webhook Events

Resend fires events to `POST /api/webhooks/resend` (signed with Svix):

| Event | What It Triggers |
|-------|-----------------|
| `email.sent` | Status: `sent` |
| `email.delivered` | Status: `delivered` |
| `email.opened` | Status: `opened` (bot check applies) |
| `email.clicked` | Status: `clicked` → starts agent trial |
| `email.bounced` | Status: `bounced` (terminal) |
| `email.complained` | Status: `complained` (terminal) |

---

## Inbound Email

Resend handles inbound emails to `hello@siteo.io` and forwards to `/api/webhooks/resend/inbound`. Backend forwards to `siteoteam@gmail.com` after safety checks. See [[Route-Webhooks]] for loop prevention details.

---

## Related Notes
- [[Service-Email]]
- [[Route-Webhooks]]
- [[Email-Funnel]]
- [[Table-EmailLogs]]
