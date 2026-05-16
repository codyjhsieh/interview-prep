# ai-rag audit

## Module-level issue — DUPLICATE LESSON IDs
**Verdict:** update-content (structural bug)
**Issue:** IDs `rag-3`, `rag-4`, `rag-5`, `rag-6` are each used by TWO lessons (concept + question/drill). The "How retrieval works" lesson is `rag-3` but appears AFTER `rag-6` (prompt injection) — ordering is broken and any progress-tracking keyed on id will collide.
**Proposed change:** Renumber the question/drill lessons to `rag-7` (debug), `rag-8` (data protection), `rag-9` (CFO drill). Move the "How retrieval works" concept (currently mis-labeled `rag-3` at line 865) to sit between rag-2 (chunking) and the embeddings lesson — it's the natural chunking → retrieval → embeddings → vector DB flow. As-is, learners go chunking → embeddings → vector DB → security → retrieval, which is backwards.

---

## Lesson rag-1 — "What is RAG and why does it exist?"
**Verdict:** update-content
**Issue:** Uses "GPT-4" as the example model in 2026 — feels dated. Also: the "when NOT to use RAG" frames full-context + caching as the only alternative; misses that 2025/2026 the real alternative for medium corpora is often agentic search (LLM calls a search tool on demand) rather than stuffing everything.
**Proposed change:** Swap GPT-4 → "Claude or GPT-class model" or just "the LLM." Add one sentence to the "When NOT to reach for RAG" block: "And for medium corpora where queries are narrow, an agentic search tool (LLM calls `search(query)` on demand) can beat both full-context and pre-built RAG infra."

---

## Lesson rag-2 — "Chunking"
**Verdict:** update-content + expand-intuition
**Issue:** Missing the two 2024–2026 techniques that now define the production bar: **contextual chunking** (Anthropic's Sep 2024 technique — prepend an LLM-generated 1-sentence context to each chunk before embedding; ~35–50% retrieval-error reduction) and **late chunking** (Jina/Weaviate — embed the whole doc at token level, then pool into chunks; preserves cross-chunk context with naive-chunking storage cost). Both are now standard senior-interview answers.
**Proposed change:** Add a 5th option "**Contextual chunking** (Anthropic, 2024): use a cheap LLM to write a 1-sentence context summary for each chunk, prepend it before embedding. Boosts recall ~35% on heterogeneous corpora. Pair with prompt caching to keep ingest cost down." And one line on late chunking as an alternative when documents have heavy cross-reference. Tighten the four-strategy list by cutting the "Useless." commentary on fixed-size (the dash already implies it).

---

## Lesson rag-4 (embeddings) — "Embedding models — how to choose one"
**Verdict:** update-content
**Issue:** 2026 model list is stale. Missing the actual current leaders: **Voyage-3 / voyage-3-large** (now top of retrieval MTEB at competitive price), **Gemini embedding-001** (top of English MTEB), **BGE-M3** (the multi-vector/sparse/dense unified model — different from generic BGE), **Qwen3-Embedding** (top open-weight, 32K context, Matryoshka dims). Also missing **Matryoshka representation learning** as a concept — the modern way to "shrink dims at query time" without re-embedding.
**Proposed change:** Refresh the "2026 production picks" list: BGE-M3 (multi-functional, Apache 2.0) / Qwen3-Embedding (open-weight, Matryoshka) / Voyage-3 family (hosted, retrieval leader, has legal/code/finance variants) / OpenAI text-embedding-3 (still fine, but no longer SOTA) / Gemini embedding-001 (top MTEB). Add one sentence on Matryoshka: "Modern embedders are trained so you can truncate the vector to 512/768/1024 dims at query time without re-embedding — pick the dim/storage tradeoff per use case."

---

## Lesson rag-5 (vector DB) — "Vector DBs — choosing one, with tradeoffs"
**Verdict:** tighten + minor update
**Issue:** Mostly solid and timeless. Two gaps: (1) doesn't mention **Turbopuffer / LanceDB / Vespa** which are the 2025/2026 cost-disruption picks (object-storage-backed, 10–100× cheaper at scale); (2) "HNSW is default" is still true but worth flagging **DiskANN / disk-based ANN** for very-large-scale, and that pgvector now ships HNSW (the lesson implies it but doesn't say). The four-category structure with checks/Xs is a bit long.
**Proposed change:** Add Turbopuffer/LanceDB to category 1 ("hosted") with one sentence: "object-storage-backed; 10× cheaper at billion-scale, slightly slower cold queries." Tighten by collapsing the "Use when:" bullets into the trailing prose for each category.

---

## Lesson rag-6 (prompt injection) — "Prompt injection — the security model for LLM apps"
**Verdict:** keep (mostly) + minor update
**Issue:** Strong lesson, senior-signal callout is genuinely good. Mildly stale: doesn't mention **CaMeL (Google DeepMind, 2025)** — the dual-LLM "privileged/quarantined" pattern that's become the reference architecture for injection defense, nor the **NIST AI RMF / OWASP LLM Top 10** which interviewers at compliance-heavy companies now expect candidates to name.
**Proposed change:** Add one line at the end of the defense list: "**Dual-LLM pattern (CaMeL, 2025):** a privileged planner LLM never sees untrusted content; a quarantined LLM reads untrusted content but cannot call tools. The architecture, not the prompt, is the boundary." Optionally name-drop OWASP LLM Top 10 as the canonical taxonomy.

---

## Lesson rag-3 (retrieval) — "How retrieval actually works (sparse vs dense vs hybrid)"
**Verdict:** update-content + reorder
**Issue:** Content is good but missing **ColBERT v2 / late-interaction** retrieval — the third major retrieval paradigm in 2026 ("near cross-encoder accuracy at near bi-encoder speed"). Senior candidates are expected to name it. Also: the hybrid pipeline shown ends at re-rank → top 5, but doesn't mention **query rewriting / HyDE** (LLM rewrites the query before retrieval) which is now part of any serious pipeline. And as noted above, this lesson is out of order — should come right after chunking.
**Proposed change:** Add a one-paragraph "third option: late interaction (ColBERT v2)" — per-token embeddings, MaxSim scoring; the middle ground between bi-encoder speed and cross-encoder accuracy; bundled in PLAID / RAGatouille / Vespa. Add a "query side" sentence at the top of the pipeline: "Before retrieval, optionally rewrite the query: HyDE generates a hypothetical answer to embed (helps when queries are short), or an LLM expands acronyms / decomposes multi-hop questions." Move this lesson to immediately after rag-2.

---

## Lesson rag-4 (question, debug RAG) — "Q: How do you debug a RAG that knows but ignores the context?"
**Verdict:** expand-intuition + interactive-weak
**Issue:** Single sentence of bullets with no `interactive:`. For a question-type lesson the bullet list is fine, but the answer is generic. Missing the senior-signal move: **isolate retrieval and generation independently** (eval retriever with recall@k on a labeled set, eval generator with context-given-correct gold chunks). Also missing: "lost in the middle" — long-context positional bias, the actual reason a model "ignores" mid-context chunks.
**Proposed change:** Restructure as "First, decompose the question: is it (a) retrieval failing or (b) generation ignoring good context? Eval each in isolation." Then list checks for each. Add "lost-in-the-middle" as a concrete cause and the fix (move best chunks to top/bottom of context, or re-rank tighter).

---

## Lesson rag-5 (question, data protection) — "Q: Protect sensitive data in a RAG pipeline?"
**Verdict:** tighten + minor expand
**Issue:** Single-line bullet dump. Solid checklist but no "why" — interview answer needs the architectural framing first. Also missing **embedding inversion** (a known 2024 attack — recover ~50–80% of source text from raw embeddings), which is a senior signal for security-conscious roles.
**Proposed change:** Frame: "Treat the vector index as a database of secrets — embeddings are NOT one-way. Apply standard DB controls plus LLM-specific ones." Then the existing bullets. Add embedding-inversion as a one-liner: "Raw embeddings can leak source text — encrypt at rest, never expose query embeddings to clients."

---

## Lesson rag-6 (drill, CFO-facing bot) — "Drill: design RAG for a CFO-facing support bot"
**Verdict:** interactive-weak
**Issue:** Drill body is one sentence; no scaffolding for what a "good answer" looks like, no `interactive:` widget, no rubric. For a 20xp/15min drill this is thin — learners can't self-grade.
**Proposed change:** Add a hidden / collapsible "model answer" sketch with the 8 picks (chunking strategy, embedding model, retrieval method, re-ranker, prompt with citation instruction, eval set design, guardrails, latency budget) each defended in one sentence. Or add a `match` interactive: 6–8 design decisions ↔ correct rationales. Without one of those, the drill is just a prompt with no feedback loop.

---

Module ai-rag — 9 lessons reviewed, 9 flagged (1 module-level structural + 8 lesson-level).

Sources consulted:
- [Best Chunking Strategies for RAG in 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
- [RAG Is Not Dead: Advanced Retrieval Patterns 2026 (dev.to)](https://dev.to/young_gao/rag-is-not-dead-advanced-retrieval-patterns-that-actually-work-in-2026-2gbo)
- [Late Chunking (Weaviate)](https://weaviate.io/blog/late-chunking)
- [Best Embedding Models 2026 — MTEB Benchmarks (pecollective)](https://pecollective.com/tools/best-embedding-models/)
- [Open-Source Embedding Models 2026 (BentoML)](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)
- [Agentic RAG with Knowledge Graphs for Multi-Hop Reasoning (arXiv 2507.16507)](https://arxiv.org/abs/2507.16507)
- [What Is Agentic RAG (Neo4j)](https://neo4j.com/blog/agentic-ai/what-is-agentic-rag/)
