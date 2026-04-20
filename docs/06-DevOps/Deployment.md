# Deployment

---

## Backend — Render

- **Service type**: Web Service
- **Root directory**: `scraper-agent/`
- **Build command**: `npm install && npm run build` (runs `tsc`)
- **Start command**: `node dist/server.js`
- **Node version**: 18+
- **URL**: `https://realestateleadai.onrender.com`

**Environment variables**: Set in Render dashboard (see [[Environment-Variables]])

**Free tier caveat**: Render sleeps after 15 minutes of inactivity. The GitHub Actions keep-alive pings `/api/health` every 14 minutes to prevent this.

---

## Frontend — Vercel

- **Root directory**: `web/`
- **Build command**: `npm run build` (runs `vite build`)
- **Output directory**: `dist/`
- **Framework**: Vite (auto-detected)

**SPA Configuration**: All routes must return `index.html`. Vercel handles this automatically for Vite projects.

**Custom domains**: Each agent website can have its own domain attached. See [[Vercel-Domains]].

**Environment variables**: Set in Vercel dashboard:
- `VITE_API_URL` = Render backend URL
- `VITE_SUPABASE_URL` = Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Supabase public key

---

## Database — Supabase

- **Managed PostgreSQL** — no server to manage
- **Schema migrations**: Applied manually via Supabase SQL Editor (`supabase/migrations/`)
- **Storage bucket**: `agent-assets` — stores agent headshots and logos uploaded via admin panel
- **Storage access**: Public bucket (files are publicly accessible via CDN URL)

---

## Related Notes
- [[CI-CD]]
- [[Environment-Variables]]
- [[Cron-Jobs]]
