---
name: refresh-add-candidates
description: Add new companies to CANDIDATES. Dispatches parallel ATS-discovery agents (50-per-batch × 4 = ~200 companies at once), drops customs, appends survivors as tuples under a dated batch header.
---

# refresh-add-candidates

Expands the discovery surface. Input: a list of company display names.
Output: new tuples appended to `CANDIDATES` in `scripts/refresh-companies.py`.

## Steps

1. **Deduplicate against existing CANDIDATES.**
   ```bash
   grep -oE '\("([a-z0-9-]+)"' scripts/refresh-companies.py | tr -d '(",' | sort -u > /tmp/existing_ids.txt
   ```
   Grep each proposed kebab-id against `/tmp/existing_ids.txt`.

2. **Dispatch parallel `general-purpose` agents — 50 companies per agent, 4 agents = 200 companies concurrently.** Each agent's job: for each name, WebFetch the careers page, identify the ATS platform, return `{name: {ats, slug, confidence}}` where `confidence ∈ {high, medium, unknown, custom}`. `custom` = company runs an in-house / non-supported ATS (Oracle HCM, Phenom, iCIMS, SAP SuccessFactors) — skip.

3. **Draft tuples**: `("id","Name","ats","slug","vertical","sub","stage","raised","lead",["badges"],"notes")`. Vertical is one of `ai | fintech | consumer | saas | devtools | infra | health | hft | marketplace | media | crypto | proptech | gaming | adtech | aerospace | defense | robotics | automotive | ed`.

4. **Append** to `CANDIDATES` under a dated header (`# ── YYYY-MM-DD — <what and why> ──`). Also append known logo domains to the `DOMAINS` dict in the same file.

5. **Verify parse**: `python3 -c 'import ast; ast.parse(open("scripts/refresh-companies.py").read())'`.

6. **Verify count**: `awk '/^CANDIDATES = \[/,/^]/' scripts/refresh-companies.py | grep -cE '^\s*\("'`.

## Then

Run `/refresh-jobs`. Non-NYC-hiring companies silently drop out of `--emit-json` — expected. Companies with only excluded titles (security engineer, research engineer, etc. per TITLE_EXCLUDE) also drop.

## Guardrails

- Only include `confidence: high` or `medium` finds. `unknown` and `custom` waste probe budget.
- Never fabricate slugs. If the agent didn't confirm, skip.
- Additive: never remove or edit existing tuples.

## Yield expectations (measured)

- ATS research (4 parallel agents × 50 names): 5-18 min wall.
- Of 200 names → ~90-110 have usable public ATS boards (~50% yield).
- Of those, ~10-20 typically have live NYC engineering openings (~10-20% survival through the NYC + title filter).
- Big-tech (Google, Meta, Amazon), old-line banks (JPMC, Wells Fargo), and PE giants (Blackstone, KKR) almost always run custom career sites and drop out.
