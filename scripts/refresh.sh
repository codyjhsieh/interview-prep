#!/usr/bin/env bash
# refresh.sh — deterministic stages of the jobs refresh pipeline.
#
#   scripts/refresh.sh fetch-merge   # discover + additive-merge into js/data.js
#   scripts/refresh.sh logos         # print JSON list of ids missing a domain
#   scripts/refresh.sh ship          # bump ?v= cache-buster, commit, push
#   scripts/refresh.sh all           # fetch-merge + ship (skips agent logo step)
#
# Never destructive: fetch always uses --emit-json; merge is additive-only.
# Aborts if the fetch returns fewer than MIN_ROWS rows (protects against a
# mass ATS outage silently producing an empty refresh).
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
TMPDIR="$ROOT/.tmp"
mkdir -p "$TMPDIR"
JSON="$TMPDIR/refresh.json"
BASELINE="$TMPDIR/baseline.js"
TODAY="$(date +%Y-%m-%d)"
MIN_ROWS="${MIN_ROWS:-40}"

fetch() {
  echo "→ fetch"
  python3 scripts/refresh-companies.py --emit-json "$JSON"
  local n
  n=$(node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log((d.rows||[]).length)' "$JSON")
  if [ "$n" -lt "$MIN_ROWS" ]; then
    echo "  aborting: only $n rows (< MIN_ROWS=$MIN_ROWS). Suspect ATS outage." >&2
    exit 2
  fi
  echo "  $n rows"
}

merge() {
  echo "→ merge (additive, baseline=today's data.js)"
  cp js/data.js "$BASELINE"
  node scripts/merge-additive.js js/data.js "$JSON" --baseline "$BASELINE" --today "$TODAY"
}

logos() {
  node scripts/check-logos.mjs
}

prune() {
  echo "→ prune (drop postings no longer on live ATS boards)"
  node scripts/check-dead.js --prune
}

ship() {
  echo "→ ship"
  local cur date_part num_part new
  cur=$(grep -oE '\?v=[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]+' index.html | head -1 | sed 's/.*=//')
  date_part="${cur%-*}"; num_part="${cur##*-}"
  if [ "$date_part" = "$TODAY" ]; then
    new="$TODAY-$((num_part + 1))"
  else
    new="$TODAY-1"
  fi
  sed -i '' "s|?v=$cur|?v=$new|g" index.html
  echo "  cache-buster: $cur → $new"

  if git diff --quiet js/data.js index.html; then
    echo "  nothing to commit"
    return 0
  fi
  git add js/data.js index.html
  git commit -m "Data refresh $TODAY + cache-bust to $new

Auto-generated via scripts/refresh.sh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
  git push
}

case "${1:-all}" in
  fetch)        fetch ;;
  merge)        merge ;;
  fetch-merge)  fetch; merge ;;
  logos)        logos ;;
  prune)        prune ;;
  ship)         ship ;;
  all)          fetch; merge; prune; ship ;;
  *) echo "usage: $0 {fetch|merge|fetch-merge|logos|prune|ship|all}"; exit 1 ;;
esac
