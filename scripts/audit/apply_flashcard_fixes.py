#!/usr/bin/env python3
"""Apply the 37 flashcard fixes from the parallel audit to js/data.js.
Each fix file is a JSON list of {id, issue, new_q?, new_a?} entries.
Also handles the fc-cli-8 / fc-cl-8 duplicate-ID collision by renaming
fc-cli-8 → fc-cli-9 (the audit flagged it as a key conflict; the cli
namespace already has fc-cli-1..7 so 9 is the next free)."""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "js" / "data.js"

# Load all fix files
fixes = []
for n in range(1, 5):
    p = ROOT / "scripts" / "audit" / f"flashcards_fixes_{n}.json"
    fixes.extend(json.loads(p.read_text()))

text = DATA.read_text()
applied = 0
missing = []

# Find the FLASHCARDS block bounds so we don't accidentally edit a
# lookalike pattern elsewhere in the file.
m = re.search(r"const FLASHCARDS = \[(.*?)\n\];", text, re.S)
fc_start, fc_end = m.start(1), m.end(1)
fc_block = text[fc_start:fc_end]

def js_str(s):
    # The fix files use \\' for embedded apostrophes (so they survive
    # one round of JSON unescape and one round of going into a JS
    # single-quoted literal). After json.loads, \\' became \'. We need
    # to ensure any RAW apostrophe inside the string becomes \'. Same
    # for backslashes — but the audit agents were told not to use \n
    # etc., so we keep this simple.
    return s.replace("\\", "\\\\").replace("'", "\\'")

for fix in fixes:
    cid = fix["id"]
    # Find this card's full entry in the flashcards block
    pat = re.compile(
        r"(\{\s*id:'" + re.escape(cid) + r"',\s*cat:'[^']+',\s*q:')"
        r"([^']*(?:\\'[^']*)*)"      # current q
        r"(',\s*a:')"
        r"([^']*(?:\\'[^']*)*)"      # current a
        r"(\'\s*\})"
    )
    m2 = pat.search(fc_block)
    if not m2:
        missing.append(cid)
        continue
    new_q = fix.get("new_q") or m2.group(2)
    new_a = fix.get("new_a") or m2.group(4)
    # The values from JSON already have backslash-escapes appropriate
    # for going into a single-quoted JS string (the audit prompt told
    # agents to use \\' for apostrophes). We trust that contract.
    replacement = m2.group(1) + new_q + m2.group(3) + new_a + m2.group(5)
    fc_block = fc_block[:m2.start()] + replacement + fc_block[m2.end():]
    applied += 1

# Structural: rename fc-cli-8 → fc-cli-9 to break the collision with fc-cl-8
fc_block, n_renames = re.subn(r"\{\s*id:'fc-cli-8'", "{ id:'fc-cli-9'", fc_block, count=1)

# Splice back
text = text[:fc_start] + fc_block + text[fc_end:]
DATA.write_text(text)

print(f"Applied {applied}/{len(fixes)} fixes")
print(f"Renames: fc-cli-8 → fc-cli-9 (count={n_renames})")
if missing:
    print(f"MISSING (not found in flashcards block): {missing}")
