---
name: refresh-ship
description: Bump the ?v= cache-buster in index.html to today's date, commit js/data.js + index.html, and push to main.
---

# refresh-ship

Deterministic. Bash owns the logic.

```bash
scripts/refresh.sh ship
```

## What it does

- Reads current `?v=YYYY-MM-DD-N` from `index.html`.
- If date == today, increments N. Else sets `TODAY-1`.
- Single `sed` across all 13 occurrences — no drift.
- No-op if `js/data.js` and `index.html` are both unchanged (silence in git history is the correct signal for "nothing changed").
- Otherwise `git add` + `commit` + `push origin main`.

## If the push is blocked

The auto-mode classifier may block direct-to-main pushes. If it does:

1. The commit is already made locally — verify with `git log -1`.
2. Ask the user to authorize the push explicitly, then run `git push origin main`.

## Guardrails

- Only stages `js/data.js` and `index.html`. Any other uncommitted work stays out.
- Never `--no-verify`. Never force-push.
- No commit on no-op.
