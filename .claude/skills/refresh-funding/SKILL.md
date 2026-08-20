---
name: refresh-funding
description: Fill stage / raised / lead for companies that have no funding data, from their own job-posting boilerplate and SEC Form D filings. Proposes with evidence; writing is a separate reviewable step. Never invents a number.
---

# refresh-funding

Fills the funding fields on companies that have none. Runs after
`/refresh-fetch-merge`, because it reads `descRaw` out of `.tmp/refresh.json`
and that file only exists after a fetch.

```bash
scripts/refresh.sh funding                       # postings only (fast)
scripts/refresh.sh funding --edgar                # + SEC Form D (slow, rate-limited)
node scripts/apply-funding.mjs .tmp/funding.json --dry
node scripts/apply-funding.mjs .tmp/funding.json
```

## Why this is two steps

Funding is the one field on the card that reads as a hard fact. A wrong
tagline is a bad sentence; a wrong `raised` is a false claim about a real
company. So the fetch step only ever *proposes*, every proposal carries the
sentence or filing it came from, and a human (or you, reading the evidence)
decides. `--dry` prints what would be written.

## Sources, in order

1. **The company's own posting boilerplate.** Companies state their totals in
   job descriptions — "we've raised $58.5M Series B led by Google Ventures".
   That matches what `raised` / `stage` / `lead` mean elsewhere in CANDIDATES,
   it's current, and the evidence is a sentence you can read. Covers roughly a
   quarter of fetched companies.
2. **SEC Form D** (`--edgar`). Authoritative and structured, but a **floor**:
   only Reg D placements the company filed itself, and many stop filing after
   early rounds. Used as a fallback when a posting says nothing, and as a
   cross-check when it does.

## What gets flagged instead of written

`apply-funding.mjs` skips flagged proposals unless `--include-flagged`:

- **Claims of $1B or more.** "Raised our $1.5B Series F" is one word away from
  a valuation, and valuations are quoted far more often than round sizes.
- **Form D older than 2023.** Astronomer's only filing is $1.9M from 2017;
  writing that as its funding would be worse than leaving it blank.
- **SEC total well above the posting's claim** — the posting is likely stale.

## Guardrails

- **Additive.** A company that already has `raised` is never touched.
  Hand-curated funding outranks anything extracted.
- **Valuations are not funding.** An amount within 60 characters of
  "valuation" / "valued at" / "post-money" is discarded, not converted.
- **A lead investor must be a name.** "backed by leading VCs" names nobody and
  yields an empty `lead`, not the phrase "leading VCs".
- **`fundingSrc`** is written alongside (`posting` or `sec`) so a later reader
  can tell an extracted figure from a curated one. All three data.js
  serializers emit it — `lib/emit-companies.mjs`, `merge-additive.js`, and
  `check-dead.js`. If you add another field, add it to all three or the next
  refresh silently drops it.
- **Blank beats wrong.** Any company without evidence keeps empty fields, and
  the card renders them as nothing.

## Coverage expectations (measured 2026-08-20)

Of 40 companies on the board with no funding data, postings yielded 3 and the
SEC fallback a handful more. This stage is a slow accumulator, not a bulk
backfill — most companies simply don't state their funding in a job ad. The
rest stay blank until someone curates them.
