# Component: Website Editor

**Files**: Multiple under `web/src/components/website/` and `web/src/components/admin/`

The inline visual editing system for agent websites.

---

## Components

### `EditableText`
Inline click-to-edit component. Shows text normally; on click switches to input/textarea. Used throughout `PublicWebsite.tsx` when in admin mode.

### `VisualEditorToolbar`
Floating toolbar shown in admin mode:
- **Save** button (active when dirty)
- **Undo** (calls `history.undo()`)
- **Redo** (calls `history.redo()`)
- **Preview** — toggles public-only view

### `ContentEditor`
Full form editor in `AdminDashboard` sidebar:
- Headline, tagline, bio text areas
- Services list (add/remove/edit)
- Booking URL field

### `ThemeEditor`
Color and font picker:
- Primary color (hex input + color wheel)
- Dark/light mode toggle
- Font family selection

### `DomainManager`
Custom domain attachment UI:
- Input domain name → `POST /api/admin/domains`
- Shows DNS verification instructions (CNAME record to add)
- Polls `GET /api/admin/domains/:domain` for `verified: true`
- Remove button → `DELETE /api/admin/domains/:domain`

---

## `website_config` JSONB Shape

```json
{
    "custom_domain": "agentname.com",
    "theme": "dark",
    "primary_color": "#6366f1",
    "headline": "Your Trusted Real Estate Expert",
    "tagline": "Helping families find home",
    "bio_override": "Custom bio text...",
    "services": [
        { "title": "Buyer Representation", "description": "..." }
    ],
    "booking_url": "https://calendly.com/...",
    "testimonials": [
        { "name": "Jane D.", "text": "...", "rating": 5 }
    ]
}
```

---

## Related Notes
- [[Page-PublicWebsite]]
- [[Page-AdminDashboard]]
- [[Route-Admin]]
- [[Table-ScrapedAgents]]
