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
  r"platform[\s-]engineer|data[\s-]engineer|systems[\s-]engineer|"
  r"member\s+of\s+technical\s+staff|mts"
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
  ("tavily","Tavily","ashby","tavily","ai","Search API for AI agents","Series A","$30M","Insight Partners",["Insight","YC W24"],"Retrieval API for agents. Ranking + eval. RAG-adjacent."),
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
  ("brex","Brex","greenhouse","brex","fintech","Corporate cards + spend mgmt","Series D","$1.5B","DST",["YC","DST","Greenoaks"],"Cards, banking, expense. PCI, ledger, large eng org."),
  ("mercury","Mercury","greenhouse","mercury","fintech","Banking for startups","Series C","$152M","CRV",["CRV","a16z","Coatue"],"Banking UX + ops. Compliance, money movement."),
  ("plaid","Plaid","ashby","plaid","fintech","Banking API + financial data","Series D","$734M","Altimeter",["Altimeter","a16z","Index"],"Bank-data connectivity infra. Integration breadth, reliability."),
  ("alloy","Alloy","greenhouse","alloy","fintech","Identity decisioning for fintech","Series C","$207M","Lightspeed",["Lightspeed","Avenir"],"KYC/AML infra. Identity graph, compliance UX."),
  ("gusto","Gusto","greenhouse","gusto","fintech","Payroll / HR for SMBs","Series E","$716M","Generation",["Generation","Kleiner","YC"],"Payroll engine + benefits. Compliance, money movement, multi-state tax."),
  ("robinhood","Robinhood","greenhouse","robinhood","fintech","Retail brokerage (NASDAQ)","Public","$5.6B pre-IPO","DST",["NASDAQ","DST","Sequoia"],"Public co. Markets infra, latency, identity."),
  ("sofi","SoFi","greenhouse","sofi","fintech","Personal finance (NASDAQ)","Public","$2.6B pre-IPO","SoftBank",["NASDAQ","SoftBank","Silver Lake"],"Consumer finance super-app. Lending, banking, brokerage."),
  ("modern-treasury","Modern Treasury","ashby","moderntreasury","fintech","Payment operations","Series C","$183M","Altimeter",["Altimeter","Benchmark"],"Money movement infra. Bank integrations, ledger, ops UX."),
  ("carta","Carta","greenhouse","carta","fintech","Cap-table + private markets","Series G","$1.2B","Andreessen Horowitz",["a16z","Spark","Tribe"],"Cap tables + fund admin. Compliance, securities."),
  ("blockworks","Blockworks","ashby","blockworks","fintech","Crypto media + research","Series A","$15M","Framework",["Framework","10T","S Capital"],"Crypto news + intelligence. Editorial tech + data products."),
  ("betterment","Betterment","greenhouse","betterment","fintech","Robo-advisor","Late stage","$436M","Kinnevik",["Kinnevik","Bessemer","Menlo"],"Robo-advised investing. Algorithms + compliance + UX."),
  ("propel","Propel","ashby","propel","fintech","Fintech for low-income Americans","Series B","$50M","Andreessen Horowitz",["a16z","Kleiner","Serena Williams"],"SNAP-balance app + benefits financial services. Mission-driven."),
  ("public","Public","greenhouse","public","fintech","Social investing","Series D","$310M","Tiger",["Tiger","Accel","Greycroft"],"Stocks + crypto + treasuries. Markets infra + community."),
  ("fireblocks","Fireblocks","greenhouse","fireblocks","fintech","Crypto custody / MPC","Series E","$1B","D1 Capital",["D1","Sequoia","Stripes"],"Institutional crypto infra. MPC, custody, compliance."),
  ("gemini","Gemini","greenhouse","gemini","fintech","Crypto exchange","Late stage","$400M","Morgan Creek",["Morgan Creek"],"Winklevoss-led NYC crypto exchange. Compliance-first culture."),
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
}


# ── HTTP fetchers (curl) ─────────────────────────────────────────────────
def curl_json(url, timeout=15):
  try:
    r = subprocess.run(["curl","-sS","-L","--max-time",str(timeout),url],
                       capture_output=True, timeout=timeout+3, text=True)
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
  return []


# ── Filtering ────────────────────────────────────────────────────────────
def level(title):
  low = title.lower()
  if "founding" in low: return "founding"
  if "senior" in low or "sr." in low or "sr " in low: return "senior"
  return "mid"

def filter_jobs(ats, raw):
  out = []
  for j in raw:
    if ats == "ashby":
      if j.get("isListed", True) is False: continue
      title = (j.get("title") or "").strip()
      primary = j.get("location","") or ""
      secs = [s.get("location","") for s in (j.get("secondaryLocations") or [])]
      is_nyc = bool(NYC.search(primary)) or any(NYC.search(s) for s in secs)
      url = j.get("jobUrl") or j.get("applyUrl")
    else:
      title = (j.get("title") or "").strip()
      loc = (j.get("location") or {}).get("name","") or ""
      is_nyc = bool(NYC.search(loc))
      url = j.get("absolute_url")
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
    matches = filter_jobs(ats, raw)
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
