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
3. **Company tagline batches (fast):** partition the `companies` list into batches of ~30. Dispatch parallel agents (up to 10 concurrent). Each agent receives the batch and returns `{id: tagline}` — 6–12 words, first-person present tense ("Ship money at planet scale."). Merge all outputs into `.tmp/descriptions-companies.json`.
4. **Job desc batches (larger):** partition the `jobs` list into batches of ~30 (grouped by company where possible so the agent sees consistent context). Dispatch parallel agents (up to 30 concurrent). Each agent receives the batch — title + level + first 800 chars of `descRaw` — and returns `{url: desc}` — 8–15 words, action-verb led ("Build LLM-eval infra for enterprise deployments."). Merge into `.tmp/descriptions-jobs.json`.
5. Combine into one file: `{jobs: [...], companies: [...]}` → `.tmp/descriptions-merged.json`.
6. Apply: `node scripts/apply-descriptions.mjs .tmp/descriptions-merged.json`. Additive; caps to 140 chars.
7. Verify: `scripts/refresh.sh descriptions --count` — expect `jobsWithDesc` up by the number of applied descs, `companiesWithTagline` up by the number of applied taglines.

## Agent prompt shape

**Company tagline (batch of 30 companies):**
> For each company below, write a 6-12 word tagline that's punchier than the existing `sub` field. Present tense, action verb, no filler. Return JSON `{id: tagline}`. Example: `{"stripe": "Ship money at planet scale."}`.

**Job desc (batch of 30 jobs):**
> For each job below, write an 8-15 word one-line description of what the engineer will actually work on, drawn from the `descRaw` body. Action verb first, no company name, no seniority. Return JSON `{url: desc}`. Example: `{"https://...": "Build LLM-eval infra for enterprise deployments."}`.

## Optimization / parallelism

- **Batching by company** for job descs lets the agent internalize context once per batch → fewer tokens per job.
- **Batch size ~30** — sweet spot: agents can hold context, output stays under ~2k tokens.
- **Fan-out 10-30 concurrent** — same shape as `/refresh-add-candidates`. If you're paying for parallelism, this is where it earns.
- **Skip jobs without `descRaw`** — Workday and SmartRecruiters list endpoints don't return description bodies. `descRaw` presence is the gate.

## Guardrails

- **Additive:** never overwrite an existing `desc` or `tagline`. Enforced in `apply-descriptions.mjs`.
- **Cap 140 chars** on both fields. Long-form belongs in the ATS.
- **Silent-approximate is safe.** Missing `desc` falls back to `descRaw[:80]` or the job title alone; missing `tagline` falls back to `sub`.
- **`js/data.js` is staged by `/refresh-ship`** so these writes travel with the rest of the data.
