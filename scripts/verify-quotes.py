#!/usr/bin/env python3
"""
verify-quotes.py — live-verify every Quote-of-the-Day entry against the
source text it cites.

What it does
------------
Parses js/quotes.js to extract each `add(text, author, source, url,
year, context)` call. For each quote, classifies the URL and fetches
the appropriate source text via curl (cached on disk so re-runs are
fast):

  • Project Gutenberg book ID  → /cache/epub/{id}/pg{id}.txt
  • Bible Gateway verse        → local KJV plaintext (Gutenberg #10)
  • Wikipedia / Gutenberg search → no canonical source, marked
                                   `unsourced` (can't verify either way)

Both the quote and the source text are normalized (curly→straight
quotes, collapse whitespace, lowercase, strip punctuation that varies
across editions) and substring-matched. If the whole quote isn't found,
the script also tries sliding 7+-word windows from the start of the
quote — this catches translation variants where the prefix matches but
the tail diverges.

Tiers reported:
  • verified      — full quote found verbatim in cited source
  • partial       — first N consecutive words found, but not the full
                    quote (typically a translation difference — Gutenberg
                    has one specific translation per classic work, while
                    quotes often use a more famous later translation)
  • not-found     — source fetched, quote not present
  • unsourced     — source URL isn't a canonical text (wiki, search
                    page); can't decide either way

Note on translations: Gutenberg #2680 is George Long's 1862 Marcus
Aurelius, not Gregory Hays's 2002 — so Hays renderings ("The
impediment to action…", "Confine yourself to the present") will not
match. They are real Marcus quotes, just from a different English
edition. Same for Tao Te Ching (Legge on Gutenberg vs. Mitchell in
quotes), Bhagavad Gita (Arnold's verse Song Celestial), Dante
(Longfellow), etc. A "not-found" result is a signal to either swap
the cited source to a translation that Gutenberg hosts, or to mark
the quote as unverified.

Run from repo root:
    python3 scripts/verify-quotes.py
    python3 scripts/verify-quotes.py --print-missing   # show what failed

Writes a per-quote report to /tmp/quote-verification.json.
"""

from __future__ import annotations
import argparse, json, os, re, subprocess, sys, unicodedata
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parent.parent
QUOTES_JS = REPO_ROOT / "js" / "quotes.js"
CACHE     = Path("/tmp/quote-cache")
CACHE.mkdir(parents=True, exist_ok=True)
REPORT    = Path("/tmp/quote-verification.json")

# ── Fetching ──────────────────────────────────────────────────────────────
def curl_text(url: str, timeout: int = 30) -> str | None:
  try:
    r = subprocess.run(
      ["curl", "-sS", "-L", "--max-time", str(timeout),
       "-A", "Mozilla/5.0 (quote-verify)", url],
      capture_output=True, timeout=timeout + 5, text=True,
    )
    return r.stdout if r.returncode == 0 and r.stdout else None
  except Exception:
    return None

def gutenberg_plaintext(book_id: int) -> str | None:
  """Fetch and cache the plaintext version of a Project Gutenberg book."""
  cache_file = CACHE / f"gutenberg-{book_id}.txt"
  if cache_file.exists():
    return cache_file.read_text(errors="replace")
  # Try the canonical plain-text path first, then a couple of fallbacks.
  candidates = [
    f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt",
    f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt",
    f"https://www.gutenberg.org/files/{book_id}/{book_id}.txt",
  ]
  for url in candidates:
    body = curl_text(url)
    if body and len(body) > 1000:
      cache_file.write_text(body)
      return body
  return None

def kjv_text() -> str | None:
  """Project Gutenberg ebook 10 is the KJV Bible. Used to verify any
  bible(...) link. We strip the embedded "N:N" verse markers so they
  don't break substring matches on quotes that span two verses."""
  body = gutenberg_plaintext(10)
  if not body: return None
  # Strip leading verse markers like "5:3 " at the start of lines.
  body = re.sub(r"\b\d{1,3}:\d{1,3}\s+", " ", body)
  return body

# ── Normalization ─────────────────────────────────────────────────────────
SMART_QUOTES = str.maketrans({
  "‘": "'", "’": "'", "“": '"', "”": '"',
  "–": "-", "—": "-", "…": "...",
})
PUNCT_RE = re.compile(r"[^a-z0-9'\s]+")
WS_RE    = re.compile(r"\s+")

def normalize(s: str) -> str:
  s = unicodedata.normalize("NFKC", s)
  s = s.translate(SMART_QUOTES)
  s = s.lower()
  s = PUNCT_RE.sub(" ", s)
  s = WS_RE.sub(" ", s).strip()
  return s

# ── Parsing quotes.js ─────────────────────────────────────────────────────
# Each entry looks like:
#   add('text...', 'author...', 'source...', url, year,
#       'context...');
# Single quotes inside the strings are escaped \'. We match the FIRST four
# arguments of each add() call; that's enough for verification.
ADD_RE = re.compile(
  r"\badd\(\s*"
  r"'((?:[^'\\]|\\.)*)'\s*,\s*"      # text
  r"'((?:[^'\\]|\\.)*)'\s*,\s*"      # author
  r"'((?:[^'\\]|\\.)*)'\s*,\s*"      # source label
  r"([^,]+?)\s*,",                    # url expression
  re.DOTALL,
)
GUT_ID_RE   = re.compile(r"gutId\((\d+)\)")
BIBLE_RE    = re.compile(r"bible\('([^']+)'\)")
WIKI_RE     = re.compile(r"wikis?\(")
GUT_QUERY_RE = re.compile(r"\bgut\(")

def parse_quotes() -> list[dict]:
  src = QUOTES_JS.read_text()
  out = []
  for m in ADD_RE.finditer(src):
    raw_text, author, source_label, url_expr = m.groups()
    # Unescape single-quote escapes
    text = raw_text.replace("\\'", "'").replace("\\\\", "\\").replace('\\"', '"')
    url_expr = url_expr.strip()
    cls = "unsourced"
    gut_id = None
    bible_ref = None
    mg = GUT_ID_RE.search(url_expr)
    mb = BIBLE_RE.search(url_expr)
    if mg:
      gut_id = int(mg.group(1)); cls = "gutenberg"
    elif mb:
      bible_ref = mb.group(1); cls = "bible"
    elif WIKI_RE.search(url_expr) or GUT_QUERY_RE.search(url_expr):
      cls = "unsourced"
    out.append({
      "text": text,
      "author": author.replace("\\'", "'"),
      "source": source_label.replace("\\'", "'"),
      "url_expr": url_expr,
      "class": cls,
      "gut_id": gut_id,
      "bible_ref": bible_ref,
    })
  return out

# ── Verification ──────────────────────────────────────────────────────────
def find_in(needle: str, haystack: str) -> tuple[str, int]:
  """Return (tier, words_matched). Tier ∈ verified | partial | not-found."""
  nq = normalize(needle)
  if not nq:
    return ("not-found", 0)
  if nq in haystack:
    return ("verified", len(nq.split()))
  words = nq.split()
  # Sliding windows from the start (catches truncations + translations
  # where the opening clause matches but the tail diverges).
  for n in range(min(len(words), 20), 3, -1):       # try 20 → 4 words
    window = " ".join(words[:n])
    if window in haystack:
      return ("partial", n)
  # Sliding windows from inside the quote (catches cases where the
  # prefix differs but a unique mid-phrase matches).
  if len(words) >= 8:
    for start in range(1, len(words) - 5):
      for n in range(min(8, len(words) - start), 4, -1):
        window = " ".join(words[start:start+n])
        if window in haystack:
          return ("partial", n)
  # Final fallback: word-set overlap. If 70%+ of the quote's content
  # words appear close together somewhere in the source, treat as
  # likely-translation-variant. We check the densest matching window.
  content_words = [w for w in words if len(w) >= 4]
  if len(content_words) >= 5:
    hay_words = haystack.split()
    qs = set(content_words)
    win_size = max(len(words) * 3, 30)
    best = 0
    for i in range(0, len(hay_words) - win_size, max(1, win_size // 4)):
      hits = sum(1 for w in hay_words[i:i+win_size] if w in qs)
      if hits > best:
        best = hits
    if best / len(qs) >= 0.7:
      return ("partial", best)
  return ("not-found", 0)

def bible_lookup(verse_ref: str, kjv: str) -> tuple[str, int]:
  """For a Bible reference like 'Ecclesiastes 9:10' we don't index by
  chapter:verse — we just verify by searching the entire KJV text.
  Good enough: KJV's small phrasing variants are unique."""
  # The Gutenberg KJV file uses "Eccl. 9:10 Whatsoever..." style markers
  # but quote text already excludes them, so search the body.
  return None  # placeholder; real verify uses find_in()

# ── Main ──────────────────────────────────────────────────────────────────
def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--print-missing", action="store_true",
                  help="Print details for partial / not-found / unsourced quotes")
  ap.add_argument("--limit", type=int, default=0,
                  help="Cap on number of quotes to check (for quick test)")
  args = ap.parse_args()

  quotes = parse_quotes()
  if args.limit: quotes = quotes[:args.limit]
  print(f"Parsed {len(quotes)} quotes from quotes.js", file=sys.stderr)

  # Fetch all needed Gutenberg books once, cached on disk.
  gut_ids_needed = sorted({q["gut_id"] for q in quotes if q["gut_id"]})
  print(f"Will need {len(gut_ids_needed)} Gutenberg book(s) plus KJV", file=sys.stderr)

  text_cache: dict[int, str] = {}
  for gid in gut_ids_needed:
    body = gutenberg_plaintext(gid)
    if body is None:
      print(f"  [fetch-failed] gutenberg #{gid}", file=sys.stderr); continue
    text_cache[gid] = normalize(body)
    print(f"  [ok] gutenberg #{gid}: {len(body):,} bytes", file=sys.stderr)

  kjv = kjv_text()
  if kjv:
    kjv_norm = normalize(kjv)
    print(f"  [ok] KJV cached: {len(kjv):,} bytes", file=sys.stderr)
  else:
    kjv_norm = None
    print(f"  [fetch-failed] KJV", file=sys.stderr)

  # Verify each quote
  results = {"verified": [], "partial": [], "not-found": [], "unsourced": [],
             "fetch-failed": []}
  for q in quotes:
    cls = q["class"]
    if cls == "gutenberg":
      body = text_cache.get(q["gut_id"])
      if not body:
        bucket = "fetch-failed"; tier = "fetch-failed"; words = 0
      else:
        tier, words = find_in(q["text"], body)
        bucket = tier
    elif cls == "bible":
      if not kjv_norm:
        bucket = "fetch-failed"; tier = "fetch-failed"; words = 0
      else:
        tier, words = find_in(q["text"], kjv_norm)
        bucket = tier
    else:
      bucket = "unsourced"; tier = "unsourced"; words = 0
    results[bucket].append({**q, "tier": tier, "words_matched": words})

  # Summary
  total = len(quotes)
  print("\n── Verification summary ───────────────────────────────────────", file=sys.stderr)
  for bucket in ("verified", "partial", "not-found", "unsourced", "fetch-failed"):
    n = len(results[bucket])
    pct = (100 * n / total) if total else 0
    print(f"  {bucket:14s} {n:4d}  ({pct:4.1f}%)", file=sys.stderr)
  print("─────────────────────────────────────────────────────────────────\n", file=sys.stderr)

  # Write the full report
  REPORT.write_text(json.dumps(results, indent=2))
  print(f"Wrote {REPORT}", file=sys.stderr)

  # Optional details
  if args.print_missing:
    for bucket in ("not-found", "partial", "unsourced", "fetch-failed"):
      if not results[bucket]: continue
      print(f"\n── {bucket} ──", file=sys.stderr)
      for r in results[bucket]:
        print(f'  [{r["author"]}] {r["text"][:90]}', file=sys.stderr)
        print(f'        source: {r["source"]}', file=sys.stderr)

if __name__ == "__main__":
  main()
