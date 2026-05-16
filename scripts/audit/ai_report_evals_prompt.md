# ai-evals + ai-prompt audit

Reviewed against the May 2026 state of LLM evals + prompting. Web checks confirmed: (1) Promptfoo was acquired by OpenAI for $86M in March 2026 (still MIT-licensed); (2) reasoning models (o3, Claude extended-thinking, DeepSeek-R1, Gemini Deep Think) are the dominant pattern and have changed how CoT should be taught; (3) Braintrust raised $80M at $800M in Feb 2026; (4) the modern stack is "lightweight CI tool (DeepEval/RAGAS/Promptfoo) + platform (Braintrust/LangSmith/HoneyHive)"; (5) provider-side structured outputs (OpenAI strict JSON, Anthropic tool-use schemas, Gemini controlled generation) are now the default for JSON.

---

## Module: ai-evals

### Lesson ev-1 — "Why 'evals' are the hardest part of AI engineering"
**Verdict:** keep (minor tighten)
**Issue:** Strong framing and the 3-layer mental model is the right senior pattern. Slightly verbose in the opener (the law-firm hypothetical eats 2 sentences before delivering the punchline). The code snippet's `unit_checks` is fine, but the `eval_golden_set` snippet duplicates content that lesson ev-3 covers in more depth — slight redundancy across lessons.
**Proposed change:** Trim the law-firm framing to one sentence ("'How do you know your AI works?' is the question every junior fumbles at AI-FDE rounds in 2026."). Drop the `eval_golden_set` snippet from this lesson — it pre-empts ev-3. Add one sentence naming the modern tooling baseline ("In 2026 you build these three layers on top of a platform — Braintrust, LangSmith, or HoneyHive — not from scratch.") so ev-5 doesn't feel disconnected.

---

### Lesson ev-2 — "LLM-as-judge — and the 4 ways it lies to you"
**Verdict:** update-content (high-value lesson, missing 2026 patterns)
**Issue:** The 4 biases (length, position, self-preference, drift) are correct and well-explained — this is senior-grade content. But the lesson misses three patterns that are now table stakes in 2026:
1. **Pairwise preference vs. absolute scoring** — interviewers expect candidates to name *when* to use which. Absolute Likert scores are noisy; pairwise is the standard for model-vs-model comparisons. Lesson hints at pairwise but doesn't name the tradeoff.
2. **Rubric-based / G-Eval style judges** (decomposing a single "is it good?" into structured sub-scores that the judge fills in one-by-one) — this is the dominant Braintrust/DeepEval pattern.
3. **Reasoning models as judges** — using o3 / Claude extended-thinking as the judge measurably reduces bias 1 (length) and bias 2 (position) because the model deliberates before scoring. Worth one sentence.

Also: the code snippet has a bug. `s2_reverse` and `s1_reverse` both call `score(_, q)` with the same one-argument signature — there's no actual order swap happening (the comment says "Swap order and re-score" but the function never takes a pair, so position never swaps). Either rewrite as a true pairwise function `score(q, a_first, a_second)` or remove the snippet.
**Proposed change:** Add "Bias 5 — Verbosity-of-rubric bias" is overkill; instead, after the 4 biases, add a short "2026 patterns" paragraph: (a) prefer pairwise + bidirectional for model comparisons, absolute Likert only for regression tracking against a fixed baseline; (b) use a rubric-decomposed judge (separate sub-scores for factual/complete/tone, not one global score); (c) reasoning-model judges (o3, Claude extended-thinking) materially reduce length + position bias — worth the cost on high-stakes evals. Fix the pairwise code so it actually takes `(q, a, b)` and swaps order.

---

### Lesson ev-3 — "How to build a golden set in one day"
**Verdict:** keep
**Issue:** Excellent — the 1-hour / 3-hour / 1-hour / 1-hour breakdown is the kind of concreteness candidates remember in interviews. Frequency × business value sampling is the right senior signal. Adversarial / OOS coverage is exactly what staff+ engineers ask about. Minor: `rubric` in the example shows expected scores (5,5,4,4) but it should probably show *axes* not *scores* — the second example correctly uses `rubric_axes`. Inconsistency, not a substantive bug.
**Proposed change:** Tiny fix: unify the JSONL examples — both should use `rubric_axes: ["factual","completeness","tone","citation"]` rather than mixing axes and pre-filled scores. Optional add: one line about *regression tagging* (mark which examples were added because of a specific bug — gives you a "did the fix stick?" signal over time).

---

### Lesson ev-4 — "Q: Eval suite for an agent that spends money"
**Verdict:** expand-intuition (too thin for the topic)
**Issue:** This is a question-type lesson with a 4-line answer. The topic — eval'ing a money-spending agent — is one of the highest-signal interview questions in 2026 (AI agents are the hot category), and the answer compresses too much. Specifically missing:
- **Trajectory eval** (not just outcome) — did the agent take a reasonable path, or did it spend $40 to do something a 2-line script could do? This is the τ-bench / SWE-bench Verified pattern.
- **Counterfactual / replay eval** — record real traces, replay against new model versions, compare spend + outcome. This is the production pattern at Sierra and Adept.
- **Tool-call correctness** — did it call the right tool with the right args? Schema-validated.
- **Human-in-the-loop gating** — for spend > threshold, agent must request approval; eval'd separately.
**Proposed change:** Expand to ~120 words: tooling-level guardrails (budget mocks, schema-validated tool calls), **trajectory evals** (τ-bench style — score the *path* not just outcome), 30 representative scenarios with expected spend bands, adversarial set (prompt-injection via tool outputs, role confusion), production: hard-cap + 80% alert + human-approval gate for high-spend actions, replay-eval new model versions against logged production traces.

---

### Lesson ev-5 — "The eval-tooling landscape (RAGAS, DeepEval, Braintrust, HoneyHive)"
**Verdict:** update-content (missing the two highest-mindshare tools)
**Issue:** Misses **LangSmith** and **Promptfoo** — the two most likely names to come up in a 2026 interview.
- **LangSmith** is the LangChain-attached eval/tracing platform; framework-agnostic since 2025 but most teams using LangChain default to it. Has to be named.
- **Promptfoo** (acquired by OpenAI March 2026 for $86M, still open source MIT) — the dominant red-teaming + CI-style YAML eval tool. Used by OpenAI and Anthropic internally per their own README. If a candidate doesn't name this, the interviewer notices.
- Also missing: **OpenAI Evals** (the OpenAI-published framework, now somewhat folded into Promptfoo direction post-acquisition), and the **Anthropic eval workbench** in the Claude console.

The "how to pick" guidance is decent but is missing the modern team pattern: most teams pair a **lightweight CI tool (DeepEval / Promptfoo / RAGAS)** with a **platform (Braintrust / LangSmith / HoneyHive)**. That's the 2026 answer.
**Proposed change:** Add Promptfoo (open-source, YAML configs, red-teaming + CI, acquired by OpenAI) and LangSmith (LangChain-attached but framework-agnostic, hosted) as top-level entries. Add a one-liner on OpenAI Evals + Anthropic console eval workbench. Replace the "How to pick" list with the modern stacking pattern: *"Most production teams run two tools: a CI-grade scorer (DeepEval / Promptfoo / RAGAS) that gates PRs, plus a platform (Braintrust / LangSmith / HoneyHive) that PMs and SMEs use to review traces, edit datasets, and track regressions."* This is the senior-signal answer.

---

## Module: ai-prompt

### Lesson pr-1 — "Anatomy of a production prompt (with example)"
**Verdict:** update-content
**Issue:** The 4-section structure (SYSTEM / FEW-SHOT / USER / FINAL REMINDER) is solid and correctly senior-coded. But the lesson is teaching 2023-era prompting and misses what changed:
1. **Structured outputs are now provider-enforced**, not prompt-enforced. The lesson's "respond ONLY in this JSON schema" is the *fallback* — the primary technique in 2026 is OpenAI strict structured outputs / Anthropic tool-use input schemas / Gemini controlled generation. Saying "respond in JSON" in the system prompt without using the API's structured-output flag is a junior signal. This must be named.
2. **Few-shot guidance for reasoning models is different.** For o3 / Claude extended-thinking / DeepSeek-R1, few-shot examples can *degrade* performance (the model's pre-trained reasoning chain conflicts with the example demonstrations). The lesson currently teaches few-shot as a universal "highest-leverage thing" — true for non-reasoning models, false for reasoning models. Add the caveat.
3. **The "FINAL REMINDER" trick** is increasingly unnecessary on modern long-context models with structured outputs enforced. Worth flagging as a "still useful but less load-bearing in 2026" pattern.
**Proposed change:** Add a short closing paragraph: *"In 2026, prefer your provider's structured-outputs feature (OpenAI strict JSON, Anthropic tool-use with input_schema, Gemini controlled generation) over prompt-level JSON instructions — failure rate drops below 0.1%. The system-prompt schema becomes documentation, not enforcement. Also: for reasoning models (o3, Claude extended-thinking, DeepSeek-R1), few-shot can degrade performance — start zero-shot and add examples only if the eval shows improvement."*

---

### Lesson pr-2 — "Chain-of-thought (CoT) — why it works and how to use it"
**Verdict:** update-content (the most outdated lesson in either module)
**Issue:** Lesson correctly mentions reasoning models in one paragraph ("Claude with extended thinking, GPT with o-mode") but underweights the size of the shift. In May 2026, the senior answer to "do you use CoT?" is: *"No — I use a reasoning model. CoT was the 2022–2024 workaround when models couldn't deliberate natively."* The lesson currently presents CoT as the default and reasoning models as the "modern alternative." That framing is reversed for 2026.

Also missing:
- **Chain-of-Draft** — the 2026 efficiency variant (5-word-max reasoning steps, ~80% fewer tokens, same accuracy on R1/o3). Worth naming.
- **Self-consistency** — sample N CoT traces, majority-vote the answer. Standard pattern when you can't use a reasoning model.
- **Best-of-N** — generate N answers, judge or vote, pick best. Common for code gen.
- The classic CoT advice ("Let's think step by step") *hurts* o3 and Claude extended-thinking per Anthropic's and OpenAI's own 2026 prompting guides.
**Proposed change:** Flip the framing. Lead with: "In 2026 you have two paths — (1) use a **reasoning model** (o3, Claude extended-thinking, DeepSeek-R1, Gemini Deep Think) which does CoT internally and you just specify the task, or (2) use a non-reasoning model + prompted CoT." Then teach the 2022-style CoT as the path-2 fallback. Add a short "advanced patterns" section: self-consistency (sample N, vote), best-of-N (sample N, judge picks), Chain-of-Draft (5-word reasoning steps for cost). Add the critical warning: "Do not prompt 'think step by step' at reasoning models — it degrades performance and wastes the model's own reasoning budget."

---

### Lesson pr-3 — "Temperature — what it actually controls"
**Verdict:** keep
**Issue:** Excellent intuition lesson — explaining temperature as the *shape of the probability distribution* rather than "creativity" is exactly the senior framing. The trap callout (T=0 ≠ deterministic due to batched inference) is the kind of detail that wins interviews. The MCQ on structured-outputs + retry is well-targeted. Minor: could mention that **reasoning models often ignore temperature entirely** (o3 / Claude extended-thinking use their own sampling for the thinking trace) — a one-line footnote, not a rewrite.
**Proposed change:** Add a final one-liner: *"Reasoning models (o3, Claude extended-thinking) largely ignore temperature for their internal thinking trace — the parameter still applies to the final answer but matters less."*

---

### Lesson pr-4 — "Drill: prompt-injection red team"
**Verdict:** expand-intuition (one-line prompt, no answer key)
**Issue:** The drill is well-targeted (prompt injection is *the* security topic in 2026) but it's just a prompt with a hint and no answer key. A candidate who's never thought about injection will stare at this and produce 3 vectors and call it done. Compare to ev-4 which at least gives a model answer.

The drill also predates 2026 attack patterns: **indirect prompt injection via tool outputs** (the agent calls a tool, the tool's response contains injected instructions — this is the dominant 2026 attack vector and the subject of every responsible-AI eval suite) is hinted at but not central. Same with **multi-turn injection** (planting instructions across turns) and **memory poisoning** (for agents with persistent memory).
**Proposed change:** Convert from a 1-line prompt into a proper drill with 8 named vectors and one-line mitigations: (1) direct override ("ignore previous instructions"), (2) encoding tricks (base64, unicode homoglyphs), (3) **indirect injection via tool outputs / RAG docs** — call out as the #1 2026 vector, (4) role confusion ("you are now DAN"), (5) output exfiltration (trick the model into leaking the system prompt), (6) multi-turn injection (set up benign context then pivot), (7) **memory poisoning** for agents with persistent memory, (8) jailbreak via fictional framing ("write a story where a character explains how to..."). Mitigations: input sanitization is *insufficient*; the real fixes are (a) treat tool outputs as untrusted data with provenance tags, (b) structured outputs (model can't emit free-form leaks), (c) separate planner/executor model split, (d) output filtering on sensitive patterns, (e) red-team golden set in your eval suite.

---

Modules ai-evals + ai-prompt — 9 lessons reviewed, 7 flagged.

Sources consulted:
- [DeepEval alternatives (2026) — Braintrust](https://www.braintrust.dev/articles/deepeval-alternatives-2026)
- [Top 5 AI Agent Eval Tools After Promptfoo's Exit — DEV](https://dev.to/thedailyagent/top-5-ai-agent-eval-tools-after-promptfoos-exit-576i)
- [LangSmith — LangChain](https://www.langchain.com/langsmith/evaluation)
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)
- [AI Reasoning Models: The Complete 2026 Prompting Guide — SurePrompts](https://sureprompts.com/blog/ai-reasoning-models-prompting-complete-guide-2026)
- [How to Prompt Thinking Models like DeepSeek R1 and OpenAI o3 — Helicone](https://www.helicone.ai/blog/prompt-thinking-models)
- [AI Agent Benchmarks 2026: SWE-bench, GAIA, tau-bench — Rapid Claw](https://rapidclaw.dev/blog/ai-agent-benchmarks-2026)
- [tau-Bench: Benchmarking AI agents — Sierra](https://sierra.ai/blog/benchmarking-ai-agents)
- [Structured Output and JSON Mode Guide 2026 — TokenMix](https://tokenmix.ai/blog/structured-output-json-guide)
- [OpenAI Structured Outputs docs](https://platform.openai.com/docs/guides/structured-outputs)
