# sd-classic audit (lessons 1-8)

Scope note: in array order, the first 8 lessons of `sd-classic` are `sd-1, sd-2, sd-3, sd-4, sd-5, sd-7, sd-8, sd-9`. (`sd-6` is appended out-of-order at the very end of the module — line 7250 — and is owned by the second-half agent.)

## Lesson sd-2 — "URL shortener — designed in 10 minutes"
**Verdict:** update-content
**Issue:** Solid bones, but two 2026-era gaps:
1. Doesn't name the **301-vs-302** redirect tradeoff — 301 is browser/CDN-cacheable (kills analytics on cache hits); 302 forces every redirect through your origin (analytics work, but you lose CDN benefit). This is a *classic* senior follow-up question and is conspicuously absent.
2. Storage section says "Postgres or DynamoDB row" but doesn't note that a single-key-lookup access pattern is the textbook DynamoDB / KV use case — Postgres is fine for v1 but DynamoDB / a serverless KV (Cloudflare KV, Workers KV, Aurora DSQL) is what most 2026 teams would actually pick. Mentioning Cloudflare Workers / edge-KV as the "modern serverless answer" upgrades the senior signal.
3. The "Pre-allocated ranges" Snowflake/Sonyflake terminology isn't named — say "Twitter Snowflake / Sonyflake-style ID generator" so candidates know the canonical name.

**Proposed change:**
- Add a sentence under Redirect path: *"Use 302 (temporary) if you need per-click analytics — 301 (permanent) lets the browser/CDN cache the mapping forever and bypasses your origin entirely. Pick the tradeoff explicitly."*
- Under Storage: *"In 2026 the default serverless pick is DynamoDB (single-key access) or Cloudflare Workers KV / D1 if you want the read path served from edge. Postgres is fine for v1."*
- Under Pre-allocated ranges: *"This is the Snowflake / Sonyflake pattern — a 64-bit ID = timestamp + machine_id + sequence, generated locally per server."*

---

## Lesson sd-3 — "Rate limiter — sliding-window log vs token bucket"
**Verdict:** expand-intuition + update-content
**Issue:**
1. The lead line ("Token bucket: cheap, allows bursts. Sliding-window log: exact...") is dense to the point of being unreadable — it dumps four algorithms in one sentence before showing code. No intuition for *why* token bucket allows bursts or *why* sliding-window-log's memory grows.
2. **Missing GCRA** (Generic Cell Rate Algorithm) — the memory-efficient production default in 2026 (used by Stripe, Cloudflare Workers, redis-cell). A senior candidate naming GCRA is a strong signal; the lesson doesn't even mention it.
3. The Lua snippet is correct but cramped and uses two SET calls per allow — production implementations use a single HSET or redis-cell. Worth a one-liner saying "in practice use the `redis-cell` module or Upstash's hosted rate-limiter."
4. No mention of where rate-limiting *should* live in the stack: CDN/edge (Cloudflare) > API gateway > service. Most senior interviews want you to push the limiter as far left as possible.

**Proposed change:** Restructure the prose into a 4-algorithm table (fixed window, sliding window log, sliding window counter, token bucket) with one-line tradeoff each, then add: *"GCRA (Generic Cell Rate Algorithm) is the memory-efficient production default — store one timestamp per key instead of a counter or log. Used by Stripe and the `redis-cell` module."* Add a "where to put it" sentence: *"Push the limiter as close to the edge as possible — Cloudflare/CDN > API gateway > app — so rejected traffic never reaches your origin."*

---

## Lesson sd-5 — "Caching pitfalls"
**Verdict:** expand-intuition
**Issue:** This is by far the thinnest lesson in the first 8 — one telegraphic sentence of body. Compare to sd-2 (URL shortener) which gets ~25 lines of structured prose. "Caching pitfalls" is one of the most-asked senior-interview topics and deserves equivalent depth. The one-liner names the right pitfalls but gives no intuition for *why* each happens or *what* the fix actually looks like. Also missing 2025/2026 patterns: **negative caching** (cache the "not found" too, or you DDoS your DB on every miss for a non-existent key — Reddit's 2023 outage cause), **stale-while-revalidate** (the modern HTTP/CDN pattern), **two-tier caching** (process-local + Redis), and **Postgres as the cache** (with `UNLOGGED` tables / `pg_prewarm` — a 2025 trend now that Postgres-as-everything is real).

**Proposed change:** Expand to ~15 lines matching the depth of sd-2/sd-4. Cover, with one short paragraph each:
- Stampede / thundering herd → singleflight (request coalescing) or refresh-ahead
- Invalidation → TTL + event-driven (CDC / Kafka) for write-heavy paths
- Negative caching (don't let "not found" slam the DB)
- Stale-while-revalidate (serve stale, refresh in background — the modern HTTP/CDN default)
- Hot keys → replicas, client-side double-keying, CDN at the edge
- Two-tier caching (in-process LRU + Redis) for ultra-hot keys
- Senior signal: name the *consistency* model (read-your-writes, monotonic reads) your cache provides.

---

## Lesson sd-7 — "Chat / messaging at scale"
**Verdict:** update-content
**Issue:** Good structure, but a few 2026 gaps:
1. **"Long-polling is dead; use WebSockets"** — incomplete. The modern answer also names **WebTransport** (HTTP/3-based, replacing WebSockets for new builds at Meta/Cloudflare) and **SSE for one-way push** (which the lesson briefly mentions). Worth one sentence: "WebTransport (HTTP/3) is the emerging successor; WebSockets remain the safe interview answer."
2. **Capacity numbers aren't given.** Other lessons (sd-2, sd-4, sd-bo) give concrete numbers; this one doesn't. A senior candidate should be able to say: "1M concurrent users, ~20k WS per gateway → 50 gateways; messages at 100/s/user peak → fan-out via Kafka with ~100k events/s." Without numbers this lesson is qualitative only.
3. **CRDTs aren't mentioned.** For chat-history-sync across devices and offline edits, CRDTs (or Yjs/Automerge) are the 2025/2026 default — directly relevant to the "delivery semantics / unread count" section. The lesson stops at "last-read sequence" which is correct for unreads but misses the broader pattern.
4. **End-to-end encryption** (Signal protocol / MLS) is the elephant in the room for any modern chat design — at minimum acknowledge it as a constraint that changes the server-side message store (you store ciphertext only).

**Proposed change:** Add a short "Modern variants" block: *"For new builds in 2026: WebTransport over HTTP/3 is replacing WebSockets at hyperscalers. For multi-device sync and offline edits, CRDTs (Yjs/Automerge) handle merge semantics. For E2E (Signal protocol / IETF MLS), the server stores opaque ciphertext — your message store doesn't change shape, but ranking/search must run client-side."* Add one capacity paragraph with 1M-concurrent-user numbers.

---

## Lesson sd-8 — "Consistent hashing — how to shard without re-shuffling"
**Verdict:** expand-intuition
**Issue:** Strong lesson overall, but missing the *modern* alternative: **rendezvous hashing (HRW)** is what most new systems (Discord's voice routing, some Kafka rebalancers, Riak) actually use because it has lower variance, no virtual-node tuning, and simpler reasoning. A senior candidate naming rendezvous hashing as "the simpler alternative consistent hashing's authors basically admit is better for most cases" is a senior signal. Also missing: **jump consistent hash** (Google, 2014) — O(1) memory, used by Vitess and some Kafka clients. The "Implementations" bullet list names the 2012-era set; 2026's list should include these.

**Proposed change:** Add a short paragraph after "Virtual nodes":
*"**Modern alternatives.** Consistent hashing with virtual nodes is the canonical interview answer, but two newer hashes are better in practice:*
- *Rendezvous (HRW) hashing — for each key, score every server, pick the highest. No ring, no vnodes, lower variance. Used by Discord and Riak.*
- *Jump consistent hash (Google, 2014) — O(1) memory, no data structures at all, used by Vitess. Limitation: nodes must be numbered 0..N-1 (no arbitrary removal).*
*Naming either of these in an interview is a strong senior signal."*

---

## Lesson sd-9 — "CAP & PACELC — what you can't have all of"
**Verdict:** update-content
**Issue:**
1. **DynamoDB framing is outdated.** Lesson says "DynamoDB (in default mode)" is AP. Since 2018 DynamoDB has had **strongly-consistent reads as a per-request flag** and **DynamoDB Transactions** (full ACID). And as of 2024-2025, **DynamoDB global tables with strong consistency** are GA. Calling it "PA/EL" is too simple now — it's tunable per-request.
2. **Aurora DSQL** (AWS, 2024 preview / 2025 GA) is the new poster child for "globally consistent + low latency" alongside Spanner — worth naming since it's the AWS-native answer interviewers will expect candidates to know in 2026.
3. **CockroachDB** is conspicuously absent from the system table — it's the most-asked PACELC system in 2026 interviews after Spanner/Dynamo.

**Proposed change:** Update the system list:
- DynamoDB: PA/EL by default; **tunable per-request** (strong reads + transactions available)
- Spanner: PC/EC — TrueTime
- **Aurora DSQL (AWS 2025): PC/EC — globally consistent, uses synchronized clocks like Spanner**
- **CockroachDB: PC/EC — Spanner-like architecture, software clocks (HLC) instead of TrueTime hardware**
- Cassandra: PA/EL, tunable per-query
- Postgres + read replicas: PC on primary, EL on replicas (drift)

---

## Lessons not flagged (kept as-is)

- **sd-1** — concise, accurate, good interactive. Keep.
- **sd-4** — excellent depth, names backfill/ranking/celebrity-threshold, strong capacity math. Keep.

---

sd-classic (1-8) — 8 lessons reviewed, 6 flagged.
