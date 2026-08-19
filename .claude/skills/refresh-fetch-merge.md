---
name: refresh-fetch-merge
description: Fetch fresh ATS boards for every candidate company and additively merge NYC engineering roles into js/data.js. Emits JSON, refuses to write if the fetch is suspiciously sparse.
---

# refresh-fetch-merge

One command. Deterministic. Bash owns the safety.

```bash
scripts/refresh.sh fetch-merge
```

Expect ~5 min wall time. If you're above 2× that, an ATS is hanging — check `.tmp/refresh.json` for partial progress.

## What it does

- Writes `.tmp/refresh.json` from `refresh-companies.py --emit-json`.
- Aborts if row count < `MIN_ROWS` (default 40, override via env). Guards against mass ATS outage.
- Snapshots `js/data.js` → `.tmp/baseline.js` so pre-existing job URLs get accurate backfilled `added` dates.
- Runs `merge-additive.js`. Additive-only; existing companies and jobs are never removed.

## Success signal

One-line summary from `merge-additive.js`: `Companies: N (added X) / Jobs: M (added Y, deduped Z stale) / Verified: DATE`. Zero adds is still success.
