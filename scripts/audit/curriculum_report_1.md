# Algorithms audit — modules 1-4

Audit of `cod-graphs`, `cod-arrays`, `cod-advgraphs`, `cod-hashing` in `/Users/codyhsieh/Desktop/Coding/InterviewPrep/js/data.js` (lines 1608–2756).

Overall: these four modules are in good shape. Intuition is generally strong (the "WHY", named patterns, and senior-signal callouts are present). A handful of lessons have minor verbosity issues, and a couple of interactives are too obvious (the correct answer is the only one with technical vocabulary). Flagged below.

---

## Module: cod-graphs

### Lesson g-1 — "BFS — what it does and how to code it from memory"

**Verdict:** keep

(Strong: code-template + enqueue-vs-dequeue trap + algo-selection table + customer twists + deque depth callout. Tight; everything earns its keep.)

---

### Lesson g-2 — "Q: Shortest path between two nodes in a social graph"

**Verdict:** expand-intuition

**Issue:** Just two sentences in the body. No code, no interactive, no senior signal beyond a single hint. For a 15-XP / 12-min lesson, the depth is thin compared to siblings.

**Proposed change:** Add 3-4 bullets on bidirectional BFS — when it pays off (high branching factor, known target), the meet-in-the-middle math (√N), and a 6-line code sketch. Or add an MCQ where the wrong answers include "plain BFS" and "DFS for shortest path".

---

### Lesson g-3 — "Q: Infection spread"

**Verdict:** expand-intuition

**Issue:** Two-sentence body. Multi-source BFS is one of the highest-value patterns; the lesson treats it as a footnote. Also no interactive.

**Proposed change:** Add a 6-line code stub showing `queue = deque(initial_infected_nodes)` with depth tracking. One sentence on WHY multi-source BFS = single BFS with virtual super-source. Add an MCQ on what `level` means (= time-to-infection, not edges-from-start).

---

### Lesson g-4 — "Drill: write BFS in Python in 4 min"

**Verdict:** keep

(Pure drill; fits its role.)

---

### Lesson g-5 — "DFS — recursion, backtracking, and when to use it over BFS"

**Verdict:** keep

(Clean: template + BFS/DFS decision list + backtracking template + recursion-limit trap. Interactive is solid.)

---

### Lesson g-6 — "Union-Find (DSU) — connecting components fast"

**Verdict:** keep

(Code-with-both-optimizations + when-to-reach + interactive distinguishes BFS-per-query from DSU. Good.)

---

### Lesson g-LC1 — "Word Ladder II — why BFS-then-DFS, not pure BFS"

**Verdict:** keep

(The "compute the structure first, enumerate within it second" framing is exactly the senior-signal articulation this curriculum needs.)

---

### Lesson g-LC2 — "Shortest Path in Grid with K Obstacle Eliminations — state-space BFS"

**Verdict:** keep

(The "state space = grid × resource axis" reframe is the whole point. Cross-references to bitmask state and Cheapest Flights are valuable. Interactive tests the actual insight.)

---

### Lesson g-LC3 — "Bus Routes — model as a graph of routes, not stops"

**Verdict:** keep

(Modeling-flip lessons are the most valuable kind. The MCQ does real arithmetic comparing edge counts — non-trivial answer.)

---

### Lesson g-LC4 — "Open the Lock — implicit state graph + dead ends"

**Verdict:** keep

(Implicit-graph framing + bidirectional-BFS depth callout + the match interactive across 4 sibling problems is excellent.)

---

## Module: cod-arrays

### Lesson a-1 — "Two pointers — when linear sweep with two indices is the trick"

**Verdict:** keep

(Recognition matrix + rule-out depth callout + senior signal. Strong.)

---

### Lesson a-2 — "Sliding window — variable vs fixed"

**Verdict:** keep

(Fixed + variable templates + recognition heuristic. Compact.)

---

### Lesson a-3 — "Binary search — beyond find element in sorted array"

**Verdict:** keep

(The "binary search on the ANSWER" lift from intro-binary-search to senior-pattern is the value. Predicate framing is correct.)

---

### Lesson a-4 — "Prefix sums + difference arrays"

**Verdict:** keep

(Both directions covered + applications named.)

---

### Lesson a-LC1 — "Trapping Rain Water — two-pointer ruled-out argument"

**Verdict:** keep

(The "say the rule-out aloud" coaching is the senior bar.)

---

### Lesson a-LC2 — "Sliding Window Maximum — monotonic deque trick"

**Verdict:** keep

(Excellent findbug — `<` vs `<=` is a real, subtle bug that would surface only on adversarial input. Cross-ref to running min/max problems.)

---

### Lesson a-LC3 — "Median of Two Sorted Arrays — partition by binary search"

**Verdict:** keep

(One of the hardest interview problems and the explanation actually grounds the partition invariant. MCQ tests the cross-comparison check — not memorization.)

---

### Lesson a-LC4 — "Subarrays with K Different Integers — atMost(K) − atMost(K−1)"

**Verdict:** keep

(Pattern-naming + family cross-references. The interactive is correct but a bit too easy — option 0 is so obviously right that the others read like filler.)

**Minor nit (optional):** swap the distractors for two answers that are subtly wrong (e.g., "atMost(K) − atMost(K+1)" or "atMost(K) − atLeast(K)") to force the student to think about set-arithmetic direction.

---

## Module: cod-advgraphs

### Lesson ag-cod-1 — "Dijkstra — shortest path with weighted edges"

**Verdict:** keep

(Template + complexity + caveat + selection table. Solid.)

---

### Lesson ag-cod-2 — "Topological sort — ordering tasks with dependencies"

**Verdict:** keep

(Kahn's + cycle-detection bonus + DFS alternative noted.)

---

### Lesson ag-cod-3 — "Monotonic stack — next greater / smaller element"

**Verdict:** keep

(Template + 5-problem recognition list. Pattern-naming is tight.)

---

### Lesson ag-cod-4 — "Bit manipulation — XOR tricks, subset enumeration, bitmasks"

**Verdict:** interactive-weak

**Issue:** The MCQ ("array where every element appears twice except ONE, in O(1) memory") is THE textbook XOR problem and the answer is given away by "O(1) memory" — any candidate who skimmed the lesson picks XOR. Doesn't test understanding, only recall.

**Proposed change:** Switch to a harder variant — e.g., "every element appears THREE times except one — does plain XOR work?" (No — pairs no longer cancel; need bit-counting mod 3.) Or: "given two numbers each appearing once and the rest appearing twice, recover both." That requires understanding XOR partitioning by a differentiating bit — a real intuition test.

---

### Lesson ag-LC1 — "Cheapest Flights Within K Stops — Bellman-Ford vs modified Dijkstra"

**Verdict:** keep

(Explains WHY Dijkstra breaks + the `ndist = dist[:]` snapshot rationale. Decision interactive uses real numbers.)

---

### Lesson ag-LC2 — "Alien Dictionary — topological sort from inferred edges"

**Verdict:** keep

(Both edge cases — prefix-trap and disconnected letters — called out explicitly. Lex-smallest min-heap variant noted as bonus.)

---

### Lesson ag-LC3 — "Critical Connections — Tarjan's bridge-finding algorithm"

**Verdict:** keep

(The disc/low distinction is the deepest part of the problem and it's nailed. The "use disc[v] not low[v] for back-edges" subtlety is the senior-bar detail. Match interactive reinforces the four key concepts.)

---

### Lesson ag-LC4 — "Largest Rectangle in Histogram — monotonic stack invariant"

**Verdict:** keep

(Sentinel-trick explanation + width-formula derivation + cloze interactive that tests three distinct decisions.)

---

## Module: cod-hashing

### Lesson h-1 — "Q: Two-sum / pair-sum to target"

**Verdict:** keep

(Short and earns it — this is a known baseline, the followups are the value.)

---

### Lesson h-2 — "Q: First non-repeating character"

**Verdict:** keep

(Streaming followup is the right intuition hook.)

---

### Lesson h-3 — "Q: LRU cache, O(1) get/put"

**Verdict:** keep

(One of the highest-frequency interview problems. Code is complete with sentinel-list pattern. Worth its length.)

---

### Lesson h-4 — "Q: Max sum sliding window of size k"

**Verdict:** tighten

**Issue:** Duplicates material already covered in `a-2` (fixed-size sliding window). Same identical code shape. In a curriculum this is fine if it's framed as "Q-style" practice, but the body adds nothing the array module didn't.

**Proposed change:** Either delete (already covered in `a-2`) and replace with a hash-flavored variant (e.g., "longest substring without repeating chars" — same family, but uses hash). Or keep but trim to 3 lines + the code, and add a sentence pointing at the array module to avoid duplication confusion.

---

### Lesson h-LC1 — "Minimum Window Substring — sliding window with counter"

**Verdict:** keep

(The `matched` integer optimization explanation + symmetric shrink rule is the senior insight. Sort interactive tests the order of operations — not memorization.)

---

### Lesson h-LC2 — "Substring with Concatenation of All Words — windowed hash check"

**Verdict:** keep

(Track decomposition via `offset in range(L)` is the unlock and the MCQ tests exactly that insight.)

---

### Lesson h-LC3 — "First Missing Positive — index-as-hash in O(N) time, O(1) space"

**Verdict:** keep

(Pigeonhole framing in the interactive is the real intuition test. The "array-as-hash" pattern callout cross-references three siblings.)

---

### Lesson h-LC4 — "Longest Substring with At Most K Distinct Characters"

**Verdict:** keep

(The "while not if" bug-find is a real candidate trap. The "at-most-K family in different costumes" generalization is the senior takeaway.)

---

## Summary

| Module | Lessons reviewed | Flagged tighten | Flagged expand | Interactive-weak |
|---|---|---|---|---|
| cod-graphs | 10 | 0 | 2 (g-2, g-3) | 0 |
| cod-arrays | 8 | 0 | 0 | 0 (a-LC4 minor nit) |
| cod-advgraphs | 8 | 0 | 0 | 1 (ag-cod-4) |
| cod-hashing | 8 | 1 (h-4) | 0 | 0 |
| **Total** | **34** | **1** | **2** | **1** |

**Top three changes worth making (in priority order):**

1. **g-2 and g-3** — beef up bodies. Two-sentence answers don't fit the 12–15 XP / 12-min budget. Both teach high-frequency patterns (bidirectional BFS, multi-source BFS) that deserve real templates + interactives.
2. **ag-cod-4 (Bit manipulation)** — replace the XOR MCQ with the "appears three times except one" or "two singletons" variant. The current question gives away its answer via the constraint phrasing.
3. **h-4** — either delete (duplicates a-2) or refocus on a hash-flavored sliding-window variant.

Everything else is genuinely solid. The LC-Hard drills consistently nail the "WHY this works" / pattern-naming / senior-signal framing the curriculum is going for.
