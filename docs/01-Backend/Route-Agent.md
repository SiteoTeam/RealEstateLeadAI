# Route: Agent

**File**: `scraper-agent/src/routes/agent.ts`

Agent-specific protected operations using the agent JWT strategy.

---

## Purpose

These endpoints are for individual agents accessing their own dashboard at `/w/:slug/admin`. Authentication is via the custom agent JWT (Strategy 2 in [[Auth-Middleware]]).

Key operations include:
- Agent login (validate password → issue JWT)
- Password change
- Password reset request/verification

---

## Ownership Enforcement

Every route verifies that the authenticated agent's `slug` matches the `:slug` in the URL. An agent with slug `john-smith` cannot access endpoints for `jane-doe`.

---

## Related Notes
- [[Auth-Middleware]]
- [[Service-Auth]]
- [[Page-AdminLogin]]
- [[Page-AdminDashboard]]
