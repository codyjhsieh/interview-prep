# Interview Prep — FDE / SDE 2026

A static web app (vanilla HTML / CSS / JS, no build) for prepping
Forward-Deployed-Engineer and SDE interviews. Single-author project. Deployed
to GitHub Pages at <https://codyhsieh.com/interview-prep/>.

This README is brutally honest. The platform is good for what it is; it is
**not** a complete prep stack, and it does not guarantee a pass.

---

## What it is

- 10 curriculum categories, ~150 concept lessons, hundreds of MCQ / T-F /
  flashcard / cloze / whyexplain items.
- A spaced-repetition flashcard system (SM-2).
- A pet (Bit, low-poly Three.js) that you feed by completing daily XP,
  intended to make the daily-return habit sticky.
- A "Quote of the Day" of 197 explicitly-motivational quotes from books only,
  every entry with a hyperspecific context blurb.
- A handful of mini-games (Decomp Timer, etc.) and a STAR-story bank with
  auto-save.
- Companies view (~20 deep-dives), Coverage view (per-category audit), Mocks
  log, Profile.

There is no backend. All state is `localStorage`.

---

## What this README replaces

Aggregates and replaces these planning docs (kept in repo for history):
`COVERAGE_REPORT.md`, `QUIZ_COVERAGE.md`, `USER_FLOWS.md`, `PASS_RATE_PLAN.md`.
Everything load-bearing from them is summarized below.

---

## Curriculum coverage — honest numbers

Weighted coverage ≈ **82%**. Every category at or above the 80% target.

| Category | Weight | Coverage |
|---|---:|---:|
| Decomposition / Case Study | 18% | 85% |
| AI / LLM Production | 17% | 80% |
| Coding & Algorithms | 15% | 80% |
| System Design (classic + FDE) | 13% | 80% |
| Client Simulation | 9% | 85% |
| SQL & Data | 8% | 80% |
| Behavioral / Values | 8% | 85% |
| Cloud / DevOps | 6% | 80% |
| Domain / Vertical | 4% | 85% |
| Meta-Skills | 2% | 80% |

**Residual gaps** intentionally not fixed because they wouldn't move the
needle on actual interview outcomes:

| Category | Top remaining gap |
|---|---|
| AI | Cost monitoring + token budgeting; RLHF/DPO; long-context patterns |
| Coding | Segment trees / Fenwick; advanced string algorithms |
| System Design | SAGA pattern; DR/backup; leader election in depth |
| SQL & Data | Event sourcing; Iceberg / Delta / Hudi |
| Behavioral | Multi-month gap explanations; reference handling |
| Cloud | Certificate management / ACME; service mesh depth |
| Domain | E-commerce; climate tech |
| Meta | Immigration (H1B / TN / OPT); LinkedIn / blog signal |

---

## Quiz bank — honest numbers

| Bank | Current | 10× target | Multiplier |
|---|---:|---:|---:|
| Lightning Quiz | 92 | 300 | 7.7× of baseline |
| Category Quizzes | 330 | 1000 | 6.6× |
| Flashcards | 187 | 700 | **10.4× ✅** |
| Concept-attached MCQs / T-F / cloze | ~280 | — | (capped at 1 per concept) |
| **Total interactive items** | **~760** | ~2,390 | **3.3× of baseline** |

- Flashcards: SRS now has real signal — multiple weeks of unique cards
  before first repetition.
- Lightning Quiz: ~9 unique 10-question runs before exhausting the bank.
- Category Quizzes: 6–8 takes per category before repetition.
- This is **starter-good** territory, not "user will never run out."

### MCQ length-bias status

| Pass | MCQs | Length-biased | Notes |
|---|---:|---:|---|
| Baseline | 62 | 52 (83%) | Original |
| Current | 59 | 46 (77%) | 6 worst rewritten; 3 converted to non-MCQ widgets |
| Target | — | <20% | Hand-rewrite the remaining 46 distractors |

For behavioral / strategic-answer MCQs, the correct answer genuinely encodes
multi-clause reasoning. Those should migrate to `whyexplain` or `sort`
widgets where length-bias is impossible by design.

---

## How interview-pass actually works (the math)

A *guaranteed* 100% per-interview pass rate is not achievable. There are
irreducible stochastic factors (interviewer mood, team fit, competition,
day-of variance). What IS achievable: drive per-interview probability to
~85–95% AND run enough concurrent processes that the **portfolio** pass rate
approaches 100%.

Probability of landing ≥1 offer given per-interview `p` and `n` concurrent
processes:

| p (per-interview) | n = 1 | n = 3 | n = 5 | n = 8 |
|---:|---:|---:|---:|---:|
| 50% | 50% | 88% | 97% | 99.6% |
| 70% | 70% | 97% | 99.8% | >99.9% |
| 85% | 85% | 99.7% | >99.9% | >99.9% |
| 95% | 95% | >99.9% | >99.9% | >99.9% |

**Takeaway:** at p=70%, 3 concurrent processes already gets you to 97%.
Per-interview work raises the floor; the portfolio strategy raises the
ceiling. You buy more pass-rate by adding applications than by getting
marginally better at any single interview.

### The 10 failure modes that cause rejections

| # | Failure mode | Frequency | Fix |
|---|---|---:|---|
| 1 | Coverage gap — topic never studied | ~25% | Curriculum depth |
| 2 | Retrieval failure under pressure | ~20% | SRS + mock-pressure practice |
| 3 | Communication gap — could solve, couldn't narrate | ~15% | Verbal practice + recorded mocks |
| 4 | Time management — ran out before finishing | ~10% | Timed drills + decomp discipline |
| 5 | Stress response — froze, lost composure | ~8% | Stress inoculation + day-of routine |
| 6 | Behavioral story gap | ~7% | 5 STAR stories rehearsed verbally |
| 7 | Values mismatch — failed culture-fit | ~5% | Per-company values prep |
| 8 | Surprise topic — niche edge case | ~4% | Broad exposure + decomp skill |
| 9 | Negotiation failure | ~3% | Negotiation discipline |
| 10 | Pure variance (bad interviewer day) | ~3% | Portfolio of concurrent applications |

---

## What this platform does NOT do

For honesty:

- **Does not replace LeetCode** — for coding-heavy loops, you need grading-
  loop volume. This platform covers patterns and pattern recognition; it
  does not give you the 300–500 problems' practice volume of LeetCode.
- **Does not replace mock interviews** — verbal practice under pressure
  remains the highest-leverage activity. This is curriculum + scaffolding,
  not a graded mock.
- **Does not have audio / verbal-rehearsal mode** — every concept and STAR
  story would benefit from a "say it out loud" recording. Not implemented.
- **Does not have a wrong-answer review queue with SRS** — missing MCQs
  should accumulate into a daily review feed. Not implemented.
- **Does not have a pipeline tracker** for concurrent applications.
- **Does not have AI grading on free-form answers** — `whyexplain` saves
  text but the user self-grades.
- **Does not have a resume / outreach / negotiation module** at depth —
  these are mentioned in meta-skills but not interactive.
- **Does not have dark mode.**

You will not land a top-tier offer using **only** this platform. You will
use it alongside LeetCode + Pramp/interviewing.io mocks + Glassdoor research
+ your own resume work + your own networking.

---

## What it's actually best for

- **FDE-track candidates at AI-first companies** — the decomposition,
  client-simulation, AI-engineering, and domain-vertical content is
  genuinely differentiated and hard to find elsewhere. Roughly 70% of what
  you need for that track.
- **Pattern recognition for coding interviews** — 15 LeetCode-pattern
  modules with idiomatic Python and runnable code snippets. Good for
  building mental models; not enough volume for a Google bar.
- **System Design fundamentals + FDE-specific extensions** — 24 lessons
  including back-of-envelope numbers, Raft, reliability patterns, Kafka,
  geo-dispatch, payments, multi-tenancy, VPC deploys, webhooks, SSO. About
  50% of what an SDE-track loop needs.
- **Spaced-repetition flashcards** — 187 cards with SM-2 scheduling. The
  habit-forming surface that actually works.

---

## Architecture (one paragraph)

Static HTML/CSS/JS hosted on GitHub Pages. Three.js (r148 UMD) for the pet
scene. Prism.js for code syntax highlighting. Tailwind via CDN with a custom
theme. State in `localStorage`, serialized to/from a single JSON blob.
SM-2-based SRS for flashcards. No build step, no bundler, no backend.
`js/data.js` holds the entire curriculum; `js/views.js` renders every view;
`js/gamification.js` handles XP, streaks, level, pet state, SRS scheduling;
`js/games.js` holds the mini-games; `js/quotes.js` holds the manifesto.
`js/glass-adaptive.js` samples DOM background colors and writes per-card
tint variables for the Liquid Glass aesthetic.

---

## User-flow optimizations shipped

The dashboard surfaces a single primary CTA ("Continue · <lesson>") and a
"Today's game" tile. Global keyboard shortcuts: `J` next lesson, `G`
today's game, `F` flashcards, `Esc` close modal, `Enter` confirm. Lesson
modal has "Mark & next →" that chains to the next incomplete lesson in the
module. Auto-save on blur for STAR stories and Profile. Search-as-you-type
on Companies view. Dashboard surfaces the single largest ROI-weighted
coverage gap inline. Daily quests are deterministic per-day; Lightning Quiz
interleaves across topics on a daily seed (Rohrer & Taylor).

---

## Honest TL;DR

- Weighted curriculum coverage: **≈82%**, every category at the 80% bar.
- Quiz volume: **~760 interactive items**, 3.3× the launch baseline.
  Flashcards alone hit 10× target; Lightning Quiz and Category Quizzes are
  not yet there.
- For FDE-track candidates: **~70% of what you need** to land a top-tier
  offer when combined with mock interviews and outreach.
- For SDE-track candidates at FAANG: **~45%** of what you need; coding
  volume and system-design "design X" prompts are the gaps.
- The math says: prep well + apply broadly (3–5 concurrent processes) and
  portfolio math gets you to >99% land probability. The platform helps
  with the first half. You do the second half.

---

## Run locally

```sh
# No build step. Just open index.html in a browser, or:
python3 -m http.server 8000
# then visit http://localhost:8000
```

Tests for the window-beam math module (the only thing testable headlessly):

```sh
node tests/window-beam.test.js
```

---

## License

Not specified. Personal project.
