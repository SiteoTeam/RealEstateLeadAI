# Service: Email

**File**: `scraper-agent/src/services/email.ts`

All email sending via Resend. Six email types, each backed by an HTML template.

---

## Initialization

```typescript
export const resend = apiKey ? new Resend(apiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'George@siteo.io';
```

Null-safe — if `RESEND_API_KEY` is missing, all send functions return `{ success: false }` gracefully.

---

## Function Reference

| Function | Trigger | Subject | Template |
|----------|---------|---------|----------|
| `sendWelcomeEmail()` | Admin clicks "Notify Agent" | `Your agent profile on Google` | `templates/welcome.ts` |
| `sendAdminAccessEmail()` | First `email.clicked` webhook | `Admin access to your website` | `templates/auth.ts` |
| `sendPasswordResetEmail()` | Agent requests reset | `Reset Your Siteo Password` | `templates/auth.ts` |
| `sendTrialExpiryReminderEmail()` | 10-day trial cron | `${daysLeft} days left to keep your site active` | `templates/auth.ts` |
| `sendPaymentSuccessEmail()` | `invoice.payment_succeeded` webhook | `Payment Successful - Siteo Receipt` | `templates/payment.ts` |
| `sendAuditEmail()` | Admin creates audit | `Website Report for ${agentName}` | `templates/audit.ts` |
| `sendContactEmail()` | Agent contact form submission | `New Website Inquiry from ${visitor}` | `templates/contact.ts` |

---

## Email Logging Pattern

Every send inserts a row into `email_logs`:
```typescript
await db.from('email_logs').insert({
    lead_id: leadId || null,
    recipient: agentEmail,
    subject: '...',
    status: 'sent',
    resend_id: result?.id,  // Resend's ID for webhook correlation
    created_at: new Date().toISOString()
});
```

The `resend_id` is how `routes/webhooks.ts` correlates incoming webhook events back to this log entry.

---

## Unsubscribe Headers

Marketing emails (`sendWelcomeEmail`, `sendAuditEmail`) include:
```
List-Unsubscribe: <https://siteo.io/api/public/unsubscribe/:leadId>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

This ensures CAN-SPAM / RFC 8058 compliance and shows an unsubscribe button in Gmail.

---

## Related Notes
- [[Resend-Email]]
- [[Route-Webhooks]]
- [[Table-EmailLogs]]
- [[Email-Funnel]]
