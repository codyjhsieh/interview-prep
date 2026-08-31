#!/usr/bin/env python3
"""fetch-funding.py — propose funding metadata for companies that have none.

  python3 scripts/fetch-funding.py --out .tmp/funding.json
  python3 scripts/fetch-funding.py --out .tmp/funding.json --edgar   # + SEC check
  python3 scripts/fetch-funding.py --limit 20 -v

Emits proposals only; scripts/apply-funding.mjs writes them. Nothing here is
invented: every proposal carries the sentence it came from.

Two sources, deliberately ranked:

1. The company's own job-posting boilerplate (`descRaw` in .tmp/refresh.json,
   written by the fetch stage). Companies state their own totals — "we've
   raised $355M Series C led by Lux" — which is exactly what the `raised`,
   `stage` and `lead` fields mean elsewhere in CANDIDATES. Fresh, and the
   provenance is a sentence you can read. Covers ~23% of fetched companies.

2. SEC Form D filings (--edgar). Authoritative and structured, but a FLOOR,
   not a total: it captures only Reg D private placements the company itself
   filed, and many stop filing after early rounds. Astronomer's only Form D is
   $1.9M from 2017 against a far larger real total. So EDGAR is never written
   to `raised` on its own — it is used to corroborate a posting claim, and to
   flag a company whose filings exceed what its posting says.

Anything without evidence stays blank. A blank field renders as nothing; a
wrong one renders as fact.
"""
import argparse, json, re, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFRESH_JSON = ROOT / ".tmp" / "refresh.json"
DATA_JS = ROOT / "js" / "data.js"
UA = "interview-prep-jobs-board codyjhsieh@gmail.com"
# A Form D older than this is a floor from a different era of the company.
RECENT_CUTOFF = "2023-01-01"

# Two shapes, because companies write funding both ways:
#   verb-led   "raised over $10m", "secured $355M in funding"
#   round-led  "and now $17M Series A led by Venrock"  (no verb in front)
# Matching only the first shape silently picks the smaller, older round.
AMOUNT = re.compile(
    r"(?:(?:raised|raising|secured|closed|funding of|total funding of)\s*"
    r"(?:over|more than|approximately|about|~|a|our|an|its)?\s*"
    r"\$\s?([0-9][0-9.,]*)\s*(billion|million|B\b|M\b)"
    r"|\$\s?([0-9][0-9.,]*)\s*(billion|million|B\b|M\b)\s+(?=Series\s+[A-F]\b|round|financing))",
    re.I)
# A valuation is not money raised; "$11B valuation" must never become `raised`.
VALUATION_NEAR = re.compile(r"valuation|valued at|post-money|pre-money", re.I)
SERIES = re.compile(r"\bSeries\s+([A-F])\b")
LED_BY = re.compile(r"\b(?:led by|backed by|investors include(?:s)?|"
                    r"investment from)\s+([A-Z][A-Za-z0-9&.\- ]{2,40})")
# "backed by leading VCs" names nobody; these must not become a `lead` value.
NOT_A_NAME = re.compile(r"^(leading|top|world|industry|prominent|notable|premier|"
                        r"tier|great|amazing|some of|the best)\b", re.I)
# an investor name ends where the sentence moves on
TAIL = re.compile(r"\s+(?:last|in|back|earlier|and now|since|during|after|who|which|"
                  r"we|our|this|that)\b.*$", re.I)


# Entities that file a Form D on their own behalf while being named after the
# company they invest in. Their amounts are never the company's funding.
FUND_VEHICLE = re.compile(
    r"\bseries\s+of\b|\bfund\b|\bspv\b|\bco[\s-]?invest|\bjv\b|"
    r"\bholding(s)?,?\s+(lp|llc)\b|\bpartners,?\s+lp\b|\bcapital\s+llc\b",
    re.I)


def curl(url, timeout=20):
    try:
        r = subprocess.run(["curl", "-sS", "-m", str(timeout), "-H", f"User-Agent: {UA}", url],
                           capture_output=True, text=True, timeout=timeout + 5)
        return r.stdout if r.returncode == 0 else ""
    except Exception:
        return ""


def norm_amount(num, unit):
    """('355', 'M') -> '$355M'; ('1.3', 'billion') -> '$1.3B'."""
    try:
        v = float(num.replace(",", ""))
    except ValueError:
        return None
    unit = unit[0].upper()
    if unit == "M" and v >= 1000:
        v, unit = v / 1000, "B"
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    return f"${s}{unit}"


def clean_investor(raw):
    name = re.split(r"[,.;]| and | with ", raw.strip())[0]
    name = TAIL.sub("", name).strip(" .,&")
    if not name or len(name) < 3 or NOT_A_NAME.match(name):
        return ""
    if not name[0].isupper():          # not a proper noun -> not an investor
        return ""
    return name[:28]


def from_postings(company):
    """Best funding claim across this company's own posting bodies."""
    best = None
    for job in company.get("jobs", []):
        body = (job.get("descRaw") or "").replace("\n", " ")
        for m in AMOUNT.finditer(body):
            window = body[max(0, m.start() - 60): m.end() + 60]
            if VALUATION_NEAR.search(window):
                continue                      # a valuation, not money raised
            num = m.group(1) or m.group(3)
            unit = m.group(2) or m.group(4)
            amount = norm_amount(num, unit)
            if not amount:
                continue
            value = float(num.replace(",", "")) * (1000 if unit[0].upper() == "B" else 1)
            if value < 1:                     # sub-$1M: seed noise, or a typo
                continue
            sent_start = max(0, body.rfind(".", 0, m.start()) + 1)
            sent = body[sent_start: body.find(".", m.end()) + 1 or m.end() + 120].strip()
            series = SERIES.search(window)
            led = LED_BY.search(window) or LED_BY.search(body[:1500])
            cand = {
                "raised": amount,
                "value_m": value,
                "stage": f"Series {series.group(1)}" if series else "",
                "lead": clean_investor(led.group(1)) if led else "",
                "evidence": sent[:220],
            }
            # companies quote their cumulative total; take the largest claim
            if not best or cand["value_m"] > best["value_m"]:
                best = cand
    return best


def edgar_form_d_total(name):
    """Sum of amounts sold across a company's Form D filings, or None.

    A floor: only Reg D placements the company filed itself.
    """
    q = re.sub(r"[^A-Za-z0-9 ]", "", name).strip().replace(" ", "+")
    atom = curl("https://www.sec.gov/cgi-bin/browse-edgar?company=%s&type=D&owner=include"
                "&count=10&action=getcompany&output=atom" % q)
    if not atom:
        return None
    conformed = re.search(r"<conformed-name>([^<]+)</conformed-name>", atom)
    cik = re.search(r"<cik>(\d+)</cik>", atom)
    if not (conformed and cik):
        return None
    # Guard against name collisions: EDGAR happily returns a different company.
    a = re.sub(r"[^a-z0-9]", "", conformed.group(1).lower())
    b = re.sub(r"[^a-z0-9]", "", name.lower())
    if not (a.startswith(b) or b.startswith(a)):
        return None
    # A prefix match is not enough: investment vehicles are routinely NAMED
    # after the company they hold, so they sail through it. "Blink Health
    # 1789/RWP fund a Series of CGF2021 LLC" starts with "Blink Health" and
    # reported $1.4M for a company that has raised orders of magnitude more.
    # Same shape as "Regard JV Holding, LP". These file their own Form Ds; the
    # amounts are the vehicle's, not the company's.
    if FUND_VEHICLE.search(conformed.group(1)):
        return None
    time.sleep(0.15)                          # SEC asks for <10 req/s
    subs = curl(f"https://data.sec.gov/submissions/CIK{int(cik.group(1)):010d}.json")
    try:
        j = json.loads(subs)
    except Exception:
        return None
    recent = j.get("filings", {}).get("recent", {})
    total, count, latest = 0.0, 0, ""
    for form, acc, date in zip(recent.get("form", []), recent.get("accessionNumber", []),
                               recent.get("filingDate", [])):
        if form not in ("D", "D/A"):
            continue
        time.sleep(0.15)
        doc = curl("https://www.sec.gov/Archives/edgar/data/%d/%s/primary_doc.xml"
                   % (int(cik.group(1)), acc.replace("-", "")))
        sold = re.search(r"<totalAmountSold>([0-9.]+)</totalAmountSold>", doc or "")
        if sold:
            total += float(sold.group(1)); count += 1
            latest = latest or date
    if not count:
        return None
    return {"sec_total_m": round(total / 1e6, 2), "filings": count,
            "latest": latest, "conformed": conformed.group(1)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=".tmp/funding.json")
    ap.add_argument("--edgar", action="store_true", help="also check SEC Form D (slow)")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    if not REFRESH_JSON.exists():
        sys.exit(f"{REFRESH_JSON} not found — run `scripts/refresh.sh fetch` first "
                 "(descRaw only exists in the fetch output).")
    rows = json.loads(REFRESH_JSON.read_text()).get("rows", [])

    # ids that already carry funding. The emitted record spans several lines,
    # so this parses the block rather than regexing across newlines.
    have_raised = set()
    probe = subprocess.run(
        ["node", "-e", """
const fs=require("fs");const src=fs.readFileSync("js/data.js","utf8");
const a=src.indexOf("[",src.indexOf("const COMPANIES = ["));
const e=src.indexOf("\\n];",a);
const cos=eval("("+src.slice(a,e+2)+")");
console.log(JSON.stringify({
  funded: cos.filter(c=>c.raised).map(c=>c.id),
  public: cos.filter(c=>/^public/i.test(c.stage||"")).map(c=>c.id),
}));
"""], capture_output=True, text=True, cwd=str(ROOT))
    # Companies already marked Public are skipped entirely. A public company
    # still files Form Ds — private placements, employee plans, debt — and
    # those amounts are not venture funding. ServiceNow's $389M was proposed
    # and rejected by hand on three consecutive refreshes; rendering it beside
    # seed and Series C peers misstates a company worth orders of magnitude
    # more. Encoding the rule beats re-deciding it every run.
    public_ids = set()
    try:
        _p = json.loads(probe.stdout or "{}")
        have_raised = set(_p.get("funded", []))
        public_ids = set(_p.get("public", []))
    except Exception:
        print("warning: could not read existing funding; proposing for all",
              file=sys.stderr)
    # companies already carrying funding are never touched
    proposals, checked = [], 0
    for c in rows:
        if c["id"] in have_raised or c["id"] in public_ids:
            continue
        claim = from_postings(c)
        if not claim:
            # No self-reported figure. Fall back to SEC Form D, but only when
            # the filings are recent: Astronomer's sole Form D is $1.9M from
            # 2017, and publishing that as its funding would be worse than
            # publishing nothing.
            if not args.edgar:
                continue
            sec = edgar_form_d_total(c["name"])
            if not sec or sec["sec_total_m"] < 1:
                continue
            fresh = sec["latest"] >= RECENT_CUTOFF
            proposals.append({
                "id": c["id"], "name": c["name"],
                "raised": f"${sec['sec_total_m']:.0f}M" if sec["sec_total_m"] >= 1 else "",
                "stage": "", "lead": "", "source": "sec",
                "evidence": (f"SEC Form D: {sec['filings']} filing(s), "
                             f"${sec['sec_total_m']}M sold, latest {sec['latest']} "
                             f"({sec['conformed']})"),
                **({} if fresh else
                   {"flag": f"latest Form D is {sec['latest']} — a floor, likely stale"}),
            })
            if args.verbose:
                print(f"  {c['name']:26s} ${sec['sec_total_m']:>8.1f}M  SEC "
                      f"({sec['filings']} filings, latest {sec['latest']})", file=sys.stderr)
            if args.limit and len(proposals) >= args.limit:
                break
            continue
        checked += 1
        p = {"id": c["id"], "name": c["name"], "raised": claim["raised"],
             "stage": claim["stage"], "lead": claim["lead"],
             "source": "posting", "evidence": claim["evidence"]}
        # A billion-dollar claim is the most costly kind to get wrong, and the
        # phrasing companies use ("raised our $1.5B Series F") is easy to
        # confuse with a valuation. Flag rather than write silently.
        if claim["value_m"] >= 1000:
            p["flag"] = "claim >= $1B — verify against the source sentence before applying"
        if args.edgar:
            sec = edgar_form_d_total(c["name"])
            if sec:
                p["sec"] = sec
                if sec["sec_total_m"] > claim["value_m"] * 1.5:
                    p["flag"] = (f"SEC Form D total ${sec['sec_total_m']}M exceeds the "
                                 f"posting's {claim['raised']} — posting may be stale")
        proposals.append(p)
        if args.verbose:
            print(f"  {c['name']:26s} {p['raised']:>7s} {p['stage']:9s} {p['lead']}", file=sys.stderr)
        if args.limit and len(proposals) >= args.limit:
            break

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"proposals": proposals}, indent=1))
    print(f"{len(proposals)} proposal(s) from {len(rows)} fetched companies "
          f"-> {out}", file=sys.stderr)
    print(f"apply with:\n  node scripts/apply-funding.mjs {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
