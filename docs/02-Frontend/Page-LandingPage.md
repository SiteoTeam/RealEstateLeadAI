# Page: Landing Page

**File**: `web/src/pages/LandingPage.tsx`

Public marketing site for siteo.io. Shown to visitors who are not logged in and not on a custom domain.

---

## Key Sections

- **Hero** — headline, subheadline, CTA button
- **Features** — what the platform does (extract, CRM, website, email)
- **How It Works** — 3-step process
- **Pricing** — subscription tier
- **Intake Form** — name, email, phone, message

---

## Intake Form Submission

POSTs to `POST /api/public/intake` — sends a notification email to `siteoteam@gmail.com`. No DB storage.

---

## Related Notes
- [[Route-Public]]
- [[DomainRouter]]
