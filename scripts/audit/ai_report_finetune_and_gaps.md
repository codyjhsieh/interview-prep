# ai-finetune audit

Module: `ai-finetune` — "Fine-tune vs RAG vs prompt" (2 lessons: `ft-1`, `ft-2`).

## Lesson ft-1 — "Prompt vs RAG vs fine-tune — the decision tree"

**Verdict:** Mostly solid. Decision tree, cost ladder, and "facts vs behavior" reframe are senior-quality. **Flag — minor staleness.** Two issues: (a) the "Stable, < 200k tokens → prompt with full context" branch is calibrated to 2024-era windows; with 1M-token windows (Gemini, Claude Sonnet 4.5+) and aggressive prompt caching (90% discount on cache hits), the realistic break-even is meaningfully higher, and the lesson never names prompt caching as the lever that makes full-context viable. (b) The interactive decision tree's bad-path message says "5M tokens vastly exceeds context windows" — true today, but the framing implies "always too big" rather than "too big once you factor in cost-per-call even with caching."

**Issue:** Decision tree is from a pre-prompt-caching, pre-1M-context mental model. Senior 2026 answer should explicitly say: *"under ~1M tokens, evaluate full-context + prompt caching before reaching for RAG infra; the crossover has moved."*

**Proposed change:**
- Update the decision-tree pre-line ("Stable, < 200k tokens → prompt with full context") to "Stable, fits in window AND prompt caching gives acceptable per-call cost → full context + cache."
- Add one sentence noting Claude/Gemini 1M-token windows + Anthropic's 90% cache-read discount changed the break-even.
- Update bad-context explainer for the 5M-token case to reference per-call $ even with caching, not just window size.

---

## Lesson ft-2 — "When fine-tuning is actually the right call"

**Verdict:** **Flag — comprehensive intuition is missing for 2025/2026 methods.** Lesson stays at the "fine-tune yes/no" level and never names the modern toolkit. A senior FDE candidate is now expected to say "QLoRA + DPO on Unsloth, ship a 30MB adapter, hot-swap on vLLM" — none of those terms appear. The three legitimate use cases (latency narrow-task, jargon/style, distillation) are correct and well-framed, but the lesson reads as if the year is 2023.

**Issue (specific gaps):**
1. **No method vocabulary.** Missing: LoRA / QLoRA (the production default), DPO (replaced RLHF/PPO for 95% of teams), ORPO / SimPO / KTO (reference-free single-stage successors), RLAIF, synthetic-data distillation pipelines.
2. **No tooling.** Missing: Unsloth (2–5× faster QLoRA), Axolotl (YAML configs), trl + peft (HuggingFace stack), vLLM LoRA hot-swap for serving.
3. **No mention of the modern alignment pipeline:** SFT → DPO is the standard recipe; lesson treats fine-tuning as a single monolithic step.
4. **No reasoning-model fine-tuning angle.** DeepSeek R1 distillation (continued pretraining on CoT traces) is a 2025 milestone — the lesson doesn't acknowledge that you can now fine-tune *reasoning* into smaller models, not just style/classification.
5. **No "fine-tune-as-eval" pattern** (fine-tune a small judge model on your domain to use as an LLM-as-judge).
6. **No data quality framing.** The "data quality > quantity, 1000 hand-curated > 100k noisy (LIMA result)" rule is a senior signal and is absent.
7. **Economic reality is dated.** Should call out "Llama 3 8B QLoRA fine-tune on a single A100 in ~6 hours for ~$15, 30MB adapter, hot-swap on vLLM."
8. **Domain adaptation vs alignment distinction missing.** SFT/continued-pretraining (teach knowledge or format) is a different beast from preference optimization (teach which answer is preferred) — senior candidates must separate these.

**Proposed change:**
- Either expand `ft-2` with a "modern method stack" section, or (cleaner) **add 1–2 new lessons** to the module:
  - `ft-3` "The 2026 fine-tuning stack — LoRA, QLoRA, DPO, ORPO" — vocabulary + when to pick each + the SFT→DPO pipeline + cost numbers ($15 / A100 / 6h / 30MB adapter).
  - `ft-4` "Distillation & synthetic-data pipelines" — using GPT-4/Claude to generate (prompt, ideal_response) pairs, then QLoRA a small open model; DeepSeek R1-style reasoning distillation; fine-tune-as-eval (domain judge models).
- Update `ft-2`'s "Before fine-tuning" checklist to add "have you tried prompt caching + 1M context first?" as the new top-of-ladder check.
- Add the LIMA / data-quality line to `ft-2` body: *"1000 hand-curated examples often beat 100k noisy ones — the LIMA result still holds. Spend your budget on annotation quality, not volume."*
- Interactive is fine but consider replacing one MCQ with a method-pick question: *"You have 5000 (prompt, chosen, rejected) triples for tone alignment of a 8B open model on one A100. Best stack?"* — answer QLoRA SFT → DPO with trl, ship adapter.

---

# Missing-topic audit (entire AI category)

Reviewed lesson names across all 5 modules: `ai-rag` (chunking, embeddings, vector DBs, hybrid retrieval, prompt injection, debugging), `ai-evals` (3-layer evals, LLM-as-judge biases, golden set, eval-tooling landscape), `ai-prompt` (anatomy, CoT, temperature, injection drill), `ai-agents` (chain vs agent, tool-calling failure modes, agent autonomy controls, **structured outputs ag-4**, **tool-call format wars incl. MCP ag-5**, multi-agent debugging), `ai-finetune` (decision tree, when to fine-tune).

**Already covered (don't re-add):** structured outputs / JSON Schema (`ag-4`), MCP at the format-wars level (`ag-5`), prompt injection (`rag-6`, `pr-4`), hybrid retrieval (`rag-3`), eval tooling landscape (`ev-5`), prompt caching is *mentioned* in passing (`rag-1`) but never taught as a lesson.

| Topic | Suggested module | Suggested lesson name | Why it matters in 2026 |
|---|---|---|---|
| **Prompt caching as a cost lever** | ai-prompt | "Prompt caching — the 90% discount you don't know you're missing" | Anthropic cache-read = 90% off; OpenAI ~50% off + 80% latency cut. Not optional for agents > 3 steps. Module mentions it once in passing (`rag-1`) but never teaches it. Senior FDEs structure prompts to maximize cache hits (stable prefix first, volatile content last). |
| **Reasoning models (o-series, extended thinking, R1)** | ai-prompt | "Reasoning models vs CoT prompting — when to switch" | `pr-2` covers CoT-via-prompt but never mentions that o1/o3/Claude extended-thinking/DeepSeek-R1 have made manual CoT obsolete for hard reasoning. Decision rule: simple → no CoT; medium → CoT prompt; hard multi-step → reasoning model with thinking budget. Cost/latency tradeoffs differ. |
| **Long-context strategy (1M+ windows)** | ai-rag | "1M-token windows — when to stuff context instead of RAG" | Gemini 1.5/2.5, Claude Sonnet 4.5+ now 1M tokens. The full-context vs RAG break-even has moved dramatically. `rag-1` hints at this but doesn't teach the decision (cost/latency/recall tradeoffs at 1M, lost-in-the-middle, needle-in-a-haystack evals). |
| **MCP as a build-the-server skill** | ai-agents | "Building an MCP server — exposing your tools to any LLM" | `ag-5` introduces MCP as a *format*; missing is the practical "your customer wants Claude Desktop + Cursor + their internal agent to all use your refund tool — ship one MCP server." 97M monthly SDK downloads by Dec 2025, donated to Linux Foundation. This is now a literal job skill. |
| **Computer Use / Browser agents** | ai-agents | "Computer use — when to drive a UI instead of an API" | Anthropic Oct 2024, mainstream by 2025; Opus 4.5/4.7 marketed primarily on computer-use benchmarks. Senior decision: API > MCP > Computer Use ladder. When the customer has no API, browser/desktop control is the integration path. Eval and safety story is unique (screenshots, OCR confidence, action confirmation). |
| **Multimodal production (vision/voice)** | ai-prompt | "Multimodal prompts — images, PDFs, audio in the same call" | High-resolution vision (Opus 4.7: 2576px), realtime voice APIs (OpenAI Realtime, Gemini Live). Production patterns: PDF→image extraction beats PDF→text for layout-heavy docs; voice agents need different latency budgets (<300ms vs <2s for text). Zero coverage in current curriculum. |
| **Cost & latency engineering** | ai-prompt (or new) | "Token budgets, batch APIs, parallel tool calls, streaming" | Senior interview signal: "how do you ship this for $X/conversation?" Levers: model tier routing (cheap classifier → escalate), batch API (50% off for non-realtime), parallel tool calls (one round-trip for N tools), streaming for perceived latency. Curriculum teaches *what* to build but never *what it costs to run.* |
| **Hallucination defense beyond RAG** | ai-evals | "Grounding, citations, abstention — making models say 'I don't know'" | Production pattern: require span-level citations in output; reject answers whose citations don't substantiate the claim; train/prompt for abstention on low-confidence retrieval. `rag-4` Q hints at debugging this but no lesson teaches the architectural pattern (citation-required schemas + faithfulness eval + abstention rates). |
| **Agent observability / tracing** | ai-agents | "Tracing agents — LangSmith, Langfuse, Helicone, OpenTelemetry" | `ag-3` says "per-step observability" is one of 5 controls but never names tools. By April 2026 the field consolidated to six production platforms (LangSmith, Langfuse, Arize Phoenix, Helicone, Datadog LLM, Honeycomb). Senior candidates must name at least one and explain trace-replay-against-new-model workflow. |
| **GraphRAG / late-interaction / ColBERT** | ai-rag | "Beyond vector search — GraphRAG, ColBERT, late-interaction" | Vector RAG hits a ceiling on multi-hop questions ("what are all the dependencies of project X that also touch system Y?"). GraphRAG (Microsoft 2024) and ColBERT-style late-interaction are the 2026 production answers for relational/structured corpora. `rag-3` only covers BM25+dense+rerank. |
| **Jailbreak defense / output filtering / red-teaming** | ai-prompt | "Output guardrails — content filters, PII scrubbers, policy classifiers" | `rag-6` covers prompt-injection well on the *input* side; missing is the *output* side: content moderation (OpenAI Moderation API, Llama Guard, AWS Bedrock Guardrails), structured output PII detection, two-model pattern (generator + critic). 2026 senior bar. |
| **Synthetic data generation pipelines** | ai-finetune | "Generating training data with bigger models (distillation pipelines)" | The dominant 2026 fine-tune workflow: GPT-4/Claude generates N synthetic (input, output) pairs → filter with rubric → QLoRA a small open model. DeepSeek R1 distill made this mainstream for reasoning. Currently zero coverage. (Partial overlap with `ft-2`'s "distillation for cost" use case, but as a pipeline pattern it deserves its own lesson.) |
| **Caching layer for LLM responses (semantic cache)** | ai-rag (or ai-prompt) | "Semantic response caching — when 'we've answered this before' applies" | Distinct from prompt caching: cache *answers* keyed by query-embedding similarity. GPTCache, Redis Vector. Production lever for high-volume support bots: 30–50% of queries are near-duplicates. Not mentioned anywhere. |

---

ai-finetune — 2 reviewed, 2 flagged. + 13 missing-topic recommendations.
