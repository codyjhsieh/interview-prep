---
name: refresh-fetch-merge
description: Fetch fresh ATS boards in parallel (10 workers) and additively merge engineering roles across the three covered cities into js/data.js. Refuses to write on suspiciously sparse fetches.
---

# refresh-fetch-merge

Deterministic. Bash owns safety; the skill just invokes it.

```bash
scripts/refresh.sh fetch-merge         # fetch + merge alone
scripts/refresh.sh all                 # fetch + prune in parallel, then merge, ship
REFRESH_WORKERS=20 scripts/refresh.sh fetch    # push fetch concurrency higher
```

Expect ~1-2 min wall for fetch alone (was 7 min before parallelization).

## What it does

- Writes `.tmp/refresh.json` from `refresh-companies.py --emit-json`. Fetch is now a `ThreadPoolExecutor(max_workers=REFRESH_WORKERS)` — order preserved via `sorted(rows_by_idx)`.
- Aborts if row count < `MIN_ROWS` (default 40).
- Snapshots `js/data.js` → `.tmp/baseline.js` for accurate `added` backfill.
- Runs `merge-additive.js`. Additive-only; existing companies/jobs never removed.

## Cities

The board covers **three**: New York, San Diego and Los Angeles. They live in
one place — the `CITIES` list at the top of `scripts/refresh-companies.py`,
plus `CITY_ABBR` for the ambiguous abbreviations:

```python
CITIES = [("nyc", ...), ("sd", ...), ("la", ...)]
CITY_ABBR = [("la", re.compile(r'\bLA\b'))]
```

London, Paris, Madrid and Barcelona were covered for one day (2026-09-16) and
dropped again: they produced ~420 rows, but a US-based candidate needs UK/EU
work authorisation and only a couple of dozen of those employers would
realistically sponsor and relocate one. Volume is not the same as reach.

Four things to keep straight when adding or removing one:

1. **Order matters.** `match_city` returns the first hit, so `sd` stays ahead
   of `la` — "La Jolla, CA" must resolve to San Diego.
2. **`CITY_ABBR` is case-sensitive on purpose.** The `CITIES` patterns are
   `re.I`, and a case-insensitive `\bla\b` matches "La Jolla". Bare
   abbreviations belong in `CITY_ABBR`, which runs only after every
   spelled-out name has been ruled out.
3. **Move the city in or out of `OTHER_TITLE_CITY` and
   `OTHER_TITLE_CITY_ABBR`.** Those reject titles naming a city the board does
   *not* cover, so a newly-supported city has to come out and a dropped one has
   to go back in. `js/views.js`'s `cityLabel` / `cityShort` track the same set.

4. **Removing a city needs `scripts/prune-cities.mjs`.** The merge is additive,
   so narrowing `CITIES` stops new postings but leaves the existing ones in
   `js/data.js`. That script reads the keep-list straight out of `CITY_LABEL`,
   so there is still only one place to edit.

`match_city()` returns the first matching key, so a posting tagged for several
offices resolves to whichever city is listed first (NYC wins a NYC/SD posting).
Each job carries that key as `city`.

Two rules that bite if you forget them:

- **A title naming a city overrides the location field.** Multi-location
  listings tag every office in `location` and name the real anchor in the
  title. So `OTHER_TITLE_CITY` (cities we *don't* cover) drops the posting,
  and a title naming a city we *do* cover re-homes it. San Diego is
  deliberately absent from `OTHER_TITLE_CITY` — adding it back would reject
  every San Diego posting.
- **`city` must be emitted by all three data.js serializers** —
  `lib/emit-companies.mjs`, `merge-additive.js`, `check-dead.js`. Miss one and
  the next refresh silently drops it, which turns a San Diego posting into a
  New York one. Rows written before San Diego existed carry `city:"nyc"` from
  a one-time backfill; the UI's `jobCity()` also defaults to `nyc`.

To add a third city you would change `CITIES`, `cityLabel`/`cityShort` in
`js/views.js`, and remove it from `OTHER_TITLE_CITY` if listed. Nothing else.

## Success signal

One-line summary: `Companies: N (added X) / Jobs: M (added Y, deduped Z stale) / Verified: DATE`. Zero adds is still success.
