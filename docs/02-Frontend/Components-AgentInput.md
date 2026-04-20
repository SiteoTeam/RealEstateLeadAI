# Component: Agent Input

**Files**: `web/src/components/agent/AgentInput.tsx`, `AgentCard.tsx`

The single-import workflow in the platform dashboard.

---

## `AgentInput`

- Text field accepting a Coldwell Banker URL
- Validates with `isValidCBUrl(url)` — must include `coldwellbanker.com` and `/agents/`
- On submit: calls `extractProfile(url)` → shows `AgentCard` with results

---

## `AgentCard`

Renders extracted `CBAgentProfile` before saving:
- Headshot preview
- Name, email, phone
- Bio excerpt
- Social links detected
- Save button with `saveState` indicator: `'preview' | 'saving' | 'saved'`

---

## Related Notes
- [[App-Platform]]
- [[Services-API]]
- [[Extractor-ColdwellBanker]]
