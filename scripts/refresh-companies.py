#!/usr/bin/env python3
"""
refresh-companies.py — re-verify every live NYC engineering posting and
rewrite the COMPANIES block in js/data.js in place.

What it does
------------
For every candidate company in CANDIDATES below, hits the company's
public ATS JSON (Ashby / Greenhouse / Lever / Workable / Workday /
Teamtailor / SmartRecruiters) via curl, filters jobs by:

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
  r"platform[\s-]engineer|data[\s-]engineer|systems[\s-]engineer|"
  # DevOps / SRE / Cloud / Security / Reliability — infra-adjacent IC roles.
  r"devops[\s-]engineer|site[\s-]reliability[\s-]engineer|sre(?:\s|$)|"
  r"cloud[\s-]engineer|security[\s-]engineer|reliability[\s-]engineer|"
  # AI/ML variants — slash-separated (AI/ML), GenAI, LLM, Agent, Research,
  # MLOps. "Research Engineer" is the elite-AI-lab pattern (Anthropic,
  # OpenAI, DeepMind); TITLE_EXCLUDE's "researcher" doesn't catch it.
  r"ai[/]ml[\s-]engineer|ml[/]ai[\s-]engineer|"
  r"genai[\s-]engineer|llm[\s-]engineer|agent[\s-]engineer|"
  r"agentic[\s-]engineer|mlops[\s-]engineer|research[\s-]engineer|"
  # Solutions / Sales / Presales Engineer — customer-facing eng roles.
  # Removed from TITLE_EXCLUDE and explicitly allowed here.
  r"solutions?[\s-]engineer|sales[\s-]engineer|presales[\s-]engineer|"
  # Agency title variants — reverse-order (Engineer, Front-end) and
  # parenthetical (Engineer (Front-end)) forms common at Code and Theory /
  # DEPT / Instrument / etc.
  r"engineer,\s*(?:front|back|full[\s-]?stack|frontend|backend|fullstack|"
  r"devops|sre|site\s+reliability|cloud|security|reliability|"
  r"ai|ml|ai[/]ml|ml[/]ai|genai|llm|agent|agentic|mlops|applied[\s-]ai|research|"
  r"solutions?|sales|presales)|"
  r"engineer\s*\((?:front|back|full[\s-]?stack|frontend|backend|fullstack|"
  r"devops|sre|site\s+reliability|cloud|security|reliability|"
  r"ai|ml|ai[/]ml|ml[/]ai|genai|llm|agent|agentic|mlops|applied[\s-]ai|research|"
  r"solutions?|sales|presales)|"
  # "Developer" role names — DEPT uses these for mobile + software roles
  # ("Android Developer", "iOS Developer", "Software Developer").
  r"software[\s-]developer|"
  r"(?:android|ios|mobile|web|full[\s-]?stack|frontend|backend)[\s-]developer"
  r")\b", re.IGNORECASE)
# Dual-tagged seniority ("Senior/Staff Backend Engineer") = still senior IC.
# When the title contains "senior" we mask out staff/principal tokens BEFORE
# running TITLE_EXCLUDE so those titles survive; the rest of the exclusions
# (manager, sales/solutions/customer eng, etc.) still apply.
SENIORITY_MARK = re.compile(r'\bsenior\b|\bsr[.\s]', re.I)
STAFF_PRINCIPAL = re.compile(r'\b(staff|principal)\b', re.I)
TITLE_EXCLUDE = re.compile(
  r"\b("
  r"staff[\s,]|principal|^lead\s|\slead\s|\slead$|head\s|chief|director|"
  r"manager|engineering\s+manager|technical\s+program|vp\s|vice\s+president|"
  r"intern|internship|research\s+scientist|researcher|"
  # Kept excluded: customer / field engineer. Solutions + Sales Engineer
  # were previously here but are now explicitly allowed (see TITLE_INCLUDE).
  r"customer\s+engineer|field\s+engineer|"
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
  ("hebbia","Hebbia","ashby","hebbia-ai","ai","AI for asset managers + finance","Series B","$161M","Andreessen Horowitz",["a16z","Index","Peter Thiel"],"Multi-step agents over long-form finance docs. Eval discipline, retrieval depth."),
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
  ("headway","Headway","ashby","headway","health","In-network mental health","Series D","$325M","Spark",["Spark","a16z","GV"],"Therapist network + billing. Healthcare insurance plumbing."),
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
  ("pinecone","Pinecone","ashby","pinecone","ai","Vector database for AI","Series B","$138M","Andreessen Horowitz",["a16z","Menlo","Wing"],"Production vector DB. Distributed indexing, latency, retrieval quality at scale."),
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

  # ── 2026-06-16 — new NYC candidates (probed live; only those with live NYC SWE) ──
  ("via","Via","greenhouse","via","saas","Transit tech + mobility platform","Series G","$988M","83North",["83North","Exor","Pitango"],"NYC mobility. Transit routing + optimization; logistics + ML systems."),
  ("aura-frames","Aura Frames","greenhouse","aura","consumer","Connected digital photo frames","Series C","$60M+","Trustbridge",["Trustbridge","Forerunner"],"NYC consumer hardware. Device platform + infra + product eng for connected frames."),
  ("rho","Rho","ashby","rho","fintech","Business banking + spend mgmt","Series B","$200M","Dragoneer",["Dragoneer","DFJ Growth"],"NYC fintech. Corporate cards + treasury; payments systems."),
  ("hex","Hex","greenhouse","hextechnologies","saas","Collaborative analytics + AI notebooks","Series B","$96M","Andreessen Horowitz",["a16z","Sequoia","Amplify"],"Data workspace + AI agents; query engines + collab. NYC eng roles."),
  ("brigit","Brigit","ashby","brigit","fintech","Consumer financial health app","Series A","$53M","Lightspeed",["Lightspeed","DCM","NYCA"],"NYC fintech. Cash advances + budgeting; banking integrations + ML underwriting."),
  ("zocdoc","Zocdoc","greenhouse","zocdoc","health","Doctor booking marketplace","Series D","$375M","Francisco Partners",["Francisco Partners","Baillie Gifford"],"NYC healthtech. Provider search + scheduling marketplace; high-traffic systems."),
  ("clear","CLEAR","greenhouse","clear","security","Identity verification (NYSE: YOU)","Public","$700M+","NYSE",["NYSE","T. Rowe Price"],"NYC identity platform. Biometric verification at airports + healthcare; backend + data eng."),
  ("drw","DRW","greenhouse","drweng","fintech","Principal trading firm","Private","Self-funded","—",["Privately held"],"NYC/Chicago quant trading. Low-latency systems, market data, analytics — C++/Python heavy."),
  ("imc","IMC Trading","greenhouse","imc","fintech","Global market maker","Private","Self-funded","—",["Privately held"],"NYC market-making. Ultra-low-latency C++/FPGA, ML for trading; deep systems work."),
  ("flow-traders","Flow Traders","greenhouse","flowtraders","fintech","ETF + crypto market maker","Public","Self-funded","Euronext",["Euronext"],"NYC trading. ETP market-making; trading systems + low-latency infra."),
  ("old-mission","Old Mission","greenhouse","oldmissioncapital","fintech","Proprietary trading firm","Private","Self-funded","—",["Privately held"],"NYC/Chicago prop trading. C++/Python trading systems + market data infra."),

  # ── 2026-06-30 — hospitality / media / consumer expansion (probed via parallel agents) ──
  ("sonder","Sonder","workday","sonder/wd1/Join_Sonder","hospitality","Tech-enabled hotels + short-stay (NASDAQ: SOND)","Public","$425M+ pre-IPO","Greenoaks",["NASDAQ","Greenoaks","Founders Fund"],"Tech-enabled hotel + short-stay operator. Inventory mgmt + booking + ops automation."),
  ("higgsfield","Higgsfield AI","ashby","higgsfieldai","ai","Generative AI video for creators","Series A","$15M+","Menlo",["Menlo","AI Grant"],"Gen video studio. Multimodal models, GPU pipelines, mobile-first UX."),
  ("kasa","Kasa (incl. Mint House)","greenhouse","kasa","hospitality","Apartment-hotel operator (acq. Mint House 2024)","Series C","$190M+","Ribbit",["Ribbit","Citi Ventures"],"Tech-enabled apartment-hotel operator. Inventory + ops + booking systems."),
  ("unitedmasters","UnitedMasters","greenhouse","unitedmasterstranslation","media","Music distribution + artist services","Series B","$70M+","Andreessen Horowitz",["a16z","Alphabet"],"NYC independent-artist distribution + label services. Music data, payments, integrations."),
  ("vsco","VSCO","greenhouse","vsco39","consumer","Mobile photo editing + community","Series C","$90M","Goldcrest",["Goldcrest","Accel"],"Oakland-based mobile photo editor. Image ML, iOS/Android."),
  ("soundcloud","SoundCloud","greenhouse","soundcloud71","media","Audio streaming + creator platform","Late stage","$655M+","Sirius XM",["Sirius XM","Atlantic"],"Audio + creator platform. Streaming infra, recs, monetization."),
  ("bdg","Bustle Digital Group","lever","BDG","media","Digital media (Bustle, Mic, Inverse, NYLON)","Late stage","$70M+","GGV",["GGV","BlackRock"],"NYC women's-focused digital media network. CMS + ad tech + commerce."),
  ("resy","Resy","workable","resy-1","hospitality","Dining reservations (Amex-owned)","Acquired","$32M pre-acq.","American Express",["American Express","First Round"],"NYC dining reservations platform. Real-time booking, table mgmt, marketplace."),
  ("defector","Defector Media","workable","defector-media","media","Worker-owned sports + culture","Bootstrapped","—","—",["Worker-owned"],"NYC subscription sports/news collective (ex-Deadspin staff). Editorial + CMS + subscriptions."),
  ("recess","Recess","lever","recess","consumer","Functional drinks (CBD + magnesium)","Series B","$25M+","RiverPark",["RiverPark"],"NYC functional drinks brand. DTC + retail; lean eng for site/operations."),
  ("liquid-death","Liquid Death","greenhouse","liquiddeath","consumer","Canned water + iced tea CPG","Series D","$267M","Live Nation",["Live Nation","Science Inc"],"LA CPG with cult brand. Lean eng team for e-commerce + brand campaigns."),

  # ── 2026-06-22 — 30 new NYC-leaning startups (probed live; non-matches drop silently) ──
  # Fintech (NYC-strong)
  ("lemonade","Lemonade","ashby","lemonade","fintech","AI-driven insurance (NYSE: LMND)","Public","$480M pre-IPO","SoftBank",["NYSE","SoftBank","Sequoia"],"NYC insurtech. Public co; ML underwriting + customer claims AI."),
  ("capchase","Capchase","ashby","capchase","fintech","Revenue-based financing for SaaS","Series B","$280M","QED",["QED","SciFi","Bling"],"NYC RBF for SaaS founders. Underwriting models + capital-markets plumbing."),
  ("knotapi","Knot","ashby","knot","fintech","Card-on-file switching API","Series B","$25M","Lightspeed",["Lightspeed","Nyca"],"NYC fintech infra — programmatic card management across merchants. APIs + integrations."),
  ("orum","Orum","ashby","orum","fintech","Real-time bank payments API","Series B","$56M","Accel",["Accel","Bain Capital Ventures"],"NYC payments infra — RTP, FedNow, ACH. Money movement + reliability."),
  ("daloopa","Daloopa","ashby","daloopa","ai","AI-extracted financial data","Series B","$23M","Credit Suisse AM",["Credit Suisse","Nyca","Hack VC"],"NYC AI for buy-side financial modeling. Document parsing + ranking."),

  # Health (NYC-strong)
  ("cedar","Cedar","ashby","cedar","health","Healthcare patient billing platform","Series D","$425M","Andreessen Horowitz",["a16z","Tiger","Thrive"],"NYC healthcare payments. Patient-facing UX + payer integrations."),
  ("spring-health","Spring Health","ashby","springhealth","health","Mental health benefits platform","Series E","$472M","Kinnevik",["Kinnevik","General Catalyst","RRE"],"NYC mental health network for employers. Provider matching + outcomes data."),
  ("kindbody","Kindbody","greenhouse","kindbody","health","Fertility + women's health network","Series D","$305M","Perceptive Advisors",["Perceptive","RRE","Claritas"],"NYC fertility care. Clinical + tech platform across owned clinics."),
  ("talkiatry","Talkiatry","ashby","talkiatry","health","In-network psychiatric care","Series C","$130M","Andreessen Horowitz",["a16z","Perceptive"],"NYC psychiatry. Insurance + telehealth + EHR integrations."),
  ("octave","Octave","greenhouse","octave","health","Hybrid mental health care","Series B","$80M","Norwest",["Norwest","Greycroft"],"NYC mental health network. In-person + telehealth."),
  ("particle-health","Particle Health","greenhouse","particlehealth","health","Healthcare data API","Series B","$28M","Menlo",["Menlo","Story","Collaborative"],"NYC healthcare interop API. Records exchange + payer-provider data."),

  # AI / devtools / data (NYC + remote-NYC eng)
  ("vellum","Vellum","ashby","vellum","ai","LLM development + eval platform","Series A","$25M","Rebel",["Rebel","YC W23"],"LLM observability + prompt mgmt + evals. NYC + remote eng."),
  ("braintrust","Braintrust","ashby","braintrust","ai","LLM eval + observability platform","Series A","$36M","Andreessen Horowitz",["a16z","Greylock"],"LLM evals + experimentation infra. Strong applied-AI eng culture."),
  ("anyword","Anyword","greenhouse","anyword","ai","AI copywriting for marketing","Series B","$30M","Innovation Endeavors",["Innovation Endeavors","Lead Edge"],"NYC AI copy generation for marketing teams."),
  ("verbit","Verbit","greenhouse","verbit","ai","AI transcription + captioning","Series E","$550M","Sapphire",["Sapphire","Vertex","Stripes"],"NYC ASR + captioning at scale. Hybrid AI + human review."),
  ("materialize","Materialize","ashby","materialize","devtools","Streaming SQL database","Series C","$135M","Kleiner",["Kleiner","Redpoint","Lightspeed"],"NYC streaming SQL DB. Real-time analytics, dataflow internals."),
  ("bigid","BigID","greenhouse","bigid","security","Data security + privacy compliance","Series E","$317M","Riverwood",["Riverwood","Bessemer","Tiger"],"NYC data discovery + privacy compliance for enterprise."),
  ("linear","Linear","ashby","linear","saas","Project mgmt for SWE teams","Series B","$87M","Sequoia",["Sequoia","Index","Accel"],"Issue tracker for software teams. Real-time CRDT collab + product depth."),
  ("dbt-labs","dbt Labs","greenhouse","dbtlabs","devtools","Data transformation framework","Series D","$415M","Altimeter",["Altimeter","Sequoia","a16z"],"Data transformation OSS + dbt Cloud. Strong data + DX eng."),
  ("honeycomb","Honeycomb","greenhouse","honeycomb","devtools","Observability for production","Series D","$95M","Insight",["Insight","Storm","Scale Venture"],"Distributed tracing + obs. Columnar query engine internals."),
  ("launchdarkly","LaunchDarkly","greenhouse","launchdarkly","devtools","Feature flag management","Late stage","$330M","Bessemer",["Bessemer","a16z","Vertex"],"Feature mgmt at scale. Real-time config delivery + SDKs."),
  ("sentry","Sentry","ashby","sentry","devtools","Error monitoring + perf","Series E","$217M","Accel",["Accel","NEA","BOND"],"Error tracking + perf monitoring at scale. SF + NYC + remote eng."),
  ("sourcegraph","Sourcegraph","greenhouse","sourcegraph","devtools","Code search + Cody AI","Series D","$232M","Andreessen Horowitz",["a16z","Sequoia","Redpoint"],"Code search + AI code assistant. Compiler + indexer + LLM infra."),
  ("snyk","Snyk","greenhouse","snyk","security","Developer-first app sec","Series G","$1.3B","Tiger",["Tiger","Boldstart","Coatue"],"App-sec + supply chain. NYC + Boston + remote eng."),
  ("hightouch","Hightouch","ashby","hightouch","devtools","Reverse-ETL + composable CDP","Series C","$93M","Sapphire",["Sapphire","ICONIQ","Y Combinator"],"Reverse-ETL — sync warehouse data to SaaS. Strong analytics-eng DX."),
  ("census","Census","greenhouse","census","devtools","Data activation / reverse ETL","Series B","$80M","Sequoia",["Sequoia","Insight","a16z"],"Reverse-ETL platform — warehouse → ops tools."),

  # Media / consumer / SaaS (NYC HQ)
  ("vimeo","Vimeo","greenhouse","vimeo","media","Video platform (NASDAQ: VMEO)","Public","$2.6B revenue","NASDAQ",["NASDAQ"],"NYC video platform — creator hosting + enterprise video. Public co."),
  ("voxmedia","Vox Media","greenhouse","voxmedia","media","Digital media network","Late stage","$590M+","NBCUniversal",["NBCU","Comcast","General Atlantic"],"NYC media (Vox, The Verge, NY Mag, Eater). CMS + ad tech."),
  ("foursquare","Foursquare","ashby","foursquare","saas","Location intelligence platform","Late stage","$390M","Andreessen Horowitz",["a16z","Spark"],"NYC location data + dev platform. Geospatial + APIs."),
  ("wonder","Wonder","greenhouse","wonder","consumer","Premium food delivery + meal kits","Series C","$1.4B","NEA",["NEA","Bain Capital Ventures","GV"],"NYC food delivery + ghost-kitchen platform. Marc Lore's co."),
  ("nayya","Nayya","greenhouse","nayya","fintech","Employee benefits decisioning","Series C","$100M","ICONIQ",["ICONIQ","Felicis"],"NYC benefits AI for employers. Decision-support + claims integration."),
  ("glia","Glia","ashby","glia","saas","Digital customer service platform","Series E","$155M","Insight",["Insight","Wildcat"],"NYC digital + voice customer service. Co-browsing + AI agents."),

  # ── 2026-07-21 — food & beverage / hospitality expansion (probed via parallel agents) ──
  ("slice","Slice","greenhouse","slice","hospitality","Software + marketplace for indie pizzerias","Series G","$250M+","Union Square Ventures",["USV","GGV","KKR"],"NYC-HQ platform powering 20K+ independent pizzerias — ordering, marketing, payments."),
  ("owner-com","Owner.com","ashby","owner","hospitality","All-in-one indie restaurant marketing + ordering","Series B","$60M+","Redpoint",["Redpoint","SaaStr Fund"],"Adam Guild's all-in-one indie restaurant marketing + ordering platform. Hot on X."),
  ("blackbird","Blackbird Labs","ashby","blackbird-labs-inc","hospitality","Restaurant loyalty + payments (Ben Leventhal)","Series B","$50M+","Andreessen Horowitz",["a16z","Union Square Ventures"],"Resy founder Ben Leventhal's next act — loyalty + payments network for restaurants (NYC dining darling)."),
  ("sauce","Sauce","lever","Sauce","hospitality","Commission-free restaurant ordering + delivery","Series A","$30M","Bessemer",["Bessemer"],"NYC-native anti-DoorDash — direct online ordering + delivery for restaurants."),
  ("restaurant365","Restaurant365","lever","restaurant365","hospitality","Restaurant accounting + ops","Late stage","$400M+","KKR",["KKR","ICONIQ","Serent"],"Category-leading restaurant back-office platform ($1B+ val) — accounting, inventory, scheduling."),
  ("chowbus","Chowbus","greenhouse","chowbus","hospitality","POS + delivery for Asian restaurants","Series B","$120M+","Left Lane",["Left Lane","Altos"],"POS + delivery for Asian restaurants (huge in NYC's Flushing + Manhattan Chinatown)."),
  ("choco","Choco","ashby","choco","hospitality","B2B ordering between restaurants + suppliers","Series B+","$328M","Bessemer",["Bessemer","Insight","Coatue"],"Berlin HQ w/ NYC office. Unicorn WhatsApp-style ordering app between restaurants and suppliers."),
  ("crunchtime","Crunchtime (Zenput)","greenhouse","zenput","hospitality","Enterprise restaurant ops (multi-unit chains)","Late stage","$100M+","Battery",["Battery","Vista"],"Category leader for multi-unit restaurant operations (acquired Zenput, uses that ATS)."),
  ("popmenu","Popmenu","workable","popmenu","hospitality","Restaurant AI menu + marketing SaaS","Series C","$88M","Tiger",["Tiger","Bedrock"],"Restaurant marketing + AI menu SaaS — Atlanta HQ, real NYC eng presence."),
  ("slangai","Slang.ai","lever","slangai","ai","Voice AI for restaurant phone lines","Series B","$36M","USVP",["USVP","Homebrew"],"NYC-HQ voice AI answering restaurant calls — 2K+ restaurants, 20M+ calls handled."),
  ("blank-street","Blank Street Coffee","greenhouse","blankstreet","hospitality","Tech-forward micro-cafe chain","Series C","$100M+","General Catalyst",["General Catalyst","Tiger","Left Lane"],"NYC-native tech-forward coffee chain — mobile app, loyalty, hundreds of stores."),
  ("olipop","OLIPOP","greenhouse","olipop","cpg","Prebiotic soda category leader","Series C","$137M+","JP Morgan",["JP Morgan","Monogram","Melo7"],"Category-defining prebiotic soda ($1.85B val). Oakland HQ, NYC-strong ops + brand."),
  ("magic-spoon","Magic Spoon","workable","magicspoon","cpg","Low-carb high-protein DTC cereal","Series B","$85M+","Constellation",["Constellation","Lightspeed","Coatue"],"Cult NYC DTC cereal brand, now in national retail. Founders Gabi Lewis + Greg Sewitz."),
  ("ag1","AG1 (Athletic Greens)","greenhouse","ag1","consumer","Foundational-nutrition powder subscription","Late stage","$115M","Alpha Wave Global",["Alpha Wave"],"Category-defining green-powder subscription (~$1.2B val). Big NYC office; supply-chain + product eng."),
  ("hungryroot","Hungryroot","greenhouse","hungryroot","consumer","AI-personalized grocery + meal delivery","Late stage","$70M+","L Catterton",["L Catterton","Lightspeed"],"NYC-HQ profitable meal-kit + grocery hybrid personalized by AI recs."),
  ("misfits-market","Misfits Market","greenhouse","misfitsmarket","marketplace","Ugly-produce grocery + Imperfect Foods","Late stage","$525M+","SoftBank",["SoftBank","D1","Valor"],"NJ/NYC online grocery — merged with Imperfect Foods; large eng org, logistics-heavy."),
  ("tovala","Tovala","lever","tovala","consumer","Smart-oven + meal delivery","Series C","$100M+","Left Lane",["Left Lane","OurCrowd"],"Connected smart-oven + subscription meal service. Hardware + software + food-ops."),
  ("farmers-dog","The Farmer's Dog","greenhouse","thefarmersdog","consumer","Fresh human-grade dog food subscription","Series D","$150M+","L Catterton",["L Catterton","Shasta"],"NYC-HQ fresh pet-food juggernaut (~$2B val). Huge eng org — logistics, cold-chain, subscriptions."),
  ("foodsmart","Foodsmart","lever","foodsmart","health","Food-as-medicine platform","Series C","$63M+","Cigna Ventures",["Cigna Ventures","Bessemer"],"Food-as-medicine platform for health plans/employers. NYC office; nutrition + telehealth ops."),

  # ── 2026-07-21 — 100-company expansion (probed via 4 parallel research agents) ──
  # AI / applied AI (Ashby)
  ("mintlify","Mintlify","ashby","mintlify","ai","AI-native developer documentation","Series A","$18.5M","Bain Capital",["Bain Capital","BoxGroup"],"NYC + SF. Powers docs for OpenAI, Anthropic, Cursor. Dev-tools darling."),
  ("graphite","Graphite","ashby","graphite","ai","AI code review + stacked PRs","Series B","$52M","Accel",["Accel","Founders Fund"],"NYC + SF. Ex-Airbnb team. Diamond AI reviewer."),
  ("synthesia","Synthesia","ashby","synthesia","ai","Generative AI video / avatars","Series D","$180M","NEA",["NEA","Accel","Kleiner"],"NYC office (London HQ). Leading enterprise AI video, $2.1B val."),
  ("sweep","Sweep","ashby","sweep","ai","AI CRM + GTM data automation","Series A","$28M","Insight",["Insight","Bessemer"],"NYC + TLV. Salesforce-native agentic workflows."),
  ("gamma","Gamma","ashby","gamma","ai","AI presentation + design agent","Series B","$50M+","Accel",["Accel"],"NYC + SF. 60M+ users, fastest-growing AI prosumer app."),
  ("pylon","Pylon","ashby","pylon","ai","AI-powered B2B customer support","Series A","$17M","Andreessen Horowitz",["a16z","YC"],"NYC + Palo Alto. Zendesk-for-B2B with AI copilots."),
  ("vapi","Vapi","ashby","vapi","ai","Voice AI infra / dev platform","Series A","$20M","Bessemer",["Bessemer","YC"],"NYC + SF. Fastest-growing voice-agent API layer."),
  ("orbital","Orbital","ashby","orbital","ai","AI for legal real-estate / title","Series B","$27M","Spark",["Spark","NfX"],"NYC + London. Vertical legal AI with big-law traction."),
  ("browserbase","Browserbase","ashby","browserbase","ai","Headless browser infra for AI agents","Series A","$27M","Kleiner",["Kleiner","CRV"],"NYC + SF. Stagehand SDK, key primitive for agentic web."),
  ("midpage","Midpage","ashby","midpage","ai","AI legal research assistant","Seed","$6M","BoxGroup",["BoxGroup"],"NYC HQ. Lawyer-founded, buzzed legal AI."),
  ("semgrep","Semgrep","ashby","semgrep","security","AI + static analysis code security","Series D","$100M","Redpoint",["Redpoint","Sequoia"],"NYC office (also SF/Boston/Denver). AppSec leader, AI-assisted vuln triage."),
  ("attio","Attio","ashby","attio","saas","AI-native CRM","Series B","$33M","Redpoint",["Redpoint","Balderton"],"NYC office (also London). Modern relationship-graph CRM."),
  ("reducto","Reducto","ashby","reducto","ai","Document ingestion / parsing for LLMs","Seed","$8.4M","First Round",["First Round","Benchmark"],"NYC + SF. Powers RAG pipelines at top AI cos."),
  ("parallel","Parallel","ashby","parallel","ai","Web-scale agentic search API for LLMs","Series A","$30M","Spark",["Spark","First Round"],"NYC + SF. Ex-Twitter/OpenAI research team."),
  ("dataiku","Dataiku","greenhouse","dataiku","ai","Enterprise AI/ML platform","Late stage","$846M+","Wellington",["Wellington","Snowflake"],"NYC HQ, $3.7B val. Mature enterprise AI, strong SWE hiring."),

  # Fintech / crypto / insurance (Ashby + Greenhouse)
  ("socure","Socure","ashby","socure","fintech","Identity verification / KYC","Series E","$744M","Accel",["Accel","T. Rowe Price","Commerce Ventures"],"NYC HQ, $4.5B val. ML fraud detection, security-adjacent."),
  ("paxos","Paxos","ashby","paxos","fintech","Regulated crypto / stablecoin infra","Series D","$540M","OakHC/FT",["OakHC/FT","Declaration","Founders Fund"],"NYC HQ. Issues PYUSD for PayPal."),
  ("trm-labs","TRM Labs","ashby","trm-labs","security","Blockchain intelligence + compliance","Series B","$130M","Thoma Bravo",["Thoma Bravo","Tiger","Bessemer"],"NYC office. Chainalysis alternative for law enforcement + banks."),
  ("meow","Meow","ashby","meow","fintech","SMB treasury + business banking","Series A","$27M","Tiger",["Tiger","a16z"],"NYC HQ. T-bill yield for startups."),
  ("uniswap","Uniswap Labs","ashby","uniswap","fintech","DeFi + crypto exchange infra","Series B","$165M","Polychain",["Polychain","a16z"],"NYC HQ. Largest DEX protocol."),
  ("ledger","Ledger","ashby","ledger","fintech","Crypto custody + hardware","Series C","$380M+","10T Holdings",["10T Holdings"],"NYC US office. Hardware wallet + institutional custody."),
  ("notabene","Notabene","ashby","notabene","fintech","Crypto Travel Rule + compliance","Series A","$18M","Y Combinator",["YC","Jump Capital"],"NYC HQ. Crypto RegTech."),
  ("elliptic","Elliptic","ashby","elliptic","security","Blockchain analytics + AML","Series C","$60M","Evolution",["Evolution","SoftBank"],"NYC office. Crypto compliance."),
  ("dailypay","DailyPay","ashby","dailypay","fintech","Earned wage access","Late stage","$500M+","Carrick",["Carrick","Rockefeller"],"NYC HQ. Payroll infra at scale."),
  ("numeral","Numeral","ashby","numeral","fintech","Sales tax compliance automation","Series A","$28M","Benchmark",["Benchmark"],"NYC hybrid. Tax RegTech, engineer-first."),
  ("imprint","Imprint","ashby","imprint","fintech","Co-branded credit cards","Series C","$95M","Kleiner Perkins",["Kleiner","Thrive"],"NYC HQ. Modern card issuing + rewards."),
  ("tomo","Tomo","ashby","tomo","fintech","Mortgage origination tech","Series B","$70M+","Ribbit",["Ribbit","DST"],"NYC HQ. Mortgage stack rebuild."),
  ("vestwell","Vestwell","greenhouse","vestwell","fintech","Retirement / 401k infra","Series D","$227M","Wellington",["Wellington","Fin Capital"],"NYC HQ. White-label recordkeeping API."),
  ("capitolis","Capitolis","greenhouse","capitolis","fintech","Capital-markets optimization","Series D","$290M","SVB",["SVB","Sequoia","a16z"],"NYC HQ. Novation + compression for banks."),
  ("ondofinance","Ondo Finance","greenhouse","ondofinance","fintech","Tokenized RWA / DeFi infra","Series A","$34M","Founders Fund",["Founders Fund","Pantera"],"NYC HQ. Tokenized US Treasuries."),
  ("databento","Databento","greenhouse","databento","fintech","Market data infra for quants","Series A","$34M","Point72 Ventures",["Point72","USV"],"NYC office. Low-latency financial data APIs."),
  ("unqork","Unqork","greenhouse","unqork","saas","No-code for insurance + banking enterprises","Series C","$365M","Vista",["Vista","BlackRock"],"NYC HQ. Enterprise fintech platform."),
  ("ripple","Ripple","greenhouse","ripple","fintech","Crypto payments + cross-border","Late stage","$15B val","Andreessen Horowitz",["a16z","Founders Fund"],"NYC office. RippleNet + XRP infra."),
  ("symphony","Symphony","greenhouse","symphony","fintech","Trader collaboration + messaging","Late stage","$500M+","Goldman Sachs",["Goldman","JPM","BlackRock"],"NYC HQ. Secure comms for capital markets."),
  ("trumid","Trumid","greenhouse","trumid","fintech","Fixed-income electronic bond trading","Late stage","$200M+","Dragoneer",["Dragoneer","TPG"],"NYC HQ. Real-time trading systems."),

  # Devtools / security / infra (Ashby + Greenhouse + Lever)
  ("codat","Codat","ashby","codat","fintech","SMB financial data APIs","Series C","$175M+","JP Morgan",["JP Morgan","Index","Tiger"],"NYC office. Unified API for accounting/banking data."),
  ("dashlane","Dashlane","greenhouse","dashlane","security","Password manager / identity","Series D","$200M+","Sequoia",["Sequoia","Bessemer"],"NYC HQ. Snyk-adjacent security, mature eng org."),
  ("contentful","Contentful","greenhouse","contentful","saas","Headless CMS","Series F","$333M","Tiger",["Tiger","General Catalyst"],"NYC office, $3B val. Strong platform eng."),
  ("anaplan","Anaplan","greenhouse","anaplan","saas","Connected planning SaaS","PE-owned","$10.7B (Thoma Bravo)","Thoma Bravo",["Thoma Bravo"],"NYC office. Enterprise SaaS eng."),
  ("liveperson","LivePerson","greenhouse","liveperson","ai","Conversational AI + CX","Public","(NASDAQ: LPSN)","NASDAQ",["NASDAQ"],"NYC office. Legacy player pivoting hard to LLMs."),
  ("yotpo","Yotpo","greenhouse","yotpo","saas","E-commerce marketing SaaS","Series F","$436M","Bessemer",["Bessemer","Access","ClalTech"],"NYC office. $1.4B val martech."),
  ("taboola","Taboola","greenhouse","taboola","saas","Content + ad tech","Public","(NASDAQ: TBLA)","NASDAQ",["NASDAQ"],"NYC major office. Recommendation engine, big data pipelines."),
  ("axonius","Axonius","greenhouse","axonius","security","Cybersecurity asset mgmt","Series F","$600M+","Accel",["Accel","Lightspeed","ICONIQ"],"NYC office. Attack-surface mgmt."),
  ("prove","Prove","greenhouse","prove","security","Identity + auth infra","Series D","$150M+","MassMutual",["MassMutual","Blackstone"],"NYC HQ. Phone-centric identity verification API."),
  ("amplitude","Amplitude","greenhouse","amplitude","saas","Product analytics","Public","(NASDAQ: AMPL)","NASDAQ",["NASDAQ"],"NYC major office. Product analytics + experimentation."),
  ("sisense","Sisense","greenhouse","sisense","saas","Embedded analytics + BI","Series F","$200M+","Insight",["Insight"],"NYC HQ. Embedded analytics."),
  ("flatironhealth","Flatiron Health","greenhouse","flatironhealth","health","Oncology data platform","Late stage","$500M+ (Roche-owned)","Roche",["Roche"],"NYC HQ. Oncology real-world data."),
  ("ordergroove","Ordergroove","greenhouse","ordergroove","saas","Subscription commerce APIs","Series C","$32M+","Bain Capital",["Bain Capital"],"NYC HQ. Recurring commerce APIs for retail."),
  ("octus","Octus","greenhouse","octus","fintech","Legal + credit intelligence SaaS","Late stage","$200M+","Warburg Pincus",["Warburg Pincus"],"NYC HQ. LLM workflows on legal docs (fka Reorg)."),
  ("replit","Replit","ashby","replit","ai","AI coding IDE / dev cloud","Late stage","$220M","Andreessen Horowitz",["a16z","Coatue","Y Combinator"],"NYC (SoHo) office, $1.2B val. AI coding agent."),
  ("doss","Doss","ashby","doss","ai","AI-native ERP for physical ops","Seed","$28M","Bessemer",["Bessemer","First Round"],"NYC HQ. Greenfield AI ERP, small elite eng team."),
  ("handshake","Handshake","ashby","handshake","saas","Early-career hiring marketplace","Series F","$434M","Kleiner Perkins",["Kleiner","Coatue","Valor"],"NYC office. Marketplace at scale."),
  ("parafin","Parafin","ashby","parafin","fintech","Embedded SMB financing infra","Series C","$94M","Ribbit",["Ribbit","GIC"],"NYC office. Ramp/Stripe alumni."),
  ("tremendous","Tremendous","ashby","tremendous","fintech","Payouts + rewards API","Bootstrapped","$30M","Profitable",["—"],"NYC HQ. Dev-tools style fintech API."),

  # Consumer / marketplace / media / health / climate / gaming (Ashby + Greenhouse + Lever)
  ("duolingo","Duolingo","greenhouse","duolingo","consumer","Edtech language learning","Public","(NASDAQ: DUOL)","NASDAQ",["NASDAQ"],"NYC eng office. Massive consumer ML/gamification org."),
  ("kickstarter","Kickstarter","greenhouse","kickstarter","marketplace","Crowdfunding marketplace","PBC","Profitable","—",["Public Benefit Corp"],"NYC HQ (Brooklyn). Mature marketplace."),
  ("fanduel","FanDuel","greenhouse","fanduel","consumer","Sports betting / gaming","Public","(Flutter subsidiary)","Flutter",["Flutter","LSE"],"NYC HQ. Leading US sportsbook, real-time betting infra."),
  ("current","Current","greenhouse","current","fintech","Consumer neobank","Series D","$400M+","Andreessen Horowitz",["a16z","Tiger"],"NYC HQ. Teen + underbanked mobile banking."),
  ("hometap","Hometap","greenhouse","hometap","fintech","Home equity investments","Series C","$100M+","Bain Capital Ventures",["Bain Capital Ventures","ICONIQ"],"NYC office (Boston HQ). Alt to HELOC."),
  ("industrious","Industrious","ashby","industrious","saas","Flex office real estate","Acquired","$220M+ (CBRE)","CBRE",["CBRE"],"NYC HQ. Flex workspace tech, global network."),
  ("betterhelp","BetterHelp","greenhouse","betterhelp","health","Online therapy / telehealth","Public","(Teladoc subsidiary)","Teladoc",["Teladoc"],"NYC office. Largest online therapy platform."),
  ("komodohealth","Komodo Health","greenhouse","komodohealth","health","Healthcare claims data graph","Series E","$314M+","Tiger",["Tiger","a16z"],"NYC + SF. Real-world healthcare data."),
  ("tia","Tia","greenhouse","tia","health","Women's health clinics + software","Series C","$132M","Lone Pine",["Lone Pine","Threshold"],"NYC HQ. Modern women's clinic + platform."),
  ("whoop","Whoop","ashby","whoop","health","Fitness / recovery wearable","Series F","$405M","SoftBank",["SoftBank","IVP"],"NYC office (Boston HQ). Recovery + fitness wearable."),
  ("sylvera","Sylvera","ashby","sylvera","climate","Carbon credit ratings","Series B","$96M","Balderton",["Balderton","Insight"],"NYC office (London HQ). Carbon markets."),
  ("crusoe","Crusoe","ashby","crusoe","climate","Flare-gas + clean-energy AI datacenters","Series C","$1.4B+","G2 Venture Partners",["G2 VP","Founders Fund"],"NYC office. Novel energy-transition compute."),
  ("arcadia","Arcadia","lever","arcadia","climate","Community solar + utility data API","Series E","$380M+","BlackRock",["BlackRock","Drawdown"],"NYC office. Energy data infra."),
  ("newsbreak","NewsBreak","greenhouse","newsbreak","media","AI-powered local news app","Late stage","$200M+","Francisco Partners",["Francisco Partners"],"NYC office. Top-100 US app."),
  ("axios","Axios","greenhouse","axios","media","Digital news brand","Acquired","$57M+ (Cox)","Cox",["Cox"],"NYC eng office (DC HQ). Smart-brevity news."),
  ("morningbrew","Morning Brew","lever","morningbrew","media","Business newsletters","Acquired","$75M (BDG)","Bustle Digital Group",["Bustle Digital Group"],"NYC HQ. Newsletter empire."),
  ("rockstargames","Rockstar Games","greenhouse","rockstargames","consumer","AAA game studio","Public","(Take-Two subsidiary)","Take-Two",["Take-Two","NASDAQ"],"NYC HQ. GTA/RDR studio, massive eng org."),
  ("affirm","Affirm","greenhouse","affirm","fintech","BNPL / consumer credit","Public","(NASDAQ: AFRM)","NASDAQ",["NASDAQ"],"NYC office. Consumer fintech infra."),
  ("flexport","Flexport","greenhouse","flexport","saas","Freight + logistics tech","Series E","$2.3B+","Founders Fund",["Founders Fund","SoftBank"],"NYC office. Logistics + supply-chain ML."),
  ("rga","R/GA","greenhouse","rga","saas","Digital product agency","Public","(Interpublic subsidiary)","Interpublic",["Interpublic","NYSE"],"NYC HQ. Large NY eng org building for enterprise."),

  # Teamtailor — European / Nordic brands with NYC presence
  ("toteme","Toteme","teamtailor","toteme","consumer","Swedish luxury fashion","PE-backed","Altor Equity","Altor Equity",["Altor Equity"],"NYC US HQ, Madison Ave + Mercer offices. Elin Kling-founded, Shopify+Sitoo commerce stack."),
  ("ganni","Ganni","teamtailor","ganni","consumer","Danish contemporary fashion","Acquired","L Catterton majority","L Catterton",["L Catterton"],"Ganni SoHo NYC HQ for Americas. 500-person co, dedicated NYC e-comm team."),
  ("oatly","Oatly","teamtailor","oatly","consumer","Oat milk (NASDAQ: OTLY)","Public","(NASDAQ: OTLY)","NASDAQ",["NASDAQ"],"NYC US HQ. Senior SWE roles currently open in NY."),
  ("epidemic-sound","Epidemic Sound","teamtailor","epidemic-sound","media","Royalty-free music for creators","Late stage","$450M","EQT Growth",["EQT Growth","Blackstone Growth"],"NYC one of six global offices. $1.4B val."),
  ("yoto","Yoto","teamtailor","yoto","consumer","Kids screen-free audio platform","Series A","$22M + $15M debt","Chan Zuckerberg Initiative",["CZI","Acton","Burda","HSBC"],"NYC + London offices. Built In NYC profile, full-stack + security roles open."),
  ("huel","Huel","teamtailor","huel","consumer","DTC nutrition / meal replacement","Series A","£20M + profitable","Highland Europe",["Highland Europe"],"Brooklyn DUMBO office. NYC-based tech team."),
  ("polestar","Polestar","teamtailor","polestar","consumer","EV (NASDAQ: PSNY, Volvo/Geely spinoff)","Public","(NASDAQ: PSNY)","NASDAQ",["NASDAQ"],"NYC-metro offices. 70+ software eng openings — infotainment + cloud."),
  ("sabon","Sabon","teamtailor","sabon","consumer","Dead Sea beauty brand","PE-backed","Investindustrial","Investindustrial",["Investindustrial"],"NYC US HQ Broadway. Retail-heavy but has US corp office in NY."),
  ("fjallraven","Fjallraven","teamtailor","fjallraven","consumer","Kanken / outdoor gear","Public","(Parent Fenix Outdoor STO:FOI-B)","STO",["Fenix Outdoor"],"NYC EPIC + Mott St presence. Ecom + retail tech."),
  ("revolutionbeauty","Revolution Beauty","teamtailor","revolutionbeauty","consumer","Mass beauty (LSE: REVB)","Public","(LSE: REVB)","LSE",["LSE"],"US operations with NYC hiring in past 12mo."),
  ("sweedbeauty","Sweed Beauty","teamtailor","sweedbeauty","consumer","Swedish clean makeup","Growth equity","undisclosed","—",["—"],"Actively expanding NYC / US."),
  ("bulk","Bulk","teamtailor","bulk","consumer","UK sports nutrition DTC","Acquired","Nestle 2024","Nestle",["Nestle"],"Global including US. Strong DTC eng."),
  ("cazoo","Cazoo","teamtailor","cazoo","consumer","Online car marketplace (LSE: CZOO)","Public","(LSE: CZOO)","LSE",["LSE"],"UK-primary — weak NYC signal. Included for coverage; will drop naturally if no NYC eng."),
  ("sneakersnstuff","Sneakersnstuff","teamtailor","sneakersnstuff","consumer","Swedish sneaker retail","Acquired","ANWR Group","ANWR Group",["ANWR Group"],"NYC Bowery store. Small tech but real ecom."),
  ("filippak","Filippa K","teamtailor","filippak","consumer","Minimalist fashion","PE-owned","Nordic PE","Nordic PE",["Nordic PE"],"NYC store + wholesale ops."),

  # SmartRecruiters — enterprise, media, agencies, retail w/ NYC eng
  ("linkedin","LinkedIn","smartrecruiters","LinkedIn3","saas","Professional social / SaaS","Public","(Microsoft: MSFT)","Microsoft",["Microsoft","NASDAQ"],"Empire State Building NYC office. Sr enterprise systems eng roles."),
  ("equinox","Equinox Group","smartrecruiters","Equinox","consumer","Luxury fitness / hospitality","PE-backed","$1B+","L Catterton",["L Catterton","Related Cos"],"HQ Hudson Yards NYC. Sr Data Engineer + site-testing eng roles."),
  ("nyc-gov","City of New York","smartrecruiters","CityOfNewYork","saas","Public sector (dept of tech)","Public sector","$110B budget","—",["Public sector"],"NYC gov. Sr SWE GeoSupport, .NET, City Environmental Quality Review roles."),
  ("socotec","Socotec","smartrecruiters","Socotec","saas","TIC + AI platform","PE-backed","~$2B rev","Cobepa",["Cobepa"],"151 W 42nd St Manhattan. SWE applied AI + data infra roles."),
  ("visa","Visa","smartrecruiters","Visa","fintech","Payments (NYSE: V)","Public","(NYSE: V)","NYSE",["NYSE","Dow 30"],"NYC office Bryant Park."),
  ("sgs","SGS","smartrecruiters","SGS","saas","Testing + inspection (SIX: SGSN)","Public","(SIX: SGSN)","SIX",["SIX"],"Farmingdale NY lab. Sr SWE hybrid roles."),
  ("bosch","Bosch Group","smartrecruiters","BoschGroup","saas","Industrial / mobility / IoT","Private","$91B rev","—",["Privately held"],"Bosch Research NYC office."),
  ("nielseniq","NielsenIQ","smartrecruiters","NielsenIQ","saas","Data + analytics (NIQ)","Public","(NIQ post-Advent spinout)","NYSE",["NYSE"],"NYC HQ 85 Broad St. Sr Director Engineering roles."),
  ("abbvie","AbbVie / Allergan","smartrecruiters","AbbVie","health","Biopharma (NYSE: ABBV)","Public","(NYSE: ABBV)","NYSE",["NYSE","S&P 500"],"Allergan Manhattan office. Engineer Technology II roles."),
  ("dominos","Domino's Pizza","smartrecruiters","Dominos","consumer","QSR (NYSE: DPZ)","Public","(NYSE: DPZ)","NYSE",["NYSE","S&P 500"],"NYC franchise ops + Ann Arbor eng HQ."),
  ("gap","Gap Inc","smartrecruiters","GapInc2","consumer","Apparel retail (NYSE: GPS)","Public","(NYSE: GPS)","NYSE",["NYSE","S&P 500"],"Old Navy NYC design office."),

  # ── 2026-07-21 — Batch 1: elite NYC coding/product agencies ──
  ("codeandtheory","Code and Theory","greenhouse","codeandtheory","saas","Elite NYC product + engineering agency","Acquired","(WPP subsidiary, 2024)","WPP",["WPP"],"NYC (SoHo) HQ. 800+ ppl. Clients: WSJ, NYT, CNN, Coca-Cola. 36 NYC eng roles today."),
  ("dept","DEPT","greenhouse","dept","saas","Global digital product agency","Late stage","Carlyle-backed","Carlyle",["Carlyle"],"NYC Manhattan office. 4000+ ppl. Clients: Google, eBay, Vice, Patagonia."),
  ("instrument","Instrument","lever","instrument","saas","Portland/NYC design + engineering studio","Acquired","(DEPT subsidiary)","DEPT",["DEPT"],"NYC studio. ~400 ppl. Clients: Google, Spotify, Nike, Meta."),
  ("nearform","Nearform","greenhouse","nearform","saas","Elite React/Node consultancy (acq. Formidable 2023)","Private","undisclosed","—",["—"],"US remote incl NYC. ~500 ppl. Clients: Netflix, HBO, Verizon, Twilio."),
  ("hugeinc","Huge","greenhouse","hugeinc","saas","Flagship Brooklyn agency","PE","AEA Investors","AEA Investors",["AEA"],"Brooklyn DUMBO HQ. ~1000 ppl. Clients: Google, HBO, Nike, McDonald's."),
  ("metalab","MetaLab","greenhouse","metalab","saas","Elite remote product design agency","Bootstrapped","Profitable","—",["—"],"Remote-first with NYC hires. Slack UI + Coinbase + Uber designers."),
  ("kettle","Kettle","greenhouse","kettle","saas","NYC-founded creative + product agency","Bootstrapped","Profitable","—",["—"],"NYC roots, now remote-first. Clients: NatGeo, Google, MoMA."),
  ("akqa","AKQA","greenhouse","akqa","saas","WPP design + tech agency","Acquired","(WPP subsidiary)","WPP",["WPP"],"NYC Manhattan office. ~2500 ppl. Clients: Nike, Google, Audi."),
  ("ideo","IDEO","greenhouse","ideo","saas","Legendary design consultancy","Private","undisclosed","—",["—"],"NYC office active. ~500 ppl. Historic clients: Apple mouse, Ford, Airbnb."),
  ("thoughtworks","Thoughtworks","greenhouse","thoughtworks","saas","Global engineering consultancy","Public","(NASDAQ: TWKS)","NASDAQ",["NASDAQ"],"NYC Manhattan office. 10K+ ppl. XP + agile pedigree."),
  ("vsapartners","VSA Partners","greenhouse","vsapartners","saas","Chicago-based design + brand agency","Private","undisclosed","—",["—"],"NYC office. ~250 ppl. Clients: Google, Nike, IBM."),

  # ── 2026-07-21 — Batch 2: elite contract / FDE consultancies ──
  ("palantir","Palantir","lever","palantir","saas","Elite FDE consultancy (NYSE: PLTR)","Public","(NYSE: PLTR)","NYSE",["NYSE"],"NYC major eng hub. Original FDE model. 33 NYC eng roles today."),
  ("turing","Turing","greenhouse","turing","ai","AI dev marketplace + staff","Late stage","$140M+","WestBridge",["WestBridge","Foundation"],"NYC HQ. Elite talent network with staff engineers."),
  ("capco","Capco","greenhouse","capco","saas","Financial-services dev consultancy","Acquired","(Wipro subsidiary)","Wipro",["Wipro"],"NYC office. Elite banking tech consultancy."),
  ("vannevarlabs","Vannevar Labs","greenhouse","vannevarlabs","saas","Defense FDE consultancy","Series C","$100M+","General Catalyst",["General Catalyst","Founders Fund"],"NYC office. Palantir alumni; defense FDE."),
  ("toptal","Toptal","lever","toptal","saas","Elite dev marketplace + staff","Bootstrapped","Profitable","—",["—"],"NYC office. Vetted senior-eng network."),
  ("andela","Andela","ashby","andela","saas","Staff-engineer dev network","Late stage","$381M","SoftBank",["SoftBank","GV","Spark"],"NYC-connected. Staff-eng model."),
  ("pariveda","Pariveda","ashby","pariveda","saas","Elite management + dev consultancy","Bootstrapped","Profitable","—",["Employee-owned"],"NYC office. Boutique employee-owned."),
  ("factory","Factory","ashby","factory","ai","Agentic-coding FDE shop","Series A","$15M","Sequoia",["Sequoia"],"NYC office. AI dev-consulting hybrid."),
  ("openevidence","OpenEvidence","ashby","openevidence","health","Medical AI FDE-style","Series B","$100M+","Sequoia",["Sequoia","Kleiner"],"NYC + Boston. Elite AI deployment shop."),

  # ── 2026-07-21 — Batch 3: recent YC startups (AI / dev / infra) ──
  ("clarion","Clarion","ashby","clarion","ai","AI voice + comms for healthcare","Series A","$13M","Maverick",["Maverick","YC","a16z"],"YC W24. NYC HQ. Automates clinic scheduling/billing calls."),
  ("offdeal","OffDeal","ashby","offdeal","ai","AI-native investment bank","Seed","$4.7M","Radical",["Radical","YC"],"YC W24. NYC. AI-run SMB M&A."),
  ("pointone","PointOne","ashby","pointone","ai","AI legal timekeeping","Seed","$10M+","Khosla",["Khosla","YC"],"YC W24. NYC. Automated time entry for BigLaw."),
  ("greenboard","Greenboard","ashby","greenboard","fintech","AI compliance for fintech","Seed","YC","Y Combinator",["YC"],"YC W24. NYC. Back-office automation for regulated financial firms."),
  ("spur","Spur","ashby","spur","ai","AI E2E test automation","Seed","YC","Y Combinator",["YC"],"YC S24. NYC founding team. LLM-generated tests."),
  ("ultra","Ultra","ashby","ultra","ai","General-purpose humanoid robots","Seed","$10M+","(undisclosed)",["—"],"YC S24. NYC HQ, KY manufacturing. Zero-integration robots."),
  ("codes-health","Codes Health","ashby","codes-health","health","AI medical record retrieval","Seed","YC","Y Combinator",["YC"],"YC S24. NYC. Cross-EHR chart abstraction."),
  ("ryvn","Ryvn","ashby","ryvn","infra","Multi-cloud deploy infra + observability","Seed","YC","Y Combinator",["YC"],"YC F24. NYC. Ship workloads across AWS/GCP/Azure."),
  ("tuesday-labs","Tuesday Labs","ashby","tuesday-labs","ai","Consumer + tidying robots","Seed","YC","Y Combinator",["YC"],"YC W24. NYC. Home-tidying AI robots."),
  ("diligencesquared","Diligencesquared","ashby","diligencesquared","ai","AI market due-diligence","Seed","YC","Y Combinator",["YC"],"YC F25. NYC. Automates McKinsey-grade market reports for PE."),
  ("fleetline","Fleetline","ashby","fleetline","ai","AI trucking load planner","Seed","YC","Y Combinator",["YC"],"YC S25. NYC founding roles. LLM+OR-based fleet optimization."),
  ("ambral","Ambral","ashby","ambral","ai","AI account mgmt / CS agent","Seed","YC","Y Combinator",["YC"],"YC S25. NYC founding engineer role. Enterprise CS copilot."),

  # ── 2026-07-21 — Batch 4: recent YC startups (consumer / fintech / health) ──
  ("tennr","Tennr","ashby","tennr","health","AI reads faxes/PDFs for specialty-clinic patient intake","Series B","$37M","Andreessen Horowitz",["a16z","ICONIQ"],"YC W23. NYC."),
  ("loula","Loula","ashby","loula","health","Insurance billing rails for doulas + postpartum providers","Seed","YC","Y Combinator",["YC"],"YC W23. NYC. Mission-driven."),
  ("fortuna-health","Fortuna Health","ashby","fortuna-health","health","Consumer Medicaid enrollment + renewals","Series A","$18M","Andreessen Horowitz",["a16z"],"YC S23. NYC."),
  ("prosper-ai","Prosper","ashby","prosper-ai","health","AI voice agents for patient calls at health systems","Seed","YC","Y Combinator",["YC"],"YC S23. NYC."),
  ("junction","Junction Bioscience","ashby","junction","health","AI hypothesis engine for molecular discovery","Seed","YC","Y Combinator",["YC"],"YC W24. NYC + wet lab."),
  ("piramidalinc","Piramidal","greenhouse","piramidalinc","health","Foundation model for the brain (EEG)","Seed","$6M","(undisclosed)",["—"],"YC W24. NYC. Deployed at NYU Langone."),
  ("garage","Garage","ashby","garage","marketplace","Marketplace for industrial assets","Seed","YC + Founders Fund","Founders Fund",["Founders Fund","YC"],"YC W24. NYC. Trucks, machinery, equipment."),
  ("finny","FINNY AI","ashby","finny","fintech","AI organic-growth engine for RIAs","Seed","$12M","Maverick",["Maverick","YC"],"YC S24. NYC."),
  ("claim-health","Claim Health","ashby","claim-health","health","AI RCM for post-acute care","Seed","YC","Y Combinator",["YC"],"YC S25. NYC."),
  ("avallon","Avallon AI","ashby","avallon","fintech","AI agents for insurance claims ops","Seed","YC","Y Combinator",["YC"],"YC S25. NYC."),
  ("careswift","CareSwift","ashby","careswift","health","AI scribe for ambulance/EMS run reports","Seed","YC","Y Combinator",["YC"],"YC S25. NYC."),
  ("solva","Solva","ashby","solva","fintech","AI automating insurance claims + blocking overpayments","Seed","YC","Y Combinator",["YC"],"YC S25. NYC."),
  ("atg","Autonomous Technologies Group","ashby","atg","fintech","Superintelligent financial advisor research lab","Seed","YC","Y Combinator",["YC"],"YC F25. NYC."),

  # ── 2026-07-23 — Art / creative / music / celeb-brand batch ──
  ("sonymusic","Sony Music Entertainment","greenhouse","sonymusicentertainment","media","Global record label (Sony subsidiary)","Public","(Sony subsidiary)","Sony",["Sony"],"NYC HQ. Includes The Orchard, Alamo, Columbia. 3 NYC eng today (Data Privacy, Emerging Tech, Sr PM D2C)."),
  ("a24","A24","greenhouse","a24","media","Indie film + TV studio","Late stage","$225M","Stripes",["Stripes"],"NYC + LA. Cultural weight — Everything Everywhere, Uncut Gems, Moonlight. Small ops today, no NYC eng yet."),
  ("aimeleondore","Aime Leon Dore","greenhouse","aimeleondore","consumer","NYC cult streetwear + menswear","Bootstrapped","Profitable","—",["—"],"NYC HQ (SoHo). Teddy Santis' menswear cult brand; Porsche + New Balance collabs. 16 open roles today (retail/design)."),
  ("splice","Splice","greenhouse","splice","media","Music-production sample marketplace + tools","Series D","$102M+","Union Square Ventures",["USV","DFJ Growth"],"NYC HQ. Producer + creator tools; sample library at scale."),
  ("goop","Goop","greenhouse","goop","consumer","Wellness + lifestyle content commerce","Series C","$100M+","Democracy Partners",["Democracy","NEA","Lightspeed"],"LA HQ, NYC retail. Gwyneth Paltrow's brand."),
  ("livenation","Live Nation Entertainment","smartrecruiters","LiveNationEntertainment","media","Live-events + ticketing conglomerate (NYSE: LYV)","Public","(NYSE: LYV)","NYSE",["NYSE"],"NYC office. Ticketmaster + concert-promoter parent."),
  ("honestco","The Honest Company","greenhouse","thehonestcompany","consumer","Wellness + baby DTC (NASDAQ: HNST)","Public","(NASDAQ: HNST)","NASDAQ",["NASDAQ"],"LA HQ. Jessica Alba's co. Board empty today; kept as future-surfacing candidate."),
]

# Clearbit logo domains, keyed by company id. Companies absent from this
# map fall back to the first letter of their name in the card.
DOMAINS = {
  "via":"ridewithvia.com","aura-frames":"auraframes.com","rho":"rho.co",
  "hex":"hex.tech","brigit":"hellobrigit.com","zocdoc":"zocdoc.com",
  "clear":"clearme.com","drw":"drw.com","imc":"imc.com",
  "flow-traders":"flowtraders.com","old-mission":"oldmissioncapital.com",
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
  # 2026-06-22 additions
  "lemonade":"lemonade.com","capchase":"capchase.com","knotapi":"knotapi.com",
  "orum":"orum.io","daloopa":"daloopa.com","cedar":"cedar.com",
  "spring-health":"springhealth.com","kindbody":"kindbody.com",
  "talkiatry":"talkiatry.com","octave":"findoctave.com",
  "particle-health":"particlehealth.com","vellum":"vellum.ai",
  "braintrust":"braintrust.dev","anyword":"anyword.com","verbit":"verbit.ai",
  "materialize":"materialize.com","bigid":"bigid.com","linear":"linear.app",
  "dbt-labs":"getdbt.com","honeycomb":"honeycomb.io",
  "launchdarkly":"launchdarkly.com","sentry":"sentry.io",
  "sourcegraph":"sourcegraph.com","snyk":"snyk.io","hightouch":"hightouch.com",
  "census":"getcensus.com","vimeo":"vimeo.com","voxmedia":"voxmedia.com",
  "foursquare":"foursquare.com","wonder":"wonder.com","nayya":"nayya.com",
  "glia":"glia.com",
  # 2026-06-30 additions
  "sonder":"sonder.com","higgsfield":"higgsfield.ai","kasa":"kasa.com",
  "unitedmasters":"unitedmasters.com","vsco":"vsco.co","soundcloud":"soundcloud.com",
  "bdg":"bustle.com","resy":"resy.com","defector":"defector.com",
  "recess":"takearecess.com","liquid-death":"liquiddeath.com",
  # 2026-07-21 additions
  "slice":"slicelife.com","owner-com":"owner.com","blackbird":"blackbird.xyz",
  "sauce":"getsauce.com","restaurant365":"restaurant365.com",
  "chowbus":"chowbus.com","choco":"choco.com","crunchtime":"crunchtime.com",
  "popmenu":"popmenu.com","slangai":"slang.ai","blank-street":"blankstreet.com",
  "olipop":"drinkolipop.com","magic-spoon":"magicspoon.com","ag1":"drinkag1.com",
  "hungryroot":"hungryroot.com","misfits-market":"misfitsmarket.com",
  "tovala":"tovala.com","farmers-dog":"thefarmersdog.com","foodsmart":"foodsmart.com",
  # 2026-07-21 100-company expansion — AI/dev
  "mintlify":"mintlify.com","graphite":"graphite.dev","synthesia":"synthesia.io",
  "sweep":"sweep.dev","gamma":"gamma.app","pylon":"usepylon.com","vapi":"vapi.ai",
  "orbital":"orbital.co","browserbase":"browserbase.com","midpage":"midpage.ai",
  "semgrep":"semgrep.dev","attio":"attio.com","reducto":"reducto.ai",
  "parallel":"parallel.ai","dataiku":"dataiku.com",
  # Fintech / crypto
  "socure":"socure.com","paxos":"paxos.com","trm-labs":"trmlabs.com",
  "meow":"meow.com","uniswap":"uniswap.org","ledger":"ledger.com",
  "notabene":"notabene.id","elliptic":"elliptic.co","dailypay":"dailypay.com",
  "numeral":"numeralhq.com","imprint":"imprint.co","tomo":"tomo.com",
  "vestwell":"vestwell.com","capitolis":"capitolis.com","ondofinance":"ondo.finance",
  "databento":"databento.com","unqork":"unqork.com","ripple":"ripple.com",
  "symphony":"symphony.com","trumid":"trumid.com","codat":"codat.com",
  # Devtools / security / infra
  "dashlane":"dashlane.com","contentful":"contentful.com","anaplan":"anaplan.com",
  "liveperson":"liveperson.com","yotpo":"yotpo.com","taboola":"taboola.com",
  "axonius":"axonius.com","prove":"prove.com","amplitude":"amplitude.com",
  "sisense":"sisense.com","flatironhealth":"flatiron.com","ordergroove":"ordergroove.com",
  "octus":"octus.com","replit":"replit.com","doss":"doss.com",
  "handshake":"joinhandshake.com","parafin":"parafin.com","tremendous":"tremendous.com",
  # Consumer / marketplace / media / health / climate / gaming
  "duolingo":"duolingo.com","kickstarter":"kickstarter.com","fanduel":"fanduel.com",
  "current":"current.com","hometap":"hometap.com","industrious":"industriousoffice.com",
  "betterhelp":"betterhelp.com","komodohealth":"komodohealth.com","tia":"asktia.com",
  "whoop":"whoop.com","sylvera":"sylvera.com","crusoe":"crusoe.ai",
  "arcadia":"arcadia.com","newsbreak":"newsbreak.com","axios":"axios.com",
  "morningbrew":"morningbrew.com","rockstargames":"rockstargames.com",
  "affirm":"affirm.com","flexport":"flexport.com","rga":"rga.com",
  # Teamtailor
  "toteme":"toteme.com","ganni":"ganni.com","oatly":"oatly.com",
  "epidemic-sound":"epidemicsound.com","yoto":"yotoplay.com","huel":"huel.com",
  "polestar":"polestar.com","sabon":"sabonnyc.com","fjallraven":"fjallraven.com",
  "revolutionbeauty":"revolutionbeauty.com","sweedbeauty":"sweedbeauty.com",
  "bulk":"bulk.com","cazoo":"cazoo.co.uk","sneakersnstuff":"sneakersnstuff.com",
  "filippak":"filippa-k.com",
  # SmartRecruiters
  "linkedin":"linkedin.com","equinox":"equinox.com","nyc-gov":"nyc.gov",
  "socotec":"socotec.com","visa":"visa.com","sgs":"sgs.com","bosch":"bosch.com",
  "nielseniq":"nielseniq.com","abbvie":"abbvie.com","dominos":"dominos.com",
  "gap":"gap.com",
  # Batch 1: agencies
  "codeandtheory":"codeandtheory.com","dept":"deptagency.com",
  "instrument":"instrument.com","nearform":"nearform.com",
  "hugeinc":"hugeinc.com","metalab":"metalab.com","kettle":"wearekettle.com",
  "akqa":"akqa.com","ideo":"ideo.com","thoughtworks":"thoughtworks.com",
  "vsapartners":"vsapartners.com",
  # Batch 2: elite contract shops
  "palantir":"palantir.com","turing":"turing.com","capco":"capco.com",
  "vannevarlabs":"vannevarlabs.com","toptal":"toptal.com","andela":"andela.com",
  "pariveda":"parivedasolutions.com","factory":"factory.ai","openevidence":"openevidence.com",
  # Batch 3: YC AI/dev/infra
  "clarion":"clarionhealth.com","offdeal":"offdeal.com","pointone":"pointone.ai",
  "greenboard":"greenboard.co","spur":"spur.dev","ultra":"ultra.us",
  "codes-health":"codeshealth.co","ryvn":"ryvn.io","tuesday-labs":"tuesdaylabs.com",
  "diligencesquared":"diligencesquared.com","fleetline":"fleetline.ai","ambral":"ambral.com",
  # Batch 4: YC consumer/fintech/health
  "tennr":"tennr.com","loula":"loula.co","fortuna-health":"fortunahealth.com",
  "prosper-ai":"prosper.ai","junction":"junction.bio","piramidalinc":"piramidal.ai",
  "garage":"garage.com","finny":"finny.ai","claim-health":"claim.health",
  "avallon":"avallon.ai","careswift":"careswift.com","solva":"solva.ai","atg":"atg.systems",
  # 2026-07-23 art/creative/celeb batch
  "sonymusic":"sonymusic.com","a24":"a24films.com","aimeleondore":"aimeleondore.com",
  "splice":"splice.com","goop":"goop.com","livenation":"livenationentertainment.com",
  "honestco":"honest.com",
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
  if ats == "teamtailor":
    # Teamtailor exposes a JSONFeed at {subdomain}.teamtailor.com/jobs.json.
    # If the slug contains a dot, treat it as a full host (custom domain like
    # careers.marginedge.com); otherwise prepend .teamtailor.com.
    host = slug if "." in slug else f"{slug}.teamtailor.com"
    d = curl_json(f"https://{host}/jobs.json")
    return d.get("items", []) if d else []
  if ats == "smartrecruiters":
    # SmartRecruiters public postings API — pages of 100 (API cap).
    all_postings = []
    offset = 0
    while True:
      d = curl_json(f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=100&offset={offset}")
      if not d or "content" not in d: break
      page = d.get("content", []) or []
      all_postings.extend(page)
      total = d.get("totalFound") or 0
      offset += 100
      if offset >= total or not page: break
      if offset > 5000: break  # safety
    return all_postings
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

def _date10(v):
  """Normalize an ATS posting date to YYYY-MM-DD ('' if unparseable).
  Accepts ISO strings (Ashby/Greenhouse/Workable) and epoch-ms ints (Lever)."""
  if not v: return ""
  if isinstance(v, (int, float)):
    try:
      return datetime.datetime.utcfromtimestamp(v / 1000).date().isoformat()
    except Exception:
      return ""
  s = str(v)
  return s[:10] if len(s) >= 10 and s[4] == "-" and s[7] == "-" else ""

def filter_jobs(ats, raw, slug=""):
  out = []
  for j in raw:
    posted = ""
    if ats == "ashby":
      if j.get("isListed", True) is False: continue
      title = (j.get("title") or "").strip()
      primary = j.get("location","") or ""
      secs = [s.get("location","") for s in (j.get("secondaryLocations") or [])]
      is_nyc = bool(NYC.search(primary)) or any(NYC.search(s) for s in secs)
      url = j.get("jobUrl") or j.get("applyUrl")
      posted = _date10(j.get("publishedDate") or j.get("publishedAt") or j.get("updatedAt"))
    elif ats == "greenhouse":
      title = (j.get("title") or "").strip()
      loc = (j.get("location") or {}).get("name","") or ""
      is_nyc = bool(NYC.search(loc))
      url = j.get("absolute_url")
      posted = _date10(j.get("updated_at") or j.get("first_published") or j.get("created_at"))
    elif ats == "lever":
      title = (j.get("text") or "").strip()
      cat = j.get("categories") or {}
      loc = cat.get("location","") or ""
      all_locs = cat.get("allLocations") or []
      blob = loc + " " + " ".join(all_locs if isinstance(all_locs, list) else [])
      is_nyc = bool(NYC.search(blob))
      url = j.get("hostedUrl") or j.get("applyUrl")
      posted = _date10(j.get("createdAt"))
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
      posted = _date10(j.get("published_on") or j.get("created_at"))
    elif ats == "teamtailor":
      # Teamtailor JSONFeed item. Title + url are top-level; location is in
      # _jobposting.jobLocation[].address.{addressLocality,addressRegion}.
      title = (j.get("title") or "").strip()
      url = j.get("url") or ""
      jp = j.get("_jobposting") or {}
      locs = jp.get("jobLocation") or []
      if isinstance(locs, dict): locs = [locs]
      parts = []
      for L in locs:
        a = (L or {}).get("address") or {}
        parts.append(f"{a.get('addressLocality','')} {a.get('addressRegion','')}")
      is_nyc = bool(NYC.search(" ".join(parts)))
      posted = _date10(j.get("date_published"))
    elif ats == "smartrecruiters":
      # SmartRecruiters posting. Title = name; location = {city, region,
      # fullLocation, remote, hybrid}; URL constructed from company + id.
      title = (j.get("name") or "").strip()
      loc = j.get("location") or {}
      blob = f"{loc.get('city','')} {loc.get('region','')} {loc.get('fullLocation','')}"
      is_nyc = bool(NYC.search(blob))
      url = f"https://jobs.smartrecruiters.com/{slug}/{j.get('id','')}"
      posted = _date10(j.get("releasedDate"))
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
      posted = _date10(j.get("startDate"))
    else:
      continue
    if not is_nyc: continue
    if not title: continue
    title_for_check = STAFF_PRINCIPAL.sub("", title) if SENIORITY_MARK.search(title) else title
    if TITLE_EXCLUDE.search(title_for_check): continue
    if not TITLE_INCLUDE.search(title): continue
    out.append({"title": title, "url": url, "level": level(title), "posted": posted})
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
  ap.add_argument("--only", default="", help="Comma-separated candidate ids to probe (default: all)")
  ap.add_argument("--emit-json", default="", help="Write fetched rows to this JSON path and DO NOT touch data.js "
                                                  "(feed it to scripts/merge-additive.js for an additive merge)")
  args = ap.parse_args()

  only = {x.strip() for x in args.only.split(",") if x.strip()}
  today = datetime.date.today().isoformat()
  rows = []
  seen = set()
  no_match = []
  for cid, name, ats, slug, vertical, sub, stage, raised, lead, badges, notes in CANDIDATES:
    if only and cid not in only:
      continue
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

  # Additive path: emit fetched rows as JSON for merge-additive.js (which unions
  # them into data.js without removing anything). Skips the destructive rewrite.
  if args.emit_json:
    import json as _json
    payload = {"verified": today, "rows": rows}
    with open(args.emit_json, "w") as f:
      _json.dump(payload, f, indent=2)
    print(f"\nWrote {sum(len(r['jobs']) for r in rows)} live URLs across {len(rows)} companies "
          f"-> {args.emit_json} (verified {today}).\n"
          f"Merge additively with:\n  node scripts/merge-additive.js js/data.js {args.emit_json}",
          file=sys.stderr)
    return

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
