# Component: Cold Calls

**File**: `web/src/components/coldcalls/ColdCallsList.tsx`

Sales pipeline board for tracking cold call outreach.

---

## Status Columns

Leads are grouped into status columns (Kanban-style):

| Column | `cold_call_status` value |
|--------|--------------------------|
| New | `queued` |
| Contacted | `contacted` |
| Interested | `interested` |
| Not Interested | `not_interested` |
| Callback | `callback` |

---

## Actions

- Move lead to a different status column → `updateColdCallStatus(id, status, notes)`
- Add notes → `PATCH /api/leads/:id` with `cold_call_notes`
- Call date is automatically set to `NOW()` on status change

---

## Entry Point

Leads enter the cold call board from `LeadsList` via "Add to Cold Calls" action → `markAsColdCall(id)`.

---

## Related Notes
- [[Components-LeadsList]]
- [[Services-API]]
- [[Table-ScrapedAgents]]
