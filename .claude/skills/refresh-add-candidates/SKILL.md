---
name: refresh-add-candidates
description: Add new companies to CANDIDATES. Probes drafted names with scripts/discover-ats.py, dedupes on (ats, slug), verifies each hit board's identity against its own posting bodies, appends survivors as tuples under a dated batch header.
---

# refresh-add-candidates

Expands the discovery surface. Input: a list of company display names.
Output: new tuples appended to `CANDIDATES` in `scripts/refresh-companies.py`.

## Steps

1. **Draft names, then dedupe on the normalized display name.** Strip
   everything but `[a-z0-9]` and compare against the names already in
   `CANDIDATES`. This is only a first pass — it cannot catch a company already
   present under a different label, which is what step 3 is for.

2. **Probe with the deterministic prober, not agents.**
   ```bash
   python3 scripts/discover-ats.py names.txt --json found.json --workers 30 -v
   ```
   It tries every plausible slug against every supported ATS and reports the
   one that actually returns a board. Hand-guessing slugs was wrong more often
   than right (55 of 98 guesses dead in the 2026-08-20 batch), and WebFetch
   agents are slower, costlier and less reliable than the prober for this.
   A sweep of ~1,100 names takes roughly 40 minutes; run it in the background.

3. **Dedupe the hits on `(ats, slug)`, which is the identity — not the
   display name, and not the id.** 101 of 245 boards in the 2026-09-08 sweep
   were already in `CANDIDATES` under a different label. Compare
   case-insensitively: at least one existing row carries a capitalized slug
   (`smartrecruiters:Freshworks`). Then *also* re-check the normalized display
   name, to catch a company already on the board under a different slug.
   Re-run both checks after any rename — renaming a drafted name to match what
   its board calls itself can re-introduce a duplicate that the first pass
   cleared.

4. **Verify identity from the board's own posting bodies before writing
   anything.** A probed slug often resolves to a live board belonging to a
   different company with the same name. Read a couple of posting
   descriptions per hit and confirm they describe the company you meant.
   Prioritize by risk: a slug much shorter than the name (reached by the
   prober's first-word-alone variant) is the common offender. Do not trust
   "the company's first word appears in the body" as proof — a Hazel posting
   says "Hazel" throughout whether or not it is Hazel Health.
   When a board turns out to be a different but genuinely good company,
   relabel the row to that company rather than discarding the find.

5. **Record every confirmed collision in `COLLIDING` in
   `scripts/discover-ats.py`**, with the reason. `discover()` skips those
   pairs, so a name that can only reach a board through a colliding slug
   reports no board at all. Before this list existed the knowledge lived in
   prose comments and the same bad slugs came back every sweep —
   `ashby:neptune` three separate times.

6. **Draft tuples**: `("id","Name","ats","slug","vertical","sub","stage","raised","lead",["badges"],"notes")`.
   Leave stage/raised/lead empty and let `/refresh-funding` fill them.
   `sub` is the card tagline and has a 32-character budget.
   Vertical is one of `ai | fintech | consumer | saas | devtools | infra |
   health | hft | marketplace | media | crypto | proptech | gaming | adtech |
   aerospace | defense | robotics | automotive | climate | security | cpg | ed`.
   Ids must be unique; suffix `-2` when a base id is taken.

7. **Append** to `CANDIDATES` under a dated header
   (`# ── YYYY-MM-DD — <what and why> ──`), saying how many names were
   probed, how many resolved, how many were already known and how many were
   collisions. Add logo domains via `/refresh-logos`, which verifies them.

8. **Verify**: `python3 scripts/check-candidates.py`. It checks arity, unique
   ids, unique `(ats, slug)` and unique company names, and exits non-zero
   naming every offender. Run it after every edit — the duplicate-name check
   in particular exists because renaming a drafted company to match its board
   happens *after* the dedupe and has re-introduced a duplicate on three
   separate sweeps (Genius, Cocoon, Tubi).
   When it flags a duplicate name, fetch both slugs before deleting anything:
   usually one is dead and the other is the company's current board, so the
   fix is to point the existing row at the live slug and drop the new one,
   which keeps the original id and its funding data.

## Then

Run `/refresh-jobs`. Companies not hiring in a covered city (New York, Los
Angeles or San Diego) silently drop out of `--emit-json` — expected.
Companies with only excluded titles also drop, per `TITLE_EXCLUDE`.

## Guardrails

- Never fabricate a slug. If the prober didn't return a board, skip the name.
- Never write a row whose identity you have not read off its board.
- Leave out a board that carries nothing identifying its company either way,
  rather than guessing.
- Additive: never remove or edit existing tuples, except to correct a row
  that names the wrong company.
- Defence and space-ISR primes are out of scope for this board.

## Yield expectations (measured, 2026-09-17 sweep of 1,597 names)

- 522 names resolved to a live board (~33%).
- 143 of those were already in `CANDIDATES` under another name or slug (~27%).
- 82 were slug collisions (~16% of hits) — the single biggest source of bad
  rows, and invisible unless you read the postings.
- 297 net new rows (~19% of names drafted).
- 21 of the 297 had a qualifying role in a covered city on day one (~7%).
  Most of the value is in coverage for later postings, not immediate rows.
- Budget roughly 4 names drafted per row added, and 75 per row that shows up
  on the board the same day.
