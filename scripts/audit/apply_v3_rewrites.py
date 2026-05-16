#!/usr/bin/env python3
"""Apply the 374 v3 rewrites (Q + A) from fc_v3_*.json files into js/data.js.

Each card keeps its existing id/cat/module/lesson. Only q and a are
replaced. Strings come in with raw newlines and apostrophes — both need
escaping for the JS single-quoted literal.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "js" / "data.js"
AUDIT = ROOT / "scripts" / "audit"

CATS = ["ai","behav","client","cloud","coding","data","decomp","domain","meta","sysd"]
rewrites = {}  # id -> {q, a}
for cat in CATS:
    payload = json.loads((AUDIT / f"fc_v3_{cat}.json").read_text())
    for r in payload["rewrites"]:
        if r["id"] in rewrites:
            print(f"DUP: {r['id']}")
        rewrites[r["id"]] = {"q": r["q"], "a": r["a"]}

print(f"Loaded {len(rewrites)} rewrites")

text = DATA.read_text()
m = re.search(r"const FLASHCARDS = \[(.*?)\n\];", text, re.S)
if not m:
    sys.exit("ERROR: FLASHCARDS block not found")
fc_start, fc_end = m.start(1), m.end(1)
fc_block = text[fc_start:fc_end]

card_re = re.compile(
    r"(\{\s*id:'([^']+)',\s*cat:'[^']+',\s*module:'[^']+',\s*lesson:'[^']+',\s*"
    r"q:')((?:[^'\\]|\\.)*)('),\s*a:'((?:[^'\\]|\\.)*)('\s*\})",
    re.S
)

def jss(s):
    """Escape a Python string for a JS single-quoted literal."""
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")

applied = 0
missing = []

def replace_card(m2):
    global applied
    cid = m2.group(2)
    if cid not in rewrites:
        missing.append(cid)
        return m2.group(0)
    new_q = jss(rewrites[cid]["q"])
    new_a = jss(rewrites[cid]["a"])
    applied += 1
    return m2.group(1) + new_q + m2.group(4) + ", a:'" + new_a + m2.group(6)

fc_block_new = card_re.sub(replace_card, fc_block)

text_new = text[:fc_start] + fc_block_new + text[fc_end:]
DATA.write_text(text_new)

print(f"Applied {applied} rewrites")
if missing:
    print(f"MISSING in data.js but present in rewrites: {sorted(missing)[:20]}")

# Cards in rewrites not in data.js
parsed_ids = set()
for cm in card_re.finditer(fc_block):
    parsed_ids.add(cm.group(2))
extra = set(rewrites) - parsed_ids
if extra:
    print(f"Rewrites for unknown cards: {sorted(extra)[:20]}")
