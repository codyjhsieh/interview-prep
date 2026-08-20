#!/usr/bin/env python3
"""append-candidates.py — turn discover-ats.py output into CANDIDATES tuples.

  python3 scripts/append-candidates.py found.json --header "2026-08-20 — sweep"
  python3 scripts/append-candidates.py found.json --dry --limit 300

Appends one tuple per discovered company to the end of CANDIDATES in
scripts/refresh-companies.py, under a dated batch header. Only companies whose
board actually fetched appear in discover-ats.py's output, so every slug
written here is one that resolved against a live ATS.

Funding fields (stage / raised / lead / badges) are written empty. They are
hand-curated from disclosed rounds elsewhere in CANDIDATES, and inventing them
for a few hundred companies would put made-up numbers on the cards. The UI
skips empty ones. Fill them in later for companies worth the research.
"""
import argparse, ast, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE / "refresh-companies.py"

VERTICALS = {"ai", "fintech", "consumer", "saas", "devtools", "infra", "health",
             "hft", "marketplace", "media", "crypto", "proptech", "gaming",
             "adtech", "aerospace", "defense", "robotics", "automotive", "ed"}


def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "company"


def existing_ids(src):
    tree = ast.parse(src)
    for n in tree.body:
        if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "CANDIDATES":
            return {e.elts[0].value for e in n.value.elts}
    raise SystemExit("CANDIDATES not found")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("found")
    ap.add_argument("--header", default="")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    found = json.loads(Path(args.found).read_text())
    src = TARGET.read_text()
    have = existing_ids(src)

    rows, skipped = [], []
    for f in found:
        cid = slugify(f["name"])
        if cid in have:
            skipped.append(cid); continue
        have.add(cid)
        meta = f.get("meta") or []
        vertical = meta[0] if meta and meta[0] in VERTICALS else "saas"
        sub = meta[1] if len(meta) > 1 else ""
        rows.append((cid, f["name"], f["ats"], f["slug"], vertical, sub, f["nyc"]))
        if args.limit and len(rows) >= args.limit:
            break

    # live boards first so the highest-signal additions are easy to eyeball
    rows.sort(key=lambda r: (-r[6], r[1].lower()))

    def emit(r):
        cid, name, ats, slug, vertical, sub, nyc = r
        return ('  ("%s","%s","%s","%s","%s","%s","","","",[],""),'
                % (cid, name.replace('"', r'\"'), ats, slug, vertical,
                   sub.replace('"', r'\"')))

    block = "\n".join(emit(r) for r in rows)
    header = f"  # ── {args.header} ──" if args.header else "  # ── batch ──"

    print(f"{len(rows)} new tuples ({sum(1 for r in rows if r[6])} with live NYC roles today), "
          f"{len(skipped)} duplicate ids skipped", file=sys.stderr)
    if args.dry:
        print(header); print(block[:2000]); return

    anchor = src.rindex("]\n\n# ── Regex helpers") if "]\n\n# ── Regex helpers" in src else None
    if anchor is None:
        # CANDIDATES literal ends at the first "\n]\n" after its start
        start = src.index("CANDIDATES = [")
        anchor = src.index("\n]\n", start) + 1
    out = src[:anchor] + header + "\n" + block + "\n" + src[anchor:]
    TARGET.write_text(out)
    ast.parse(out)          # fail loudly rather than leaving a broken pipeline
    print(f"appended to {TARGET.relative_to(HERE.parent)}", file=sys.stderr)


if __name__ == "__main__":
    main()
