#!/usr/bin/env python3
"""Re-implements companyFitScore (js/views.js:4376-4459) in Python and
produces a distribution histogram across the live COMPANIES list.
Used to verify the new user-preference layer isn't squashing the
score into a narrow band."""
import re, pathlib, collections, sys

src = pathlib.Path(__file__).resolve().parent.parent / "js" / "data.js"
text = src.read_text()
m = re.search(r"const COMPANIES = (\[.*?^\]);\s*\n", text, re.S | re.M)
block = m.group(1)

# Each company tuple — extract just the fields needed for scoring
cos = []
for entry in re.finditer(r"\{\s*id:\"([^\"]+)\",\s*name:\"([^\"]+)\",\s*vertical:\"([^\"]+)\",[\s\S]*?(?=\n  \{ id:|\n\];)", block):
    obj = entry.group(0)
    cid, name, vertical = entry.group(1), entry.group(2), entry.group(3)
    stage  = (re.search(r'stage:"([^"]*)"',  obj) or [None,""])[1]
    raised = (re.search(r'raised:"([^"]*)"', obj) or [None,""])[1]
    sub    = (re.search(r'sub:"([^"]*)"',    obj) or [None,""])[1]
    notes  = (re.search(r'notes:"([^"]*)"',  obj) or [None,""])[1]
    levels = re.findall(r'level:"([^"]+)"', obj)
    cos.append({"id":cid,"name":name,"vertical":vertical,"stage":stage,
                "raised":raised,"sub":sub,"notes":notes,"levels":levels})

ELITE = {'openai','anthropic','stripe','figma','notion','cognition','cursor','perplexity','cohere','glean','sierra','jane-street','scaleai','ramp','airtable'}
HEAVY = {'plaid','brex','mercury','datadog','mongodb','vercel','attentive','gusto','carta','hopper','patreon','seatgeek','navan','block','metropolis','spotify','reddit','lyft','peloton','chime','robinhood','sofi','asana','iterable','braze','squarespace','talkspace','oscar'}

CRYPTO_RE   = re.compile(r"\b(crypto|web3|blockchain|nft|defi|on-?chain|cryptocurrency|tokeniz|stablecoin)\b", re.I)
CREATIVE_RE = re.compile(r"\b(creative|design|video|image|music|audio|film|content creator|filmmaker|generative.*(video|image|audio|music)|3d|animation|publishing)\b", re.I)
HOSP_RE     = re.compile(r"\b(travel|hotel|restaurant|dining|hospitality|airline|trip|reservation)\b", re.I)

def score(c):
    s = 35
    v = c["vertical"]
    if v == 'ai': s += 14
    elif v in ('devtools','infra'): s += 7
    elif v == 'fintech': s += 2
    elif v in ('health','saas'): s += 0
    else: s -= 2

    st = (c["stage"] or "").lower()
    if re.search(r'seed', st): s += 22
    elif re.search(r'series a\b', st): s += 18
    elif re.search(r'series b\b', st): s += 11
    elif re.search(r'series c\b', st): s += 3
    elif re.search(r'series d\b', st): s -= 5
    elif re.search(r'series e\b', st): s -= 7
    elif re.search(r'series [fghij]\b|late|take-private', st): s -= 10
    elif re.search(r'public', st): s -= 12

    r = c["raised"] or ""
    num = float(re.sub(r'[^\d.]','', r) or 0)
    if 'B' in r and num >= 5: s -= 10
    elif 'B' in r and num >= 1: s -= 7
    elif 'B' in r: s -= 4
    elif num >= 500: s -= 3
    elif num >= 200: s -= 1
    elif num <= 30: s += 6

    if c["id"] in ELITE: s -= 16
    if c["id"] in HEAVY: s -= 8
    if 'founding' in c["levels"]: s += 12

    blob = (c["sub"] + " " + c["notes"]).lower()
    if CRYPTO_RE.search(blob):                       s -= 15
    if v == 'media' or CREATIVE_RE.search(blob):     s += 10
    if v == 'hospitality' or HOSP_RE.search(blob):   s += 10

    return max(15, min(85, round(s)))

scored = [(c["name"], c["vertical"], score(c), c["id"]) for c in cos]
scored.sort(key=lambda x: -x[2])

buckets = collections.Counter()
for _, _, s, _ in scored:
    buckets[(s // 5) * 5] += 1
print(f"Total companies: {len(scored)}\n")
print("Score distribution (5-point buckets, bar = 1 company):")
for low in sorted(buckets, reverse=True):
    bar = "#" * buckets[low]
    print(f"  {low:>3}-{low+4:<3}  {buckets[low]:>3}  {bar}")
print()
total = sum(s for _,_,s,_ in scored)
print(f"Mean:   {total/len(scored):.1f}")
print(f"Median: {sorted(s for _,_,s,_ in scored)[len(scored)//2]}")
print(f"Min:    {min(s for _,_,s,_ in scored)}")
print(f"Max:    {max(s for _,_,s,_ in scored)}")
print(f"At cap (85):   {sum(1 for _,_,s,_ in scored if s >= 85)}")
print(f"At floor (3):  {sum(1 for _,_,s,_ in scored if s <= 3)}")
print()
print("Top 15:")
for name, v, s, cid in scored[:15]:
    print(f"  {s:>3}  {name:30s}  [{v}]")
print()
print("Bottom 10:")
for name, v, s, cid in scored[-10:]:
    print(f"  {s:>3}  {name:30s}  [{v}]")
