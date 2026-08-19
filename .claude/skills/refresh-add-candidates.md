---
name: refresh-add-candidates
description: Add new companies to CANDIDATES in refresh-companies.py. Dispatches parallel ATS-discovery agents, drops customs, appends the survivors as tuples under a dated batch header.
---

# refresh-add-candidates

Expands the discovery surface. Input: a list of company display names. Output:
new tuples appended to `CANDIDATES` in `scripts/refresh-companies.py`.

## Steps

1. **Deduplicate** against existing CANDIDATES: `grep -oE '\("[a-z0-9-]+","[^"]+"' scripts/refresh-companies.py | cut -d\" -f4 | sort -u`. Drop any name already listed.
2. **Discover ATS boards** via parallel `general-purpose` agents, ~40 companies per agent. Each returns `{name: {ats, slug, confidence}}`. Skip anything marked `custom` — the pipeline can't probe custom career sites.
3. **Draft tuples**: `("id","Name","ats","slug","vertical","sub","stage","raised","lead",["badges"],"notes")`. Use kebab-case ids. Vertical is one of `ai | fintech | consumer | saas | devtools | infra | health | hft | marketplace | media | crypto | proptech | gaming | adtech`.
4. **Append** to `CANDIDATES` under a dated header: `# ── YYYY-MM-DD — <short description> ──`. Also append known logo domains to the `DOMAINS` dict in the same file.
5. **Verify** the file still parses: `python3 -c 'import ast; ast.parse(open("scripts/refresh-companies.py").read())'`.

## Then

Run `/refresh-jobs`. Companies with no live NYC engineering roles will silently drop out of the emit-json output — that's expected and correct.

## Guardrails

- Only include `confidence: high` or `medium` ATS finds. `unknown` and `custom` waste probe budget.
- Never fabricate slugs. If the agent didn't confirm, skip.
- Additive: never remove or edit existing tuples.
