# sd-classic audit (lessons 9-16)

## Lesson sd-9 — "CAP & PACELC — what you can't have all of"
**Verdict:** update-content
**Issue:** DynamoDB's PACELC classification is no longer current. As of June 2025, DynamoDB Global Tables support multi-region **strong consistency** (MRSC) as a GA feature — you can configure global tables as PC/EC (3 regions, quorum writes, RPO=0) instead of PA/EL. The lesson hard-codes "DynamoDB: PA/EL" without acknowledging the now-tunable MRSC mode. Also, Cassandra's "PA/EL by default; tunable per-query" is fine, but the true-false statement that Spanner has ~10ms+ commit latency is dated — Spanner now commonly commits in single-digit ms within a region; multi-region is where the TrueTime commit-wait shows up.
**Proposed change:** Update the bullets to: "DynamoDB: PA/EL by default; **PC/EC available** via Global Tables multi-region strong consistency (GA 2025, 3-region quorum w/ optional witness)." Add a short note that the "PACELC profile" is increasingly a per-table/per-query knob in modern serverless DBs (DynamoDB MRSC, Spanner, CockroachDB, Aurora DSQL), not a fixed system property. Tighten the Spanner T/F to "~commit-wait latency on multi-region writes (TrueTime)."

---

## Lesson sd-bo — "Back-of-envelope — the numbers every senior knows cold"
**Verdict:** update-content
**Issue:** Two of the capacity rules of thumb are seriously outdated, which is dangerous in a "numbers every senior knows cold" lesson:
1. "1 disk ≈ 10K IOPS (NVMe SSD)" — modern enterprise NVMe runs **400K–1M+ random-read IOPS** at 4KB. 10K is consumer-SATA-era. This is off by ~50–100×.
2. "1 Redis instance ≈ 100K ops/sec (single-thread)" — fine ballpark, but Redis 7+ with I/O threading and KeyDB/Dragonfly comfortably hit 500K–1M+ ops/sec on a single box; the lesson should at least mention the upper bound.
3. "SSD random read (4 KB) ~100 μs" — this is the Jeff Dean 2012 number. Modern NVMe is **~20–50 μs** for random 4KB reads, with high-end drives at <20 μs. Not catastrophic for estimation, but worth a footnote that the Dean table predates NVMe.
4. The worked example uses "192 Gbps ingress" without flagging that 1×100GbE NIC is now table-stakes per server — modern servers do 200–400 GbE.
**Proposed change:** Replace "1 disk ≈ 10K IOPS (NVMe SSD), 100 IOPS (HDD)" with "1 disk ≈ **500K IOPS** (modern datacenter NVMe), ~200 IOPS (HDD, treat as legacy)." Add one line at the top of the latency table: "Jeff Dean's original 2012 numbers, normalized. NVMe and 100GbE shift several of these by 2–5×; the *order of magnitude* is what matters in interviews." Bump Redis line to "100K–500K ops/sec (Redis 7 / Dragonfly upper bound)."

---

## Lesson sd-db — "DB internals — B-tree vs LSM, when each wins"
**Verdict:** expand-intuition
**Issue:** Strong technical content but the lesson reads like 2020. Missing the most important 2024–2026 storage trend: the **disaggregated / separation-of-storage-and-compute** architecture that powers Aurora DSQL, Neon, PlanetScale Postgres, and Databricks Lakebase. These aren't pure B-tree vs LSM — they're "B-tree-style API on top of log-structured durable storage over S3-class object store." Also missing: "Postgres-as-everything" pattern (pgvector, TimescaleDB, ParadeDB for search) which is a senior-signal answer in 2026 when interviewers ask "what DB?" Also missing one-line mention that DuckDB / MotherDuck are eating analytics workloads at the small-to-medium scale.
**Proposed change:** Add a short third section after B-tree/LSM: "**Disaggregated storage (2024+).** Aurora DSQL, Neon, PlanetScale Postgres, Databricks Lakebase decouple compute from a log-structured durable layer on object storage. You get Postgres semantics on the read path with LSM-style write economics underneath. Senior signal: name 'separation of storage and compute' explicitly." Also add to "When to pick which": "**Default for new apps in 2026** → Postgres (B-tree) plus its ecosystem (pgvector for embeddings, TimescaleDB for time-series, pglogical for CDC) before reaching for a specialist. The 'Postgres-as-everything' pattern wins when your scale is <10TB."

---

## Lesson sd-raft — "Replication & Raft — consensus in one page"
**Verdict:** update-content
**Issue:** "Kafka's newer 'KRaft' mode replaces ZooKeeper with Raft." — As of Kafka 4.0 (released March 2025), **KRaft is the only supported mode**; ZooKeeper has been completely removed. Calling it "newer" is misleading a year later. Also, the "where Raft shows up" list is missing the big 2024+ additions: **TiDB/TiKV** is there but **OpenAI/foundation-model training control planes**, **Materialize's coordinator**, and **Aurora DSQL** (uses a similar consensus layer for its journal) would round out the list. Multi-leader section is fine but could mention CRDTs explicitly winning over OT (Operational Transforms) in modern collaborative tools (Figma/Linear/Liveblocks all use CRDTs now; Google Docs is the last major OT holdout).
**Proposed change:** Change "Kafka's newer 'KRaft' mode replaces ZooKeeper with Raft" to "**Kafka 4.0+ (2025) uses KRaft exclusively — ZooKeeper is fully removed.** This was the single biggest Kafka operational simplification in a decade." Add to multi-leader bullet: "Modern collaborative apps (Figma, Linear, Liveblocks, Notion) all use CRDTs; Operational Transforms (OT) is essentially deprecated outside Google Docs."

---

## Lesson sd-reliable — "Reliability patterns — circuit breaker, bulkhead, retry budget"
**Verdict:** expand-intuition
**Issue:** Patterns themselves are timeless and well-explained, but the lesson is silent on **where these actually live in 2026 production systems**: not in your application code but in the **service mesh** (Istio/Envoy DestinationRules for circuit breaking + outlier detection, Linkerd for retry budgets) or in the **API gateway** (Kong, Cloudflare). A senior signal in 2026 is knowing the decision: app-level (Hystrix-style, mostly dead) vs sidecar (Envoy) vs gateway. Also missing: **OpenTelemetry** as the standard for instrumenting these patterns — every modern circuit-breaker emits OTel metrics (state-change spans) so SREs can alert on `circuit_breaker_state="open"`.
**Proposed change:** Add a short "Where these live today" section: "In 2026, you rarely hand-code these patterns. Circuit breakers and outlier detection live in **Envoy/Istio DestinationRules**, retry budgets and timeouts in service-mesh policies, and the breaker's state changes are emitted as **OpenTelemetry** metrics/spans so they're alertable. The Hystrix-style in-app library pattern (Netflix, 2012-era) is essentially deprecated — Netflix archived Hystrix in 2018." Keep the code snippet but caption it "the algorithm, for interview-whiteboard purposes — in production, this is your sidecar's job."

---

## Lesson sd-kafka — "Distributed log — Kafka partitioning, replication, exactly-once"
**Verdict:** update-content
**Issue:** This is the most outdated lesson in the batch. Three issues:
1. No mention of **KRaft** — given Kafka 4.0 (March 2025) removed ZooKeeper entirely, a 2026 Kafka lesson that doesn't say "KRaft, not ZooKeeper" is missing a year of news. Interviewers will absolutely ask "how do you bootstrap a cluster without ZooKeeper now?"
2. No mention of the **object-store / BYOC tier** that has reshaped the Kafka market: **WarpStream** (acquired by Confluent 2024, S3-backed, ~10× cheaper for latency-tolerant workloads), **Redpanda** (C++, no JVM, much lower p99), **AutoMQ / Aiven Diskless / Bufstream / StreamNative Ursa** (all Kafka-protocol-compatible on object storage). Senior signal in 2026 is "for clickstream/logs/observability I'd reach for WarpStream over Kafka — same protocol, ~10× cost reduction, 400ms latency floor is fine for this workload."
3. The "When NOT to reach for Kafka" section says SQS/RabbitMQ but is missing the modern "use Postgres as a queue" pattern (`SELECT FOR UPDATE SKIP LOCKED`, e.g. Inngest, River, Trigger.dev) which is the legitimately correct answer for <10K msgs/sec.
**Proposed change:** Replace ZooKeeper-era framing throughout. Add a new section: "**Kafka in 2026 — the cheaper-tier shake-up.** WarpStream (S3 + stateless agents, ~10× cheaper, 400 ms latency floor), Redpanda (C++, no JVM, sub-ms p99), AutoMQ/Aiven Diskless/Bufstream (S3-backed, Kafka protocol). For latency-tolerant streams (logs, clickstream, observability), reach for the S3-tier; for sub-ms trading-style workloads, vanilla Kafka or Redpanda. Confluent acquired WarpStream in 2024; IBM announced acquisition of Confluent in Dec 2025." Add to "When NOT to reach for Kafka": "**<10K msgs/sec with a Postgres already running** → use Postgres as a queue (`SELECT FOR UPDATE SKIP LOCKED`). Inngest, River, Trigger.dev, pgmq all build on this. Don't operate a Kafka cluster for what a single SQL table can do." Update intro to drop the "(if you mention ZooKeeper)" trap and instead set up "KRaft is the only mode in 4.0+; ZooKeeper is dead."

---

## Lesson sd-geo — "Geo-dispatch — Uber-style matching at scale"
**Verdict:** keep
**Issue:** None significant — H3 is still the right answer in 2026, Redis sorted sets keyed by H3 cell is still the canonical pattern, the ring-expansion algorithm is current. Spatial DBs (PostGIS, MongoDB 2dsphere) are correctly framed as more expensive alternatives.
**Proposed change:** (Minor / optional) — could mention that PostGIS now has H3 extensions (`h3-pg`) so "Postgres + H3" is a viable single-stack alternative to Redis for medium-scale dispatch. Not required.

---

## Lesson sd-pay — "Payment processing — idempotency, sagas, the exactly-once myth"
**Verdict:** keep
**Issue:** Solid, current, and well-paced. Idempotency key + saga + reconciliation + minor units is exactly the 2026 answer. Stripe's API v2 (released 2024-2025) has slightly evolved idempotency semantics — it now auto-retries failed requests server-side and returns the updated response — but the lesson's framing is still correct.
**Proposed change:** (Optional) Add one sentence to the idempotency section: "Stripe API v2 (2024) extends this further — the platform auto-retries failed requests server-side and returns the final response, so client retry logic gets simpler. The *pattern* — store-key + return-cached-result — is unchanged."

---

sd-classic (9-16) — 8 reviewed, 6 flagged.
