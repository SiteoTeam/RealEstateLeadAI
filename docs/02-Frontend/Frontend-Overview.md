# Frontend Overview

**Root**: `web/src/`

React 19 + Vite + TypeScript app. One build serves three completely different experiences.

---

## Route Tree

```mermaid
graph TD
    MAIN[main.tsx] --> DR[DomainRouter]
    DR -- "Custom domain resolves" --> PW[PublicWebsite\nslug from domain lookup]
    DR -- "sb-*-auth-token in localStorage" --> APP[App.tsx\nPlatform Dashboard]
    DR -- "Default" --> LP[LandingPage]

    ROUTER[React Router Routes]
    ROUTER --> W_SLUG[/w/:slug → PublicWebsite]
    ROUTER --> ADMIN[/w/:slug/admin → AdminDashboard]
    ROUTER --> ADMIN_LOGIN[/w/:slug/admin/login → AdminLogin]
    ROUTER --> AUDIT[/audit/:token → AuditPage]
    ROUTER --> LOGIN[/login → PlatformLogin]
    ROUTER --> PRIVACY[/privacy → PrivacyPolicy]
```

---

## Three Personas

| Persona | Entry Point | Auth | URL Pattern |
|---------|-------------|------|-------------|
| Platform Admin | `App.tsx` | Supabase session | `siteo.io` (root) |
| Agent | `PublicWebsite` (admin mode) | Agent JWT | `siteo.io/w/:slug/admin` |
| Visitor | `PublicWebsite` (public) or `LandingPage` | None | `siteo.io/w/:slug` or custom domain |

---

## `main.tsx` Entry

Mounts `<DomainRouter />` inside a `<BrowserRouter>` and `<Suspense>` wrapper. Supabase client is initialized at module level from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Related Notes
- [[DomainRouter]]
- [[App-Platform]]
- [[Page-PublicWebsite]]
- [[Page-LandingPage]]
