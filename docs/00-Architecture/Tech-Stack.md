# Tech Stack

---

## Backend (`scraper-agent/`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | HTTP server and routing |
| `typescript` | ^5.3.0 | Type safety |
| `@supabase/supabase-js` | ^2 | PostgreSQL client + auth verification |
| `firecrawl-js` | latest | Headless scraping service API client |
| `cheerio` | ^1 | Server-side HTML/DOM parsing |
| `resend` | ^2 | Transactional email sending |
| `stripe` | ^14 | Payment processing and subscriptions |
| `svix` | ^1 | Webhook signature verification (Resend) |
| `multer` | ^1 | Multipart file upload handling |
| `bcryptjs` | ^2 | Password hashing for agent accounts |
| `jsonwebtoken` | ^9 | Agent JWT creation and verification |
| `fuse.js` | ^7 | Fuzzy search (admin panel) |
| `cors` | ^2 | Cross-origin request middleware |
| `dotenv` | ^16 | Environment variable loading |
| `ts-node` | ^10 | TypeScript execution for dev |

---

## Frontend (`web/`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.0 | UI framework |
| `react-dom` | 19.2.0 | DOM rendering |
| `vite` | 7.2.4 | Build tool and dev server |
| `typescript` | ~5.9.3 | Type safety |
| `tailwindcss` | 4.1.18 | Utility-first CSS |
| `framer-motion` | 12.29.2 | Page and scroll animations |
| `react-router-dom` | 7.13.0 | Client-side routing |
| `@supabase/supabase-js` | ^2 | Auth session management |
| `lucide-react` | 0.563.0 | Icon library |
| `xlsx` | ^0.18 | Excel/CSV parsing for bulk import |
| `react-google-recaptcha-v3` | ^1 | reCAPTCHA for contact form |
| `vitest` | 4.0.18 | Unit testing framework |

---

## External Services

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| **Supabase** | PostgreSQL DB, auth, file storage | Service key (backend), Anon key (frontend) |
| **Firecrawl** | Headless browser scraping | API key |
| **Resend** | Transactional email | API key + Svix webhook signing |
| **Stripe** | Subscription billing | Secret key + webhook signing secret |
| **Vercel** | Frontend hosting + custom domains | Bearer token + project/team IDs |

---

## Related Notes
- [[Environment-Variables]]
- [[System-Overview]]
