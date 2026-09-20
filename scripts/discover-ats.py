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


# Slugs that resolve to a live board belonging to a DIFFERENT company than the
# name being probed. Each one was confirmed by reading the board's own posting
# bodies, and each one kept coming back on later sweeps because the knowledge
# lived only in a prose comment — ashby:neptune was re-proposed three times.
# Skipping them here means a name that can only reach a board through a
# colliding slug reports no board at all, which is the correct answer.
COLLIDING = {
  ("ashby", "latent"):       "clinical-AI company in SF, not Latent Labs the protein-AI lab",
  ("ashby", "neptune"):      "couples' wedding concierge (meetneptune.com)",
  ("ashby", "arlo"):         "hospitality group, not Arlo Technologies the camera maker",
  ("ashby", "ellipsislabs"): "Ellipsis Labs the DeFi protocol company",
  ("ashby", "odyssey"):      "a different Odyssey than the one usually meant",
  ("ashby", "assembly"):     "a different Assembly",
  ("ashby", "cambio"):       "a different Cambio",
  ("ashby", "antares"):      "Antares nuclear",
  ("ashby", "applied"):      "Applied Intuition",
  ("greenhouse", "vast"):    "Vast the space-station company",
  # ── 2026-09-17 sweep: each read off the board's own posting bodies ──
  ("ashby", "castle"):          "Castle the homeowner-finance app (Boston)",
  ("ashby", "prompt"):          "Prompt the rehab-therapy EMR vendor",
  ("greenhouse", "fleet"):      "Fleet Data Centers",
  ("ashby", "relay"):           "Relay the UK logistics company",
  ("ashby", "aim"):             "AIM, autonomous heavy machinery (Seattle)",
  ("greenhouse", "spin"):       "Spin, FEMSA's Mexican fintech",
  ("ashby", "sphere"):          "Sphere, trade-compliance infrastructure",
  ("greenhouse", "karat"):      "Karat the technical-interview company",
  ("ashby", "fourier"):         "Fourier, hydrogen electrolyzers",
  ("greenhouse", "ezra"):       "Ezra, emerging-market digital lending",
  ("greenhouse", "mantis"):     "Mantis, talent + production staffing",
  ("ashby", "lightspeed"):      "LightSpeed Build, construction robotics",
  ("ashby", "oligo"):           "Oligo, spacecraft design automation",
  ("ashby", "symmetry"):        "Symmetry, AI context tooling (Seattle)",
  ("greenhouse", "manifest"):   "Manifest, software supply-chain security",
  ("greenhouse", "raven"):      "Raven, RA Capital's healthcare incubator",
  ("lever", "latch"):           "LatchBio, software for biology",
  ("ashby", "crisp"):           "Crisp, Dutch grocery delivery",
  ("lever", "veo"):             "Veo, AI sports cameras",
  ("ashby", "safe"):            "Safe Software, maker of FME",
  ("greenhouse", "ess"):        "a cleared federal IT services contractor",
  ("greenhouse", "quilt"):      "Quilt, residential heat pumps",
  ("ashby", "duckbill"):        "Skyway, GPU infrastructure procurement",
  ("smartrecruiters", "hh2"):   "not hh2 the construction back-office vendor",
  ("ashby", "fig"):             "a single-row test board, no real postings",
  ("lever", "anomaly"):         "Anomaly the London ad agency",
  ("smartrecruiters", "nextgen"): "not NextGen Healthcare — a Las Vegas trades firm",
  ("greenhouse", "noah"):       "a veterinary hospital group in Virginia",
  ("ashby", "zoe"):             "ZOE the nutrition company (London)",
  ("smartrecruiters", "whatfix"): "a single 'test' posting, no real board",
  ("greenhouse", "moon"):       "Variloom, 3D-printed textile manufacturing",
  ("ashby", "foundation"):      "Foundation, homebuilding and home transactions",
  ("greenhouse", "nucleus"):    "Nucleus Global, medical communications",
  ("ashby", "ampersand"):       "Ampersand, AI integration infrastructure (SF)",
  ("ashby", "sabi"):            "a neural-wearable startup, not Sabi the market",
  ("ashby", "vivid"):           "Vivid, resilience posture management (Tel Aviv)",
  ("greenhouse", "playlist"):   "Playlist, an outdoor recreation company",
  # ── 2026-09-20 LA sweep. Short, generic slugs that the prober reaches by
  ("ashby", "phantom"):           "Phantom the crypto wallet, not Phantom Space",
  ("ashby", "resolution"):        "a research lab, not Resolution Games",
  ("greenhouse", "activate"):     "Activate, a science fellowship, not Activate Games",
  ("greenhouse", "atoms"):        "a real-estate operator, not Atoms the shoe brand",
  ("greenhouse", "bravo"):        "an architecture/MEP engineering firm",
  ("greenhouse", "oliver"):       "a French advertising agency, not Oliver Cabell",
  # its first-word-alone variant are where nearly all of these come from.
  ("ashby", "bio"):               "BIO, a decentralized-science protocol",
  ("ashby", "boom"):              "Boom, a flexible-housing rental platform",
  ("ashby", "double"):            "Double, bookkeeping software",
  ("ashby", "evolve"):            "a recruitment agency",
  ("ashby", "focus"):             "Focus Digital, a UX consultancy",
  ("ashby", "harmony"):           "Harmony, an employee-service AI",
  ("ashby", "ignition"):          "Ignition, revenue and billing automation",
  ("ashby", "lightning"):         "Lightning Labs, bitcoin infrastructure",
  ("ashby", "phoenix"):           "Phoenix, a Canadian telehealth platform",
  ("ashby", "post"):              "Post, a graph-data company",
  ("ashby", "quantum"):           "Quantum, a London ad business",
  ("ashby", "radiant"):           "Radiant, AI cloud infrastructure",
  ("ashby", "squad"):             "a contract engineering agency",
  ("ashby", "volta"):             "Volta, AI infrastructure",
  ("greenhouse", "alliance"):     "Alliance Corporation, a wireless distributor",
  ("greenhouse", "allied"):       "an HVAC and electrical contractor",
  ("greenhouse", "archer"):       "Archer Veterinary Clinic",
  ("greenhouse", "clevr"):        "a Mendix consultancy in the Netherlands",
  ("greenhouse", "cornerstone"):  "Cornerstone Child Development Center (Louisiana, not LA)",
  ("greenhouse", "david"):        "DAVID, a global creative agency",
  ("greenhouse", "didi"):         "DiDi's autonomous-driving unit",
  ("greenhouse", "elite"):        "a physical-therapy group in Mississippi",
  ("greenhouse", "flex"):         "Flex, a NYC rent-payment fintech",
  ("greenhouse", "integra"):      "Integra FEC, economic consulting",
  ("greenhouse", "iris"):         "Iris, a creative agency",
  ("greenhouse", "its"):          "ITS, an IT services firm",
  ("greenhouse", "kite"):         "Kite, a software company, not Kite Pharma",
  ("greenhouse", "lex"):          "an HVAC contractor in Texas",
  ("greenhouse", "magnolia"):     "Magnolia of Waco, Texas",
  ("greenhouse", "memic"):        "an insurance claims operation in Maine",
  ("greenhouse", "pdq"):          "a garage-door service company",
  ("greenhouse", "super"):        "a European games company",
  ("greenhouse", "village"):      "a New Jersey preschool",
  ("lever", "renegade"):          "Renegade, an onchain dark pool",
  ("smartrecruiters", "99"):      "a Russian call centre",
  ("smartrecruiters", "aplacecalledhome"):"a Tennessee home-care provider",
  ("smartrecruiters", "bandit"):  "a Barcelona job listing, not Bandit Running",
  ("smartrecruiters", "elgato"):  "not Elgato \u2014 a board mixing nursing and assembly roles",
  ("smartrecruiters", "fenix"):   "Fenix, an Australian mining company",
  ("smartrecruiters", "knight"):  "a healthcare staffing listing",
  ("smartrecruiters", "magellan"):"a French SAP consultancy",
  ("smartrecruiters", "outdoor"): "a Swiss outdoor shop",
  ("smartrecruiters", "radian"):  "an Indiana weekend sales gig",
  # ashby:hazel is on the board as Hazel in its own right; the name that must
  # not reach it is Hazel Health, the K-12 telehealth company.
  ("ashby", "hazel"):           "Hazel the AI data coworker, not Hazel Health",
}

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
    tries = [t for t in tries if t not in COLLIDING]
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
