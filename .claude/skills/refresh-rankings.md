---
name: refresh-rankings
description: Backfill missing COOLNESS scores and QUANT_GATED entries in views.js so new companies get accurate fit scores instead of the vertical-based fallback.
---

# refresh-rankings

Fills gaps in `views.js`'s ranking maps. Companies without a hand-scored
COOLNESS fall back to a vertical-based default (`_coolness()`, view.js:5274);
this skill promotes them to real scores.

## Steps

1. Run `scripts/refresh.sh rankings` — prints JSON: `{missingCoolness, missingQuant, staleKeys}`.
2. **`missingQuant` (mechanical, no agent):** for every id with `vertical === 'hft'` not in `QUANT_GATED`, append to the set. Zero judgment involved.
3. **`missingCoolness` fast path (≤5, recognizable):** score inline from memory. Scale below.
4. **`missingCoolness` slow path (>5 or unfamiliar):** dispatch parallel `general-purpose` agents, ~15 companies per agent. Each returns `{id: N}` where `N ∈ [1,10]`. Prompt: "score along the LES-cool axis — would the candidate be proud to say where they work at a downtown NYC dinner. 10 = peak-LES (Partiful, Dorsia, Suno). 5 = neutral (Mercury, Squarespace). 1 = anti-LES (Salesforce, Goldman Sachs)."
5. Append COOLNESS entries in `views.js` under a dated header (`// ── YYYY-MM-DD auto-scored ──`). Append QUANT_GATED ids to the set literal. Never overwrite existing entries.
6. `staleKeys` are soft — report but don't touch. Companies get renamed; deletion needs human review.

## Scale anchor

| Tier | Feel | Examples |
|---|---|---|
| 10 | peak-LES | Partiful, Dorsia, Suno, Flora, Udio |
| 8-9 | cool | Runway, Cursor, ElevenLabs, Perplexity, Etsy, Substack |
| 6-7 | solid | Vercel, Notion, Airtable, Whatnot, Kalshi, Polymarket |
| 5 | neutral | Stripe, Mercury, Squarespace, Talkspace, Ro |
| 3-4 | enterprise | Ramp, OpenAI, Anthropic, Datadog, MongoDB, Modal |
| 1-2 | anti-LES | Salesforce, Goldman Sachs, Two Sigma, Jane Street, BlackRock |

## Guardrails

- Never overwrite an existing COOLNESS score.
- Additive: append only, under a dated section.
- `js/views.js` gets included in `/refresh-ship`'s git-add — this stage's mutations ship with the data changes.
- Silent-approximate is safe. If agents fail, the `_coolness()` fallback handles it.
