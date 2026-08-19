---
name: refresh-ship
description: Bump the ?v= cache-buster in index.html to today's date, commit js/data.js + js/views.js + index.html, and push to the current branch's upstream.
---

# refresh-ship

Deterministic. Bash owns the logic.

```bash
scripts/refresh.sh ship
```

## What it does

- Reads current `?v=YYYY-MM-DD-N` from `index.html`.
- If date == today, increments N. Else sets `TODAY-1`.
- Single `sed` across all 13 occurrences — no drift. Written via
  write-then-move rather than `sed -i`, so it runs on GNU and BSD userland
  alike (`sed -i ''` is a macOS-ism that fails on Linux).
- No-op if `js/data.js` and `index.html` are both unchanged (silence in git history is the correct signal for "nothing changed").
- Otherwise `git add` + `commit` + `git push -u origin <current-branch>`.
  Pushes to whatever branch is checked out — main locally, a feature branch
  in a Claude Code remote session — never to a hardcoded `main`.

## If the push is blocked

The auto-mode classifier may block direct-to-main pushes. If it does:

1. The commit is already made locally — verify with `git log -1`.
2. Ask the user to authorize the push explicitly, then run
   `git push -u origin "$(git rev-parse --abbrev-ref HEAD)"`.

## Guardrails

- Only stages `js/data.js` and `index.html`. Any other uncommitted work stays out.
- Never `--no-verify`. Never force-push.
- No commit on no-op.
