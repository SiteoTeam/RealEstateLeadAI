# Integration: Firecrawl

Headless browser scraping service. Used to fetch Coldwell Banker agent profile pages.

---

## Why Firecrawl?

CB profile pages are JavaScript-rendered. A plain `fetch()` only gets the HTML shell. Firecrawl runs a headless browser and returns the fully-rendered HTML.

---

## Usage

```typescript
const result = await firecrawl.scrapePage(url);
// result.html — full rendered HTML
// result.markdown — converted markdown (not used currently)
```

Configuration: `FIRECRAWL_API_KEY` env var.

---

## TypeScript Types

```typescript
interface FirecrawlScrapeResponse {
    success: boolean
    data?: {
        html?: string
        markdown?: string
    }
}
```

Defined in `scraper-agent/src/types.ts`.

---

## Error Handling

If Firecrawl returns `success: false` or times out, the extractor adds to `extraction_errors[]` and returns `422` to the frontend.

---

## Related Notes
- [[Extractor-ColdwellBanker]]
- [[Route-Leads]]
