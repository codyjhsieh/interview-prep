#!/usr/bin/env python3
"""Apply the 18 description fixes from the parallel audit to both
scripts/refresh-companies.py (CANDIDATES) and js/data.js (COMPANIES).
No drops — all entries kept; sub/notes updated; stage flipped to
Public for the 2 IPOs."""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent

# (id, new_sub, new_notes, new_stage_or_None)
FIXES = [
  # ── Acquired (keep, reframe) ──────────────────────────────────────
  ("tavily",
   "Search API for AI agents (acq. by Nebius Feb 2026)",
   "Retrieval API for AI agents. Now part of Nebius; still hiring under Tavily brand. Ranking + eval.",
   None),
  ("brex",
   "Corporate cards + spend mgmt (acq. by Capital One Apr 2026)",
   "Cards, banking, expense. Now part of Capital One; still hiring under Brex brand. PCI, ledger, large eng org.",
   None),
  ("mosaic",
   "Modern FP&A platform (acq. by HiBob Feb 2025)",
   "Strategic finance — budgeting + forecasting. Now part of HiBob HR platform; still has standalone product team.",
   None),
  ("forge",
   "Private-market liquidity (acq. by Charles Schwab Mar 2026)",
   "Secondaries trading + private-market data. Now part of Schwab; hiring under Forge brand. Markets infra + KYC.",
   None),
  ("stash",
   "Beginner investing app (Grab acquisition pending Q3 2026)",
   "Subscription-based brokerage + banking for first-time investors. Grab acquisition announced Feb 2026, closes Q3.",
   None),
  ("neon",
   "Serverless Postgres (acq. by Databricks May 2025)",
   "Branchable serverless Postgres. Now part of Databricks; product still runs standalone. Storage separation, autoscaling.",
   None),

  # ── IPO'd (keep, flip stage to Public) ────────────────────────────
  ("wealthfront",
   "Robo-advisor + cash mgmt (NASDAQ: WLTH)",
   "Public co since Dec 2025. Robo-advisor + banking at $88B+ AUM. Algorithms + compliance + UX.",
   "Public"),
  ("gemini",
   "Crypto exchange + prediction markets (NASDAQ: GEMI)",
   "Public co (GEMI) since Sept 2025. Winklevoss-led; US-focused after intl exit. Exchange + CFTC-regulated derivatives.",
   "Public"),

  # ── Pivoted products ──────────────────────────────────────────────
  ("blockworks",
   "Crypto data + analytics platform",
   "Data warehouse + market intelligence for crypto traders/institutions (post-2025 pivot away from media). Dashboards, analytics infra.",
   None),
  ("commure",
   "AI-native RCM + ambient documentation",
   "AI-native revenue cycle + ambient AI scribe + agents for health systems. Powers 130+ health systems, $25B+ in annual claims.",
   None),
  ("hopper",
   "B2B travel tech + fintech (HTS)",
   "Hopper Technology Solutions powers partners (Capital One, Uber, Nubank) with booking + travel fintech (price-freeze, cancel-for-any-reason). B2B is now majority of revenue.",
   None),
  ("hang",
   "Autonomous marketing system for brands",
   "AI-driven marketing + CDP + loyalty stack for restaurants/retailers (Ulta, ASICS, Cinemark). Identity resolution, segmentation, gamified engagement.",
   None),

  # ── Wrong vertical / mischaracterized ─────────────────────────────
  ("blee",
   "AI for marketing compliance review",
   "Enterprise AI compliance platform — legal/compliance review of marketing content in regulated industries (fintech, healthcare, pharma). LLMs + workflow + integrations.",
   None),
  ("camber",
   "AI medical billing + RCM",
   "AI revenue-cycle / claims-processing platform for healthcare clinics. Claims automation, denial prediction; behavioral-health roots, expanding verticals.",
   None),
  ("crosby",
   "AI-first law firm for contract review",
   "AI-native law firm reviewing NDAs/MSAs/DPAs for tech clients (Cursor, Clay, etc.). LLM + lawyer workflows, eval on legal accuracy.",
   None),
  ("plot",
   "AI for cultural / social-video intelligence",
   "AI-native social listening turning short-form video into real-time cultural insights. Multimodal ingestion, ranking.",
   None),
  ("slate",
   "Content + brand tools for social-media teams",
   "Brand-consistent content creation for enterprise social teams (NFL, Visa, Budweiser). In-browser/mobile studio, brand asset mgmt, direct social publishing.",
   None),
  ("sola",
   "Agentic process automation for enterprises",
   "AI-native RPA: record a workflow once, Sola turns it into an autonomous agent. Customers in logistics, legal, healthcare back-office.",
   None),
]

# ── Update scripts/refresh-companies.py ─────────────────────────────
rc_path = ROOT / "scripts" / "refresh-companies.py"
rc_text = rc_path.read_text()
rc_hits = 0
for cid, new_sub, new_notes, new_stage in FIXES:
  # Tuple format: ("id","Name","ats","slug","vertical","sub","stage","raised","lead",["badges"],"notes")
  pat = re.compile(r'(\(\s*"' + re.escape(cid) + r'"\s*,\s*"[^"]+"\s*,\s*"[^"]+"\s*,\s*"[^"]+"\s*,\s*"[^"]+"\s*,\s*")[^"]*("\s*,\s*")[^"]*("\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*\[[^\]]*\]\s*,\s*")[^"]*("\s*\))')
  m = pat.search(rc_text)
  if m:
    if new_stage:
      rc_text = pat.sub(lambda mm: mm.group(1) + new_sub + mm.group(2) + new_stage + mm.group(3) + new_notes + mm.group(4), rc_text)
    else:
      rc_text = pat.sub(lambda mm: mm.group(1) + new_sub + mm.group(2) + mm.group(0).split('","')[6] + mm.group(3) + new_notes + mm.group(4), rc_text)
    rc_hits += 1
  else:
    print(f"  MISS in refresh-companies.py: {cid}")

# Simpler: just do per-cid sub/notes find+replace in both files using
# the existing string content. The complex regex above is brittle.

rc_text = rc_path.read_text()
rc_hits = 0
data_path = ROOT / "js" / "data.js"
data_text = data_path.read_text()
data_hits = 0

def replace_field(text, cid, field_re, new_value, sentinel_re):
  """Within the block belonging to `cid`, replace the FIRST occurrence
     of field_re (the entire match) with new_value. sentinel_re tells
     us where the block ends so we don't bleed into the next entry."""
  # Find the block: from the cid marker to the sentinel
  cid_marker = re.search(r'\("' + re.escape(cid) + r'"', text)
  if not cid_marker:
    cid_marker = re.search(r'\{\s*id:"' + re.escape(cid) + r'"', text)
  if not cid_marker:
    return text, False
  start = cid_marker.start()
  # Find end of this entry — next entry start, OR closing bracket
  end_m = sentinel_re.search(text, start + 1)
  end = end_m.start() if end_m else len(text)
  block = text[start:end]
  new_block, n = field_re.subn(new_value, block, count=1)
  if n == 0:
    return text, False
  return text[:start] + new_block + text[end:], True

# Sentinels: next tuple in refresh-companies, next entry-open in data.js
rc_sentinel = re.compile(r'\n  \("[a-z0-9\-]+"\s*,')
data_sentinel = re.compile(r'\n  \{ id:"[a-z0-9\-]+",')

for cid, new_sub, new_notes, new_stage in FIXES:
  # refresh-companies.py uses tuple format with sub/notes as 6th and 11th items
  # Replace sub (1st quoted string after vertical)
  sub_field = re.compile(r'"' + re.escape(cid) + r'","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]*)","([^"]*)","([^"]*)",(\[[^\]]*\]),"([^"]*)"')
  m = sub_field.search(rc_text)
  if m:
    new_stage_val = new_stage if new_stage else m.group(6)
    replacement = '"' + cid + '","' + m.group(1) + '","' + m.group(2) + '","' + m.group(3) + '","' + m.group(4) + '","' + new_sub + '","' + new_stage_val + '","' + m.group(7) + '","' + m.group(8) + '",' + m.group(9) + ',"' + new_notes + '"'
    rc_text = rc_text[:m.start()] + replacement + rc_text[m.end():]
    rc_hits += 1
  else:
    print(f"  MISS in refresh-companies.py: {cid}")

  # data.js entries: find { id:"<cid>", ... } block and replace sub: and notes: fields within it
  data_pat = re.compile(r'(\{\s*id:"' + re.escape(cid) + r'",[\s\S]*?)\nrelated_companies')
  # Actually use sentinel
  m = re.search(r'\{\s*id:"' + re.escape(cid) + r'",', data_text)
  if m:
    # Find end of this block — look for the next "  { id:" or "];"
    end_m = re.search(r'\n  \{ id:"|\n\];', data_text[m.start() + 1:])
    end = (m.start() + 1) + end_m.start() if end_m else len(data_text)
    block = data_text[m.start():end]
    # Replace sub: and notes: and (if applicable) stage:
    new_block = re.sub(r'sub:"[^"]*"', f'sub:"{new_sub}"', block, count=1)
    new_block = re.sub(r'notes:"[^"]*"', f'notes:"{new_notes}"', new_block, count=1)
    if new_stage:
      new_block = re.sub(r'stage:"[^"]*"', f'stage:"{new_stage}"', new_block, count=1)
    if new_block != block:
      data_text = data_text[:m.start()] + new_block + data_text[end:]
      data_hits += 1
  else:
    print(f"  MISS in data.js: {cid}")

rc_path.write_text(rc_text)
data_path.write_text(data_text)
print(f"\nrefresh-companies.py: {rc_hits}/{len(FIXES)} updated")
print(f"js/data.js:           {data_hits}/{len(FIXES)} updated")
