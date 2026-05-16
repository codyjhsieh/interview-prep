# ai-agents audit

## Lesson ag-1 — "What is an 'agent' really? (vs a chain)"
**Verdict:** keep (light tighten)
**Issue:** Strong intuition lesson — chain vs agent distinction, price-of-agency framing, and "most things labeled agents should be chains" senior take are all on-point. The two ASCII flow diagrams duplicate effort (the second is much longer; the first could be 3 lines). Minor: doesn't name the dominant 2026 framing — that the "decide-the-next-step" loop is now usually a tool-use loop driven by a reasoning model (o3 / Claude extended thinking) rather than a ReAct prompt.
**Proposed change:** Trim first ASCII block to ~3 lines. Add one sentence after "The LLM picks the next action": *"In 2026 this loop is typically driven by a reasoning model (o3, Claude extended thinking) that plans internally between tool calls — ReAct-style prompted scratchpads are largely obsolete."* True/false set is high quality, keep.

---

## Lesson ag-2 — "Tool calling — the 6 ways it actually breaks"
**Verdict:** keep
**Issue:** Excellent lesson — schema drift, hallucinated args, infinite loops, idempotency, tool-name collisions are exactly the failure modes a senior FDE has actually hit. Idempotency-key example with Stripe is concrete. MCQ on duplicate-charge is a real test (the distractors are plausible-but-wrong). No staleness issues.
**Proposed change:** None. Optionally add a 7th: *"Parallel tool calls — modern providers (OpenAI, Anthropic) emit multiple tool_calls in one assistant turn. If your dispatcher executes them serially, you give up the latency win; if you execute in parallel, you must handle ordering for stateful tools."* — but the lesson is already at 12min, so probably keep as-is.

---

## Lesson ag-3 — "Bounding agent autonomy — the 5 controls"
**Verdict:** keep (minor expand)
**Issue:** The 5 controls (allowlist, spend cap, max-step budget, HITL, observability) + kill-switch + code skeleton is a model lesson. Match interactive is a real test. Missing one 2026 control that interviewers now probe for: **trajectory-replay debugging / checkpointing** (LangGraph's durable execution, resume-from-step-N). This is now a senior signal because long-running agents fail and you can't afford to restart from scratch.
**Proposed change:** Add a 6th sub-bullet or a closing line: *"In 2026, durable execution / checkpointing (LangGraph's killer feature; also in Temporal-style agent runtimes) is becoming a 6th control — agents that run for minutes-to-hours must survive process crashes by replaying from a checkpoint, not by re-running from step 0."*

---

## Lesson ag-4 — "Structured outputs — JSON Schema as your security boundary"
**Verdict:** keep
**Issue:** Strong and current. Correctly distinguishes grammar-constrained decoding from "temp=0 + good prompt". Cites `strict:true` (OpenAI) and Anthropic's `input_schema`. The "schema validity ≠ semantic validity" line is the senior signal. Find-bug interactive is real (catches missing `additionalProperties:false` AND incomplete `required`).
**Proposed change:** None. Model identifiers (`gpt-4.1`, `claude-sonnet-4-6`) are reasonable for the May-2026 timeframe.

---

## Lesson ag-5 — "Tool-call format wars — OpenAI vs Anthropic vs MCP"
**Verdict:** update-content
**Issue:** MCP coverage is real but slightly behind 2026 reality. The lesson still calls MCP "Anthropic's open spec" — as of December 2025, MCP was donated to the **Linux Foundation's Agentic AI Foundation** (co-founded by Anthropic, Block, and OpenAI). OpenAI adopted MCP across Agents SDK / Responses API / ChatGPT Desktop in March 2025. By May 2026 MCP has 97M+ monthly SDK downloads and 10,000+ public servers — it's no longer "becoming" the lingua franca, it **is** the lingua franca. The hedging language ("becoming", "if it wins") understates current reality.
**Proposed change:** Update the MCP paragraph: *"MCP (Model Context Protocol) started as Anthropic's open spec (Nov 2024) and is now governed by the Linux Foundation's Agentic AI Foundation (donated Dec 2025; co-stewarded by Anthropic, OpenAI, Block). OpenAI's Agents SDK, Responses API, ChatGPT Desktop, Google DeepMind, Microsoft, and AWS all speak MCP. 10,000+ public MCP servers exist as of mid-2026. It IS the USB-C for LLM tools — past tense on 'becoming'."* Also update interview-move line from *"becoming the lingua franca"* → *"the cross-provider standard for tool discovery"*. Why-explain interactive is good, keep.

---

## Lesson ag-6 — "Q: Multi-agent system fails. Where do you look first?"
**Verdict:** expand-intuition
**Issue:** Answer is correct (context loss between handoffs is real) but too thin for a `question` lesson. Doesn't mention the 2026 toolchain a senior would actually reach for: **LangSmith / Langfuse / Helicone trace viewers**, LangGraph's supervisor-pattern visualization, or what specifically to look at in a trace (input context size at handoff, system-prompt drift between agents, tool-result truncation). Also missing the most common multi-agent anti-pattern — **over-decomposition** (5 agents that should have been 1 agent with 5 tools).
**Proposed change:** Expand to ~2 short paragraphs: *"(1) Open the trace (LangSmith, Langfuse, or Helicone) and walk the handoff boundary — what context did the receiving agent actually see? 80% of multi-agent failures are context loss: the orchestrator passes a summary; the worker needed the raw thread; or the worker's system prompt didn't include the tool the orchestrator assumed it had. (2) Then ask the harder question: should this be multi-agent at all? A common anti-pattern is decomposing into 5 agents what should have been 1 agent with 5 tools — multi-agent only earns its complexity when sub-agents have genuinely independent context windows, distinct tool allowlists, or run in parallel."* Consider upgrading from `type:'question'` to an interactive (mcq or whyexplain) since the rest of the module is interactive.

---

Module ai-agents — 6 lessons reviewed, 3 flagged (ag-3 minor-expand, ag-5 update-content, ag-6 expand-intuition).

Sources:
- [MCP donation to Linux Foundation / Agentic AI Foundation — Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [MCP Adoption Statistics 2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)
- [Claude Agent SDK & Computer Use](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Anthropic Computer Use tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- [LangGraph production / LangSmith observability](https://www.langchain.com/langgraph)
- [LangChain agent observability article](https://www.langchain.com/articles/agent-observability)
