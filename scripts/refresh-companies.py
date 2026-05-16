#!/usr/bin/env python3
"""
refresh-companies.py — re-verify every live NYC engineering posting and
rewrite the COMPANIES block in js/data.js in place.

What it does
------------
For every candidate company in CANDIDATES below, hits the company's
public ATS JSON (Ashby / Greenhouse) via curl, filters jobs by:

  • Location contains "New York" / NYC / Brooklyn / Manhattan
  • Title matches an SDE / SWE / Forward Deployed / Founding /
    Applied AI/ML / Member-of-Technical-Staff pattern
  • Title does NOT contain staff / principal / lead / manager /
    director / intern / research scientist / sales-or-solutions /
    customer / partner / implementation engineer

For each company with ≥1 surviving posting, it emits a record with
all matching jobs (sorted founding > senior > mid) and the funding
metadata declared in CANDIDATES. The full set replaces the COMPANIES
const in js/data.js. The verified-on date is bumped to today.

Use this whenever postings go stale. Links rot — that's expected;
this script is the recovery path.

How to add a new company
------------------------
Append to CANDIDATES (tuple format below). The ATS slug must be the
exact slug the company uses on Ashby or Greenhouse — e.g.,
  https://jobs.ashbyhq.com/{slug}            -> ("ashby", slug)
  https://job-boards.greenhouse.io/{slug}    -> ("greenhouse", slug)
If a company doesn't survive the location/role filters, the script
silently drops it. Run with -v to see no-match diagnostics.

Run from repo root:
  python3 scripts/refresh-companies.py
"""

from __future__ import annotations
import argparse, datetime, json, os, re, subprocess, sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_JS   = REPO_ROOT / "js" / "data.js"

# ── Regex filters ────────────────────────────────────────────────────────
NYC = re.compile(r'\b(new[\s-]?york|nyc|brooklyn|manhattan)\b', re.I)
TITLE_INCLUDE = re.compile(
  r"\b("
  r"forward[\s-]deployed|fde|founding[\s-]engineer|"
  r"software[\s-]engineer|swe(?:\s|$)|sde(?:\s|$)|"
  r"backend[\s-]engineer|frontend[\s-]engineer|fullstack[\s-]engineer|"
  r"full[\s-]stack[\s-]engineer|product[\s-]engineer|"
  r"ai[\s-]engineer|applied[\s-]ai[\s-]engineer|ml[\s-]engineer|"
  r"machine[\s-]learning[\s-]engineer|infrastructure[\s-]engineer|"
  r"platform[\s-]engineer|data[\s-]engineer|systems[\s-]engineer"
  r")\b", re.IGNORECASE)
TITLE_EXCLUDE = re.compile(
  r"\b("
  r"staff[\s,]|principal|^lead\s|\slead\s|\slead$|head\s|chief|director|"
  r"manager|engineering\s+manager|technical\s+program|vp\s|vice\s+president|"
  r"intern|internship|research\s+scientist|researcher|"
  r"solutions?\s+engineer|sales\s+engineer|customer\s+engineer|field\s+engineer|"
  r"support\s+engineer|implementation\s+engineer|partner\s+engineer|"
  r"developer\s+advocate|developer\s+relations|devrel|recruiter|recruiting|"
  r"account\s+executive|account\s+manager|operations\s+manager"
  r")\b", re.IGNORECASE)

# ── Candidates ───────────────────────────────────────────────────────────
# Tuple shape: (id, name, ats, slug, vertical, sub, stage, raised, lead, badges, notes)
# Funding metadata is hand-curated from publicly disclosed rounds. To add a
# new company, append a tuple; the script will probe its ATS and include
# the company if any matching NYC engineering postings are live.
CANDIDATES = [
  # AI / ML
  ("openai","OpenAI","ashby","openai","ai","GPT / ChatGPT / API","Late stage","$57B+","Microsoft",["Microsoft","Thrive","Khosla"],"FDE-style 'solutions' work + applied research. Bar is extreme; emphasizes shipping + safety judgment."),
  ("anthropic","Anthropic","greenhouse","anthropic","ai","Claude — AI safety lab","Series F","$18B+","Amazon",["Amazon","Google","Spark"],"Heavy values screen; expect ethical-dilemma and downside-risk questions. Applied-AI eng roles are FDE-flavored."),
  ("scaleai","Scale AI","greenhouse","scaleai","ai","AI data + evals + RLHF","Series F","$1.6B","Accel",["Accel","Index","Founders Fund"],"Data pipelines for AI labs + DoD. FDE work for enterprise deploys; long async eval workflows."),
  ("runway","Runway","ashby","runway-ml","ai","Generative video / film AI","Series D","$536M","General Atlantic",["General Atlantic","Founders Fund","Coatue"],"Generative video. Heavy multimodal eval, long-running GPU jobs, customer-facing studio UX."),
  ("hebbia","Hebbia","greenhouse","hebbia","ai","AI for asset managers + finance","Series B","$161M","Andreessen Horowitz",["a16z","Index","Peter Thiel"],"Multi-step agents over long-form finance docs. Eval discipline, retrieval depth."),
  ("decagon","Decagon","ashby","decagon","ai","AI customer-support agents","Series C","$240M","Bain Capital Ventures",["Bain","a16z","Accel"],"Enterprise AI agents. FDE-heavy: deploy alongside customer success."),
  ("credal","Credal","ashby","credal","ai","Enterprise LLM gateway","Series A","$20M","Spark",["Spark","YC W23"],"Auth, audit, redaction, routing. RAG + governance for regulated buyers."),
  ("mirage","Mirage","ashby","mirage","ai","AI 3D worldbuilding","Series A","$15M","Founders Fund",["Founders Fund"],"3D scene generation. Multimodal, GPU pool design, long-running inference."),
  ("tavily","Tavily","ashby","tavily","ai","Search API for AI agents (acq. by Nebius Feb 2026)","Series A","$30M","Insight Partners",["Insight","YC W24"],"Retrieval API for AI agents. Now part of Nebius; still hiring under Tavily brand. Ranking + eval."),
  ("modal","Modal Labs","ashby","modal","infra","Serverless cloud for AI","Series A","$23M","Redpoint",["Redpoint","Lux"],"Container runtime, serverless GPU. Systems-heavy."),
  ("normal-computing","Normal Computing","ashby","normalcomputing","ai","Probabilistic AI for enterprise","Series A","$14M","First Spark",["First Spark"],"Probabilistic compute approach to enterprise AI."),
  ("distyl","Distyl","ashby","distyl","ai","AI for Fortune 500 deployments","Series A","$30M","Lightspeed",["Lightspeed","Coatue"],"FDE-heavy: deploy AI inside banks, telcos."),
  ("sierra","Sierra","ashby","sierra","ai","AI agents for consumer brands","Series A","$110M","Sequoia",["Sequoia","Benchmark"],"Bret Taylor's agent co. Customer-deploy heavy."),
  ("cognition","Cognition","ashby","cognition","ai","Devin — autonomous SWE agent","Series A","$196M","Founders Fund",["Founders Fund","8VC"],"Autonomous code agent. Agent reliability + eval depth."),
  ("glean","Glean","greenhouse","gleanwork","ai","Enterprise AI search","Series F","$615M","Altimeter",["Sequoia","Lightspeed","Kleiner"],"Enterprise search + chat over corp docs. Retrieval at scale."),
  ("elevenlabs","ElevenLabs","ashby","elevenlabs","ai","Voice AI / TTS","Series C","$281M","Andreessen Horowitz",["a16z","Sequoia","Nat Friedman"],"Voice synthesis API. Audio infra, real-time streaming."),
  ("rilla","Rilla","ashby","rilla","ai","AI for field-sales coaching","Series A","$24M","Sequoia",["Sequoia"],"Speech AI for outside sales. ASR, summarization, ranking."),
  ("perplexity","Perplexity","ashby","perplexity","ai","AI answer engine","Series C","$165M","IVP",["IVP","NEA","NVIDIA"],"Conversational answer engine with citations. Retrieval + ranking + UX."),
  ("cohere","Cohere","ashby","cohere","ai","Enterprise LLM platform","Series C","$945M","Inovia",["Inovia","Index","Tiger","NVIDIA"],"Enterprise LLM toolchain. Strong RAG + finetuning depth."),
  ("cursor","Cursor","ashby","cursor","ai","AI-first code editor","Series B","$170M","Andreessen Horowitz",["a16z","Thrive","OpenAI"],"AI code editor. Frontier model integration, latency, UX."),
  ("langchain","LangChain","ashby","langchain","ai","LLM app dev framework","Series A","$25M","Sequoia",["Sequoia","Benchmark"],"LangSmith + framework. Agent tooling, observability, evals."),
  ("baseten","Baseten","ashby","baseten","ai","ML model deployment","Series C","$135M","IVP",["IVP","Spark","Greylock"],"Model deployment infra. Inference engineering, autoscaling GPU."),
  ("deepgram","Deepgram","ashby","deepgram","ai","Speech AI / STT","Series C","$86M","Madrona",["Madrona","Tiger","Wing"],"Real-time speech recognition. Streaming protocols, audio pipelines, AI eval."),
  ("assemblyai","AssemblyAI","greenhouse","assemblyai","ai","Speech-to-text API","Series C","$50M","Accel",["Accel","Y Combinator"],"Production STT API. Streaming, models, scale."),
  ("writer","Writer","ashby","writer","ai","Enterprise generative AI","Series C","$326M","Premji Invest",["ICONIQ","Insight"],"Enterprise writing AI. RAG + governance + integrations."),
  ("clay","Clay","greenhouse","clay","ai","AI for sales prospecting","Series B","$62M","Sequoia",["Sequoia","Boldstart"],"Sales data enrichment with AI. Spreadsheet UX over data graph."),
  ("abridge","Abridge","ashby","abridge","ai","AI for medical scribing","Series D","$462M","Lightspeed",["Lightspeed","CVS","Khosla"],"Real-time medical transcription. Audio + clinical NLP + EHR."),

  # Fintech
  ("stripe","Stripe","greenhouse","stripe","fintech","Payments + financial infra","Late stage","$8.7B","Sequoia",["Sequoia","a16z","General Catalyst"],"Payments at planet scale. Distributed systems, idempotency, money."),
  ("ramp","Ramp","ashby","ramp","fintech","Corporate cards + finance ops","Series E","$1.3B","Founders Fund",["Founders Fund","Sequoia","Stripe"],"Ledger, fraud, integrations at scale. High autonomy bar."),
  ("brex","Brex","greenhouse","brex","fintech","Corporate cards + spend mgmt (acq. by Capital One Apr 2026)","Series D","$1.5B","DST",["YC","DST","Greenoaks"],"Cards, banking, expense. Now part of Capital One; still hiring under Brex brand. PCI, ledger, large eng org."),
  ("mercury","Mercury","greenhouse","mercury","fintech","Banking for startups","Series C","$152M","CRV",["CRV","a16z","Coatue"],"Banking UX + ops. Compliance, money movement."),
  ("plaid","Plaid","ashby","plaid","fintech","Banking API + financial data","Series D","$734M","Altimeter",["Altimeter","a16z","Index"],"Bank-data connectivity infra. Integration breadth, reliability."),
  ("alloy","Alloy","greenhouse","alloy","fintech","Identity decisioning for fintech","Series C","$207M","Lightspeed",["Lightspeed","Avenir"],"KYC/AML infra. Identity graph, compliance UX."),
  ("gusto","Gusto","greenhouse","gusto","fintech","Payroll / HR for SMBs","Series E","$716M","Generation",["Generation","Kleiner","YC"],"Payroll engine + benefits. Compliance, money movement, multi-state tax."),
  ("robinhood","Robinhood","greenhouse","robinhood","fintech","Retail brokerage (NASDAQ)","Public","$5.6B pre-IPO","DST",["NASDAQ","DST","Sequoia"],"Public co. Markets infra, latency, identity."),
  ("sofi","SoFi","greenhouse","sofi","fintech","Personal finance (NASDAQ)","Public","$2.6B pre-IPO","SoftBank",["NASDAQ","SoftBank","Silver Lake"],"Consumer finance super-app. Lending, banking, brokerage."),
  ("modern-treasury","Modern Treasury","ashby","moderntreasury","fintech","Payment operations","Series C","$183M","Altimeter",["Altimeter","Benchmark"],"Money movement infra. Bank integrations, ledger, ops UX."),
  ("carta","Carta","greenhouse","carta","fintech","Cap-table + private markets","Series G","$1.2B","Andreessen Horowitz",["a16z","Spark","Tribe"],"Cap tables + fund admin. Compliance, securities."),
  ("blockworks","Blockworks","ashby","blockworks","fintech","Crypto data + analytics platform","Series A","$15M","Framework",["Framework","10T","S Capital"],"Data warehouse + market intelligence for crypto traders/institutions (post-2025 pivot away from media). Dashboards, analytics infra."),
  ("betterment","Betterment","greenhouse","betterment","fintech","Robo-advisor","Late stage","$436M","Kinnevik",["Kinnevik","Bessemer","Menlo"],"Robo-advised investing. Algorithms + compliance + UX."),
  ("propel","Propel","ashby","propel","fintech","Fintech for low-income Americans","Series B","$50M","Andreessen Horowitz",["a16z","Kleiner","Serena Williams"],"SNAP-balance app + benefits financial services. Mission-driven."),
  ("public","Public","greenhouse","public","fintech","Social investing","Series D","$310M","Tiger",["Tiger","Accel","Greycroft"],"Stocks + crypto + treasuries. Markets infra + community."),
  ("fireblocks","Fireblocks","greenhouse","fireblocks","fintech","Crypto custody / MPC","Series E","$1B","D1 Capital",["D1","Sequoia","Stripes"],"Institutional crypto infra. MPC, custody, compliance."),
  ("gemini","Gemini","greenhouse","gemini","fintech","Crypto exchange + prediction markets (NASDAQ: GEMI)","Public","$400M","Morgan Creek",["Morgan Creek"],"Public co (GEMI) since Sept 2025. Winklevoss-led; US-focused after intl exit. Exchange + CFTC-regulated derivatives."),
  ("alchemy","Alchemy","ashby","alchemy","fintech","Web3 dev platform","Series C","$535M","Lightspeed",["Lightspeed","Silver Lake","Coatue"],"Web3 infra. RPC, indexing, SDKs."),

  # Devtools / Infra / Data
  ("datadog","Datadog","greenhouse","datadog","devtools","Cloud monitoring (NASDAQ)","Public","$148M pre-IPO","Index",["NASDAQ","Index","OpenView"],"Public co. Time-series infra, alerting, observability depth."),
  ("mongodb","MongoDB","greenhouse","mongodb","devtools","Document database (NASDAQ)","Public","$311M pre-IPO","Sequoia",["NASDAQ","Sequoia","Union Square"],"Public co. Database internals, distributed systems."),
  ("cockroach-labs","Cockroach Labs","greenhouse","cockroachlabs","devtools","Distributed SQL database","Series F","$633M","Greenoaks",["Greenoaks","Benchmark","Index"],"Distributed SQL. Consensus, MVCC, query planning."),
  ("vercel","Vercel","greenhouse","vercel","devtools","Frontend cloud / Next.js","Series E","$563M","Accel",["Accel","GV","Bedrock"],"Edge platform + Next.js. CDN, build, runtime."),
  ("stainless","Stainless","ashby","stainlessapi","devtools","SDK generation from OpenAPI","Series A","$25M","a16z",["a16z","Sequoia"],"SDK generation from OpenAPI. Compiler/codegen, DX depth."),
  ("airtable","Airtable","greenhouse","airtable","devtools","No-code database","Late stage","$1.4B","Thrive",["Thrive","Coatue","Caffeinated"],"No-code data platform. App framework + AI features."),
  ("sigma-computing","Sigma","greenhouse","sigmacomputing","devtools","Cloud BI","Series D","$580M","Spectrum Equity",["Spectrum","Snowflake Ventures"],"Cloud-native BI over Snowflake/BigQuery. Spreadsheet UX."),

  # Marketplace / Consumer / Media
  ("whatnot","Whatnot","ashby","whatnot","marketplace","Live shopping marketplace","Series E","$745M","DST",["a16z","DST","YC W20"],"Real-time live shopping. Streaming, payments, trust & safety."),
  ("attentive","Attentive","greenhouse","attentive","saas","SMS marketing platform","Series E","$863M","Coatue",["Coatue","Bain","Sequoia"],"Conversational SMS. Messaging infra, deliverability, analytics."),
  ("squarespace","Squarespace","greenhouse","squarespace","saas","Website builder + payments","Take-private","$278M pre-IPO","Permira",["Permira","General Atlantic"],"Hosting, builder, payments at scale."),
  ("substack","Substack","ashby","substack","media","Independent publishing","Series B","$96M","Andreessen Horowitz",["a16z","YC"],"Newsletter platform + Notes. Publishing infra, subscriptions."),
  ("peloton","Peloton","greenhouse","peloton","consumer","Connected fitness (NASDAQ)","Public","$1.2B pre-IPO","TCV",["NASDAQ","TCV","Tiger"],"Public co. Connected hardware + content + subscription."),

  # Hospitality
  ("dorsia","Dorsia","greenhouse","dorsia","hospitality","Membership dining + reservations","Series B","$32M","Caffeinated Capital",["Caffeinated","Tribe"],"Multi-venue reservations. SQL + payments + UX."),
  ("resortpass","ResortPass","greenhouse","resortpass","marketplace","Day-pass hotel marketplace","Series B","$56M","Charlesbank",["Charlesbank","Declaration"],"Inventory + pricing for hotel amenities."),

  # Health
  ("talkspace","Talkspace","greenhouse","talkspace","health","Online therapy (NASDAQ)","Public","$110M pre-IPO","Norwest",["NASDAQ","Norwest"],"Telehealth platform — therapy networks, intake, claims."),
  ("headway","Headway","greenhouse","headway","health","In-network mental health","Series D","$325M","Spark",["Spark","a16z","GV"],"Therapist network + billing. Healthcare insurance plumbing."),
  ("oscar","Oscar Health","greenhouse","oscar","health","Tech-driven health insurance (NYSE)","Public","$1.6B pre-IPO","Founders Fund",["NYSE","Founders Fund","General Catalyst"],"Public co. Insurance platform with member-facing tech."),
  ("maven-clinic","Maven Clinic","greenhouse","mavenclinic","health","Family-care telehealth","Series F","$425M","General Catalyst",["GC","Lux","Sequoia"],"Women's + family health network. Provider matching, telehealth."),
  ("ridgeline","Ridgeline","greenhouse","ridgeline","saas","Cloud OS for investment mgmt","Series C","$278M","Wellington",["Wellington","Sequoia"],"Modern investment-management platform. Vertical SaaS at scale."),

  # Productivity / Collab
  ("figma","Figma","greenhouse","figma","saas","Collaborative design","Pre-IPO","$333M","Index",["Index","Sequoia","Greylock"],"Multiplayer collaboration at scale. CRDT, real-time infra, design tooling depth."),
  ("notion","Notion","ashby","notion","saas","Connected workspace + AI","Series C","$343M","Index",["Sequoia","Index","Coatue"],"Block-based docs + LLM features. Schema design, perf, AI eval."),
  ("justworks","Justworks","greenhouse","justworks","saas","HR / payroll / benefits","Late stage","$143M","Bain Capital",["Bain","Index"],"PEO platform. Multi-tenant, integrations with payroll + carriers."),

  # Prediction Markets
  ("kalshi","Kalshi","ashby","kalshi","fintech","Regulated event-contracts exchange","Series C","$185M","Sequoia",["Sequoia","Charles Schwab"],"CFTC-regulated prediction market. Markets infra, compliance."),
  ("polymarket","Polymarket","ashby","polymarket","fintech","Crypto prediction markets","Series B","$70M","Founders Fund",["Founders Fund","Peter Thiel"],"Decentralized prediction markets. On-chain settlement + UX."),

  # Climate
  ("watershed","Watershed","ashby","watershed","climate","Enterprise carbon accounting","Series C","$240M","Sequoia",["Sequoia","Kleiner","a16z"],"Enterprise-grade carbon ledger. Compliance + data pipelines."),

  # Sales AI
  ("unify","Unify","ashby","unify","saas","AI for outbound sales","Series A","$24M","Thrive",["Thrive","OpenAI","Sequoia Scout"],"AI sales rep / prospecting platform. Data + agents."),

  # ── Expansion batch — additional verified NYC-hiring companies ────────
  # More AI
  ("ideogram","Ideogram","ashby","ideogram","ai","Generative image AI","Series A","$80M","a16z",["a16z","Index"],"Text-to-image generation. Multimodal eval + GPU pipeline."),
  ("poolside","Poolside","ashby","poolside","ai","AI for software engineering","Series B","$626M","Bain Capital",["Bain","DST","Felicis"],"Frontier AI for code. Frontier model R&D + product engineering."),

  # More Fintech / SaaS
  ("drata","Drata","ashby","drata","saas","Continuous compliance automation","Series C","$328M","ICONIQ",["ICONIQ","GGV","Iconiq Capital"],"SOC2/ISO/HIPAA automation. Compliance + integrations breadth."),
  ("numeric","Numeric","ashby","numeric","fintech","AI-powered close software","Series B","$67M","Menlo",["Menlo","8VC"],"Modern accounting close. Spreadsheet UX + workflow + AI."),

  # More Devtools
  ("glide","Glide","ashby","glide","devtools","No-code apps from spreadsheets","Series B","$22M","First Round",["First Round","Benchmark"],"Spreadsheet → app builder. Real-time sync + visual programming."),

  # More public / large-co NYC eng
  ("yext","Yext","greenhouse","yext","saas","Brand / search platform (NYSE)","Public","$255M pre-IPO","Insight",["NYSE","Insight","Marker"],"Public co. Knowledge-graph platform + AI answers."),
  ("the-trade-desk","The Trade Desk","greenhouse","thetradedesk","saas","DSP for digital advertising (NASDAQ)","Public","$26M pre-IPO","IA Ventures",["NASDAQ","IA Ventures"],"Public co. Real-time bidding + ad tech at scale."),
  ("lyft","Lyft","greenhouse","lyft","consumer","Rideshare + mobility (NASDAQ)","Public","$5B pre-IPO","Andreessen Horowitz",["NASDAQ","a16z","Founders Fund"],"Public co. Mobility platform — matching, payments, mapping."),
  ("reddit","Reddit","greenhouse","reddit","media","Social discussion platform (NYSE)","Public","$1.3B pre-IPO","Advance",["NYSE","Advance","Tencent"],"Public co. Massive social platform with rich data + recs."),
  ("jane-street","Jane Street","greenhouse","janestreet","fintech","Quant trading firm","Private","Self-funded","Private",["Private"],"Quant trading. Strong on functional programming (OCaml), CS fundamentals."),
  ("mosaic","Mosaic","ashby","mosaic","fintech","Modern FP&A platform (acq. by HiBob Feb 2025)","Series C","$45M","Founders Fund",["Founders Fund","Y Combinator"],"Strategic finance — budgeting + forecasting. Now part of HiBob HR platform; still has standalone product team."),
  ("monte-carlo","Monte Carlo","ashby","montecarlodata","devtools","Data observability","Series D","$236M","ICONIQ",["ICONIQ","Accel","Salesforce Ventures"],"Data reliability platform. Lineage, anomaly detection, integrations."),
  ("forge","Forge","ashby","forge","fintech","Private-market liquidity (acq. by Charles Schwab Mar 2026)","Public","$240M pre-IPO","Tiger",["NYSE","Tiger","FTV"],"Secondaries trading + private-market data. Now part of Schwab; hiring under Forge brand. Markets infra + KYC."),

  # ── Second expansion batch — pushes the verified count toward doubling ─
  ("middesk","Middesk","ashby","middesk","fintech","KYB / business identity infra","Series B","$57M","Sequoia",["Sequoia","Accel"],"Business identity verification for fintech. Identity graph + compliance."),
  ("pinwheel","Pinwheel","greenhouse","pinwheelapi","fintech","Payroll API","Series B","$77M","GGV",["GGV","Coatue","First Round"],"Payroll connectivity infra. Income/employment data, direct-deposit switching."),
  ("mistral","Mistral AI","lever","mistral","ai","Open-weights LLM platform","Series B","$1B+","Andreessen Horowitz",["a16z","General Catalyst","Lightspeed"],"Open-source frontier models. Strong systems + applied research culture."),
  ("commure","Commure","ashby","commure","health","AI-native RCM + ambient documentation","Series D","$870M+","General Catalyst",["GC","Sequoia"],"AI-native revenue cycle + ambient AI scribe + agents for health systems. Powers 130+ health systems, $25B+ in annual claims."),
  ("spotify","Spotify","lever","spotify","media","Audio streaming (NYSE)","Public","$540M pre-IPO","TCV",["NYSE","TCV","DST"],"Public co. Audio infra + recs + ads + creator tools."),
  ("point72","Point72","greenhouse","point72","fintech","Quant + multi-strat hedge fund","Private","Self-funded","Private",["Private"],"Steve Cohen's quant firm. Trading systems + ML + low-latency infra."),
  ("jump-trading","Jump Trading","greenhouse","jumptrading","fintech","Proprietary trading firm","Private","Self-funded","Private",["Private"],"Quant trading. HFT, C++, low-latency networking, crypto infra."),
  ("virtu","Virtu Financial","greenhouse","virtu","fintech","Market maker (NASDAQ)","Public","$402M pre-IPO","Silver Lake",["NASDAQ","Silver Lake"],"Public market maker. HFT, market-data, low-latency systems."),
  ("secureframe","Secureframe","lever","secureframe","saas","Compliance automation","Series C","$78M","Accel",["Accel","Kleiner","Y Combinator"],"SOC2/ISO/HIPAA automation. Compliance + integrations."),
  ("asana","Asana","greenhouse","asana","saas","Work management (NYSE)","Public","$453M pre-IPO","Founders Fund",["NYSE","Founders Fund","Benchmark"],"Public co. Work-graph platform + AI features."),
  ("iterable","Iterable","greenhouse","iterable","saas","Cross-channel marketing platform","Series E","$342M","Silver Lake",["Silver Lake","Index","CRV"],"Customer messaging + journey orchestration. Data plumbing + segmentation."),
  ("braze","Braze","greenhouse","braze","saas","Customer engagement (NASDAQ)","Public","$175M pre-IPO","ICONIQ",["NASDAQ","ICONIQ","Battery"],"Public co. Cross-channel CRM messaging at scale."),
  ("knock","Knock","ashby","knock","devtools","Notifications-as-a-service","Series A","$15M","Lightspeed",["Lightspeed","Afore"],"Notification API for product teams. Event-driven infra + integrations."),
  ("extend","Extend","ashby","extend","fintech","Virtual card platform","Series B","$54M","Point72",["Point72","B Capital"],"Virtual card issuing + spend mgmt for fintechs. Card networks + ledger."),
  ("chime","Chime","greenhouse","chime","fintech","Consumer neobank (NASDAQ)","Public","$2.3B pre-IPO","DST",["NASDAQ","DST","Tiger"],"Public co. Consumer banking at scale. Money movement + UX."),
  ("kustomer","Kustomer","ashby","kustomer","saas","CRM platform for support","Series F","$174M","Tiger",["Tiger","Coatue"],"Modern support CRM. Unified customer record + automation + AI."),

  # ── Third expansion batch — ad-tech, HFT, more NYC consumer + AI infra ─
  ("doubleverify","DoubleVerify","greenhouse","doubleverify","saas","Ad measurement (NYSE)","Public","$345M pre-IPO","Providence",["NYSE","Providence"],"Public co. Ad verification + analytics infra."),
  ("wealthfront","Wealthfront","lever","wealthfront","fintech","Robo-advisor + cash mgmt (NASDAQ: WLTH)","Public","$205M","Greylock",["Greylock","Index"],"Public co since Dec 2025. Robo-advisor + banking at $88B+ AUM. Algorithms + compliance + UX."),
  ("stash","Stash","greenhouse","stashinvest","fintech","Beginner investing app (Grab acquisition pending Q3 2026)","Series G","$427M","T. Rowe Price",["T. Rowe Price","Goodwater","Coatue"],"Subscription-based brokerage + banking for first-time investors. Grab acquisition announced Feb 2026, closes Q3."),
  ("bombas","Bombas","greenhouse","bombas","consumer","Mission-driven apparel DTC","Series C","$23M","Great Hill",["Great Hill"],"DTC apparel. Logistics, e-commerce, subscriptions, marketing tech."),
  ("lovable","Lovable","ashby","lovable","ai","AI app generator","Series A","$15M","Creandum",["Creandum","byFounders"],"AI builder for apps. Frontier model integration + product engineering."),
  ("fireworks","Fireworks AI","greenhouse","fireworksai","ai","Fast inference for open models","Series B","$77M","Sequoia",["Sequoia","Benchmark","NVIDIA"],"Production inference platform for open-weights models. Systems + perf."),
  ("logrocket","LogRocket","lever","logrocket","devtools","Frontend session replay + obs","Series C","$76M","Battery",["Battery","Matrix"],"Frontend observability + session replay. JS infra + analytics."),

  # ── Fourth expansion: creative + hospitality + restaurant + creator-econ ─
  ("patreon","Patreon","ashby","patreon","media","Membership platform for creators","Series F","$413M","Tiger",["Tiger","Index","Wellington"],"Creator monetization at scale. Subscriptions infra, payments, media tooling."),
  ("hopper","Hopper","ashby","hopper","hospitality","B2B travel tech + fintech (HTS)","Series G","$750M","Goldman Sachs",["Goldman Sachs","Inovia","Capital One"],"Hopper Technology Solutions powers partners (Capital One, Uber, Nubank) with booking + travel fintech (price-freeze, cancel-for-any-reason). B2B is now majority of revenue."),
  ("hang","Hang","ashby","hang","hospitality","Autonomous marketing system for brands","Series A","$32M","Paradigm",["Paradigm","a16z"],"AI-driven marketing + CDP + loyalty stack for restaurants/retailers (Ulta, ASICS, Cinemark). Identity resolution, segmentation, gamified engagement."),
  ("block","Block","greenhouse","block","fintech","Square / Cash App / Afterpay (NYSE)","Public","$590M pre-IPO","Khosla",["NYSE","Khosla","Sequoia"],"Square / Cash App / Tidal / Afterpay parent. Payments + commerce + crypto."),
  ("mighty-networks","Mighty Networks","greenhouse","mighty","saas","Community + course platform","Series B","$67M","Owl Ventures",["Owl Ventures","Intel Capital","Reach"],"Branded community + course platform for creators. Social graph + commerce."),
  ("seatgeek","SeatGeek","greenhouse","seatgeek","marketplace","Live-events ticketing","Series E","$338M","Wellington",["Wellington","Accel","Causeway"],"Tickets marketplace + primary-issuer platform. Marketplace ranking, payments, integrations."),
  ("beacons","Beacons","ashby","beacons","saas","Link-in-bio + creator monetization","Series A","$30M","Andreessen Horowitz",["a16z","Atelier"],"Link-in-bio + creator-commerce platform. Mobile + e-commerce + creator tooling."),
  ("navan","Navan","greenhouse","tripactions","saas","Business travel + expense","Series G","$2B","Andreessen Horowitz",["a16z","Lightspeed","Greenoaks"],"Modern T&E platform (formerly TripActions). Travel inventory, expense, payments."),

  # ── Fifth expansion: user-curated NYC list ────────────────────────────
  ("airgoods","Airgoods","ashby","airgoods","marketplace","B2B grocery / CPG marketplace","Series A","$11M","Andreessen Horowitz",["a16z","BoxGroup"],"Wholesale CPG marketplace. Two-sided liquidity, catalog, payments."),
  ("blee","Blee","ashby","blee","ai","AI for marketing compliance review","Seed","$8M","Sequoia Scout",["YC W24"],"Enterprise AI compliance platform — legal/compliance review of marketing content in regulated industries (fintech, healthcare, pharma). LLMs + workflow + integrations."),
  ("camber","Camber","ashby","camber","ai","AI medical billing + RCM","Series A","$30M","Andreessen Horowitz",["a16z","Foundry"],"AI revenue-cycle / claims-processing platform for healthcare clinics. Claims automation, denial prediction; behavioral-health roots, expanding verticals."),
  ("crosby","Crosby","ashby","crosby","ai","AI-first law firm for contract review","Seed","$10M","Sequoia",["Sequoia","YC"],"AI-native law firm reviewing NDAs/MSAs/DPAs for tech clients (Cursor, Clay, etc.). LLM + lawyer workflows, eval on legal accuracy."),
  ("flora","FLORA","ashby","flora","ai","AI creative studio","Series A","$15M","Andreessen Horowitz",["a16z"],"AI-native creative platform — boards / sketches / prompts. Multimodal + design-tool depth."),
  ("general-context","General Context","ashby","general-context","ai","AI for enterprise context","Seed","$8M","Forerunner",["Forerunner","YC"],"Early-stage AI infra. Founding-engineer hiring; broad scope."),
  ("glossgenius","GlossGenius","greenhouse","glossgenius","saas","Software for beauty + wellness pros","Series C","$93M","Bessemer",["Bessemer","Imaginary"],"SaaS for independent beauty/wellness pros. Booking + payments + marketing."),
  ("loopai","Loop","greenhouse","loop","ai","AI agents for freight ops","Series B","$60M","Founders Fund",["Founders Fund","Index"],"Freight/logistics agents. Deploy with top carriers; agent eval + customer integration."),
  ("metropolis","Metropolis","greenhouse","metropolis","ai","AI computer-vision parking","Series C","$1.7B","Eldridge",["Eldridge","RXR","3L"],"Computer-vision parking platform (acquired SP Plus). Edge AI, payments, infrastructure."),
  ("opus-training","Opus Training","ashby","opus-training","saas","Mobile training for hourly workers","Series A","$25M","Tiger",["Tiger","Avenir"],"Hourly-worker training SaaS — built for restaurants + hospitality. Mobile-first."),
  ("partiful","Partiful","ashby","partiful","consumer","Modern event-invite app","Series A","$20M","Andreessen Horowitz",["a16z","FirstMark"],"Mobile event invites + RSVPs. Social graph, mobile UX, identity."),
  ("plot","Plot","ashby","plot","ai","AI for cultural / social-video intelligence","Seed","$10M","Andreessen Horowitz",["a16z"],"AI-native social listening turning short-form video into real-time cultural insights. Multimodal ingestion, ranking."),
  ("qloo","Qloo","lever","qloo","ai","Taste / cultural AI API","Series C","$103M","AXA Venture Partners",["AXA","Tribeca"],"Cross-domain taste graph API. Recommender systems, API design, latency."),
  ("sandbar","Sandbar","ashby","sandbar","ai","AI for compliance / fincrime","Series A","$22M","Felicis",["Felicis","Bain Capital Ventures"],"Anti-fincrime AI. ML + investigation tooling + bank integrations."),
  ("sequence","Sequence","ashby","sequence","fintech","Personal-finance autopilot","Series A","$19M","Andreessen Horowitz",["a16z","FirstMark"],"Money-routing + automation for consumers. Payments, ledger, AI advice."),
  ("slate","Slate","lever","slate","media","Content + brand tools for social-media teams","Series A","$15M","Forerunner",["Forerunner"],"Brand-consistent content creation for enterprise social teams (NFL, Visa, Budweiser). In-browser/mobile studio, brand asset mgmt, direct social publishing."),
  ("sola","Sola","ashby","sola","ai","Agentic process automation for enterprises","Series A","$30M","Lightspeed",["Lightspeed","FirstMark"],"AI-native RPA: record a workflow once, Sola turns it into an autonomous agent. Customers in logistics, legal, healthcare back-office."),
  ("suno","Suno","ashby","suno","ai","AI music generation","Series B","$125M","Lightspeed",["Lightspeed","Founder Collective","Nat Friedman"],"Generative music at scale. Audio pipelines, copyright/moderation, eval on subjective quality."),
  ("warp","Warp","ashby","warp","ai","AI-native terminal","Series B","$73M","Sequoia",["Sequoia","GV"],"Reimagined terminal with AI. Heavy on developer experience, latency, prompt design for code."),
  ("output","Output","ashby","output","saas","Music production software","Series A","$45M","Goldman Sachs",["Goldman Sachs","Marker"],"Music-production software (Arcade, Portal). Audio infra, ML for music, DAW integrations."),

  # ── 2026-05-15 expansion: NYC-leaning AI / fintech / health / infra ──
  # Slugs are best-guesses from each company's public careers page; run
  # with -v to surface no-match diagnostics so we can iterate.
  ("harvey","Harvey","ashby","harvey","ai","Legal AI for major firms","Series F+","$806M+","Andreessen Horowitz",["a16z","Kleiner","Coatue","Sequoia","GIC"],"Legal AI for top law firms; $11B valuation (Mar 2026). FDE-style deploys, document workflows, reasoning eval."),
  ("pinecone","Pinecone","greenhouse","pinecone","ai","Vector database for AI","Series B","$138M","Andreessen Horowitz",["a16z","Menlo","Wing"],"Production vector DB. Distributed indexing, latency, retrieval quality at scale."),
  ("captions","Captions","ashby","captions","ai","AI video editor for creators","Series C","$100M","Index",["Index","Sequoia","Kleiner"],"NYC AI-first video editor. Real-time inference, mobile + web latency."),
  ("granola","Granola","ashby","granola","ai","AI meeting notes / enterprise context","Series C","$192M","Lightspeed",["Lightspeed","NFDG","Spark"],"AI note-taking → enterprise AI workspace; $1.5B valuation (Mar 2026). ASR, summarization, LLM eval."),
  # ("common-sense-machines", ...) — acquired by Alphabet/Google in Feb 2026. Dropped.
  ("huggingface","Hugging Face","workable","huggingface","ai","ML model hub + libraries","Series D","$400M","Salesforce",["Salesforce","Google","Nvidia","Sequoia"],"Open-source ML platform; $4.5B valuation. Inference, hosting, eval; OSS-heavy culture."),
  ("coreweave","CoreWeave","greenhouse","coreweave","infra","Specialized GPU cloud (NASDAQ: CRWV)","Public","$1.5B IPO ($14B+ pre-IPO)","NASDAQ",["NASDAQ","Coatue","NVIDIA","Blackstone"],"GPU cloud powering AI labs; IPO\\'d Mar 2025. Bare-metal infra + scheduling."),
  ("lithic","Lithic","greenhouse","lithic","fintech","Card-issuing API","Series C","$110M","Stripes",["Stripes","Index","Bessemer","Tusk"],"NYC card-issuing platform (Privacy.com lineage). Payments + compliance + APIs."),
  ("unit","Unit","ashby","unit","fintech","Embedded banking","Series C","$170M","Insight",["Insight","Accel","Better Tomorrow"],"Banking-as-a-service. Ledger, KYC, money movement."),
  ("increase","Increase","ashby","increase","fintech","Modern banking APIs","Series A","$20M","Andreessen Horowitz",["a16z","Susa","Garry Tan"],"Payments API (ACH/RTP/Wire). Deep banking + reliability."),
  ("pagaya","Pagaya","greenhouse","pagaya","fintech","AI lending platform (NASDAQ)","Public","$500M+ pre-IPO","Israel Growth Partners",["NASDAQ","Aflac","Viola"],"NYC AI-lending. ML credit + capital-markets plumbing."),
  # ("petal", ...) — acquired by Empower Finance (April 2024); rebranded as Tilt Card. Dropped.
  ("alphasense","AlphaSense","greenhouse","alphasense","ai","AI market intelligence","Series F","$650M+","BDT",["BDT","Viking","Goldman"],"NYC enterprise AI search over financial docs. Retrieval + integrations."),
  ("tegus","Tegus","greenhouse","tegus","ai","Expert-call research platform","Late stage","$150M+","Bain",["Bain","Battery"],"NYC investment research. Search, ML, audio-to-text."),
  ("yotta","Yotta","ashby","yotta","fintech","Prize-linked savings","Series A","$13M","Y Combinator",["YC","Base10"],"NYC consumer savings + lottery hybrid. Payments + ledger."),
  ("bilt","Bilt Rewards","greenhouse","bilt","fintech","Rewards on rent + spend","Series C","$200M+","General Catalyst",["General Catalyst","Eldridge"],"NYC rewards network — points on rent. Loyalty + payments."),
  ("neon","Neon","ashby","neon","devtools","Serverless Postgres (acq. by Databricks May 2025)","Series B","$104M","Menlo",["Menlo","General Catalyst","GGV"],"Branchable serverless Postgres. Now part of Databricks; product still runs standalone. Storage separation, autoscaling."),
  ("convex","Convex","ashby","convex","devtools","Reactive backend","Series A","$26M","Andreessen Horowitz",["a16z","Khosla"],"Reactive backend — DB + functions + real-time. TS-first DX."),
  ("ro","Ro","lever","ro","health","D2C telehealth + pharmacy","Series E","$1B+","General Catalyst",["General Catalyst","Founders Fund","TPG"],"NYC telehealth. Care plans + fulfillment + identity."),
  ("khealth","K Health","greenhouse","khealth","health","Primary-care AI","Series E","$378M","Cigna",["Cigna","Mangrove","Atreides"],"NYC AI-first primary care. Clinical NLP + EHR + telehealth."),
  ("cityblock","Cityblock Health","workday","cityblockhealth/wd1/CityblockExternalCareerSite","health","Tech-enabled Medicaid care","Series D","$700M+","Tiger",["Tiger","General Catalyst","Maverick"],"NYC Medicaid care provider. Care platform + data + ops."),
  ("edenhealth","Eden Health","greenhouse","edenhealth","health","Employer-sponsored primary care","Series C","$60M","Flare Capital",["Flare","Greycroft"],"NYC primary care for employers. Care navigation + telehealth."),
  ("wiz","Wiz","greenhouse","wiz","security","Cloud security platform","Series E","$1.9B+","Andreessen Horowitz",["a16z","Sequoia","Lightspeed"],"Agentless cloud security. CSPM/CNAPP at scale; NYC eng presence."),
  ("chainalysis","Chainalysis","greenhouse","chainalysis","fintech","Blockchain analytics + compliance","Series F","$540M","Insight",["Insight","Accel","Benchmark"],"NYC blockchain analytics. Crypto compliance + investigations + APIs."),

  # ── 2026-05-15 — Workday ATS expansion (verified via probe) ────────
  # Tuple-encoded slug = "tenant/wdN/site". See fetch() for the URL shape.
  ("disney","The Walt Disney Company","workday","disney/wd5/disneycareer","media","Streaming + studios + parks (NYSE: DIS)","Public","$1B+ pre-IPO","NYSE",["NYSE","S&P 500"],"NYC tech: ABC News, Hulu, ESPN+, Disney+. Streaming infra + content systems."),
  ("blackrock","BlackRock","workday","blackrock/wd1/BlackRock_Professional","fintech","World's largest asset manager (NYSE: BLK)","Public","$2.6B pre-IPO","NYSE",["NYSE","S&P 500"],"NYC HQ. Aladdin platform — risk + portfolio mgmt. Heavy systems / data eng."),
  ("etsy","Etsy","workday","etsy/wd5/Etsy_Careers","marketplace","Marketplace for handmade + vintage (NASDAQ: ETSY)","Public","$307M pre-IPO","NASDAQ",["NASDAQ","S&P MidCap"],"Brooklyn HQ. Recommendations, search, payments, ML — strong Python culture."),
  ("nbcuniversal","Comcast (NBCUniversal)","workday","comcast/wd5/Comcast_Careers","media","Media + telecom (NASDAQ: CMCSA)","Public","$1.1B pre-IPO","NASDAQ",["NASDAQ","S&P 500"],"NBCU + Peacock streaming. NYC: ad tech + media engineering."),
  ("salesforce","Salesforce","workday","salesforce/wd12/External_Career_Site","saas","CRM + AI cloud (NYSE: CRM)","Public","$2B pre-IPO","NYSE",["NYSE","Dow 30"],"Hyperforce + Data Cloud + Einstein. NYC office for sales eng + applied AI."),
]

# Clearbit logo domains, keyed by company id. Companies absent from this
# map fall back to the first letter of their name in the card.
DOMAINS = {
  "openai":"openai.com","anthropic":"anthropic.com","scaleai":"scale.com",
  "figma":"figma.com","notion":"notion.so","hebbia":"hebbia.com",
  "decagon":"decagon.ai","credal":"credal.ai","mirage":"mirage.app",
  "tavily":"tavily.com","modal":"modal.com","distyl":"distyl.ai",
  "sierra":"sierra.ai","cognition":"cognition.ai","glean":"glean.com",
  "elevenlabs":"elevenlabs.io","rilla":"rillavoice.com","stripe":"stripe.com",
  "ramp":"ramp.com","brex":"brex.com","mercury":"mercury.com","plaid":"plaid.com",
  "alloy":"alloy.com","gusto":"gusto.com","datadog":"datadoghq.com",
  "mongodb":"mongodb.com","vercel":"vercel.com","stainless":"stainless.com",
  "whatnot":"whatnot.com","attentive":"attentive.com","squarespace":"squarespace.com",
  "talkspace":"talkspace.com","dorsia":"dorsia.com","resortpass":"resortpass.com",
  "normal-computing":"normalcomputing.com","cockroach-labs":"cockroachlabs.com",
  "perplexity":"perplexity.ai","cohere":"cohere.com","cursor":"cursor.com",
  "langchain":"langchain.com","baseten":"baseten.co","deepgram":"deepgram.com",
  "assemblyai":"assemblyai.com","writer":"writer.com","clay":"clay.com",
  "abridge":"abridge.com","robinhood":"robinhood.com","sofi":"sofi.com",
  "modern-treasury":"moderntreasury.com","carta":"carta.com","blockworks":"blockworks.co",
  "betterment":"betterment.com","propel":"joinpropel.com","public":"public.com",
  "fireblocks":"fireblocks.com","gemini":"gemini.com","alchemy":"alchemy.com",
  "airtable":"airtable.com","sigma-computing":"sigmacomputing.com",
  "substack":"substack.com","peloton":"onepeloton.com","headway":"headway.co",
  "oscar":"hioscar.com","maven-clinic":"mavenclinic.com","ridgeline":"ridgelineapps.com",
  "justworks":"justworks.com","kalshi":"kalshi.com","polymarket":"polymarket.com",
  "watershed":"watershedclimate.com","unify":"unifygtm.com","runway":"runwayml.com",
  "ideogram":"ideogram.ai","poolside":"poolside.ai","drata":"drata.com",
  "numeric":"numeric.io","glide":"glideapps.com","yext":"yext.com",
  "the-trade-desk":"thetradedesk.com","lyft":"lyft.com","reddit":"reddit.com",
  "jane-street":"janestreet.com","mosaic":"mosaic.tech",
  "monte-carlo":"montecarlodata.com","forge":"forgeglobal.com",
  "middesk":"middesk.com","pinwheel":"pinwheelapi.com","mistral":"mistral.ai",
  "commure":"commure.com","spotify":"spotify.com","point72":"point72.com",
  "jump-trading":"jumptrading.com","virtu":"virtu.com",
  "secureframe":"secureframe.com","asana":"asana.com","iterable":"iterable.com",
  "braze":"braze.com","knock":"knock.app","extend":"paywithextend.com",
  "chime":"chime.com","kustomer":"kustomer.com",
  "doubleverify":"doubleverify.com","wealthfront":"wealthfront.com",
  "stash":"stash.com","bombas":"bombas.com","lovable":"lovable.dev",
  "fireworks":"fireworks.ai","logrocket":"logrocket.com",
  "patreon":"patreon.com","hopper":"hopper.com","hang":"hang.xyz",
  "block":"block.xyz","mighty-networks":"mightynetworks.com",
  "seatgeek":"seatgeek.com","beacons":"beacons.ai","navan":"navan.com",
  "airgoods":"airgoods.com","blee":"blee.com","camber":"camber.com",
  "crosby":"crosby.ai","flora":"florafauna.ai","general-context":"generalcontext.com",
  "glossgenius":"glossgenius.com","loopai":"loop.com","metropolis":"metropolis.io",
  "opus-training":"opus.so","partiful":"partiful.com","plot":"plotai.com",
  "qloo":"qloo.com","sandbar":"sandbar.ai","sequence":"sequence.app",
  "slate":"slate.com","sola":"sola.ai","suno":"suno.com","warp":"warp.dev",
  "output":"output.com",
}


# ── HTTP fetchers (curl) ─────────────────────────────────────────────────
def curl_json(url, timeout=15, method="GET", body=None, referer=None):
  args = ["curl","-sS","-L","--max-time",str(timeout)]
  if method == "POST":
    args += ["-X","POST","-H","Content-Type: application/json","-H","Accept: application/json"]
    if body is not None:
      args += ["-d", body]
  if referer:
    args += ["-H", f"Referer: {referer}"]
  args.append(url)
  try:
    r = subprocess.run(args, capture_output=True, timeout=timeout+3, text=True)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout else None
  except Exception:
    return None

def fetch(ats, slug):
  if ats == "ashby":
    d = curl_json(f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false")
    return d.get("jobs", []) if d else []
  if ats == "greenhouse":
    d = curl_json(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs")
    return d.get("jobs", []) if d else []
  if ats == "lever":
    d = curl_json(f"https://api.lever.co/v0/postings/{slug}?mode=json")
    return d if isinstance(d, list) else []
  if ats == "workable":
    # Workable's v3 search endpoint — POST with empty body returns all
    # published jobs. The public v3/accounts/{slug}/jobs GET 404s; the
    # POST variant is what their SPA uses internally.
    url = f"https://apply.workable.com/api/v3/accounts/{slug}/jobs"
    body = '{"query":"","department":[],"location":[]}'
    d = curl_json(url, method="POST", body=body)
    return d.get("results", []) if d else []
  if ats == "workday":
    # Slug encodes the 3-tuple: "tenant/wdN/site"
    # e.g. "cityblockhealth/wd1/CityblockExternalCareerSite"
    try:
      tenant, wdn, site = slug.split("/", 2)
    except ValueError:
      return []
    url = f"https://{tenant}.{wdn}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"
    referer = f"https://{tenant}.{wdn}.myworkdayjobs.com/en-US/{site}"
    # Workday caps limit at 20 — page through with offset until exhausted.
    all_postings = []
    offset = 0
    while True:
      body = json.dumps({"appliedFacets":{},"limit":20,"offset":offset,"searchText":""})
      d = curl_json(url, method="POST", body=body, referer=referer)
      if not d or not isinstance(d, dict): break
      page = d.get("jobPostings", []) or []
      all_postings.extend(page)
      total = d.get("total") or 0
      offset += 20
      if offset >= total or not page: break
      if offset > 500: break  # safety
    return all_postings
  return []


# ── Filtering ────────────────────────────────────────────────────────────
def level(title):
  low = title.lower()
  if "founding" in low: return "founding"
  if "senior" in low or "sr." in low or "sr " in low: return "senior"
  return "mid"

def filter_jobs(ats, raw, slug=""):
  out = []
  for j in raw:
    if ats == "ashby":
      if j.get("isListed", True) is False: continue
      title = (j.get("title") or "").strip()
      primary = j.get("location","") or ""
      secs = [s.get("location","") for s in (j.get("secondaryLocations") or [])]
      is_nyc = bool(NYC.search(primary)) or any(NYC.search(s) for s in secs)
      url = j.get("jobUrl") or j.get("applyUrl")
    elif ats == "greenhouse":
      title = (j.get("title") or "").strip()
      loc = (j.get("location") or {}).get("name","") or ""
      is_nyc = bool(NYC.search(loc))
      url = j.get("absolute_url")
    elif ats == "lever":
      title = (j.get("text") or "").strip()
      cat = j.get("categories") or {}
      loc = cat.get("location","") or ""
      all_locs = cat.get("allLocations") or []
      blob = loc + " " + " ".join(all_locs if isinstance(all_locs, list) else [])
      is_nyc = bool(NYC.search(blob))
      url = j.get("hostedUrl") or j.get("applyUrl")
    elif ats == "workable":
      # Workable: state=published only, location is a nested object with
      # city/region/country plus a `locations` array for multi-location roles.
      if j.get("state") and j.get("state") != "published": continue
      title = (j.get("title") or "").strip()
      primary = j.get("location") or {}
      city = (primary.get("city") or "") + " " + (primary.get("region") or "")
      others = j.get("locations") or []
      blob = city + " " + " ".join(((l.get("city") or "") + " " + (l.get("region") or "")) for l in others if isinstance(l, dict))
      is_nyc = bool(NYC.search(blob))
      url = f"https://apply.workable.com/{slug}/j/{j.get('shortcode','')}"
    elif ats == "workday":
      # Workday: locationsText is a free-form string (e.g. "NY - New York"
      # or "MI - Detroit"). externalPath is relative — prefix with the
      # tenant URL we know from slug.
      title = (j.get("title") or "").strip()
      loc = j.get("locationsText") or ""
      is_nyc = bool(NYC.search(loc))
      try:
        tenant, wdn, site = slug.split("/", 2)
        url = f"https://{tenant}.{wdn}.myworkdayjobs.com/en-US/{site}{j.get('externalPath','')}"
      except ValueError:
        url = ""
    else:
      continue
    if not is_nyc: continue
    if not title or TITLE_EXCLUDE.search(title): continue
    if not TITLE_INCLUDE.search(title): continue
    out.append({"title": title, "url": url, "level": level(title)})
  # founding > senior > mid
  out.sort(key=lambda j: (
    0 if "founding" in j["title"].lower() else 1,
    0 if "senior" in j["title"].lower() else 1,
  ))
  return out


# ── Codegen: emit COMPANIES block ────────────────────────────────────────
def emit_companies_block(rows, today):
  lines = [
    "/* ---------- COMPANIES ----------",
    " * NYC-hiring board: companies with $5M+ disclosed VC/accelerator funding",
    " * that have at least one ACTIVE engineering posting located in New York",
    " * (HQ doesn't have to be NYC — only the posting). Verified " + today,
    " * against each company's live Ashby / Greenhouse public ATS JSON.",
    " * URLs link directly to the posting (not aggregators).",
    " *",
    " * To refresh: run `python3 scripts/refresh-companies.py` from the repo",
    " * root. The script re-probes every candidate ATS, filters for live NYC",
    " * engineering postings, and rewrites this block in place.",
    " *",
    " * Schema: { id, name, vertical, sub, stage, raised, lead, badges[],",
    " *           totalRoles, notes, jobs[{ title, url, level }] }",
    " *  - totalRoles == jobs.length (full set; the card slices to 3 for preview).",
    " *  - jobs are sorted: founding > senior > mid.",
    " */",
    f"const COMPANIES_VERIFIED_AT = '{today}';",
    "const COMPANIES = [",
  ]
  for c in rows:
    jobs_inner = ",\n      ".join(
      "{ title:" + json.dumps(j["title"]) + ", url:" + json.dumps(j["url"]) +
      ", level:" + json.dumps(j["level"]) + " }"
      for j in c["jobs"]
    )
    badges_inner = ", ".join(json.dumps(b) for b in c["badges"])
    lines.append("  { id:" + json.dumps(c["id"]) +
                 ", name:" + json.dumps(c["name"]) +
                 ", vertical:" + json.dumps(c["vertical"]) + ",")
    lines.append("    sub:" + json.dumps(c["sub"]) + ",")
    lines.append("    stage:" + json.dumps(c["stage"]) +
                 ", raised:" + json.dumps(c["raised"]) +
                 ", lead:" + json.dumps(c["lead"]) + ",")
    lines.append("    badges:[" + badges_inner + "],")
    lines.append(f"    totalRoles:{c['totalRoles']},")
    lines.append("    notes:" + json.dumps(c["notes"]) + ",")
    lines.append("    jobs:[")
    lines.append("      " + jobs_inner)
    lines.append("    ] },")
  lines.append("];")
  return "\n".join(lines) + "\n"


def emit_domains_block(ids_present):
  rows, buf = [], []
  for cid, dom in DOMAINS.items():
    if cid not in ids_present: continue
    key = repr(cid) if "-" in cid else cid
    buf.append(f"{key}:{repr(dom)}")
    if len(buf) == 3:
      rows.append(", ".join(buf) + ",")
      buf = []
  if buf:
    rows.append(", ".join(buf) + ",")
  return (
    "/* ---------- COMPANY DOMAINS (for Clearbit public logo CDN) ---------- */\n"
    "const COMPANY_DOMAINS = {\n  " + "\n  ".join(rows) + "\n};"
  )


def splice(src, marker_start_substr, block, end_marker="\n];\n"):
  s = src.index(marker_start_substr)
  e = src.index(end_marker, s) + len(end_marker)
  return src[:s] + block + "\n" + src[e:]


# ── Entrypoint ───────────────────────────────────────────────────────────
def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("-v","--verbose", action="store_true", help="Print no-match diagnostics")
  args = ap.parse_args()

  today = datetime.date.today().isoformat()
  rows = []
  seen = set()
  no_match = []
  for cid, name, ats, slug, vertical, sub, stage, raised, lead, badges, notes in CANDIDATES:
    if cid in seen:
      if args.verbose: print(f"[dup] {cid}", file=sys.stderr)
      continue
    seen.add(cid)
    raw = fetch(ats, slug)
    matches = filter_jobs(ats, raw, slug)
    if not matches:
      no_match.append(f"{name} ({ats}:{slug})")
      if args.verbose: print(f"[no-match] {name} ({ats}:{slug})", file=sys.stderr)
      continue
    rows.append({
      "id": cid, "name": name, "vertical": vertical, "sub": sub,
      "stage": stage, "raised": raised, "lead": lead, "badges": badges,
      "totalRoles": len(matches), "notes": notes, "jobs": matches,
    })
    print(f"[ok] {name:26s} {len(matches):3d} role(s)", file=sys.stderr)

  print(f"\n{len(rows)} companies survived (of {len(CANDIDATES)} candidates)", file=sys.stderr)
  if no_match:
    print(f"{len(no_match)} dropped:", *no_match, sep="\n  ", file=sys.stderr)

  # Rewrite js/data.js in place
  src = DATA_JS.read_text()
  src = splice(src, "/* ---------- COMPANIES ----------", emit_companies_block(rows, today))
  ids_present = {r["id"] for r in rows}
  domains_block = emit_domains_block(ids_present)
  # Replace the COMPANY_DOMAINS block (uses its own regex marker since the
  # COMPANIES splice above may have shifted positions).
  pat = re.compile(r"/\* ---------- COMPANY DOMAINS.*?\nconst COMPANY_DOMAINS = \{[^}]*\};", re.DOTALL)
  src, n = pat.subn(domains_block, src, count=1)
  assert n == 1, "Could not locate COMPANY_DOMAINS block to replace"
  DATA_JS.write_text(src)
  print(f"\nRewrote {DATA_JS.relative_to(REPO_ROOT)} — verified {today}", file=sys.stderr)
  print(f"Total live URLs: {sum(len(r['jobs']) for r in rows)}", file=sys.stderr)


if __name__ == "__main__":
  main()
