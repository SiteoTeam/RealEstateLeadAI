# Server Entry

**File**: `scraper-agent/src/server.ts`

Express application bootstrap. All routes are mounted here.

---

## CORS Configuration

```typescript
origin: [
  'https://siteo.io',
  'https://www.siteo.io',
  ...(NODE_ENV !== 'production' ? ['http://localhost:5173'] : [])
]
```

Dev mode adds `localhost:5173` (Vite dev server). Production is locked to `siteo.io`.

---

## Raw Body Capture

```typescript
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}));
```

Required so that `routes/webhooks.ts` can verify Stripe webhook signatures using the exact bytes sent.

---

## Route Mounting

| Mount Path | Router | Auth | Notes |
|------------|--------|------|-------|
| `/api/admin` | `adminRoutes` | Supabase auth | Config, uploads, domains, batch emails |
| `/api/public` | `publicRoutes` | None | Unsubscribe, intake form |
| `/api/webhooks` | `webhookRoutes` | Signed | Resend + Stripe webhooks |
| `/api/stripe` | `stripeRoutes` | Supabase auth | Checkout, cancel, portal |
| `/api/agent` | `agentRoutes` | Agent JWT | Agent-specific operations |
| `/api/audit` | `auditRoutes` | Mixed | Create (protected), fetch/submit (open) |
| `/api` | `leadsRoutes` | Supabase auth | `/extract` + `/leads` endpoints |
| `/api/website` | `websiteRoutes` | None | Public website data at `/:slug` |
| `/api/contact` | `contactRoutes` | None | Contact form submission |

---

## Special Endpoints

- `POST /api/admin/seed-passwords` — Protected, triggers `seedDefaultPasswords()`
- `GET /api/health` — Returns `{ status: 'ok', timestamp }` — used by GitHub Actions keep-alive

---

## Related Notes
- [[Routes-Overview]]
- [[Auth-Middleware]]
- [[CI-CD]]
