# Page: Public Website

**File**: `web/src/pages/PublicWebsite.tsx`

The dynamically rendered agent website. Serves two modes from the same component.

---

## Dual Mode

| Mode | Who Sees It | URL |
|------|-------------|-----|
| **Public View** | Visitors | `/w/:slug` or custom domain |
| **Editor Mode** | Agent (logged in) | `/w/:slug/admin` shows `<AdminDashboard>` which wraps this |

---

## Data Fetching

On mount, calls `getWebsiteBySlug(slug)` → `GET /api/website/:slug`. Returns the full `DBProfile` row. If not found or unpublished → 404 message.

---

## Preview Notice System

When URL has `?source=email` or `?source=audit` query params, a preview banner is shown: "You're previewing your website — click here to customize it."

---

## Config and State

- `localConfig` — current state (editable in admin mode)
- `savedConfig` — last saved state
- Dirty check: save button is enabled when `localConfig !== savedConfig`
- `useHistory()` hook provides undo/redo support for config changes

---

## Website Sections Rendered

1. **FloatingNavbar** — sticky top nav with mobile hamburger
2. **Hero** — headshot, headline, tagline, CTA
3. **Stats** — years experience, transactions, satisfaction
4. **Bio** — full bio text
5. **Services** — list with modal detail view
6. **Contact Form** — with reCAPTCHA v3 validation
7. **Testimonials** — carousel
8. **Footer** — social links, branding

---

## Framer Motion

Sections animate in on scroll with `initial={{ opacity: 0, y: 40 }}` + `whileInView={{ opacity: 1, y: 0 }}`.

---

## Related Notes
- [[Components-WebsiteEditor]]
- [[Services-API]]
- [[Page-AdminDashboard]]
- [[Route-Website]]
