---
name: refresh-jobs
description: End-to-end refresh of New York + San Diego engineering jobs — parallel fetch + prune, additive merge, logo backfill, cache-buster bump, commit, push. Fully autonomous.
---

# refresh-jobs

One command. Delegates each stage to a smaller skill. Every mutation is
additive to the companies set; jobs can be pruned only if the ATS confirms
their posting IDs are gone.

## Steps

1. **Invoke `/refresh-fetch-merge`.** Under the hood, `scripts/refresh.sh all` runs `fetch` and `prune` **in parallel** — fetch writes `.tmp/refresh.json`, prune mutates `js/data.js`; they touch disjoint state. Then merge unions the fresh rows into the pruned `data.js`. Halts if either child exits non-zero.
2. **Invoke `/refresh-logos`, `/refresh-rankings`, `/refresh-descriptions`, and `/refresh-funding` in parallel.** They edit largely disjoint state:
   - `/refresh-logos` → `COMPANY_DOMAINS` in `js/data.js`
   - `/refresh-rankings` → `COOLNESS` + `QUANT_GATED` in `js/views.js`
   - `/refresh-descriptions` → `desc` on jobs + `tagline` on companies in `js/data.js`
   - `/refresh-funding` → `raised` / `stage` / `lead` on companies in `js/data.js`.
     Must run in the same session as the fetch: it reads `descRaw` from
     `.tmp/refresh.json`, which the fetch stage writes and nothing persists.
   All soft — graceful fallback if agents fail (letter tile, vertical-default coolness, descRaw fallback for missing desc).
   Note: `/refresh-logos`, `/refresh-descriptions`, and `/refresh-funding` all touch `js/data.js`. Run their write steps sequentially (logos → descriptions → funding); the research/dispatch part can still parallelize.
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

## Environment notes (Linux / Claude Code on the web)

The pipeline runs unmodified on Linux as well as macOS — `refresh.sh` uses no
BSD-only flags, and `ship` pushes to the current branch's upstream rather than
a hardcoded `main`, so in a remote session it lands on the session branch.

- All seven ATS backends (Ashby, Greenhouse, Lever, Workable, Teamtailor,
  SmartRecruiters, Workday) are reachable through the agent proxy.
- A handful of custom career domains get CONNECT-tunnel 502s behind the proxy.
  Those companies drop out of a fetch and are never pruned — `check-dead.js`
  leaves boards it could not fetch alone. Expected, not a failure.
- `.tmp/` is gitignored; both `refresh.json` and the `baseline.js` snapshot
  live there.

## Guardrails

- Never call `refresh-companies.py` without `--emit-json`. The unflagged path rewrites `js/data.js` in place — the bug that once wiped 425 lines.
- Never remove companies; only prune-confirmed dead jobs.
- Stage 1 hard-halts on non-zero exit from either fetch or prune.
- On empty diff, `/refresh-ship` no-ops — silence is the correct signal for "nothing changed."
