# Algorithms audit — modules 13-15

Scope: `cod-stack`, `cod-select`, `cod-strings` in `/Users/codyhsieh/Desktop/Coding/InterviewPrep/js/data.js` (lines 5249–6106).

---

## Module: cod-stack

### Lesson st-1 — "Valid parentheses — pair-match with stack"

**Verdict:** keep

(Minor nit: the `explain` says `pop "[" — expected "(" but got "["`. Strictly, the pop returns `"["` and the expected value (`pair[")"]`) is `"("` — so it'd read more naturally as "popped `[` but expected `(`". Optional polish.)

---

### Lesson st-2 — "Min stack — O(1) min query"

**Verdict:** keep

Tight, clean, good cloze with strong distractor analysis.

---

### Lesson st-3 — "Decode string — nested k[content]"

**Verdict:** keep

The "trick to recognize" callout names the pattern; codepredict tests an actual nested trace.

---

### Lesson st-LC1 — "Basic Calculator IV — parse expressions with parens"

**Verdict:** tighten (minor)

**Issue:** The findbug `codeLines` reference a `precedence()` helper that is never defined inside the snippet, and the snippet omits the `(`/`)` handling entirely. A learner inspecting the lines may get confused about whether the bug is the missing helper, the missing parens-branch, or the `>` vs `>=`.

**Proposed change:** Add a one-line comment above the snippet: `# (precedence() defined elsewhere; this snippet only shows the operator-handling logic)`. Keep the bug as-is — `>` vs `>=` is exactly the right thing to test.

---

### Lesson st-LC2 — "Sum of Subarray Minimums — monotonic stack counting"

**Verdict:** keep

Excellent: explicit "pivot from iterate subarrays to iterate elements", asymmetric tiebreak gets its own paragraph, callout generalizes to related problems. This is the senior-signal pattern.

---

### Lesson st-LC3 — "Maximal Rectangle — apply histogram row-by-row"

**Verdict:** interactive-weak

**Issue:** The MCQ explanation is correct on the `heights` array but then rambles into a confused histogram-maximum aside ("cols 0,2,3 limited by min=2" — cols 0,2,3 aren't contiguous, so this isn't a valid rectangle). It muddles the very thing the question is supposed to test cleanly.

**Proposed change:** Truncate the explanation at "Heights = [3,1,3,2]." Drop the trailing histogram-area calculation entirely — it's tangential to the MCQ and contains a contiguity error that may mislead.

---

### Lesson st-LC4 — "132 Pattern — descending monotonic stack"

**Verdict:** tighten

**Issue:** The match-pair labels are imprecise. The "2" pair says "rightmost" — but in "132", the **2 is rightmost in position** while **middle in value**. Mixing axes ("position" vs "value") in the same label causes a re-read. Also, "Updated as the max of values popped" is slightly misleading: `second` is set to *each* popped value in turn; because the stack is descending, the *last* pop in a run happens to be the largest popped — but the code is `second = stack.pop()`, not `second = max(second, stack.pop())`. A learner reading the code looking for `max(...)` will be confused.

**Proposed change:** Reword the pair labels as `("1" — smallest in value, leftmost in position)`, `("2" — middle value, must be to the right of "3")`, `("3" — largest value, must be to the left of "2")`. Change "Updated as the max of values popped" to "Updated each time we pop — since the stack is monotonically decreasing, popping in order means `second` grows to the largest popped this iteration."

---

## Module: cod-select

### Lesson sel-1 — "Quickselect — Kth largest in O(N) avg"

**Verdict:** tighten (real correctness bug in the snippet)

**Issue:** The `partition` function is inconsistent with its own comments. It claims "Hoare partition: produce ≥ pivot then ≤ pivot zones" but the loop body only does the left side, and there is **no swap of the pivot into position** at the end. The trailing comment `# Put pivot in its final place by moving the last element here (simplified: standard Lomuto with pivot at end; see notes)` waves at this, but as written `partition()` returns `i` without the pivot ever being placed at `i`, so the outer `while` loop's `nums[p] == target → return nums[p]` returns whatever happened to land at index `i`, not the pivot value. A learner who copies this won't get a working quickselect.

**Proposed change:** Either (a) commit to Lomuto: place pivot at `nums[hi]` up front, do the standard Lomuto loop with `<= pivot`, swap pivot into `nums[i]` at the end, return `i`; or (b) keep it short and just say "see Lomuto partition" without the half-implementation. (a) is preferable because the lesson explicitly promises "Quickselect minus the recursion".

The `whyexplain` interactive is excellent — keep as-is.

---

### Lesson sel-2 — "Top-K with heap — streaming-friendly"

**Verdict:** keep

Clear, the "why min-heap for top-K largest" gets its own line, and the cloze options are well-chosen.

---

### Lesson sel-3 — "Median of two sorted arrays — binary search"

**Verdict:** keep

The ±∞ sentinels insight is called out; whyexplain is one of the strongest in the curriculum (explicit "more importantly" clause separates asymptotic from practical).

---

### Lesson sel-LC1 — "Sliding Window Median — two heaps + lazy deletion"

**Verdict:** tighten

**Issue:** Body is the longest in this module (~42 lines of code). The `prune` helper uses a slightly cryptic `(-h[0] if h is lo else h[0])` twice; this obscures the actual idea ("look at the top, decrement its delayed-count, pop if it's still marked"). A learner who is here for the **pattern** (lazy deletion on a heap) has to first decode the negation-trick before getting to it.

**Proposed change:** Replace `prune` with a version that takes an explicit `is_lo: bool` arg, or inline a comment `# lo stores negatives (max-heap simulation); hi stores values directly`. The body of `prune` itself could become `top = -h[0] if is_lo else h[0]; while h and delayed[top] > 0: ...`. Keeps every senior insight but cuts re-reading.

---

### Lesson sel-LC2 — "Kth Largest Element in a Stream — min-heap of size K"

**Verdict:** keep

Pattern is named ("size-bounded heap"), and the match interactive is genuinely useful — comparing min-heap-K vs max-heap-K vs quickselect side by side reinforces the dual.

---

### Lesson sel-LC3 — "Kth Smallest Element in Sorted Matrix — binary search on VALUE"

**Verdict:** keep

The "wrong angle" → "smart angle" framing is gold for senior interviews; pattern callout generalizes. MCQ tests the trickiest step (what to do when the cell is > mid).

---

### Lesson sel-LC4 — "Wiggle Sort II — quickselect + index remap"

**Verdict:** tighten (title/content mismatch)

**Issue:** The lesson is titled **"quickselect + index remap"** and the body explicitly promotes a "virtual index" formula `v(i) = (2*i + 1) % (n | 1)` as the headline trick. But the code snippet uses `nums.sort()` and a straightforward two-half interleave — no quickselect, no virtual index. A reader who came for the senior O(N) technique sees an O(N log N) sort-and-interleave instead.

**Proposed change:** Either (a) rename the lesson to "Wiggle Sort II — sort + reverse-interleave" and demote the virtual-index trick to a final "for O(N): use quickselect + virtual index" pointer, or (b) actually write the quickselect+virtual-index version. (a) is the pragmatic move for an interview-prep deck — sort-and-interleave is what most senior candidates would produce, and the "reverse before interleaving" insight is the real teachable moment.

The whyexplain interactive is fine but currently phrased as MCQ-with-modelAnswer; option 1's text is the right answer and the explanation is solid.

---

## Module: cod-strings

### Lesson sm-1 — "KMP — failure function for O(M+N) matching"

**Verdict:** keep

The whyexplain rubric is strong; "naive slide by 1 might miss a match if the pattern has internal repetition (e.g., aab in aaab)" is a sharp concrete senior-signal example.

---

### Lesson sm-2 — "Rabin-Karp — rolling hash for fast substring match"

**Verdict:** interactive-weak

**Issue:** The interactive `codepredict` runs **naive substring matching** (`text[i:i+M] == pat`), not Rabin-Karp. It tests "what does naive scan return?" — which is what Rabin-Karp is supposed to *replace*. The lesson body is about hashing and rolling, but the activity tests none of that. A learner can answer correctly without understanding rolling hash at all.

**Proposed change:** Replace with a `codepredict` that traces the rolling-hash update for a small example. E.g., compute `win_hash` for `"aab"` and then one rolling-update step to `"abc"`, and ask "what does `win_hash` equal after the update?" — multi-choice between (a) the correct rolled value, (b) the value if you forgot to subtract the outgoing char, (c) the value if you forgot the `* base` shift, (d) the value if you forgot to mod. The distractors map directly to the three things a learner has to get right. Alternatively: a `findbug` on the rolling-hash recurrence line itself (most students miss the `* h` multiplier on the outgoing char) — that would test exactly the senior-signal piece.

---

### Lesson sm-3 — "Z-function — every prefix-length match in O(N)"

**Verdict:** keep

The trace-the-output codepredict is fair — distractors are plausible off-by-ones (z[1]=0 vs 1, z[3]=3 vs 4). The "pat + # + text" pattern-matching trick is named.

---

### Lesson str-LC1 — "Shortest Palindrome — KMP failure function trick"

**Verdict:** keep

The reframe ("longest palindromic prefix") and the `s + "#" + reverse(s)` trick are both called out cleanly. Senior-signal callout is well-placed.

---

### Lesson str-LC2 — "Distinct Subsequences II — DP with last-occurrence subtraction"

**Verdict:** keep

The "subtract `dp[last[c] - 1]`" off-by-one is exactly the bug the findbug catches — the bug isolates the senior-signal index, not boilerplate. Tight.

---

### Lesson str-LC3 — "Wildcard Matching — DP with * (multi-char) and ? (single)"

**Verdict:** keep

The "* matches empty OR consumes one" decomposition is the key recurrence and is given its own block. MCQ trace is a clean end-to-end verification.

---

### Lesson str-LC4 — "Longest Duplicate Substring — binary search + rolling hash"

**Verdict:** keep

Strong: "two-layer search" framing, monotonicity argument given, collision-verification step explained, why-binary-search is exactly the senior signal — and the whyexplain interactive tests exactly that.

---

## Per-module summaries

### cod-stack
**Solid module.** 4 of 7 lessons "keep" as-is. Top issues:
1. **st-LC3 (Maximal Rectangle) MCQ explanation** trails into a wrong/confused histogram-area calculation — truncate it.
2. **st-LC4 (132 Pattern) match labels** mix "value-rank" and "position-order" in the same sentence — clarify.
3. **st-LC1 (Calculator) findbug** uses an undefined `precedence()` helper — add a one-line comment to disarm confusion.

### cod-select
**Has the only correctness bug found in the audit.**
1. **sel-1 (Quickselect) partition snippet is incomplete** — it claims to be Hoare, half-implements something Lomuto-shaped, and never places the pivot. Must fix; learners will copy and ship broken quickselect.
2. **sel-LC4 (Wiggle Sort II) title/body promise quickselect + virtual index; code does sort + interleave.** Rename the lesson or rewrite the code.
3. **sel-LC1 (Sliding Window Median) `prune` helper has a cryptic ternary** — inline a comment or factor out.

### cod-strings
**Highest signal-to-noise module, but has the single weakest interactive.**
1. **sm-2 (Rabin-Karp) interactive tests naive matching, not rolling hash.** Replace with a rolling-hash update trace or a findbug on the recurrence — this is the highest-impact single fix in the audit because it touches the lesson's entire reason for existing.

### Cross-module themes
- **Interactives ≥ explanations.** Most interactives in these modules genuinely test the senior signal (whyexplain rubrics in sm-1, sel-3, sel-1; findbug on the `>` vs `>=` in st-LC1; off-by-one index in str-LC2 are all excellent). The two weak ones (st-LC3 MCQ tail, sm-2 codepredict) stand out by contrast.
- **Pattern-naming is consistently strong.** "Shunting-yard", "size-bounded heap", "binary search on answer", "lazy deletion at heap top", "pat + # + text" — these names are exactly what a candidate should be able to drop in an interview.
- **Code-vs-narrative consistency** is the recurring tightening axis: sel-1, sel-LC4, and st-LC1 all have small mismatches between what the prose promises and what the snippet delivers.
