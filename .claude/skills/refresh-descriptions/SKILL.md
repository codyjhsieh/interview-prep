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
4. **Job desc batches (larger):** partition the `jobs` list into batches of ~30 (grouped by company where possible so the agent sees consistent context). Dispatch parallel agents (up to 30 concurrent). Each agent receives the batch — title + level + first 800 chars of `descRaw` — and returns `{url: desc}` — **≤70 characters, typically 8–10 words**, action-verb led, front-loaded so the first line stands alone ("Build LLM-eval infra for enterprise deployments." = 47 chars). Merge into `.tmp/descriptions-jobs.json`.
5. Combine into one file: `{jobs: [...], companies: [...]}` → `.tmp/descriptions-merged.json`.
6. Apply: `node scripts/apply-descriptions.mjs .tmp/descriptions-merged.json`. Additive; caps to 140 chars.
7. Verify: `scripts/refresh.sh descriptions --count` — expect `jobsWithDesc` up by the number of applied descs, `companiesWithTagline` up by the number of applied taglines.

## Agent prompt shape

**Company tagline (batch of 30 companies):**
> For each company below, write a tagline of **at most 32 characters** (usually 4-5 words) that's punchier than the existing `sub` field. Present tense, action verb, no filler. Count the characters — anything longer is cut off with an ellipsis on the company card, on phones and desktop alike. Return JSON `{id: tagline}`. Example: `{"stripe": "Ship money at planet scale."}` (27 chars).

**Job desc (batch of 30 jobs):**
> For each job below, write a one-line description of what the engineer will actually work on, drawn from the `descRaw` body — **at most 70 characters** (usually 8-10 words). Action verb first, no company name, no seniority. Front-load it: on a phone the desc wraps to two lines and the first ~38 characters are what gets read. Return JSON `{url: desc}`. Example: `{"https://...": "Build LLM-eval infra for enterprise deploys."}` (44 chars).

## Mobile budget (measured 2026-08-19, after the role-row fix)

Both fields render with Tailwind's `truncate`, so the box is a hard budget.
On phones (≤640px) the role row now wraps its level pill / fit badge / arrow
onto a second line and clamps the title and desc to two lines each, which is
what makes the numbers below workable. Measured in Chromium against the live
board:

| Field | Where it renders | Box @375px | Budget | Was (before fix) |
|---|---|---|---|---|
| `tagline` | company card (`js/views.js:5692`) | 212px, 1 line | ~32 chars | unchanged |
| `desc` | role row (`js/views.js:5862`) | 245px, 2 lines | ~76 chars | 80px, 1 line → ~13 chars |
| `desc` | role row @1280px | 697px, 1 line | ~130 chars | ~126 chars |

- **Taglines are tight on every screen.** The card puts name, tagline, and fit
  badge in one wrapping flex row, so even at 1280px the tagline box is ~177px.
  32 chars is not a phone-only rule.
- **Job descs now fit on a phone** — but only two lines of them. Keep the
  first line (~38 chars) meaningful on its own; it is what a scanning reader
  actually reads.

`desc` renders in exactly one place — the roles-mode list. The company detail
view's `job-row` (`js/views.js:6038`) does not show it at all.

To re-measure after a layout change, load `#companies` in a mobile viewport,
switch to Individual roles, and compare `clientWidth`/`scrollWidth` (and
`scrollHeight`/`clientHeight`, now that the clamp is two lines) on
`.role-row-desc` and the card tagline.

## Optimization / parallelism

- **Batching by company** for job descs lets the agent internalize context once per batch → fewer tokens per job.
- **Batch size ~30** — sweet spot: agents can hold context, output stays under ~2k tokens.
- **Fan-out 10-30 concurrent** — same shape as `/refresh-add-candidates`. If you're paying for parallelism, this is where it earns.
- **Skip jobs without `descRaw`** — Workday and SmartRecruiters list endpoints don't return description bodies. `descRaw` presence is the gate.

## Backfilling the existing corpus

The 274 taglines and 969 descs already in `js/data.js` predate these budgets
(tagline median 57 chars / 8 words, desc median 98 chars / 12 words). Even
with the two-line role row, only 3% of descs fit the ~76-char phone budget
and 0% of taglines fit 32 chars — the rest still end in an ellipsis.
`apply-descriptions.mjs` is additive by design, so a normal run will not
touch them: the new budgets apply only to newly-discovered companies and
jobs.

Rewriting the existing set is a deliberate, separate pass — it needs an
overwrite path in `apply-descriptions.mjs` (there is no `--force` today) and
re-summarizing from `descRaw`, which SmartRecruiters and Workday never
returned. Do it only when asked; do not fold it into a routine refresh.

## Guardrails

- **Additive:** never overwrite an existing `desc` or `tagline`. Enforced in `apply-descriptions.mjs`.
- **Length is the whole game.** Target ≤32 chars (tagline) and ≤70 chars
  (job desc); see *Mobile budget* below for where those numbers come from.
  `apply-descriptions.mjs` still backstops at 140 chars, but a 140-char
  string is ~4x what a phone renders — treat the backstop as a bug net, not
  a budget. Long-form belongs in the ATS.
- **Silent-approximate is safe.** Missing `desc` falls back to `descRaw[:80]` or the job title alone; missing `tagline` falls back to `sub`.
- **`js/data.js` is staged by `/refresh-ship`** so these writes travel with the rest of the data.
