# Component: Email Logs

**File**: `web/src/components/EmailLogs.tsx`

Tracks all sent emails and their delivery status.

---

## Data Loading

Calls `getEmailLogs()` → `GET /api/admin/emails`. Returns all `email_logs` rows.

---

## Status Badges

| Status | Meaning |
|--------|---------|
| `sent` | Accepted by Resend |
| `delivered` | Confirmed delivery to inbox |
| `opened` | Recipient opened (not bot) |
| `clicked` | Recipient clicked a link |
| `bounced` | Hard bounce — invalid email |
| `complained` | Spam report |
| `failed` | Resend API error on send |

---

## Actions

- **Delete logs for recipient**: calls `deleteEmailLogs(recipient)` → `DELETE /api/admin/emails/:recipient`
- Status badges are color-coded for at-a-glance pipeline health

---

## Related Notes
- [[Table-EmailLogs]]
- [[Email-Funnel]]
- [[Route-Admin]]
