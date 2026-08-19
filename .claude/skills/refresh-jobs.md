---
name: refresh-jobs
description: End-to-end refresh of NYC engineering jobs — parallel fetch + prune, additive merge, logo backfill, cache-buster bump, commit, push. Fully autonomous.
---

# refresh-jobs

One command. Delegates each stage to a smaller skill. Every mutation is
additive to the companies set; jobs can be pruned only if the ATS confirms
their posting IDs are gone.

## Steps

1. **Invoke `/refresh-fetch-merge`.** Under the hood, `scripts/refresh.sh all` runs `fetch` and `prune` **in parallel** — fetch writes `.tmp/refresh.json`, prune mutates `js/data.js`; they touch disjoint state. Then merge unions the fresh rows into the pruned `data.js`. Halts if either child exits non-zero.
2. **Invoke `/refresh-logos` and `/refresh-rankings` in parallel.** They edit disjoint files (`js/data.js` COMPANY_DOMAINS vs `js/views.js` COOLNESS/QUANT_GATED). Both soft — if agents can't resolve, ship with the graceful fallback (letter tile / vertical-based coolness default).
3. **Invoke `/refresh-ship`.** Bump `?v=`, stage `js/data.js` + `js/views.js` + `index.html`, commit, push.

## Timing (measured on ~600 candidates)

| Stage | Serial (pre-2026-08-19) | Parallel (now) |
|---|---|---|
| fetch | 7 min | ~1-2 min (10-worker `ThreadPoolExecutor`) |
| prune | 5 min | ~2 min (LIMIT=10 workers, was 5) |
| fetch+prune wall | 12 min serial | max(fetch, prune) ≈ 2 min parallel |
| merge | <1 s | <1 s |
| logos check | <1 s | <1 s |
| logos + rankings | ~1-2 min if agents needed | in parallel — max(logos, rankings) |
| ship | 1-3 s | 1-3 s |
| **total** | ~12 min | **~3-5 min** |

Concurrency knobs: `REFRESH_WORKERS` (fetch), `DEAD_WORKERS` (prune), `MIN_ROWS` (sparse-fetch abort threshold, default 40).

## Guardrails

- Never call `refresh-companies.py` without `--emit-json`. The unflagged path rewrites `js/data.js` in place — the bug that once wiped 425 lines.
- Never remove companies; only prune-confirmed dead jobs.
- Stage 1 hard-halts on non-zero exit from either fetch or prune.
- On empty diff, `/refresh-ship` no-ops — silence is the correct signal for "nothing changed."
