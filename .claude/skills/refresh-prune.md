---
name: refresh-prune
description: Re-fetch every company board and remove jobs whose posting IDs no longer exist. Never touches unfetchable companies. Part of /refresh-jobs; also runnable standalone.
---

# refresh-prune

Removes dead job postings from `js/data.js`. Called by `/refresh-jobs`
between merge and logos. Also runnable alone.

```bash
scripts/refresh.sh prune             # via orchestrator (calls --prune)
node scripts/check-dead.js           # dry run → /tmp/dead_links.json
node scripts/check-dead.js --prune   # standalone
```

Adds ~5 min to `/refresh-jobs` — re-fetches each board unfiltered so
posting-ID membership can be verified.

## Guardrails

- Prunes only when: company board fetched OK AND posting ID absent from live board AND full board returned (not truncated). Any one of those failing → leave alone.
- Companies whose board fetch failed are untouched — never removes on doubt.
- Standalone runs should be followed by `/refresh-ship` to bump cache + push.
