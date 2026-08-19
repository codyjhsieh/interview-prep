---
name: refresh-logos
description: Find every company in COMPANIES that is missing a COMPANY_DOMAINS entry and resolve the domains — inline for small counts, parallel research agents for larger batches. Then append to js/data.js.
---

# refresh-logos

Fills gaps in `COMPANY_DOMAINS` (js/data.js). Missing entries render as a
letter tile — not broken, just uglier — so this stage is best-effort.

## Steps

1. Run `scripts/refresh.sh logos`. If it prints `[]`, exit.
2. **Fast path — ≤5 missing AND all names are recognizable brands:** resolve inline from memory. E.g. `LinkedIn → linkedin.com`, `Pagaya → pagaya.com`. No agent needed.
3. **Slow path — >5 missing or unfamiliar names:** dispatch parallel `Explore` agents, ~10 companies per agent. Each agent receives a JSON list of `{id, name}` and returns `{id: "domain.com"}`, skipping anything it can't verify.
4. Append the resolved pairs to the `COMPANY_DOMAINS` map in `js/data.js`, right before the closing `};`, under a `// YYYY-MM-DD backfill (auto)` comment. Never overwrite an existing key.
5. Re-run `scripts/refresh.sh logos` to confirm the count dropped. Anything remaining is unresolvable (e.g. `odyssey-fi` — a private/renamed brand).

## Guardrails

- **Silent-wrong is worse than silent-missing.** Google's S2 CDN returns a generic globe for a wrong domain, so `onerror` never fires. Only append when the agent says `confidence: high`.
- **Never mutate existing entries.** Append only.
- **Soft failure:** if all agents fail, log and continue. `/refresh-ship` still runs.
