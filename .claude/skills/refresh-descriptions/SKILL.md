---
name: refresh-descriptions
description: Summarize raw ATS job bodies into one-line descriptions and generate punchy company taglines. Dispatches parallel LLM agents batched by company, additively writes back to js/data.js.
---

# refresh-descriptions

Two independent backfills, both driven by parallel `general-purpose`
agents. Each writes to `js/data.js` (additive-only — never overwrites
an existing `desc` or `tagline`).

## Steps

1. Run `scripts/refresh.sh descriptions --count` — one-line summary of gaps.
2. Run `scripts/refresh.sh descriptions > .tmp/descriptions-input.json` — full JSON payload: `{jobs:[{company,id,url,title,level,descRaw}], companies:[{id,name,sub,notes}]}`.
3. **Company tagline batches (fast):** partition the `companies` list into batches of ~30. Dispatch parallel agents (up to 10 concurrent). Each agent receives the batch and returns `{id: tagline}` — **≤32 characters, typically 4–5 words**, present tense ("Ship money at planet scale." = 27 chars). Merge all outputs into `.tmp/descriptions-companies.json`.
4. **Job desc batches (larger):** partition the `jobs` list into batches of ~30 (grouped by company where possible so the agent sees consistent context). Dispatch parallel agents (up to 30 concurrent). Each agent receives the batch — title + level + first 800 chars of `descRaw` — and returns `{url: desc}` — **≤55 characters, typically 6–8 words**, action-verb led, with the **first two words carrying the meaning** ("Build LLM-eval infra for enterprise deploys." = 44 chars). Merge into `.tmp/descriptions-jobs.json`.
5. Combine into one file: `{jobs: [...], companies: [...]}` → `.tmp/descriptions-merged.json`.
6. Apply: `node scripts/apply-descriptions.mjs .tmp/descriptions-merged.json`. Additive; caps to 140 chars.
7. Verify: `scripts/refresh.sh descriptions --count` — expect `jobsWithDesc` up by the number of applied descs, `companiesWithTagline` up by the number of applied taglines.

## Agent prompt shape

**Company tagline (batch of 30 companies):**
> For each company below, write a tagline of **at most 32 characters** (usually 4-5 words) that's punchier than the existing `sub` field. Present tense, action verb, no filler. Count the characters — anything longer is cut off with an ellipsis on the company card, on phones and desktop alike. Return JSON `{id: tagline}`. Example: `{"stripe": "Ship money at planet scale."}` (27 chars).

**Job desc (batch of 30 jobs):**
> For each job below, write a one-line description of what the engineer will actually work on, drawn from the `descRaw` body — **at most 55 characters** (usually 6-8 words). Action verb first, no company name, no seniority. The first two words must carry the meaning: on a phone the row clips after ~18 characters. Return JSON `{url: desc}`. Example: `{"https://...": "Build LLM-eval infra for enterprise deploys."}` (44 chars).

## Mobile budget (measured 2026-08-19)

Both fields render with Tailwind's `truncate` — one line, hard ellipsis, no
wrapping — so the box width is a hard character budget. Measured in Chromium
at iPhone widths against the live board:

| Field | Where it renders | Narrowest box | Fits | Corpus fully visible |
|---|---|---|---|---|
| `tagline` | company card (`js/views.js:5692`) | 212px @375-393px | ~32 chars | 0% at 32 · 3% at 40 |
| `tagline` | company card, desktop 1280px | 177px | ~32 chars | — |
| `desc` | role row (`js/views.js:5862`) | 98px @393px | ~15-18 chars | 0% |
| `desc` | role row, desktop 1280px | 680px | ~126 chars | 100% (0% truncated) |

Two things follow:

- **Taglines are tight everywhere.** The card puts name, tagline, and fit
  badge in one wrapping flex row, so even at 1280px the tagline gets ~177px.
  32 chars is the honest budget on every screen — this is not a phone-only
  rule.
- **Job descs are a mobile layout problem, not a word-count problem.**
  `.role-row-text` is `flex: 1 1 0` next to a checkbox, logo, level pill, fit
  badge, and link arrow, which leaves it 98px of a 367px row — about two
  words. No word count fixes that; a shorter desc just wastes less. Until the
  role row gives its text column more width (or drops `truncate` for a
  2-line clamp on small screens), write the desc so the **first two words**
  are the whole point.

`desc` renders in exactly one place — the roles-mode list. The company detail
view's `job-row` (`js/views.js:6038`) does not show it at all.

To re-measure after a layout change, load `#companies` in a mobile viewport
and compare `clientWidth` vs `scrollWidth` on `.role-row-desc` and the card
tagline; the ratio is the fraction of the string actually on screen.

## Optimization / parallelism

- **Batching by company** for job descs lets the agent internalize context once per batch → fewer tokens per job.
- **Batch size ~30** — sweet spot: agents can hold context, output stays under ~2k tokens.
- **Fan-out 10-30 concurrent** — same shape as `/refresh-add-candidates`. If you're paying for parallelism, this is where it earns.
- **Skip jobs without `descRaw`** — Workday and SmartRecruiters list endpoints don't return description bodies. `descRaw` presence is the gate.

## Backfilling the existing corpus

The 274 taglines and 969 descs already in `js/data.js` predate these budgets
(tagline median 57 chars / 8 words, desc median 98 chars / 12 words — 0% of
either is fully visible on a phone). `apply-descriptions.mjs` is additive by
design, so a normal run will not touch them: the new budgets apply only to
newly-discovered companies and jobs.

Rewriting the existing set is a deliberate, separate pass — it needs an
overwrite path in `apply-descriptions.mjs` (there is no `--force` today) and
re-summarizing from `descRaw`, which SmartRecruiters and Workday never
returned. Do it only when asked; do not fold it into a routine refresh.

## Guardrails

- **Additive:** never overwrite an existing `desc` or `tagline`. Enforced in `apply-descriptions.mjs`.
- **Length is the whole game.** Target ≤32 chars (tagline) and ≤55 chars
  (job desc); see *Mobile budget* below for where those numbers come from.
  `apply-descriptions.mjs` still backstops at 140 chars, but a 140-char
  string is ~4x what a phone renders — treat the backstop as a bug net, not
  a budget. Long-form belongs in the ATS.
- **Silent-approximate is safe.** Missing `desc` falls back to `descRaw[:80]` or the job title alone; missing `tagline` falls back to `sub`.
- **`js/data.js` is staged by `/refresh-ship`** so these writes travel with the rest of the data.
