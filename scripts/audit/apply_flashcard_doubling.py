#!/usr/bin/env python3
"""Merge the 10 fc_audit_*.json files into js/data.js.

For each existing card: rewrite as {id, cat, module, lesson, q, a} (module
derived from lesson via the catalog).

For each new card: append to the FLASHCARDS array with the same field order.

Validates:
  - Every lesson id referenced exists in the catalog.
  - No duplicate card ids.
  - JSON parses cleanly.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "js" / "data.js"
AUDIT = ROOT / "scripts" / "audit"

# ---- Load lesson catalog -> {lesson_id: module_id} ----
catalog = json.loads((AUDIT / "lessons_catalog.json").read_text())
lesson_to_module = {l["id"]: l["module_id"] for l in catalog}
valid_lesson_ids = set(lesson_to_module.keys())

# ---- Load all audit files ----
CATS = ["ai","behav","client","cloud","coding","data","decomp","domain","meta","sysd"]
updates = {}   # id -> {lesson, module, q?, a?}
new_cards = []  # list of {id, cat, module, lesson, q, a}

errors = []

for cat in CATS:
    p = AUDIT / f"fc_audit_{cat}.json"
    if not p.exists():
        errors.append(f"MISSING audit file: {p}")
        continue
    payload = json.loads(p.read_text())
    for u in payload["updates"]:
        cid = u["id"]
        lesson = u["lesson"]
        if lesson not in valid_lesson_ids:
            errors.append(f"[{cat}] update {cid}: lesson {lesson!r} not in catalog")
            continue
        if cid in updates:
            errors.append(f"[{cat}] duplicate update for {cid}")
            continue
        updates[cid] = {
            "lesson": lesson,
            "module": lesson_to_module[lesson],
            "q": u.get("q"),
            "a": u.get("a"),
        }
    for n in payload["new_cards"]:
        lesson = n["lesson"]
        if lesson not in valid_lesson_ids:
            errors.append(f"[{cat}] new card {n['id']}: lesson {lesson!r} not in catalog")
            continue
        new_cards.append({
            "id": n["id"],
            "cat": n["cat"],
            "module": lesson_to_module[lesson],
            "lesson": lesson,
            "q": n["q"],
            "a": n["a"],
        })

# Check new-card id uniqueness across all new cards
seen_new = set()
for nc in new_cards:
    if nc["id"] in seen_new:
        errors.append(f"duplicate new-card id: {nc['id']}")
    seen_new.add(nc["id"])

# ---- Read data.js and find FLASHCARDS block ----
text = DATA.read_text()
m = re.search(r"const FLASHCARDS = \[(.*?)\n\];", text, re.S)
if not m:
    sys.exit("ERROR: could not locate FLASHCARDS block in js/data.js")
fc_start, fc_end = m.start(1), m.end(1)
fc_block = text[fc_start:fc_end]

# ---- Parse existing cards to know their q/a ----
card_re = re.compile(
    r"(\{\s*id:'([^']+)',\s*cat:'([^']+)',\s*"
    r"q:'((?:[^'\\]|\\.)*)',\s*"
    r"a:'((?:[^'\\]|\\.)*)'\s*\})",
    re.S
)
existing = {}
existing_ids = []
for cm in card_re.finditer(fc_block):
    full, cid, cat, q, a = cm.groups()
    existing[cid] = {"full": full, "cat": cat, "q": q, "a": a, "span": (cm.start(), cm.end())}
    existing_ids.append(cid)

# Check that every update has a matching existing card
missing_updates = [cid for cid in updates if cid not in existing]
if missing_updates:
    errors.append(f"updates reference non-existent cards: {missing_updates}")

# Check that no new card id collides with an existing card id
for nc in new_cards:
    if nc["id"] in existing:
        errors.append(f"new card id {nc['id']} already exists")

if errors:
    print("ABORTING due to errors:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

# ---- JS string escape ----
def jss(s):
    """Escape a Python string for embedding in a JS single-quoted literal.
    Order matters: backslash FIRST, then apostrophe."""
    if s is None:
        return None
    return s.replace("\\", "\\\\").replace("'", "\\'")

# ---- Rebuild each existing card with module + lesson (and optional q/a override) ----
# We must rewrite the entire card-by-id replacement in fc_block.
# Work from END to START so spans don't shift.
sorted_existing = sorted(existing.items(), key=lambda kv: kv[1]["span"][0], reverse=True)
for cid, info in sorted_existing:
    if cid not in updates:
        # No lesson assigned (shouldn't happen — all cards should be in updates).
        # Leave as-is so we don't blank out content.
        print(f"WARN: no update for existing card {cid} -- leaving unchanged")
        continue
    u = updates[cid]
    new_q = u["q"] if u["q"] is not None else info["q"]   # already escaped form
    new_a = u["a"] if u["a"] is not None else info["a"]
    # If u["q"] / u["a"] came from JSON, they have raw apostrophes -> escape.
    # The existing info["q"] is already the raw JS-escaped form from the file.
    if u["q"] is not None:
        new_q = jss(u["q"])
    if u["a"] is not None:
        new_a = jss(u["a"])
    new_card = (
        "{ id:'" + cid + "', "
        "cat:'" + info["cat"] + "', "
        "module:'" + u["module"] + "', "
        "lesson:'" + u["lesson"] + "', "
        "q:'" + new_q + "', "
        "a:'" + new_a + "' }"
    )
    s, e = info["span"]
    fc_block = fc_block[:s] + new_card + fc_block[e:]

# ---- Append new cards ----
# fc_block currently ends after the final card entry; the closing `];` is OUTSIDE
# the captured span. We need to append new cards followed by commas.
# Look at the trailing characters of fc_block: it ends with a comma if the last
# raw line had a trailing comma. Standard pattern in data.js: each card line
# ends with a comma, so the block tail is "...},\n  ". We'll add new cards each
# on their own line with a trailing comma.
new_block_chunks = []
for nc in new_cards:
    line = (
        "  { id:'" + nc["id"] + "', "
        "cat:'" + nc["cat"] + "', "
        "module:'" + nc["module"] + "', "
        "lesson:'" + nc["lesson"] + "', "
        "q:'" + jss(nc["q"]) + "', "
        "a:'" + jss(nc["a"]) + "' },"
    )
    new_block_chunks.append(line)

# Ensure fc_block ends with newline before we append
fc_block = fc_block.rstrip()
if not fc_block.endswith(","):
    fc_block = fc_block + ","
fc_block = fc_block + "\n" + "\n".join(new_block_chunks)

# ---- Splice back into data.js ----
new_text = text[:fc_start] + fc_block + text[fc_end:]
DATA.write_text(new_text)

print(f"Applied {len(updates)} updates")
print(f"Appended {len(new_cards)} new cards")
print(f"Total cards now: {len(existing_ids) + len(new_cards)}")
