# Algorithms audit — modules 9-12

Audit of `cod-trees`, `cod-greedy`, `cod-dp`, `cod-linked` in `/Users/codyhsieh/Desktop/Coding/InterviewPrep/js/data.js` (lines ~3937–5247). Verdicts use:
- **keep** — solid as-is
- **tighten** — concise issue (cut fluff/dup, shrink code)
- **expand-intuition** — needs WHY / pattern recognition / senior signal
- **interactive-weak** — activity too easy, gives away the answer, or tests memorization

---

## Module: cod-trees

### Lesson tr-1 — "Three traversals + level-order, iterative versions"

**Verdict:** tighten

**Issue:** Body promises "four traversals" but only shows three (pre, in, level). Post-order is conspicuously missing, which is the one candidates actually fumble.

**Proposed change:** Either add the iterative post-order (the "two-stack" or "track last-visited" trick — it's the senior signal here) or change wording to "three traversals + BFS." Currently the title says four and the prose says four; the code shows three.

---

### Lesson tr-2 — "Lowest Common Ancestor — BST vs binary tree"

**Verdict:** keep

---

### Lesson tr-3 — "Serialize & deserialize binary tree (BFS encoding)"

**Verdict:** interactive-weak (mild) + overlap warning

**Issue:** Interactive `correct:1` is `1,2,3,#,#,#,#` — solvable purely by counting null slots without understanding BFS. Also: this lesson covers BFS-serialize; `t-LC2` (later in the same module) covers DFS-preorder serialize. The two overlap substantially.

**Proposed change:** Either retire the second one or reframe `t-LC2` as "Variants & tradeoffs: BFS vs preorder serialization" (a comparison drill, not a re-teach). For the interactive, ask a follow-up like "which encoding scheme produces THIS output?" — tests recognition across encodings.

---

### Lesson tr-4 — "Validate BST — pass min/max bounds"

**Verdict:** keep

---

### Lesson tr-5 — "Kth smallest in BST"

**Verdict:** keep

---

### Lesson tr-6 — "Max path sum — return one, track best"

**Verdict:** tighten (overlap)

**Issue:** This lesson and `t-LC1` ("Binary Tree Maximum Path Sum — return vs record") teach the SAME problem with the SAME insight. Total redundancy ~80%.

**Proposed change:** Drop `t-LC1`, or convert it into a follow-up variant drill (e.g., "max path sum with at most K bends" or path-sum on a DAG). Right now a learner sees the same code twice in one module.

---

### Lesson t-LC1 — "Binary Tree Maximum Path Sum — return vs record"

**Verdict:** tighten (see tr-6) — recommend removal or reframing.

---

### Lesson t-LC2 — "Serialize and Deserialize — preorder with null markers"

**Verdict:** tighten (overlap with tr-3) — see tr-3 note.

---

### Lesson t-LC3 — "Recover BST — Morris traversal"

**Verdict:** keep

(Strong — the "two scans suffice for two violations" callout is exactly the right level of insight.)

---

### Lesson t-LC4 — "Vertical Order Traversal"

**Verdict:** expand-intuition

**Issue:** Body is good but the "why is this an LC-Hard?" signal isn't called out. It's only hard because of the tiebreak rule; otherwise it's a simple BFS.

**Proposed change:** Add one sentence: "This is a Hard only because of the tiebreak spec — the core traversal is trivial. The senior move is naming the (col, row, val) tuple key upfront and not getting lost in the BFS plumbing."

---

## Module: cod-greedy

### Lesson gr-1 — "Jump game"

**Verdict:** keep

(Excellent — the coin-change counter-example callout teaches the META lesson "when does greedy fail?" — exactly the senior signal.)

---

### Lesson gr-2 — "Gas station"

**Verdict:** keep

---

### Lesson gr-3 — "Task scheduler"

**Verdict:** expand-intuition

**Issue:** The "framework" formula `(M-1)*(n+1) + most` is presented but the geometric picture isn't drawn. Many learners memorize the formula without understanding the slot grid — they fail variants.

**Proposed change:** Add a 3-4 line ASCII diagram of the slot grid for the [A,A,A,B,B,B], n=2 case:
```
A _ _ A _ _ A         <- 3 A's, gap of n=2 between them
A B _ A B _ A B       <- B's fill into the gaps; last row partial
```
That single diagram makes the formula obvious.

---

### Lesson gr-4 — "Interval scheduling maximization"

**Verdict:** keep

(The "sort by END vs sort by START" recognition callout is exactly right.)

---

### Lesson gr-LC1 — "Candy"

**Verdict:** keep

(The pattern-pointer to trapping rain water / product except self is gold.)

---

### Lesson gr-LC2 — "Patching Array"

**Verdict:** keep

---

### Lesson gr-LC3 — "Minimum Refueling Stops"

**Verdict:** keep

---

### Lesson gr-LC4 — "Jump Game IV"

**Verdict:** interactive-weak

**Issue:** Interactive uses `type:'decision'` which doesn't appear in the rest of the modules audited (likely not implemented in the widget renderer). Verify it renders, or convert to `mcq`/`whyexplain`. Question itself is solid.

**Proposed change:** Change `type:'decision'` to `type:'mcq'` (with the same options/correct/explain) unless the decision widget is supported.

---

## Module: cod-dp

### Lesson dp-1 — "1D DP — house robber, climbing stairs"

**Verdict:** keep

---

### Lesson dp-2 — "2D DP — unique paths, edit distance"

**Verdict:** keep

---

### Lesson dp-3 — "0/1 Knapsack"

**Verdict:** keep

(The "iterate backwards = 0/1, forwards = unbounded" insight is correctly framed as senior signal via the whyexplain.)

---

### Lesson dp-4 — "LIS — patience sort"

**Verdict:** keep

(The "tails is NOT the LIS itself" clarification is a frequent point of confusion — well handled.)

---

### Lesson dp-5 — "Palindrome partition"

**Verdict:** tighten

**Issue:** Body shows both isPal precompute AND the min-cuts DP — 20+ code lines. The two-pass structure is clear, but the code dump is dense without comments tying the second loop's recurrence back to the verbal description.

**Proposed change:** Add a 1-line comment on `dp[i] = min(dp[j-1] + 1)`: `# cut between s[:j] (handled) and s[j:i] (palindrome) → 1 new cut`. Cuts cognitive load significantly without removing content.

---

### Lesson dp-LC1 — "Burst Balloons"

**Verdict:** keep

(The "last to burst" reframing IS the senior signal and it's called out explicitly. Strong.)

---

### Lesson dp-LC2 — "Distinct Subsequences"

**Verdict:** keep

(Findbug interactive is sharp — it tests the EXACT classic bug: assigning on match instead of adding.)

---

### Lesson dp-LC3 — "Russian Doll Envelopes"

**Verdict:** keep

---

### Lesson dp-LC4 — "Stone Game II"

**Verdict:** interactive-weak

**Issue:** Interactive uses `type:'cloze'` with a `template`/`blanks` shape that differs from other cloze interactives in this audit (which use `before`/`after`/`options`/`correct`). Likely a different widget contract or possibly unsupported. Also: with `min/max/sum/abs` and `+/-/*//`, the answer is essentially obvious from arithmetic context.

**Proposed change:** Verify the multi-blank cloze schema is supported. Consider switching to `whyexplain` asking "Why is the score equation `suffix[i] - dfs(...)`?" — that's the real insight (zero-sum trick), not the syntax.

---

## Module: cod-linked

### Lesson ll-1 — "Reverse a linked list"

**Verdict:** keep

(Findbug interactive nails the canonical bug. Excellent.)

---

### Lesson ll-2 — "Merge two sorted lists + merge K"

**Verdict:** keep

(The `counter` tiebreaker explanation is the senior signal that distinguishes good answers — well surfaced.)

---

### Lesson ll-3 — "Fast/slow — cycle detect + cycle start"

**Verdict:** expand-intuition

**Issue:** The math justification for "reset slow to head, walk both at speed 1" is given in dense one-paragraph form: "S = nC + D where D is distance from head to entrance." A reader who doesn't already know the proof will read past it without absorbing.

**Proposed change:** Either (a) drop the proof to a `callout-depth` block with a clearer 3-line derivation, or (b) add an ASCII sketch:
```
head ---D--- entrance ===C-cycle===
slow walked: D + k (somewhere in cycle)
fast walked: 2(D + k) = D + k + nC  →  D + k = nC  →  D = nC - k
```
Currently the "why" is technically present but practically inaccessible.

---

### Lesson ll-4 — "Copy list with random pointer"

**Verdict:** tighten (overlap)

**Issue:** This lesson covers BOTH hashmap AND interleave approaches. `ll-LC2` (later in the same module) covers the same two approaches again. ~85% duplicate.

**Proposed change:** Drop one. Since `ll-4` is the "base concept" slot and `ll-LC2` is in the LC-Hard ladder, retire `ll-LC2` or convert it to a related drill ("Clone Graph" or "Deep copy a DAG with cycles" — same trick, new structure).

---

### Lesson ll-LC1 — "Reverse Nodes in K-Group"

**Verdict:** keep

---

### Lesson ll-LC2 — "Copy List with Random Pointer (interleave)"

**Verdict:** tighten — see ll-4 note (overlap, recommend retirement or repurposing).

---

### Lesson ll-LC3 — "LFU Cache"

**Verdict:** keep

(Strong: dual-map structure, min_freq trick, and the OrderedDict insight all called out.)

---

### Lesson ll-LC4 — "Sort List — merge sort"

**Verdict:** keep

(The "fast = head.next" off-by-one detail is the subtle thing that catches candidates — correctly surfaced.)

---

## Per-module summary

### cod-trees
- **Biggest issue:** **Two major lesson overlaps** — `tr-6 ↔ t-LC1` (max path sum) and `tr-3 ↔ t-LC2` (serialize). Roughly 25% of the module is duplicate content. Consolidate or repurpose the LC-Hard slots as VARIANTS, not re-teaches.
- Minor: tr-1 promises four traversals but only shows three (post-order missing).
- Otherwise strong — LCA, Validate BST, Recover BST drills are excellent.

### cod-greedy
- **Strongest module of the four.** Every base lesson has the right recognition pattern + senior signal. The "when greedy fails" callout in gr-1 is meta-pedagogy at its best.
- Minor: gr-3 (task scheduler) would benefit from the slot-grid ASCII diagram.
- Minor: gr-LC4 uses `type:'decision'` which may not be a supported widget — verify.

### cod-dp
- Solid coverage of the canonical five DP shapes. The LC-Hard drills (burst balloons, distinct subseq, Russian doll, stone game) each unlock with a single reframing that's correctly called out.
- Minor: dp-5 (palindrome partition) code dump needs inline comments.
- Minor: dp-LC4 uses non-standard `cloze` shape (`template`/`blanks` instead of `before`/`after`) — verify widget supports it.

### cod-linked
- **Same overlap problem as cod-trees:** `ll-4 ↔ ll-LC2` (copy with random pointer) is duplicate. Drop one.
- ll-3 (cycle start proof) needs an ASCII sketch — the math is technically there but practically opaque.
- Otherwise strong; LFU and Sort List are well-handled.

### Cross-cutting recommendations

1. **Audit for LC-Hard duplicates across all modules.** The pattern of "base lesson teaches X, then LC-Hard slot teaches X again" appears in 3 of 4 modules audited. The LC-Hard ladder should be VARIANTS or stretches, not re-teaches of the base concept.
2. **Standardize interactive widget types.** `type:'decision'` (gr-LC4) and the multi-blank `cloze` shape (dp-LC4) deviate from the rest. Either standardize or verify the renderer supports them.
3. **Inline comments on dense code blocks.** Several lessons (dp-5, ll-4 approach 2) drop 15-20 line code snippets without inline annotations tying back to the prose. One-line comments per major step would significantly reduce friction.
