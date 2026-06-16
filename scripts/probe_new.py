#!/usr/bin/env python3
"""Probe a batch of NEW candidate companies' ATS boards and report which have
live NYC engineering postings. Reuses refresh-companies.py's fetch/filter so the
filtering matches exactly. Does NOT modify data.js — discovery only.

  python3 scripts/probe_new.py            # probe all NEW_CANDIDATES
  python3 scripts/probe_new.py -v         # also show matched job titles
"""
import importlib.util, sys, concurrent.futures as cf
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("refresh", HERE / "refresh-companies.py")
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)

EXISTING = set(R.__dict__.get("_ids", []))
# pull existing candidate ids straight from the loaded CANDIDATES
EXISTING = {c[0] for c in R.CANDIDATES}

# (id, name, ats, slug, vertical, sub, stage, raised, lead, badges, notes)
# Best-guess ATS slugs for NYC-relevant companies; the probe validates them.
NEW = [
  # ── Fintech / crypto (heavy NYC) ─────────────────────────────────────
  ("circle","Circle","greenhouse","circle","fintech","USDC stablecoin (NYSE: CRCL)","Public","$1.1B","NYSE",["NYSE","General Catalyst"],"NYC fintech. Stablecoin infra + payments APIs; systems + security depth."),
  ("paxos","Paxos","greenhouse","paxos","fintech","Regulated stablecoin + crypto infra","Series D","$540M","Oak HC/FT",["Oak HC/FT","Declaration","PayPal Ventures"],"NYC regulated crypto. Ledger systems + custody + compliance APIs."),
  ("ondo","Ondo Finance","greenhouse","ondofinance","fintech","Tokenized real-world assets","Series A","$34M","Founders Fund",["Founders Fund","Pantera","Coinbase Ventures"],"NYC crypto. RWA tokenization; on-chain finance protocols."),
  ("consensys","Consensys","greenhouse","consensys","fintech","Ethereum software (MetaMask, Infura)","Series D","$726M","ParaFi",["ParaFi","Microsoft","Temasek"],"NYC web3 infra. MetaMask + Infura; wallet + node systems."),
  ("avalabs","Ava Labs","greenhouse","avalabs","fintech","Avalanche blockchain","Series B","$290M","Polychain",["Polychain","a16z","Three Arrows"],"NYC crypto. Avalanche L1 protocol + subnets; distributed systems."),
  ("current","Current","greenhouse","current","fintech","Consumer neobank","Series D","$400M","Andreessen Horowitz",["a16z","Tiger","Wellington"],"NYC consumer fintech. Banking core + card processing + mobile."),
  ("moneylion","MoneyLion","greenhouse","moneylion","fintech","Consumer finance platform (NYSE: ML)","Public","$470M","Edison Partners",["Edison","Greenspring"],"NYC fintech. Lending + marketplace; data + recommendation eng."),
  ("rho","Rho","greenhouse","rho","fintech","Business banking + spend mgmt","Series B","$200M","Dragoneer",["Dragoneer","DFJ Growth"],"NYC fintech. Corporate cards + treasury; payments systems."),
  ("yieldstreet","Yieldstreet","greenhouse","yieldstreet","fintech","Alternative investments platform","Series C","$280M","Tarsadia",["Tarsadia","Edison","Greycroft"],"NYC fintech. Alt-asset marketplace; payments + portfolio systems."),
  ("capchase","Capchase","greenhouse","capchase","fintech","Revenue-based financing for SaaS","Series B","$110M","QED",["QED","Bling","SciFi VC"],"NYC fintech. Underwriting models + lending APIs."),
  ("slope","Slope","ashby","slope","fintech","B2B payments + BNPL","Series A","$30M","Union Square Ventures",["USV","Y Combinator"],"NYC fintech. B2B checkout + underwriting; payments rails."),
  ("parafin","Parafin","ashby","parafin","fintech","Embedded SMB financing","Series B","$94M","GIC",["GIC","Ribbit","Thrive"],"Embedded capital for platforms; underwriting + payments APIs."),

  # ── Healthcare (NYC strong) ──────────────────────────────────────────
  ("cedar","Cedar","greenhouse","cedar","health","Patient billing + payments","Series D","$350M","Andreessen Horowitz",["a16z","Thrive","Tiger"],"NYC healthtech. Patient financial experience; payments + data eng."),
  ("spring-health","Spring Health","greenhouse","springhealth","health","Mental health benefits","Series E","$466M","Kinnevik",["Kinnevik","Tiger","RRE"],"NYC mental health. Care matching + ML; provider platform."),
  ("capital-rx","Capital Rx","greenhouse","capitalrx","health","Pharmacy benefits (PBM)","Series C","$130M","General Atlantic",["General Atlantic","B Capital"],"NYC healthtech. Judi claims-adjudication platform; high-throughput systems."),
  ("komodo-health","Komodo Health","greenhouse","komodohealth","health","Healthcare data + analytics","Series E","$314M","Tiger",["Tiger","Andreessen","SoftBank"],"NYC/SF healthtech. Healthcare map + analytics; large-scale data eng."),
  ("flatiron-health","Flatiron Health","greenhouse","flatironhealth","health","Oncology data + EHR","Acquired (Roche)","$313M","Roche",["Roche","GV","First Round"],"NYC oncology data. Clinical EHR + real-world evidence; data eng heavy."),
  ("cohere-health","Cohere Health","greenhouse","coherehealth","health","Clinical intelligence + prior auth","Series C","$156M","Temasek",["Temasek","Polaris","Deerfield"],"Care-pathway automation; clinical data + ML."),

  # ── Adtech / media / marketplace (NYC) ───────────────────────────────
  ("1stdibs","1stDibs","greenhouse","1stdibs","marketplace","Luxury design marketplace (NASDAQ: DIBS)","Public","$253M","NASDAQ",["NASDAQ","Index","Spark"],"NYC marketplace. Luxury goods; search + payments + trust."),
  ("via","Via","greenhouse","via","marketplace","Transit tech platform","Series G","$988M","Janus Henderson",["83North","Exor","Pitango"],"NYC mobility. Transit routing + optimization; logistics systems."),
  ("dataminr","Dataminr","greenhouse","dataminr","ai","Real-time event detection AI","Series F","$1B+","Fidelity",["Fidelity","Valor","8VC"],"NYC AI. Real-time signal detection from public data; streaming + ML."),
  ("taboola","Taboola","greenhouse","taboola","adtech","Content recommendation (NASDAQ: TBLA)","Public","$160M","NASDAQ",["NASDAQ","Comcast"],"NYC adtech. Recommendation engine at massive scale; ranking systems."),
  ("integral-ad-science","Integral Ad Science","greenhouse","integraladscience","adtech","Ad verification (NASDAQ: IAS)","Public","$256M","NASDAQ",["NASDAQ","Vista"],"NYC adtech. Ad measurement + fraud; high-volume data pipelines."),
  ("vimeo","Vimeo","greenhouse","vimeo","media","Video hosting platform (NASDAQ: VMEO)","Public","$300M","NASDAQ",["NASDAQ","IAC"],"NYC media. Video infra + creator tools; streaming + transcoding."),
  ("digitalocean","DigitalOcean","greenhouse","digitalocean","infra","Cloud for developers (NYSE: DOCN)","Public","$300M","NYSE",["NYSE","Access","IA Ventures"],"NYC cloud infra. Developer cloud; distributed systems + networking."),

  # ── Dev tools / SaaS / data ──────────────────────────────────────────
  ("hex","Hex","ashby","hex","saas","Collaborative analytics notebooks","Series B","$96M","Andreessen Horowitz",["a16z","Sequoia","Amplify"],"Data workspace + AI notebooks; query engines + collab."),
  ("census","Census","ashby","census","saas","Reverse ETL / data activation","Series B","$80M","Sequoia",["Sequoia","a16z","Insight"],"Data sync platform; pipelines + connectors."),
  ("hightouch","Hightouch","ashby","hightouch","saas","Data activation + AI decisioning","Series C","$91M","Bain Capital Ventures",["BCV","Amplify","ICONIQ"],"Composable CDP; reverse-ETL + audience eng."),
  ("temporal","Temporal","greenhouse","temporal","infra","Durable execution platform","Series B","$324M","Index",["Index","Sequoia","a16z"],"Workflow orchestration engine; distributed systems heavy."),
  ("cortex","Cortex","ashby","cortex","saas","Internal developer portal","Series B","$55M","Sequoia",["Sequoia","Tiger"],"Developer portal + service catalog; platform eng."),
  ("dbt-labs","dbt Labs","greenhouse","dbtlabs","saas","Analytics engineering (dbt)","Series D","$414M","Altimeter",["Altimeter","Sequoia","a16z"],"Transformation layer for the data stack; open-source + cloud."),
  ("retool","Retool","greenhouse","retool","saas","Internal tooling builder","Series C","$141M","Sequoia",["Sequoia","GIC","John Collison"],"Low-code internal apps; frontend + integration eng."),

  # ── Productivity / consumer ──────────────────────────────────────────
  ("linear","Linear","ashby","linear","saas","Issue tracking + project mgmt","Series B","$52M","Accel",["Accel","Sequoia","2020"],"Beloved dev project tool; real-time sync + performance-obsessed."),
  ("ramp-fintech","Coda","greenhouse","coda","saas","Docs + apps platform","Series D","$400M","Greylock",["Greylock","Kleiner","General Catalyst"],"All-in-one doc/app platform; collaborative editing + formula engine."),
  ("descript","Descript","ashby","descript","ai","AI audio/video editing","Series C","$100M","OpenAI Startup Fund",["a16z","Spark","OpenAI"],"AI media editing; transcription + multimodal models."),

  # ── Security ─────────────────────────────────────────────────────────
  ("snyk","Snyk","greenhouse","snyk","security","Developer security platform","Series G","$1.2B","Accel",["Accel","Tiger","ICONIQ"],"NYC presence. Dev-first security scanning; SAST/SCA at scale."),
  ("aura","Aura","greenhouse","aura","security","Consumer digital safety","Series G","$650M","Warburg Pincus",["Warburg","General Catalyst"],"Consumer identity + fraud protection; data + ML."),
  ("persona","Persona","ashby","persona","security","Identity verification platform","Series C","$217M","Coatue",["Coatue","Index","First Round"],"KYC/identity infra; verification pipelines + fraud ML."),

  # ── More NYC AI/startups ─────────────────────────────────────────────
  ("ramp-misc","Imbue","ashby","imbue","ai","AI agents for reasoning","Series B","$220M","Nvidia",["Nvidia","Astera","Kleiner"],"Reasoning-focused AI agents; training + eval infra."),
  ("contextual-ai","Contextual AI","ashby","contextualai","ai","Enterprise RAG platform","Series A","$80M","Greycroft",["Greycroft","Bain","Lightspeed"],"Enterprise RAG; retrieval + grounding eval."),
  ("you-com","You.com","ashby","youcom","ai","AI search + assistant","Series B","$99M","Georgian",["Georgian","Salesforce","Nvidia"],"AI productivity search; retrieval + agent eval."),
  ("standard-ai","Standard AI","greenhouse","standardcognition","ai","Computer vision retail","Series C","$235M","TPG",["TPG","Initialized","CRV"],"Autonomous checkout CV; edge inference + vision systems."),
  ("ramp-runwayfin","Ironclad","greenhouse","ironclad","saas","AI contract lifecycle","Series E","$333M","Accel",["Accel","Sequoia","Y Combinator"],"Contract automation + AI; document workflows."),
]


def probe(cand):
  cid, name, ats, slug = cand[0], cand[1], cand[2], cand[3]
  raw = R.fetch(ats, slug)
  jobs = R.filter_jobs(ats, raw, slug)
  return (cid, name, ats, slug, len(raw), jobs)


def main():
  verbose = "-v" in sys.argv
  dups = [c for c in NEW if c[0] in EXISTING]
  if dups:
    print("WARNING dup ids vs existing:", [c[0] for c in dups])
  cands = [c for c in NEW if c[0] not in EXISTING]
  print(f"probing {len(cands)} new candidates ({len(EXISTING)} already in list)\n")
  results = []
  with cf.ThreadPoolExecutor(max_workers=8) as ex:
    for r in ex.map(probe, cands):
      results.append(r)
  hits, raw_only, dead = [], [], []
  for cid, name, ats, slug, nraw, jobs in sorted(results, key=lambda x: -len(x[5])):
    tag = "HIT " if jobs else ("raw " if nraw else "DEAD")
    line = f"  {tag} {name:<26} {ats}/{slug:<22} raw={nraw:<4} nyc_swe={len(jobs)}"
    print(line)
    if jobs: hits.append((cid, name, len(jobs)))
    elif nraw: raw_only.append((cid, name))
    else: dead.append((cid, name, ats, slug))
    if verbose and jobs:
      for j in jobs[:6]:
        print(f"        - [{j['level']}] {j['title']}")
  print(f"\n{len(hits)} HITS (live NYC SWE), {len(raw_only)} board-ok-but-no-NYC-SWE, {len(dead)} dead/bad-slug")
  if dead:
    print("dead (fix slug or drop):", [f"{c[0]}({c[2]}/{c[3]})" for c in dead])


if __name__ == "__main__":
  main()
