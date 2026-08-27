#!/usr/bin/env python3
"""discover-workday.py — find Workday career boards from company names.

  python3 scripts/discover-workday.py names.txt --json wd.json --workers 20

discover-ats.py deliberately skips Workday: its board address is a
tenant/wdN/site triple, and the site segment cannot be guessed from a company
name the way an Ashby or Greenhouse slug can. That left the single largest ATS
uncovered — 32 of 1372 candidates — and with it most large NYC employers and
nearly all of San Diego's (Qualcomm, Illumina, Dexcom, ResMed, General Atomics).

The search is tractable because Workday's CXS endpoint distinguishes three
failure modes:

    200  valid tenant / wdN / site
    404  tenant and wdN are REAL, only the site is wrong
    422  wrong wdN, or no such tenant

So phase 1 probes each (tenant, wdN) once with a throwaway site name and keeps
only those answering 404 — a real tenant. Phase 2 enumerates site names for
just those survivors. That turns a full cross product into two cheap passes.

fetch() and filter_jobs() come from refresh-companies.py, so a reported hit
counts exactly the roles a real refresh would keep.
"""
import argparse, json, re, subprocess, sys
import concurrent.futures as cf
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("refresh", HERE / "refresh-companies.py")
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)

WDS = ["wd1", "wd5", "wd3", "wd12", "wd2", "wd10", "wd103"]
NOISE = re.compile(r"\b(inc|llc|ltd|corp|corporation|group|holdings|company|the|co)\b\.?", re.I)


def tenants(name):
    base = NOISE.sub("", name).strip()
    words = re.findall(r"[A-Za-z0-9]+", base.lower())
    if not words:
        return []
    out = ["".join(words), words[0]]
    if len(words) > 1:
        # Acronyms only from 3+ words. Two-letter tenants collide badly:
        # "ms" matched both Mount Sinai and Morgan Stanley, "ap" both Acadia
        # Pharmaceuticals and Advance Publications, and the prober happily
        # reported one company's board under the other's name.
        if len(words) >= 3:
            out.append("".join(w[0] for w in words))
        out.append("-".join(words))
    seen, uniq = set(), []
    for t in out:
        if t and t not in seen and len(t) > 1:
            seen.add(t); uniq.append(t)
    return uniq[:4]


def sites(tenant, name):
    T = tenant.capitalize()
    words = re.findall(r"[A-Za-z0-9]+", name)
    Camel = "".join(w.capitalize() for w in words)
    return [
        "External", "Careers", "careers", "External_Career_Site",
        f"{T}_Careers", f"{T}Careers", f"{T}", "ExternalCareerSite",
        f"{Camel}_Careers", f"{Camel}Careers", "External_Careers",
        "jobs", "Search", f"{tenant}", f"{T}_External_Career_Site",
        # lowercase and hyphenated forms — Illumina uses "illumina-careers",
        # which none of the capitalised variants above would ever produce.
        f"{tenant}-careers", f"{tenant}careers", f"{tenant}_careers",
        "external", "external-careers", "career-site", "CareerSite",
    ]


def status(tenant, wd, site, timeout=12):
    url = f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"
    try:
        r = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", "-m", str(timeout),
             "-X", "POST", "-H", "Content-Type: application/json",
             "-d", '{"limit":1,"offset":0,"appliedFacets":{},"searchText":""}', url],
            capture_output=True, text=True, timeout=timeout + 5)
        return int(r.stdout.strip() or 0)
    except Exception:
        return 0


def discover(item):
    name = item[0]
    meta = list(item[1:])
    # Phase 1 — which (tenant, wdN) pairs are real? 404 means real-but-wrong-site.
    live_pairs = []
    for t in tenants(name):
        for wd in WDS:
            if status(t, wd, "__probe_nonexistent__") == 404:
                live_pairs.append((t, wd))
                break                      # one wdN per tenant is enough
    if not live_pairs:
        return None
    # Phase 2 — enumerate site names on the real pairs only.
    for t, wd in live_pairs:
        for site in sites(t, name):
            if status(t, wd, site) != 200:
                continue
            slug = f"{t}/{wd}/{site}"
            try:
                raw = R.fetch("workday", slug)
            except Exception:
                continue
            m = R.filter_jobs("workday", raw, slug)
            # Guard against a tenant that belongs to a different company: the
            # company's name should appear in the site segment or somewhere in
            # the board's own postings.
            key = re.sub(r"[^a-z0-9]", "", name.lower())[:8]
            blob = re.sub(r"[^a-z0-9]", "", (site + json.dumps(raw)[:20000]).lower())
            if key and key not in blob:
                continue
            return {"name": name, "ats": "workday", "slug": slug,
                    "board": len(raw), "hits": len(m), "meta": meta,
                    "titles": [x["title"] for x in m[:3]]}
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names")
    ap.add_argument("--json", default="")
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()

    items = []
    for line in Path(args.names).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            items.append(tuple(p.strip() for p in line.split("|")))

    print(f"probing {len(items)} companies for Workday boards…", file=sys.stderr)
    found = []
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for res in ex.map(discover, items):
            if res:
                found.append(res)
                print(f"  {res['name']:30s} {res['slug']:48s} board={res['board']:5d} "
                      f"hits={res['hits']}", file=sys.stderr)

    live = [f for f in found if f["hits"]]
    print(f"\nWorkday boards found: {len(found)}/{len(items)}   with live eng roles "
          f"in a covered city: {len(live)}", file=sys.stderr)
    if args.json:
        Path(args.json).write_text(json.dumps(found, indent=1))
        print(f"wrote {args.json}", file=sys.stderr)


if __name__ == "__main__":
    main()
