# App: Platform Dashboard

**File**: `web/src/App.tsx`

The main CRM dashboard for the platform admin. Only rendered when `DomainRouter` detects a valid Supabase session.

---

## Auth Session Management

```typescript
supabase.auth.onAuthStateChange((event, session) => {
    setSession(session)
    setCheckingAuth(false)
})
```

Shows a spinner while `checkingAuth` is `true`. If no session after check → renders `<PlatformLogin />`.

---

## Tab-Based Navigation

| Tab | Component | Description |
|-----|-----------|-------------|
| `import` | `AgentInput` + `AgentCard` | Single URL extraction workflow |
| `bulk` | `BulkImport` | CSV/Excel batch import |
| `leads` | `LeadsList` | CRM board with all leads |
| `coldcalls` | `ColdCallsList` | Cold calling pipeline |
| `emails` | `EmailLogs` | Email delivery tracking |

---

## Single Import Flow

1. `AgentInput` renders URL text field
2. On submit: calls `extractProfile(url)` from `services/api.ts`
3. `saveState` transitions: `'preview' → 'saving' → 'saved'`
4. `AgentCard` renders the extracted profile for review
5. After save, profile is added to leads list

---

## Related Notes
- [[Components-AgentInput]]
- [[Components-LeadsList]]
- [[Components-ColdCalls]]
- [[Components-EmailLogs]]
- [[Services-API]]
