# Algorithms audit — modules 5-8

Source: `/Users/codyhsieh/Desktop/Coding/InterviewPrep/js/data.js` lines 2758-3934.

Conventions used below: `keep` = good as-is, `tighten` = trim fluff/redundancy, `expand-intuition` = add WHY, `interactive-weak` = activity tests memorization or is too obvious.

---

## Module: cod-prod (Production-flavored coding)

### Lesson p-1 — "Q: Parse & clean a 1GB JSONL file"

**Verdict:** expand-intuition

**Issue:** Code is fine, but the lesson skips the "why streaming matters" pattern signal. No mention of memory pressure or what makes this a *production* question vs an LC one. No interactive widget.

**Proposed change:** Add 1 sentence: "The pattern: read-stream-write-stream + Counter for observability. Loading 1GB into memory is the junior failure mode interviewers are looking for." Consider adding a tiny MCQ: "Why `for line in fin` instead of `fin.readlines()`?" (answer: lazy iterator vs materializing the whole file).

---

### Lesson p-2 — "Q: Retry-with-backoff decorator"

**Verdict:** expand-intuition

**Issue:** Strong code, but the "why jitter" insight gets one parenthetical. No interactive. The senior signal (idempotency assumption, distinction between retryable status codes, fail-fast on 4xx) is in the code but not called out.

**Proposed change:** Add a callout-senior: "Three things the interviewer is listening for: (1) jitter prevents thundering herd, (2) 4xx is non-retryable, (3) cap wall-clock not just attempt count. Saying these aloud > writing them." Optional MCQ on which status codes are retryable.

---

### Lesson p-3 — "Q: Flatten a nested list of arbitrary depth"

**Verdict:** tighten + expand-intuition

**Issue:** Very thin. The whole "why iterative" gets half a sentence. No interactive widget. Also missing the "yield from" Pythonic generator solution which is the actual senior answer.

**Proposed change:** Add a 2-line generator variant (`yield from flatten(x)`) and note: "Generator version composes with other iterators and is memory-flat. Stack-iterative version is what to reach for if recursion depth is unbounded." Add tiny widget — e.g., codepredict on depth limit.

---

### Lesson p-4 — "Q: Thread-safe singleton"

**Verdict:** keep

(Compact, names the anti-pattern, gives the Pythonic alternative — solid.)

---

### Lesson p-LC1 — "LRU Cache — hash map + doubly linked list"

**Verdict:** keep

(Clear motivation, "why neither alone" framing is excellent, sentinel trick called out, senior signal is real.)

---

### Lesson p-LC2 — "Design In-Memory File System — trie of dicts"

**Verdict:** keep

(Unification trick is well-explained; sort-the-listing note is exactly the senior signal.)

---

### Lesson p-LC3 — "Time-Based Key-Value Store — binary search on timestamps"

**Verdict:** keep

(The `chr(127)` trick is genuinely subtle and well-explained. Good interactive.)

---

### Lesson p-LC4 — "Snake Game — deque + set"

**Verdict:** keep

(The "remove tail before collision check" subtlety is *exactly* the kind of thing that earns the senior signal. Interactive directly tests this — high-quality.)

---

## Module: cod-misc (Trees, heaps, DP — short ladder)

### Lesson m-1 — "Heaps — when (and why) to reach for one"

**Verdict:** keep

(Excellent breadth: table of 5 problems, Python specifics, heapify O(N) callout. The MCQ is a real intuition check.)

---

### Lesson m-2 — "Q: Cycle detection in linked list"

**Verdict:** expand-intuition

**Issue:** Code is correct but the *why* of Floyd's algorithm is missing. Why does resetting slow to head and stepping both at 1 land at the cycle entry? That's the famous trick — should mention the math (distance from head to cycle = distance from meeting point to cycle entry, modulo the cycle length) or at least a one-liner of intuition. No interactive.

**Proposed change:** Add: "Why the reset trick works: when they first meet, the distance from head to cycle-entry equals the distance from meeting-point to cycle-entry (mod cycle length). So both pointers moving 1 step land together at the entry." Optional MCQ: "If you only need to detect the cycle, why fast=2 instead of fast=3?" (answer: fast=2 guarantees they meet inside cycle in O(cycle-length) steps; fast=3 still works but with more iterations and more edge cases).

---

### Lesson m-3 — "Dynamic programming — recognizing when to use it"

**Verdict:** keep

(The two-signatures framing is the *right* mental model, decision matrix is the senior-level reference, MCQ tests the framing not just trivia.)

---

### Lesson m-4 — "Q: Trie insert / search"

**Verdict:** tighten + expand-intuition

**Issue:** Pure how-to with zero why. Missing the recognition pattern ("when do you reach for trie vs hash?"), missing the autocomplete subtree-walk that's the actual interview followup. No interactive.

**Proposed change:** Add 1 sentence: "Reach for a trie when (a) you need prefix-sharing, (b) you need many-keys-many-queries on shared prefixes, or (c) you'll do bulk operations like 'all words starting with X'." Add a tiny MCQ or findbug on the `$` sentinel pattern.

---

### Lesson m-LC1 — "Find Median from Data Stream — two heaps"

**Verdict:** keep

(Tight, names the invariant, "push to lo then drain" subtlety is well-explained. Sort interactive is appropriate.)

---

### Lesson m-LC2 — "Merge K Sorted Lists — heap of head pointers"

**Verdict:** keep

(The tiebreaker-`i` explanation is a real production gotcha. Findbug interactive directly tests it.)

---

### Lesson m-LC3 — "Edit Distance — 2D DP with three operations"

**Verdict:** keep

(Recurrence is broken down cleanly, "three operations = three predecessors" framing is excellent. MCQ tests actual computation — good.)

---

### Lesson m-LC4 — "Longest Increasing Subsequence — patience sort"

**Verdict:** keep

(The "tails isn't a real LIS" disclaimer is the kind of depth that prevents the most common misunderstanding. Whyexplain interactive is real intuition.)

---

## Module: cod-backtrack (Backtracking)

### Lesson bt-1 — "The backtracking template (subsets / power set)"

**Verdict:** keep

(Four-part decomposition is the right mental scaffold. The `path[:]` trap callout is exactly what interviewers watch for. Findbug interactive tests the trap directly.)

---

### Lesson bt-2 — "Permutations — used/visited bookkeeping"

**Verdict:** keep

(The duplicates skip-rule is the most-asked followup and is included. Codepredict tests the trap.)

---

### Lesson bt-3 — "Combinations & combination sum"

**Verdict:** keep

(The `i` vs `i+1` distinction is the *whole* lesson and the cloze targets it exactly. Pruning `break` call-out is the senior signal.)

---

### Lesson bt-4 — "N-Queens — pruning with diagonal sets"

**Verdict:** keep, but **note duplication with bt-LC1**

**Issue:** bt-4 and bt-LC1 cover N-Queens with nearly identical code. bt-LC1 adds the "bitmask variant" depth callout but is otherwise repetition. Not a bug, but worth flagging.

**Proposed change:** Optional — merge bt-4 and bt-LC1, or differentiate bt-LC1 more clearly (e.g., make it focus exclusively on the bitmask optimization). As-is, the redundancy costs ~10 minutes of curriculum time for marginal new value.

---

### Lesson bt-5 — "Word search on a grid — DFS with in-place visited"

**Verdict:** keep

(The in-place mutation = visited set is the senior signal and it's flagged. Word Search II preview is well-placed. Findbug tests the trap.)

---

### Lesson bt-LC1 — "N-Queens (LC-Hard drill)"

**Verdict:** tighten (or merge with bt-4)

**Issue:** ~80% overlap with bt-4. Same code, same diagonal trick, same explanation. Match interactive is good but quizzes the same concept tested in bt-4's whyexplain.

**Proposed change:** Either remove bt-LC1, or rewrite it to focus purely on (a) the bitmask version + (b) counting-only optimization (skip building solutions). That would give it distinct value as a "depth" lesson.

---

### Lesson bt-LC2 — "Sudoku Solver — constraint propagation"

**Verdict:** keep

(MRV heuristic call-out is real senior content. Sort interactive is appropriate.)

---

### Lesson bt-LC3 — "Word Search II — Trie pruning"

**Verdict:** keep

(The "complexity flip" framing is gold — explains exactly why this beats per-word DFS. MCQ tests the framing.)

---

### Lesson bt-LC4 — "Expression Add Operators — multiplication carry"

**Verdict:** keep

(The `val - prev + prev*cur` derivation is the *whole* trick and it's spelled out clearly. Cloze tests the exact recurrence. High-quality LC-Hard drill.)

---

## Module: cod-intervals (Intervals)

### Lesson iv-1 — "Merge overlapping intervals"

**Verdict:** keep

(Tight, names the `&lt;` vs `&lt;=` trap, codepredict tests the silent-truncation bug. Good.)

---

### Lesson iv-2 — "Insert interval — the three-phase walk"

**Verdict:** keep

(Three-phase framing IS the senior signal. Cloze tests the exact Phase-2 boundary condition.)

---

### Lesson iv-3 — "Meeting rooms II — heap or sweep"

**Verdict:** keep

(Two approaches with tradeoffs, `&lt;` vs `&lt;=` trap is highlighted, codepredict tests it. Strong.)

---

### Lesson iv-4 — "Non-overlapping intervals — greedy by END"

**Verdict:** keep

(Counter-proof example is excellent. Recognition tip ("sort-by-end" vs "sort-by-start") is the senior decision rule. Whyexplain elicits the exchange argument.)

---

### Lesson iv-LC1 — "Employee Free Time — merge then complement"

**Verdict:** keep

(The "complement of a union" pattern callout is broadly useful and generalizes to several other LC problems.)

---

### Lesson iv-LC2 — "My Calendar III — sweep line / diff array"

**Verdict:** keep

(Delta-array explanation is the cleanest of the four LC drills. Whyexplain is real intuition.)

---

### Lesson iv-LC3 — "Meeting Rooms III — two heaps for room assignment"

**Verdict:** keep

(The "delay = end_now + duration" trick is non-obvious and well-explained. Match interactive maps structures to roles — good test of design intuition.)

---

### Lesson iv-LC4 — "Data Stream as Disjoint Intervals — SortedDict"

**Verdict:** tighten + interactive-weak

**Issue:** Code is dense and the four-cases-list isn't quite aligned with the code (the body lists 5 steps starting with "If x is inside…" but the code merges the "merge both sides" case differently). The findbug interactive is also confusing — it asks about a missing "merge both sides" case but `correctLine:6` points at the `right_start_is_xp1` flag definition, not the missing conditional. The actual buggy line is the missing `if left_end_is_xm1 and right_start_is_xp1:` branch — that's hard to express as a "click the broken line."

**Proposed change:** (1) Rewrite the findbug as an MCQ: "Which case is missing from the conditional chain?" with options like "Merge both sides", "Extend left", "Prepend right", "New singleton". (2) Tighten the body to 4 cases (drop the "If x is inside" preamble — it's already handled by the bisect check shown in code).

---

## Per-module summary

| Module | Total lessons | Keep | Tighten / expand | Notes |
|---|---|---|---|---|
| cod-prod | 8 | 5 | 3 (p-1, p-2, p-3) | All three "production Q" lessons (p-1/2/3) under-deliver on the *why this matters in production* angle and lack interactives. p-LC1..p-LC4 are uniformly strong. |
| cod-misc | 8 | 6 | 2 (m-2, m-4) | The two non-LC lessons (Floyd cycle, Trie) are how-to without why. Everything else (heaps overview, DP recognition, the 4 LC-Hard drills) is excellent. |
| cod-backtrack | 9 | 7 | 1 redundancy (bt-4 ↔ bt-LC1) | Highest-quality module overall. N-Queens is covered twice; merge or differentiate. |
| cod-intervals | 8 | 7 | 1 (iv-LC4) | iv-LC4's findbug widget is misaligned with the actual bug; rewrite as MCQ. All four base lessons (iv-1..iv-4) are model exemplars. |

**Top 3 actions (highest ROI):**

1. **cod-prod p-1/p-2/p-3:** add 1-2 sentences each on the production-context signal (why streaming, why jitter, why iterative) and add a small interactive to each. These are advertised as "production-flavored" but currently read like compact code recipes.
2. **cod-backtrack bt-4 vs bt-LC1:** resolve the N-Queens duplication. Either delete bt-LC1, or rewrite it to be purely about the bitmask optimization + counting-only variant.
3. **cod-intervals iv-LC4:** rewrite the findbug interactive — the broken line and the explanation point in different directions. Confusion-prone.

**General observation:** The LC-Hard drills (the `*-LC*` lessons) are consistently the strongest content in all four modules — they name the pattern, explain the *why*, and the interactives target the actual subtle insight. The plainer "Q:" lessons (p-1..p-4, m-2, m-4) trail in intuition depth and tend to lack interactives. Bringing those up to the LC-Hard standard would be the single highest-leverage edit pass.
