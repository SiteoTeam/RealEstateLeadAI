# Environment Variables

---

## Backend (`scraper-agent/.env`)

| Variable | Required | Used In | Notes |
|----------|----------|---------|-------|
| `SUPABASE_URL` | Yes | `db.ts`, `supabaseAuth.ts` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | `db.ts`, `webhooks.ts` | Bypasses RLS — keep secret |
| `SUPABASE_ANON_KEY` | Yes | `supabaseAuth.ts` | For Supabase Auth token verification |
| `RESEND_API_KEY` | Yes | `email.ts` | Resend email sending |
| `RESEND_FROM_EMAIL` | No | `email.ts` | Defaults to `George@siteo.io` |
| `RESEND_WEBHOOK_SECRET` | Yes | `webhooks.ts` | Svix signature verification |
| `STRIPE_SECRET_KEY` | Yes | `stripe.ts`, `db.ts` | Stripe payment processing |
| `STRIPE_PRICE_ID` | Yes | `stripe.ts` | Subscription price object ID |
| `STRIPE_WEBHOOK_SECRET` | Yes | `webhooks.ts` | Stripe webhook signature |
| `VERCEL_AUTH_TOKEN` | Yes | `vercel.ts` | Vercel domain management |
| `VERCEL_PROJECT_ID` | Yes | `vercel.ts` | Target Vercel project |
| `VERCEL_TEAM_ID` | No | `vercel.ts` | Optional team scope |
| `CRON_SECRET` | Recommended | `admin.ts` | Secures cron endpoints via `x-cron-secret` header |
| `DEFAULT_AGENT_PASSWORD` | No | `admin.ts`, `webhooks.ts` | Defaults to `welcome123` |
| `CLIENT_URL` | Yes | Multiple | `https://siteo.io` in production |
| `PORT` | No | `server.ts` | Defaults to `3001` |
| `NODE_ENV` | No | `server.ts` | `production` adds CORS restrictions |

---

## Frontend (`web/.env`)

| Variable | Required | Used In | Notes |
|----------|----------|---------|-------|
| `VITE_API_URL` | Yes | `api.ts` | Backend base URL (Render URL in prod) |
| `VITE_SUPABASE_URL` | Yes | `App.tsx`, `DomainRouter.tsx` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Yes | `App.tsx` | Public Supabase key for frontend auth |

---

## How Variables Are Loaded

- **Backend**: `dotenv.config()` called at top of `scraper-agent/src/server.ts:8`
- **Frontend**: Vite automatically exposes `VITE_*` prefixed vars via `import.meta.env`

## Security Notes

- `SUPABASE_SERVICE_KEY` has full DB access bypassing RLS — never expose to frontend
- `SUPABASE_ANON_KEY` is safe for frontend use (limited by RLS policies)
- All Stripe/Resend keys are backend-only
- `CRON_SECRET` prevents unauthorized cron endpoint triggering

---

## Related Notes
- [[Auth-Middleware]]
- [[Service-Database]]
- [[Stripe-Integration]]
- [[Resend-Email]]
- [[Cron-Jobs]]
