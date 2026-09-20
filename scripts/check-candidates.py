#!/usr/bin/env python3
"""check-candidates.py — validate the CANDIDATES invariants.

    python3 scripts/check-candidates.py

Exits non-zero and names every offender when one is broken. Run it after any
edit to CANDIDATES, and especially after renaming a drafted company to match
what its board calls itself: that rename happens *after* the dedupe, so it can
re-introduce a duplicate the dedupe had already cleared. That has slipped
through three separate sweeps (Genius, Cocoon, Tubi), which is why it lives in
a script now instead of a comment.
"""
import importlib.util, re, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("refresh", HERE / "refresh-companies.py")
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
C = R.CANDIDATES

# Two companies genuinely share each of these names; they are not duplicates.
ALLOWED_DUPLICATE_NAMES = {"camber"}
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())

fail = []
def check(label, offenders):
    if offenders:
        fail.append(f"{label}: {len(offenders)}")
        for o in offenders[:20]:
            print(f"  {label}: {o}", file=sys.stderr)

check("wrong arity", [c[0] for c in C if len(c) != 11])
check("duplicate id", [k for k, v in Counter(c[0] for c in C).items() if v > 1])
check("duplicate (ats, slug)",
      [k for k, v in Counter((c[2], c[3]) for c in C).items() if v > 1])
check("duplicate company name",
      [k for k, v in Counter(norm(c[1]) for c in C).items()
       if v > 1 and k not in ALLOWED_DUPLICATE_NAMES])
check("empty id/name/ats/slug", [c[0] for c in C if not all(c[:4])])
check("unknown ats", [f"{c[0]} -> {c[2]}" for c in C
                      if c[2] not in {"ashby", "greenhouse", "lever", "workable",
                                      "smartrecruiters", "teamtailor", "workday"}])

print(f"CANDIDATES: {len(C)}")
if fail:
    print("FAILED: " + "; ".join(fail), file=sys.stderr)
    sys.exit(1)
print("all invariants hold")
