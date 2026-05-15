#!/usr/bin/env python3
"""
probe-slugs.py — try multiple ATS slug variants per failed company.

For each (company, [candidate_slugs]) pair, hit the ATS endpoint, count
jobs that pass the same NYC + title filters as refresh-companies.py,
and print the winning (ats, slug, nyc_role_count) tuple.

Used to recover slug drift without rerunning the full 159-candidate
refresh against every public ATS.
"""
import json, re, subprocess, sys

NYC = re.compile(r'\b(new[\s-]?york|nyc|brooklyn|manhattan)\b', re.I)
TITLE_INCLUDE = re.compile(
  r"\b("
  r"forward[\s-]deployed|fde|founding[\s-]engineer|"
  r"software[\s-]engineer|swe(?:\s|$)|sde(?:\s|$)|"
  r"backend[\s-]engineer|frontend[\s-]engineer|fullstack[\s-]engineer|"
  r"full[\s-]stack[\s-]engineer|product[\s-]engineer|"
  r"ai[\s-]engineer|applied[\s-]ai[\s-]engineer|ml[\s-]engineer|"
  r"machine[\s-]learning[\s-]engineer|infrastructure[\s-]engineer|"
  r"platform[\s-]engineer|data[\s-]engineer|systems[\s-]engineer"
  r")\b", re.I)
TITLE_EXCLUDE = re.compile(
  r"\b("
  r"staff[\s,]|principal|^lead\s|\slead\s|\slead$|head\s|chief|director|"
  r"manager|engineering\s+manager|technical\s+program|vp\s|vice\s+president|"
  r"intern|internship|research\s+scientist|researcher|"
  r"solutions?\s+engineer|sales\s+engineer|customer\s+engineer|field\s+engineer|"
  r"support\s+engineer|implementation\s+engineer|partner\s+engineer|"
  r"developer\s+advocate|developer\s+relations|devrel|recruiter|recruiting|"
  r"account\s+executive|account\s+manager|operations\s+manager"
  r")\b", re.I)


def curl_json(url):
  try:
    out = subprocess.run(
      ["curl", "-sf", "-m", "8", "-H", "Accept: application/json", url],
      capture_output=True, timeout=12,
    )
    if out.returncode != 0: return None
    return json.loads(out.stdout)
  except Exception:
    return None


def count_jobs(ats, slug):
  """Return tuple (raw_count, nyc_eng_count) or (-1, -1) on fetch failure."""
  url = {
    "ashby":      f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false",
    "greenhouse": f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs",
    "lever":      f"https://api.lever.co/v0/postings/{slug}?mode=json",
  }[ats]
  d = curl_json(url)
  if d is None:
    return (-1, -1)
  raw = d.get("jobs", []) if ats != "lever" else (d if isinstance(d, list) else [])
  total = len(raw)
  match = 0
  for j in raw:
    if ats == "ashby":
      if j.get("isListed", True) is False: continue
      title = (j.get("title") or "")
      primary = j.get("location","") or ""
      secs = [s.get("location","") for s in (j.get("secondaryLocations") or [])]
      is_nyc = bool(NYC.search(primary)) or any(NYC.search(s) for s in secs)
    elif ats == "greenhouse":
      title = (j.get("title") or "")
      loc = (j.get("location") or {}).get("name","") or ""
      is_nyc = bool(NYC.search(loc))
    else:  # lever
      title = (j.get("text") or "")
      cat = j.get("categories") or {}
      loc = cat.get("location","") or ""
      all_locs = cat.get("allLocations") or []
      is_nyc = bool(NYC.search(loc)) or any(NYC.search(l or "") for l in all_locs)
    if not is_nyc: continue
    if not TITLE_INCLUDE.search(title): continue
    if TITLE_EXCLUDE.search(title): continue
    match += 1
  return (total, match)


# (company_name, [(ats, slug), ...])  — guesses ordered by likelihood
PROBES = [
  ("Pinecone",              [("ashby","pinecone"),("greenhouse","pineconesystems"),("greenhouse","pineconeio"),("lever","pinecone")]),
  ("Captions",              [("ashby","getcaptions"),("ashby","captionsapp"),("greenhouse","captions"),("greenhouse","getcaptions")]),
  ("Granola",               [("ashby","granolaai"),("greenhouse","granola"),("ashby","granola-ai")]),
  ("Common Sense Machines", [("ashby","commonsensemachines"),("ashby","csm"),("greenhouse","csm"),("greenhouse","commonsensemachines")]),
  ("Hugging Face",          [("ashby","huggingface"),("greenhouse","huggingfaceinc"),("lever","huggingface")]),
  ("Lithic",                [("ashby","lithic"),("greenhouse","lithicinc"),("lever","lithic")]),
  ("Unit",                  [("ashby","unitfinance"),("greenhouse","unit"),("ashby","getunit"),("lever","unit21")]),
  ("Increase",              [("greenhouse","increase"),("ashby","increasepay"),("lever","increase")]),
  ("Pagaya",                [("greenhouse","pagayatechnologies"),("greenhouse","pagayainvestments"),("ashby","pagaya")]),
  ("Petal",                 [("greenhouse","petal"),("greenhouse","petalcredit"),("ashby","petal")]),
  ("Tegus",                 [("greenhouse","tegusinc"),("greenhouse","tegusresearch"),("ashby","tegus")]),
  ("Yotta",                 [("ashby","withyotta"),("greenhouse","yotta"),("greenhouse","withyotta"),("lever","yotta")]),
  ("Bilt Rewards",          [("greenhouse","biltrewards"),("ashby","bilt"),("ashby","biltrewards"),("lever","bilt")]),
  ("Convex",                [("ashby","convexdev"),("greenhouse","convex"),("greenhouse","convexdev")]),
  ("Ro",                    [("greenhouse","ropartners"),("greenhouse","ro"),("greenhouse","getroman"),("ashby","ro")]),
  ("K Health",              [("greenhouse","khealthcorp"),("greenhouse","khealthus"),("greenhouse","khealthinc"),("ashby","khealth")]),
  ("Cityblock Health",      [("greenhouse","cityblock"),("greenhouse","cityblockhealthinc"),("ashby","cityblock")]),
  ("Eden Health",           [("greenhouse","edenhealthinc"),("greenhouse","edenhealthnyc"),("ashby","edenhealth"),("lever","edenhealth")]),
  ("Wiz",                   [("greenhouse","wizio"),("greenhouse","wizinc"),("ashby","wiz"),("lever","wiz")]),
  ("Chainalysis",           [("greenhouse","chainalysisinc"),("ashby","chainalysis"),("lever","chainalysis")]),
  # also retry existing dropouts
  ("Clay",                  [("ashby","clay"),("greenhouse","clayinc"),("ashby","clayrun"),("lever","clay")]),
  ("Cockroach Labs",        [("greenhouse","cockroachlabsinc"),("greenhouse","cockroachdb"),("ashby","cockroachlabs")]),
  ("Fireblocks",            [("greenhouse","fireblocksinc"),("ashby","fireblocks"),("lever","fireblocks")]),
  ("Public",                [("greenhouse","publichq"),("greenhouse","publicinc"),("greenhouse","publiccom"),("ashby","public")]),
  ("Runway",                [("ashby","runwayml"),("ashby","runway"),("greenhouse","runwayml")]),
  ("Hebbia",                [("greenhouse","hebbiaai"),("ashby","hebbia"),("lever","hebbia")]),
  ("Peloton",               [("greenhouse","pelotoncycle"),("greenhouse","onepeloton"),("ashby","peloton")]),
  ("Watershed",             [("ashby","watershedclimate"),("greenhouse","watershed"),("greenhouse","watershedclimate")]),
]


def main():
  for name, guesses in PROBES:
    winner = None
    log = []
    for ats, slug in guesses:
      raw, match = count_jobs(ats, slug)
      if raw < 0:
        log.append(f"{ats}:{slug}=404")
      elif match > 0:
        winner = (ats, slug, match, raw)
        break
      else:
        log.append(f"{ats}:{slug}={raw}r/{match}m")
    if winner:
      ats, slug, m, raw = winner
      print(f"[FOUND] {name:25s}  →  {ats}/{slug}  ({m} NYC eng roles, {raw} total)", flush=True)
    else:
      print(f"[no-fix] {name:25s}  ({'  '.join(log)})", flush=True)


if __name__ == "__main__":
  main()
