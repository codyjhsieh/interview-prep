---
name: refresh-jobs
description: End-to-end refresh of NYC engineering jobs — fetch fresh ATS boards, additive-merge into js/data.js, resolve any missing company logos, bump the cache-buster, commit, push. Fully autonomous.
---

# refresh-jobs

Runs the full pipeline. Each stage lives in its own skill so it can also be
run standalone. Every mutation is additive — nothing gets removed.

Expect ~5 min wall time, mostly network. The bash script owns the safety.

## Steps

1. **Invoke `/refresh-fetch-merge`.** Halts the pipeline if it exits non-zero (sparse fetch means an ATS outage; don't merge a partial view).
2. **Invoke `/refresh-logos`.** Soft — if agents can't resolve a domain, ship anyway (letter tile is a graceful fallback).
3. **Invoke `/refresh-ship`.** Bump `?v=`, commit, push.

## Guardrails

- Never call `refresh-companies.py` without `--emit-json`. The unflagged path rewrites `js/data.js` in place — that's the bug that once wiped 425 lines.
- Never remove companies or jobs. `merge-additive.js` enforces this; don't work around it.
- Stop-on-error: stages 1 and 3 are hard; stage 2 is soft.
- When the diff is empty, `/refresh-ship` no-ops — don't force a commit.

## Verification

After the run, expect:
- `git log -1` shows a `Data refresh YYYY-MM-DD + cache-bust to YYYY-MM-DD-N` commit.
- `grep -oE '?v=[^\"]+' index.html | sort -u` returns exactly one buster.
- `scripts/refresh.sh logos` returns `[]` or a short list of known-unresolvable ids.
