# Component: Leads List (CRM Board)

**File**: `web/src/components/leads/LeadsList.tsx`

The main CRM dashboard — shows all extracted agents with management actions.

---

## Data Loading

Calls `getLeads()` on mount → `GET /api/leads`. Refetches after any mutation.

---

## Features

- **Search**: filter by name, email, or location (client-side)
- **Sort**: by name, contacted date, trial status, paid status
- **Columns**: name, email, phone, location, status badges, actions

---

## Status Badges

| Badge | Condition |
|-------|-----------|
| 🟢 Paid | `is_paid = true` |
| 🔵 Trial Active | `trial_started_at != null AND is_paid = false` |
| 📧 Emailed | `last_contacted_at != null` |
| 🌐 Published | `website_published = true` |

---

## Lead Actions

| Action | API Call | Description |
|--------|---------|-------------|
| Notify | `POST /api/admin/notify-agent/:id` | Send welcome email |
| View Website | — | Opens `/w/:slug` in new tab |
| Edit | — | Opens edit modal (inline fields) |
| Delete | `DELETE /api/leads/:id` | With confirmation dialog |

---

## Related Notes
- [[Services-API]]
- [[Table-ScrapedAgents]]
- [[Route-Leads]]
- [[Route-Admin]]
