#!/usr/bin/env node
/* check-links.mjs — find links that are alive but WRONG.
 *
 *   node scripts/check-links.mjs                  # structural checks only
 *   node scripts/check-links.mjs .tmp/refresh.json  # + live title drift
 *
 * check-dead.js answers "is this posting gone?". This answers the different
 * question "does this link point where the board says it does?" — a link can
 * return 200 and still be wrong.
 *
 * Structural checks (no network, read js/data.js alone):
 *   cross-board   a job whose URL belongs to another company's ATS board
 *   shared-url    the same URL listed under two different companies
 *   dupe-url      the same URL twice within one company
 *   dupe-title    one company, one title, several live URLs (stale reposts)
 *
 * Live check (needs a fresh fetch, which carries the current title per URL):
 *   title-drift   the posting still exists but has been retitled, so the
 *                 board shows a title the link no longer leads to
 */
'use strict';
import fs from 'node:fs';
import { readCompanies } from './lib/emit-companies.mjs';

const { companies } = readCompanies('js/data.js');
const live = companies.filter((c) => (c.jobs || []).length);

// The ATS board a URL belongs to, as (host, slug). Mirrors the URL shapes
// filter_jobs() builds in refresh-companies.py.
const boardOf = (url) => {
  let m;
  if ((m = url.match(/jobs\.ashbyhq\.com\/([^/]+)/i))) return `ashby:${m[1].toLowerCase()}`;
  // Greenhouse's embed form names the board in a query param, not the path:
  // boards.greenhouse.io/embed/job_app?for=<slug>. Check it first, or the
  // path matcher reports every such board as "embed".
  if ((m = url.match(/greenhouse\.io\/embed\/job_app\?for=([^&]+)/i))) return `greenhouse:${m[1].toLowerCase()}`;
  if ((m = url.match(/(?:job-boards|boards)\.greenhouse\.io\/([^/]+)/i))) return `greenhouse:${m[1].toLowerCase()}`;
  if ((m = url.match(/jobs\.lever\.co\/([^/]+)/i))) return `lever:${m[1].toLowerCase()}`;
  if ((m = url.match(/apply\.workable\.com\/([^/]+)/i))) return `workable:${m[1].toLowerCase()}`;
  if ((m = url.match(/jobs\.smartrecruiters\.com\/([^/]+)/i))) return `smartrecruiters:${m[1].toLowerCase()}`;
  if ((m = url.match(/https?:\/\/([^.]+)\.wd\d+\.myworkdayjobs\.com/i))) return `workday:${m[1].toLowerCase()}`;
  return null;                       // custom career domain — nothing to compare
};

const findings = { 'cross-board': [], 'shared-url': [], 'dupe-url': [], 'dupe-title': [] };
const urlOwner = new Map();

for (const c of live) {
  // A company's own board = the one most of its jobs sit on. Derived from the
  // data rather than from CANDIDATES so this stays a pure js/data.js check.
  const counts = {};
  for (const j of c.jobs) {
    const b = boardOf(j.url);
    if (b) counts[b] = (counts[b] || 0) + 1;
  }
  const own = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const seenUrl = new Map();
  const byTitle = new Map();
  for (const j of c.jobs) {
    const b = boardOf(j.url);
    if (own && b && b !== own) findings['cross-board'].push({ company: c.name, own, got: b, title: j.title, url: j.url });

    if (seenUrl.has(j.url)) findings['dupe-url'].push({ company: c.name, title: j.title, url: j.url });
    else seenUrl.set(j.url, j.title);

    const prev = urlOwner.get(j.url);
    if (prev && prev !== c.name) findings['shared-url'].push({ a: prev, b: c.name, url: j.url });
    urlOwner.set(j.url, c.name);

    const key = j.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    byTitle.set(key, (byTitle.get(key) || []).concat(j.url));
  }
  for (const [t, urls] of byTitle) {
    if (urls.length > 1) findings['dupe-title'].push({ company: c.name, title: t, urls });
  }
}

// Live title drift, when a fetch is supplied.
const refreshPath = process.argv[2];
const drift = [];
if (refreshPath && fs.existsSync(refreshPath)) {
  const rows = JSON.parse(fs.readFileSync(refreshPath, 'utf8')).rows || [];
  const liveTitle = new Map();
  for (const c of rows) for (const j of c.jobs || []) liveTitle.set(j.url, j.title);
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const c of live) {
    for (const j of c.jobs) {
      const t = liveTitle.get(j.url);
      if (t && norm(t) !== norm(j.title)) drift.push({ company: c.name, stored: j.title, live: t, url: j.url });
    }
  }
}

for (const [k, list] of Object.entries(findings)) {
  console.log(`\n## ${k}: ${list.length}`);
  for (const f of list.slice(0, 40)) console.log('   ' + JSON.stringify(f));
}
console.log(`\n## title-drift: ${drift.length}${refreshPath ? '' : '  (no fetch supplied — skipped)'}`);
for (const d of drift.slice(0, 60)) console.log(`   ${d.company}\n     stored: ${d.stored}\n     live:   ${d.live}`);

const total = Object.values(findings).reduce((n, l) => n + l.length, 0) + drift.length;
console.log(`\n${total} link accuracy issue(s)`);
fs.writeFileSync('.tmp/link-issues.json', JSON.stringify({ ...findings, drift }, null, 1));
