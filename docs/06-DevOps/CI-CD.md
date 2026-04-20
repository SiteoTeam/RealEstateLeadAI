# CI/CD

**File**: `.github/workflows/keep-alive.yml`

Currently a single workflow — keep-alive to prevent Render free-tier sleep.

---

## keep-alive.yml

```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/14 * * * *'   # Every 14 minutes
  workflow_dispatch:           # Manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: curl -I https://realestateleadai.onrender.com/api/health
```

**Why 14 minutes**: Render free tier sleeps after 15 minutes of no traffic. 14 minutes provides a safe margin.

**Why `workflow_dispatch`**: Allows manually triggering from GitHub Actions UI when testing.

---

## Future CI Opportunities

Currently there are no automated tests or linting in CI. Opportunities to add:

```yaml
- name: Type check backend
  run: cd scraper-agent && npm run build

- name: Type check frontend
  run: cd web && npm run build

- name: Run tests
  run: cd web && npm run test
```

---

## Related Notes
- [[Deployment]]
- [[Cron-Jobs]]
