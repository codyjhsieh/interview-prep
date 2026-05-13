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
  • Wikipedia / Gutenberg search → Wikiquote API fallback — for modern
                                   copyrighted works that aren't in
                                   Gutenberg, search Wikiquote (a
                                   structured author/work-indexed quote
                                   corpus) for the quote text. A hit on
                                   the author's page is verification.

Both the quote and the source text are normalized (curly→straight
quotes, collapse whitespace, lowercase, strip punctuation that varies
across editions) and substring-matched. If the whole quote isn't found,
the script also tries sliding 7+-word windows from the start of the
quote — this catches translation variants where the prefix matches but
the tail diverges.

Tiers reported:
  • verified      — full quote found verbatim in cited source (or
                    confirmed by Wikiquote for modern works)
  • partial       — first N consecutive words found, but not the full
                    quote (typically a translation difference — Gutenberg
                    has one specific translation per classic work, while
                    quotes often use a more famous later translation)
  • not-found     — source fetched, quote not present anywhere
  • unsourced     — no canonical source AND Wikiquote returned no
                    matching hits (the script genuinely couldn't
                    verify)

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
import argparse, json, os, re, subprocess, sys, time, unicodedata
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
  """Placeholder retained for backward-compat — verification goes through
  find_in() against the KJV text."""
  return None

# ── Wikiquote fallback ────────────────────────────────────────────────────
# For modern copyrighted works (Hemingway 1952+, McCarthy, Morrison, etc.)
# that aren't on Gutenberg, we hit Wikiquote's search API. A search result
# pointing at the author's or work's Wikiquote page is a strong
# verification signal — Wikiquote is a curated quote corpus, and a quote
# that appears there is almost certainly real and correctly attributed.

# ── Wikiquote bulk dump ───────────────────────────────────────────────────
# Instead of hitting the rate-limited API once per quote, we download the
# Wikiquote dump (~210 MB bz2, ~700 MB XML) ONCE and run all searches
# locally — zero rate limits, complete corpus, deterministic. The dump
# refreshes monthly; cached locally for a week.
import bz2

WIKIQUOTE_DUMP_URL = (
  "https://dumps.wikimedia.org/enwikiquote/latest/"
  "enwikiquote-latest-pages-articles.xml.bz2"
)
WQ_BZ2   = CACHE / "wikiquote-pages.xml.bz2"
WQ_INDEX = CACHE / "wikiquote-index.json"
WQ_BLOB  = CACHE / "wikiquote-blob.txt"

def download_wikiquote_dump(allow_download: bool = True) -> bool:
  if WQ_BZ2.exists() and WQ_BZ2.stat().st_size > 100_000_000:
    print(f"  ✓ Wikiquote dump already cached: {WQ_BZ2} "
          f"({WQ_BZ2.stat().st_size / 1e6:.0f} MB) — skipping download.",
          file=sys.stderr)
    return True
  if not allow_download:
    print(f"  ✗ Wikiquote dump not cached and --no-wikiquote-download is set.",
          file=sys.stderr)
    return False

  # First, query HEAD so we can show the exact size + estimated time
  # before kicking off the actual download.
  print(f"\n  ┌─ Wikiquote bulk dump ─────────────────────────────────────",
        file=sys.stderr)
  print(f"  │ URL:    {WIKIQUOTE_DUMP_URL}", file=sys.stderr)
  head = subprocess.run(
    ["curl", "-sIL", "--max-time", "10", WIKIQUOTE_DUMP_URL],
    capture_output=True, text=True, timeout=15,
  )
  size_mb = None
  for line in head.stdout.splitlines():
    if line.lower().startswith("content-length:"):
      try:
        size_mb = int(line.split(":")[1].strip()) / 1e6
      except Exception:
        pass
  if size_mb:
    print(f"  │ Size:   {size_mb:.0f} MB (one-time download, cached at "
          f"{WQ_BZ2})", file=sys.stderr)
    # Rough ETA at 5 MB/s typical residential cable.
    print(f"  │ Est:    ~{size_mb/5:.0f}s @ 5 MB/s  ·  ~{size_mb/20:.0f}s @ 20 MB/s",
          file=sys.stderr)
  else:
    print(f"  │ Size:   ~210 MB (HEAD failed; proceeding anyway)", file=sys.stderr)
  print(f"  │ Cache:  reused on every subsequent run (until you delete "
        f"{WQ_BZ2.name})", file=sys.stderr)
  print(f"  │ Skip:   re-run with --no-wikiquote-download to use only the "
        f"Gutenberg / KJV verifier", file=sys.stderr)
  print(f"  └────────────────────────────────────────────────────────────",
        file=sys.stderr)
  print(f"\n  Downloading…", file=sys.stderr)
  sys.stderr.flush()

  t0 = time.time()
  # curl --progress-bar emits a single-line progress bar to stderr:
  #   ##############################################  100.0%
  # We forward stderr directly so the bar refreshes live in the user's
  # terminal.
  r = subprocess.run(
    ["curl", "-L", "--progress-bar", "--max-time", "600",
     "-o", str(WQ_BZ2), WIKIQUOTE_DUMP_URL],
    stderr=sys.stderr,
  )
  elapsed = time.time() - t0
  ok = r.returncode == 0 and WQ_BZ2.exists() and WQ_BZ2.stat().st_size > 100_000_000
  if ok:
    actual_mb = WQ_BZ2.stat().st_size / 1e6
    rate = actual_mb / elapsed if elapsed > 0 else 0
    print(f"  ✓ Download complete: {actual_mb:.0f} MB in {elapsed:.0f}s "
          f"({rate:.1f} MB/s)", file=sys.stderr)
  else:
    print(f"  ✗ Download failed (curl rc={r.returncode}). "
          f"Re-run, or use --no-wikiquote-download.", file=sys.stderr)
  return ok

# Strip MediaWiki markup just enough to make plain words greppable.
WIKI_MARKUP_RE = re.compile(
  r"""(\{\{[^{}]*?\}\})|"""             # templates
  r"""(\[\[[^\[\]|]*?\|)|"""              # link prefix [[Target|
  r"""(\]\]|\[\[)|"""                     # link delimiters
  r"""('''+|''+)|"""                       # bold/italic
  r"""(<!--.*?-->)|"""                     # html comments
  r"""(<ref[^>]*?>.*?</ref>)|"""            # refs (greedy-trimmed below)
  r"""(<[^>]+>)""",                         # bare html tags
  re.DOTALL,
)
def strip_wiki_markup(s: str) -> str:
  prev = None
  while prev != s:
    prev = s
    s = WIKI_MARKUP_RE.sub(" ", s)
  return s

_ALLOW_DUMP_DOWNLOAD = True
def build_wikiquote_index() -> tuple[str, list[tuple[int, str]]] | None:
  """Returns (concatenated normalized blob, [(offset, page_title), ...]).
  Cached on disk so re-runs are instant."""
  if WQ_INDEX.exists() and WQ_BLOB.exists():
    try:
      titles = json.loads(WQ_INDEX.read_text())
      blob   = WQ_BLOB.read_text()
      print(f"  ✓ Wikiquote index already built ({len(titles):,} pages, "
            f"{len(blob)/1e6:.0f} MB) — skipping rebuild.", file=sys.stderr)
      return blob, [(int(off), t) for off, t in titles]
    except Exception:
      pass
  if not download_wikiquote_dump(_ALLOW_DUMP_DOWNLOAD): return None
  print(f"  Indexing Wikiquote dump (one time)...", file=sys.stderr)
  t0 = time.time()
  bz2_size = WQ_BZ2.stat().st_size
  page_titles: list[tuple[int, str]] = []
  blob_parts: list[str] = []
  cur_pos = 0
  buf = ""
  bytes_read_compressed = 0
  PAGE_RE = re.compile(
    r"<page>\s*<title>([^<]+)</title>.*?<text[^>]*>([\s\S]*?)</text>",
    re.DOTALL,
  )
  # We can't easily know decompressed offset, but we can track # of pages
  # and approximate progress via raw decompressed bytes consumed.
  decompressed_consumed = 0
  last_report = time.time()
  with bz2.open(WQ_BZ2, "rt", encoding="utf-8", errors="replace") as fh:
    while True:
      chunk = fh.read(2 * 1024 * 1024)        # 2 MB chunks
      if not chunk: break
      buf += chunk
      decompressed_consumed += len(chunk)
      while True:
        m = PAGE_RE.search(buf)
        if not m: break
        title = m.group(1).strip()
        text  = m.group(2)
        if ":" in title and title.split(":")[0] in (
          "Talk","User","Wikiquote","File","Template","Category","Help",
          "MediaWiki","Module","Portal","Draft","Special","User talk",
        ):
          buf = buf[m.end():]; continue
        stripped = strip_wiki_markup(text)
        normalized = normalize(stripped)
        if normalized:
          page_titles.append((cur_pos, title))
          blob_parts.append(normalized + " ##pg## ")
          cur_pos += len(normalized) + len(" ##pg## ")
        buf = buf[m.end():]
      # Live progress line, throttled to once per second.
      now = time.time()
      if now - last_report >= 1.0:
        elapsed = now - t0
        sample_title = page_titles[-1][1] if page_titles else "..."
        sys.stderr.write(
          f"\r    indexing… {len(page_titles):>6,} pages  "
          f"{decompressed_consumed/1e6:>5.0f} MB decompressed  "
          f"{elapsed:>4.0f}s  last: {sample_title[:40]:<40}"
        )
        sys.stderr.flush()
        last_report = now
  sys.stderr.write("\r" + " " * 120 + "\r")
  sys.stderr.flush()
  blob = "".join(blob_parts)
  WQ_BLOB.write_text(blob)
  WQ_INDEX.write_text(json.dumps(page_titles))
  elapsed = time.time() - t0
  print(f"  Indexed {len(page_titles):,} pages, {len(blob)/1e6:.0f} MB normalized text "
        f"in {elapsed:.0f}s", file=sys.stderr)
  return blob, page_titles

_WQ_BLOB: str | None = None
_WQ_TITLES: list[tuple[int,str]] | None = None
def ensure_wq_index():
  global _WQ_BLOB, _WQ_TITLES
  if _WQ_BLOB is not None: return _WQ_BLOB is not None
  idx = build_wikiquote_index()
  if not idx: return False
  _WQ_BLOB, _WQ_TITLES = idx
  return True

def page_for_offset(offset: int) -> str:
  """Binary search the page-boundary index for the page containing offset."""
  if not _WQ_TITLES: return "?"
  lo, hi = 0, len(_WQ_TITLES) - 1
  while lo < hi:
    mid = (lo + hi + 1) // 2
    if _WQ_TITLES[mid][0] <= offset: lo = mid
    else: hi = mid - 1
  return _WQ_TITLES[lo][1]

def wikiquote_verify(quote: str, author: str, source_label: str) -> tuple[str, str]:
  """Search the locally-indexed Wikiquote dump for the quote text. If
  found, the enclosing page's title is the verification signal. If the
  page title or its content references the cited author, classify as
  verified; otherwise as partial (likely misattribution / wrong source)."""
  if not ensure_wq_index():
    return ("not-found", "wikiquote-dump-unavailable")
  nq = normalize(quote)
  if len(nq.split()) < 4:
    return ("not-found", "too-short")
  # Try the full quote first, then shorter prefixes (handles paraphrases /
  # translation drift) — but require ≥8 words to avoid spurious matches.
  words = nq.split()
  for n in (len(words), 18, 14, 10, 8):
    if n > len(words) or n < 8: continue
    needle = " ".join(words[:n])
    pos = _WQ_BLOB.find(needle)
    if pos == -1: continue
    page = page_for_offset(pos)
    # Author / source keys for attribution check.
    author_keys = [w for w in author.lower().split() if len(w) >= 3]
    if author_keys:
      surname = author_keys[-1]
      author_keys = list(set(author_keys + [surname]))
    src_keys = [w.lower().strip("()") for w in source_label.split()
                if len(w) >= 4 and any(c.isalpha() for c in w)]
    keys = set(author_keys + src_keys)
    page_lc = page.lower()
    if any(k in page_lc for k in keys):
      return ("verified", f"wikiquote-page:{page} ({n}w)")
    # Quote found but not on the cited author's page. Check the
    # surrounding 600 chars for the author's name — many Wikiquote pages
    # list multiple authors' quotes (e.g., themed pages, "Theme: Time").
    nearby = _WQ_BLOB[max(0, pos-300): pos+300]
    if any(k in nearby for k in keys):
      return ("verified", f"wikiquote-nearby:{page} ({n}w)")
    return ("partial", f"wikiquote-mismatch:{page} ({n}w)")
  return ("not-found", "wikiquote-no-match")

# ── Main ──────────────────────────────────────────────────────────────────
def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--print-missing", action="store_true",
                  help="Print details for partial / not-found / unsourced quotes")
  ap.add_argument("--limit", type=int, default=0,
                  help="Cap on number of quotes to check (for quick test)")
  ap.add_argument("--no-wikiquote-download", action="store_true",
                  help="Skip the ~210 MB Wikiquote bulk-dump download; "
                       "use only the Gutenberg + KJV verifier")
  args = ap.parse_args()
  global _ALLOW_DUMP_DOWNLOAD
  _ALLOW_DUMP_DOWNLOAD = not args.no_wikiquote_download

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

  # Verify each quote with a live progress line per row.
  results = {"verified": [], "partial": [], "not-found": [], "unsourced": [],
             "fetch-failed": []}
  total = len(quotes)
  TIER_GLYPH = {
    "verified": "\033[32m✓\033[0m",
    "partial":  "\033[33m~\033[0m",
    "not-found":"\033[31m✗\033[0m",
    "unsourced":"\033[90m?\033[0m",
    "fetch-failed": "\033[31m!\033[0m",
  }
  print(f"\n  Verifying {total} quotes:\n", file=sys.stderr)
  t_start = time.time()
  for i, q in enumerate(quotes):
    cls = q["class"]
    signal = None
    if cls == "gutenberg":
      body = text_cache.get(q["gut_id"])
      if not body:
        bucket = "fetch-failed"; tier = "fetch-failed"; words = 0
      else:
        tier, words = find_in(q["text"], body)
        bucket = tier
        if tier == "not-found":
          wq_tier, wq_signal = wikiquote_verify(q["text"], q["author"], q["source"])
          if wq_tier == "verified":
            tier = "verified"; words = -1; signal = wq_signal
            bucket = "verified"
          else:
            signal = f"gutenberg-mismatch;{wq_signal}"
    elif cls == "bible":
      if not kjv_norm:
        bucket = "fetch-failed"; tier = "fetch-failed"; words = 0
      else:
        tier, words = find_in(q["text"], kjv_norm)
        bucket = tier
    else:
      wq_tier, wq_signal = wikiquote_verify(q["text"], q["author"], q["source"])
      tier, signal = wq_tier, wq_signal
      bucket = wq_tier if wq_tier != "not-found" else "unsourced"
      words = 0
    glyph = TIER_GLYPH.get(tier, "?")
    snippet = q["text"][:55].replace("\n", " ")
    src = q["source"][:32]
    sig = (signal or "")[:36]
    print(f"  [{i+1:>3}/{total}] {glyph} {q['author'][:18]:<18} "
          f"| {snippet:<55} | {src:<32} | {sig}",
          file=sys.stderr)
    results[bucket].append({**q, "tier": tier, "words_matched": words, "signal": signal})
  elapsed = time.time() - t_start
  print(f"\n  Done in {elapsed:.0f}s.\n", file=sys.stderr)

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
