---
name: refresh-audit
description: Audit the fit-score distribution across live COMPANIES. Flags anomalies — >15% at cap/floor (distribution collapsed) or bimodal (missing vertical metadata) — that indicate the ranking is squashed and needs manual tuning.
---

# refresh-audit

Runs after every `/refresh-jobs` when you want to confirm the ranking is
still spread across the full 15-85 band. Standalone; not part of the
default `all` pipeline (adds no user-visible value on green runs).

## Run

```bash
scripts/refresh.sh audit           # human-readable histogram + top-15 + bottom-10
scripts/refresh.sh audit --json    # machine-readable (for cron / dashboards)
```

## What to look for

- **`>15% at cap (85)`** — verticals like AI are overweighting. Add companies to `ELITE` in `js/views.js` to pull them down.
- **`>15% at floor (15)`** — public/late-stage/enterprise companies collapsing. Expected if you added a lot of public companies (this run: 20 at floor from banks + HFT + big-SaaS additions).
- **Bimodal (2+ peaks)** — a whole vertical is missing metadata; check that new tuples set `vertical` correctly.
- **Top 15** — should be a mix of AI startups + high-COOLNESS consumer brands.
- **Bottom 10** — should be enterprise SaaS + big-cap fintech (Lyft, Chime, Braze, etc. is correct).

## Guardrails

- Read-only. Never mutates any file.
- The JS scoring in `scripts/score-dist.mjs` mirrors `js/views.js:companyFitScore`. If you change the JS formula, mirror it here too — the audit's job is to detect production drift.
