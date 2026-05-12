# User Flows — Audit & Friction Reduction

For each flow, I list the steps a candidate takes today, the friction, and the optimization that ships in this pass.

---

## 1 — First visit (no progress yet)
**Steps:** open `/` → land on dashboard with zero stats → guess what to do.
**Friction:** lots of "0" boxes; "Next up" is a side card; no obvious starting point.
**Ship:** dashboard now renders a single **"Continue → "** primary CTA at the top when the user has any incomplete lesson, plus a **"Today's game" tile** next to it. New users see "Start here: 6-min decomposition concept" instead of an empty quest list.

## 2 — Daily return (returning user, streak alive)
**Steps:** open / → see streak → scroll → see Next up → click → click Start.
**Friction:** ~3 navigation hops to get into actual practice.
**Ship:** primary CTA is now a single click from the header bar. Pressing **`J`** anywhere jumps to the next recommended lesson; **`G`** jumps to today's recommended game.

## 3 — Pick a lesson to study
**Steps:** Curriculum → Category → Module accordion → Lesson row → Open.
**Friction:** 4 clicks to start studying; lessons are inside `<details>` requiring expansion.
**Ship:** Modules default to **open**; a small filter bar (FDE / SDE / Both) is already present. The dashboard "Continue →" CTA bypasses this entirely for the common case.

## 4 — Complete a lesson
**Steps:** read body → maybe interact → scroll → click "Mark complete" → close → reopen Curriculum → find next.
**Friction:** scroll-to-button, then re-navigate for the next lesson.
**Ship:** Lesson modal now has a **"Mark & next →"** button that completes the current lesson *and* immediately opens the next incomplete one in the same module. Keyboard: **`Enter`** = mark & next, **`Esc`** = close.

## 5 — Daily flashcard review
**Steps:** Flashcards → click card to flip → click a rating button → next card appears → repeat.
**Friction:** two clicks per card; rate buttons are small.
**Ship:** keyboard shortcuts — **`Space`** flips the card, **`1`/`2`/`3`/`4`** rate it (again / hard / good / easy). Now ~30s per card → ~6s per card. Mouse still works as before.

## 6 — Play a mini-game
**Steps:** Games → pick game card → start.
**Friction:** two clicks; no surfacing of which game is "right for today".
**Ship:** "Today's game" tile on dashboard interleaves across the 5 games on a daily-deterministic seed (interleaving research — Rohrer & Taylor). One click from dashboard.

## 7 — Research a specific company before an interview
**Steps:** Companies → scroll/visually scan → find company → click.
**Friction:** 20 companies — visual scanning is slow when you know the name.
**Ship:** **search input** at the top of Companies view filters by name + sub-line + notes in real time. Type `nory` and only Nory remains.

## 8 — Draft / refine a STAR story
**Steps:** STAR Bank → expand story → edit four textareas → click Save.
**Friction:** explicit Save button creates "did it save?" anxiety; every edit needs a click.
**Ship:** **auto-save on blur** of any textarea, with a subtle "saved" indicator next to the story title. First-time draft still awards the 30-XP completion. Explicit Save button kept for muscle memory but no longer required.

## 9 — Log a mock interview after one ends
**Steps:** open Mock Log → fill four selects + notes → click Log.
**Friction:** four selects feel heavy for what should be a 10-second action.
**Ship:** **"+ Quick log"** button on the dashboard opens a compact 1-row inline form (vertical, round, score, then optional note). Saves on Enter. Full Mock Log view is preserved for history review.

## 10 — Check progress and decide what to study next
**Steps:** Coverage → read overall % → find the worst category → click into it.
**Friction:** already lean (2 clicks), but the decision belongs on the dashboard.
**Ship:** dashboard surfaces the **single largest gap** inline ("⚠ Closest gap: Decomposition · 0/8 · weight 18%") with a one-click jump. Coverage view is unchanged for the full audit.

---

## Cross-cutting optimizations shipped this pass

| Optimization | Where | Effect |
|---|---|---|
| **Global keyboard map** | Everywhere | `J` → next lesson · `G` → today's game · `F` → flashcards · `?` → help overlay · `/` → focus search (Companies view) · `Esc` → close modal / sidebar |
| **Single primary CTA** | Dashboard | One unambiguous "Continue" button at top — Hick's law (decision time scales with options) |
| **Auto-save everywhere** | STAR Bank, Profile | No "did it save?" anxiety; debounced writes already in place |
| **Modal escape** | Lesson modal | `Esc` closes, `Enter` confirms, focus trapped — WCAG-friendly |
| **Search-as-you-type** | Companies | Cuts a 20-item scan to a single keystroke when name is known |
| **Smart-next chaining** | Lessons | "Mark & next →" eliminates the back-out / re-navigate loop that breaks flow state |

These changes are concrete code edits, not future work — verify by reloading the page.
