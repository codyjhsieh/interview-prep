---
name: refresh-fetch-merge
description: Fetch fresh ATS boards in parallel (10 workers) and additively merge NYC engineering roles into js/data.js. Refuses to write on suspiciously sparse fetches.
---

# refresh-fetch-merge

Deterministic. Bash owns safety; the skill just invokes it.

```bash
scripts/refresh.sh fetch-merge         # fetch + merge alone
scripts/refresh.sh all                 # fetch + prune in parallel, then merge, ship
REFRESH_WORKERS=20 scripts/refresh.sh fetch    # push fetch concurrency higher
```

Expect ~1-2 min wall for fetch alone (was 7 min before parallelization).

## What it does

- Writes `.tmp/refresh.json` from `refresh-companies.py --emit-json`. Fetch is now a `ThreadPoolExecutor(max_workers=REFRESH_WORKERS)` — order preserved via `sorted(rows_by_idx)`.
- Aborts if row count < `MIN_ROWS` (default 40).
- Snapshots `js/data.js` → `.tmp/baseline.js` for accurate `added` backfill.
- Runs `merge-additive.js`. Additive-only; existing companies/jobs never removed.

## Success signal

One-line summary: `Companies: N (added X) / Jobs: M (added Y, deduped Z stale) / Verified: DATE`. Zero adds is still success.
