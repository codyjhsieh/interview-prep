#!/usr/bin/env bash
# refresh.sh — deterministic stages of the jobs refresh pipeline.
#
#   scripts/refresh.sh fetch-merge   # discover + additive-merge into js/data.js
#   scripts/refresh.sh prune         # drop postings gone from live ATS boards
#   scripts/refresh.sh logos         # print JSON list of ids missing a domain
#   scripts/refresh.sh rankings      # print JSON of missing COOLNESS/QUANT_GATED
#   scripts/refresh.sh descriptions  # print jobs/companies needing a one-liner
#   scripts/refresh.sh funding       # propose funding for companies with none
#   scripts/refresh.sh audit         # fit-score histogram (add --json for machine)
#   scripts/refresh.sh ship          # bump ?v= cache-buster, commit, push
#   scripts/refresh.sh all           # (fetch || prune) -> merge -> ship
#
# Concurrency knobs: REFRESH_WORKERS (fetch, default 10), DEAD_WORKERS (prune,
# default 10), MIN_ROWS (sparse-fetch abort threshold, default 40).
#
# Portable across GNU (Linux) and BSD (macOS) userland -- no `sed -i ''`,
# no `date -v`. `ship` pushes to the current branch's upstream, so it is safe
# on a feature branch as well as on main.
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

rankings() {
  node scripts/check-rankings.mjs
}

audit() {
  node scripts/score-dist.mjs "$@"
}

descriptions() {
  node scripts/check-descriptions.mjs "$@"
}

# Funding for companies that have none. Reads .tmp/refresh.json (descRaw only
# exists there), so it must follow a fetch in the same run. Proposes; writing
# is a separate, reviewable step:
#   scripts/refresh.sh funding --edgar        # propose into .tmp/funding.json
#   node scripts/apply-funding.mjs .tmp/funding.json
funding() {
  echo "→ funding (propose for companies with no funding data)"
  python3 scripts/fetch-funding.py --out "$TMPDIR/funding.json" "$@"
}

prune() {
  echo "→ prune (drop postings no longer on live ATS boards)"
  node scripts/check-dead.js --prune
}

ship() {
  echo "→ ship"
  # Check for real changes BEFORE bumping: the bump itself dirties index.html,
  # so checking afterwards made the no-op path unreachable and produced a
  # cache-buster-only commit on every run.
  if git diff --quiet js/data.js js/views.js index.html; then
    echo "  nothing to commit"
    return 0
  fi
  local cur date_part num_part new
  cur=$(grep -oE '\?v=[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]+' index.html | head -1 | sed 's/.*=//')
  date_part="${cur%-*}"; num_part="${cur##*-}"
  if [ "$date_part" = "$TODAY" ]; then
    new="$TODAY-$((num_part + 1))"
  else
    new="$TODAY-1"
  fi
  # Portable in-place edit: GNU sed's -i takes no argument, BSD's requires
  # one, so `sed -i ''` fails on Linux. Write-then-move works on both.
  sed "s|?v=$cur|?v=$new|g" index.html > "$TMPDIR/index.html.new"
  mv "$TMPDIR/index.html.new" index.html
  echo "  cache-buster: $cur → $new"

  git add js/data.js js/views.js index.html
  git commit -m "Data refresh $TODAY + cache-bust to $new

Auto-generated via scripts/refresh.sh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  git push -u origin "$branch"
}

case "${1:-all}" in
  fetch)        fetch ;;
  merge)        merge ;;
  fetch-merge)  fetch; merge ;;
  logos)        logos ;;
  rankings)     rankings ;;
  audit)        shift; audit "$@" ;;
  descriptions) shift; descriptions "$@" ;;
  funding)      shift; funding "$@" ;;
  prune)        prune ;;
  ship)         ship ;;
  all)
    # Parallel topology — fetch writes .tmp/refresh.json (never touches
    # data.js); prune mutates data.js in place. They don't share state,
    # so they can run concurrently. Merge waits for both, then runs on
    # the post-prune data.js (additive union with the fetched rows).
    (fetch) &  FETCH_PID=$!
    (prune) &  PRUNE_PID=$!
    FETCH_RC=0; PRUNE_RC=0
    wait $FETCH_PID || FETCH_RC=$?
    wait $PRUNE_PID || PRUNE_RC=$?
    if [ $FETCH_RC -ne 0 ] || [ $PRUNE_RC -ne 0 ]; then
      echo "aborting: fetch=$FETCH_RC prune=$PRUNE_RC" >&2; exit 1
    fi
    merge
    ship
    ;;
  *) echo "usage: $0 {fetch|merge|fetch-merge|logos|rankings|descriptions|funding|audit|prune|ship|all}"; exit 1 ;;
esac
