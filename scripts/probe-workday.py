#!/usr/bin/env python3
"""
probe-workday.py — probe 30 candidate Workday tenants and report NYC
engineering role counts. Reuses the production filter from
refresh-companies.py so output matches what the live refresh would
include.
"""
import importlib.util, sys
spec = importlib.util.spec_from_file_location("rc", "scripts/refresh-companies.py")
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

# (id, name, tenant, wd, site)
PROBES = [
  # Confirmed via WebSearch
  ("bloomberg-ind",   "Bloomberg Industry Group", "bloomberg",    "wd1",  "Bloombergindustrygroup_External_Career_Site"),
  ("pfizer",          "Pfizer",                   "pfizer",       "wd1",  "PfizerCareers"),
  ("sprinklr",        "Sprinklr",                 "sprinklr",     "wd1",  "careers"),
  ("workday-co",      "Workday",                  "workday",      "wd5",  "Workday"),
  ("adobe",           "Adobe",                    "adobe",        "wd5",  "external_experienced"),
  ("citi",            "Citi",                     "citi",         "wd5",  "2"),
  ("morganstanley",   "Morgan Stanley",           "ms",           "wd5",  "External"),
  ("mastercard",      "Mastercard",               "mastercard",   "wd1",  "CorporateCareers"),
  ("etsy",            "Etsy",                     "etsy",         "wd5",  "Etsy_Careers"),
  ("warnerbros",      "Warner Bros. Discovery",   "warnerbros",   "wd5",  "global"),
  ("comcast",         "Comcast (NBCUniversal)",   "comcast",      "wd5",  "Comcast_Careers"),
  ("disney",          "The Walt Disney Company",  "disney",       "wd5",  "disneycareer"),
  ("blackrock",       "BlackRock",                "blackrock",    "wd1",  "BlackRock_Professional"),
  ("capitalone",      "Capital One",              "capitalone",   "wd12", "Capital_One"),
  ("snap",            "Snap Inc.",                "snapchat",     "wd1",  "snap"),
  ("salesforce",      "Salesforce",               "salesforce",   "wd12", "External_Career_Site"),
  ("capgroup",        "Capital Group",            "capgroup",     "wd1",  "capitalgroupcareers"),
  ("nytimes",         "The New York Times",       "nytimes",      "wd5",  "NYT"),
  ("condenast",       "Condé Nast",               "condenast",    "wd5",  "CondeCareers"),
  ("wwe",             "WWE / TKO Group",          "wwecorp",      "wd5",  "wwecorp"),
  ("amex-gbt",        "Amex Global Business Travel", "travelhrportal", "wd1", "Jobs"),

  # Educated guesses (common tenant + site patterns)
  ("pinterest",       "Pinterest",                "pinterest",    "wd1",  "PinterestCareers"),
  ("roblox",          "Roblox",                   "roblox",       "wd5",  "Roblox"),
  ("doordash",        "DoorDash",                 "doordash",     "wd5",  "DoorDashUSA"),
  ("wayfair",         "Wayfair",                  "wayfair",      "wd1",  "WayfairCareers"),
  ("squarespace",     "Squarespace",              "squarespace",  "wd1",  "Careers"),
  ("siriusxm",        "SiriusXM",                 "siriusxm",     "wd1",  "Sirius_XM_Careers"),
  ("amex",            "American Express",         "aexp",         "wd1",  "AmexCareers"),
  ("bloomberg-lp",    "Bloomberg LP",             "bloomberg",    "wd1",  "Bloomberg_External_Career_Site"),
  ("paramount",       "Paramount",                "paramount",    "wd5",  "Paramount_Careers"),
]


def main():
  print(f"Probing {len(PROBES)} Workday tenants...", file=sys.stderr, flush=True)
  for cid, name, tenant, wdn, site in PROBES:
    slug = f"{tenant}/{wdn}/{site}"
    raw = rc.fetch("workday", slug)
    matches = rc.filter_jobs("workday", raw, slug)
    if matches:
      print(f"[FOUND] {name:30s}  →  {tenant}/{wdn}/{site}  ({len(matches)} NYC eng / {len(raw)} total)", flush=True)
    elif raw:
      print(f"[empty] {name:30s}  →  {tenant}/{wdn}/{site}  (0 NYC eng / {len(raw)} total — slug OK, no matches)", flush=True)
    else:
      print(f"[404]   {name:30s}  →  {tenant}/{wdn}/{site}", flush=True)


if __name__ == "__main__":
  main()
