# sd-fde audit

## Lesson fd-1 — "Multi-tenancy — what it means and why it matters"
**Verdict:** update-content
**Issue:** Solid intuition and the Postgres RLS snippet is on-trend, but the lesson misses several senior-signal 2025/2026 details: (1) RLS requires `FORCE ROW LEVEL SECURITY` + an app role without `BYPASSRLS`/`SUPERUSER` to actually be safe — current snippet shows only `ENABLE`; (2) connection-pooling caveat — `app.current_tenant` must be re-set on every checkout or pgbouncer transaction-mode will leak; (3) no mention of horizontal sharding for "pool at scale" (Citus / AlloyDB / Aurora Limitless) which is the modern answer when pool grows past one Postgres; (4) no mention of "schema-per-tenant" as a fourth common shape (between pool and silo) that AWS/Azure docs call out; (5) "Bridge" is non-standard terminology — most modern writeups call this "schema-per-tenant" or "database-per-tenant on shared cluster." Also: HIPAA does not actually require US-only data residency — that's a common myth; conflating compliance with residency weakens the senior signal.
**Proposed change:** Tighten the RLS snippet to include `FORCE ROW LEVEL SECURITY` and a `BYPASSRLS`-free role; add one line on pool-mode connection pooler pitfalls; rename "Bridge" → "Schema-per-tenant (bridge)"; add a sentence on Citus/Aurora-Limitless as the "pool when one DB isn't enough" answer; correct the HIPAA-residency claim ("HIPAA doesn't mandate US-only — but customers often contractually require it").

---

## Lesson fd-2 — "Webhook reliability — making someone else's server your problem"
**Verdict:** update-content
**Issue:** The six-point checklist is good but the lesson is now behind the 2026 state-of-the-art. Specifically missing: (1) the **Standard Webhooks** spec (`webhook-id` / `webhook-timestamp` / `webhook-signature` headers) — Svix/Resend/Clerk converged on this; naming it is a senior signal; (2) **asymmetric signing** (Ed25519 / RSA) is now the recommended posture for high-value webhooks because consumers verify with a public key — no shared-secret leak risk. HMAC is still fine for the common case but the trade-off should be named; (3) **short-lived rotated signing keys via JWKS** is the emerging pattern (15min–24hr rotation, public JWKS endpoint); (4) the `Idempotency-Key` HTTP header is now an IETF draft (`draft-ietf-httpapi-idempotency-key-header`) — worth naming since interviewers reference it. Retry schedule (1m/5m/30m/2h/12h) is fine but should include the standard guidance of full jitter to avoid retry storms. Code snippet treats request timeouts as transient — correct, but should also exclude 410 Gone (permanent) and add small jitter to delays.
**Proposed change:** Add a paragraph: "The Standard Webhooks spec (standard-webhooks.org) is the emerging 2026 convergence — Svix/Resend/Clerk all follow it." Add a senior callout on HMAC vs asymmetric (Ed25519) signing and on JWKS-rotated keys. Mention the IETF `Idempotency-Key` draft as the canonical idempotency-key header. Add `+ jitter` to the retry delays.

---

## Lesson fd-3 — "SSO for enterprise — what SAML, OIDC, SCIM actually do"
**Verdict:** update-content
**Issue:** Core mental model is right but several 2026 updates are missing and one claim is dated. (1) The default-protocol guidance is correct but should be sharper: "**Start with OIDC; add SAML when an enterprise IdP forces it.** In 2026 the dual-protocol IdP is the new normal — ~72% of enterprises run both." (2) **No mention of Workload Identity Federation** (GCP WIF / AWS OIDC trust / Azure Federated Credentials) — this is the modern replacement for static service-account keys in customer-cloud integrations, and is increasingly asked about in FDE rounds. (3) **No mention of OAuth 2.1 / PKCE / RAR** — relevant for modern OIDC. (4) **SCIM at scale** glosses are missing: rate-limited SCIM endpoints, idempotent PATCH semantics, and async lifecycle webhooks back to the IdP. (5) "Just-in-time provisioning" should mention the risk: stale JIT users are an off-boarding hole — SCIM disable events still matter even with JIT. (6) Last sentence on "data residency → IdP in their region" is a reach — the IdP is the customer's, not yours; rephrase.
**Proposed change:** Add OIDC-first guidance + the dual-protocol stat; add a Workload Identity Federation paragraph for service-to-service auth across customer clouds; add the JIT-vs-SCIM-disable nuance; rewrite the closing residency line.

---

## Lesson fd-4 — "Customer VPC deploys — three shapes, escalating cost"
**Verdict:** update-content
**Issue:** Framing is good and the three shapes map cleanly to what Snowflake/Confluent/Redpanda call PrivateLink / BYOC / Self-Managed. But the lesson conflates two distinct shapes that interviewers separate: (1) **PrivateLink-to-vendor-VPC** (data still in vendor account, just private network path) vs (2) **BYOC** (vendor's data plane runs INSIDE customer's cloud account, control plane stays with vendor — Redpanda BYOVPC, Confluent BYOC, Databricks). The current "Shape 2" lumps these together. Modern 2026 answer separates "BYOC data plane in customer's account" from "single-tenant in vendor's account." Also missing: (3) **Control-plane / data-plane split** as a named architecture — this is the BYOC keyword. (4) **VPC Lattice / service mesh** as an emerging pattern. (5) No mention of **air-gapped update delivery** challenges for shape 3 (signed artifact bundles, offline license servers). Senior signal: name "control plane / data plane separation."
**Proposed change:** Split current Shape 2 into "single-tenant in vendor VPC" and "BYOC (data plane in customer's account)"; introduce control-plane/data-plane terminology; add a sentence on air-gapped artifact delivery (signed bundles, no outbound internet). Update the match interactive to reflect 4 shapes or add a BYOC pairing.

---

## Lesson fd-7 — "Event sourcing + CQRS — when the log IS the database"
**Verdict:** keep
**Issue:** Strong lesson — bug-recovery framing is exactly the right senior intuition, snapshots covered, eventual-consistency trap named, and the "when not to" clause is the mature signal. Could optionally name Kafka / EventStoreDB / Postgres + outbox as concrete impls, but content is solid as-is.
**Proposed change:** Optional: one-liner naming common event stores (Kafka, EventStoreDB, Postgres outbox pattern). Not required.

---

## Lesson fd-8 — "gRPC vs REST vs GraphQL — pick the wire format"
**Verdict:** update-content
**Issue:** Solid framework but missing key 2026 entrants that FDE interviewers now expect by name. (1) **Connect / ConnectRPC** (Buf) — gRPC-compatible but works in browsers without a proxy; mainstream by 2026 and the answer to "browser + binary contract." (2) **tRPC** — TypeScript-native, common in modern startups for internal APIs. (3) **Server-Sent Events (SSE)** is THE pattern for LLM streaming responses (OpenAI, Anthropic) — should be named alongside WebSocket. (4) Typo in heading: "A grPC service in 30 lines" → "A gRPC service". (5) The cloze answer (bidi-streaming gRPC for transcription) is correct but in 2026 most public transcription APIs ship over **WebSocket** because clients are browsers — worth noting in the explain text.
**Proposed change:** Add a row for ConnectRPC ("gRPC-compatible, browser-native — no envoy proxy needed"); add SSE row for LLM token streaming; fix the gRPC typo; expand the cloze explain to acknowledge WebSocket as the public-API variant.

---

## Lesson fd-5 — "Customer's legacy ERP has no API — the integration ladder"
**Verdict:** keep
**Issue:** Excellent FDE-specific content, ladder framing is exactly right, SLA table is the senior move. Nothing materially outdated — RPA / SFTP / DB-replica / SDK ladder is unchanged. Could optionally add **CDC (Debezium / Fivetran)** as a modern variant of "Rung 2.5" between DB-replica and SDK — that's how most teams ship DB replication in 2026 — but the lesson is strong as-is.
**Proposed change:** Optional: one-line mention of CDC (Debezium / Fivetran / Airbyte) as the modern shape of "DB replica."

---

## Lesson fd-6 — "Customer-facing eval & monitoring — the AI observability stack"
**Verdict:** update-content
**Issue:** Strong content overall but missing the named-tool layer that 2025/2026 FDE interviews probe for. (1) **OpenTelemetry GenAI semantic conventions** (otel-gen-ai) are the emerging standard for trace schemas — naming them is a senior signal that the lesson currently misses. (2) No mention of **LangSmith / Langfuse / Arize / Phoenix / Helicone** as the named observability vendors customers will ask about. (3) "LLM-as-judge" is named but no caveat that judge models drift and need their own gold set / human spot-checks — without that caveat the recommendation is naïve. (4) **Cost dashboard** should mention token-level attribution per tenant (cost-per-tenant for chargeback/billing is now a standard ask). (5) The trace schema is good but should mention **PII redaction at log time** — required for HIPAA/GDPR customers and a common compliance blocker. (6) Storage shape recommends Postgres/ClickHouse — fine, but ClickHouse + S3 is now the dominant trace-store combo; the lesson could be more decisive.
**Proposed change:** Add OTel GenAI conventions reference; name LangSmith/Langfuse/Arize as the vendor landscape; add a caveat on LLM-as-judge drift and the need for human-labeled gold sets; mention PII-redaction at log time; add per-tenant cost attribution as a billing-grade requirement.

---

sd-fde — 8 reviewed, 6 flagged.

Sources:
- [Standard Webhooks spec](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
- [Svix — Webhook authentication best practices](https://www.svix.com/resources/webhook-best-practices/authentication/)
- [IETF — Idempotency-Key HTTP Header draft-07](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-07)
- [Stitchflow — SAML vs OIDC vs SCIM (2026 IT leader's guide)](https://www.stitchflow.com/blog/saml-oidc-scim-guide-it-leaders)
- [Authgear — OIDC vs SAML: when to use each (2026)](https://www.authgear.com/post/oidc-vs-saml/)
- [Northflank — Deploy SaaS in customer VPC (2026)](https://northflank.com/blog/deploy-saas-in-customer-vpc)
- [Redpanda Cloud BYOVPC for AWS — GA](https://www.redpanda.com/blog/cloud-byoc-vpc-aws-generally-available)
- [Confluent — What is Bring Your Own Cloud (BYOC)?](https://www.confluent.io/learn/bring-your-own-cloud/)
- [Crunchy Data — Row Level Security for Tenants in Postgres](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres)
- [AWS Database Blog — Multi-tenant isolation with Postgres RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
