#!/usr/bin/env python3
"""discover-ats.py — find a company's real ATS board from its name alone.

  python3 scripts/discover-ats.py names.txt --json found.json
  python3 scripts/discover-ats.py names.txt --workers 20 -v

Guessing "company X is probably on Greenhouse under slug x" is wrong more
often than right: of 98 hand-guessed slugs in the 2026-08-20 batch, 55 were
dead. This tries every plausible slug against every supported ATS instead,
and reports the one that actually returns a board.

For each name it builds slug variants (squashed, hyphenated, with common
suffixes added or stripped) and probes them across Ashby, Greenhouse, Lever,
Workable, and SmartRecruiters, stopping at the first board that returns
postings. Workday is skipped: its slug is a tenant/site triple that cannot be
guessed from a company name.

fetch() and filter_jobs() are imported from refresh-companies.py rather than
copied, so a hit here means exactly what it will mean during a refresh.
(scripts/probe-slugs.py predates this and carries its own stale copies of the
title regexes — prefer this tool.)
"""
import argparse, json, re, sys
import concurrent.futures as cf
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("refresh", HERE / "refresh-companies.py")
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)

PLATFORMS = ["ashby", "greenhouse", "lever", "workable", "smartrecruiters"]
# Suffixes companies add or drop between their brand and their ATS slug.
SUFFIXES = ["", "ai", "hq", "inc", "labs", "app", "io", "tech", "health"]
NOISE = re.compile(r"\b(inc|llc|ltd|corp|corporation|technologies|technology|"
                   r"labs|lab|group|holdings|company|co)\b\.?", re.I)


def variants(name):
    """Plausible ATS slugs for a display name, most likely first."""
    base = NOISE.sub("", name).strip()
    words = re.findall(r"[A-Za-z0-9]+", base.lower())
    if not words:
        return []
    squashed = "".join(words)
    hyphened = "-".join(words)
    out = [squashed, hyphened]
    # first word alone ("Ramp Financial" -> "ramp") and the full original name
    full = "".join(re.findall(r"[A-Za-z0-9]+", name.lower()))
    out += [words[0], full]
    for suf in SUFFIXES[1:]:
        out += [squashed + suf, f"{hyphened}-{suf}"]
        if squashed.endswith(suf) and len(squashed) > len(suf):
            out.append(squashed[: -len(suf)])
    seen, uniq = set(), []
    for v in out:
        if v and v not in seen and len(v) > 1:
            seen.add(v); uniq.append(v)
    return uniq[:12]


def discover(item):
    """item is (name,) or (name, hint_ats, hint_slug). Returns a dict or None."""
    name = item[0]
    hints = []
    # 'Name|ats|slug' is a hint; 'Name|vertical|sub' is metadata carried
    # through for the caller and ignored here. Tell them apart by platform.
    if len(item) >= 3 and item[1] in PLATFORMS and item[2]:
        hints = [(item[1], item[2])]
    tries = hints + [(p, v) for v in variants(name) for p in PLATFORMS]
    for ats, slug in tries:
        try:
            raw = R.fetch(ats, slug)
        except Exception:
            continue
        if not raw:
            continue
        matches = R.filter_jobs(ats, raw, slug)
        meta = list(item[1:]) if (len(item) > 1 and item[1] not in PLATFORMS) else []
        return {"name": name, "ats": ats, "slug": slug,
                "board": len(raw), "hits": len(matches), "meta": meta,
                "titles": [m["title"] for m in matches[:3]]}
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", help="file with one company name per line "
                                  "(optionally 'Name|ats|slug' to try a hint first)")
    ap.add_argument("--json", default="")
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    items = []
    for line in Path(args.names).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        items.append(tuple(p.strip() for p in line.split("|")))

    print(f"discovering {len(items)} companies across {len(PLATFORMS)} ATS platforms…",
          file=sys.stderr)
    found = []
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for res in ex.map(discover, items):
            if res:
                found.append(res)
                if args.verbose:
                    print(f"  {res['name']:30s} {res['ats']}:{res['slug']:24s} "
                          f"board={res['board']:4d} hits={res['hits']}", file=sys.stderr)

    live = [f for f in found if f["hits"]]
    print(f"\nfound boards: {len(found)}/{len(items)}   with live eng roles in a "
          f"covered city: {len(live)}",
          file=sys.stderr)
    if args.json:
        Path(args.json).write_text(json.dumps(found, indent=1))
        print(f"wrote {args.json}", file=sys.stderr)


if __name__ == "__main__":
    main()
