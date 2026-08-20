#!/usr/bin/env node
/* prune-titles.mjs — remove jobs whose titles belong to a role family this
 * board doesn't track, and drop any company left with no jobs.
 *
 *   node scripts/prune-titles.mjs --dry     # report only
 *   node scripts/prune-titles.mjs           # rewrite js/data.js
 *   node scripts/prune-titles.mjs --only mobile,frontend
 *
 * Why this exists: the merge step is additive by design, so tightening
 * TITLE_EXCLUDE in refresh-companies.py stops NEW postings in a family from
 * arriving but never removes the ones already in js/data.js. This is the
 * cleanup half of retiring a role family.
 *
 * The patterns below mirror the matching clauses in TITLE_EXCLUDE
 * (scripts/refresh-companies.py). That file is the source of truth for what
 * a fetch accepts; if you retire another family there, add it here too and
 * run this once. Deliberately narrower than re-running the whole filter:
 * that would also drop rows that fail for unrelated historical reasons
 * (managers, security engineers, titles the include-list never covered),
 * which is a different decision from retiring a family. */
'use strict';
import fs from 'node:fs';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';

// Mirrors the mobile / front-end / research clauses of TITLE_EXCLUDE.
const FAMILIES = {
  mobile:   /\b(mobile|android|ios|react\s+native)\b/i,
  frontend: /\b(front[\s-]?end|frontend|web\s+developer|ui\s+engineer)\b/i,
  research: /\b(researcher|research\s+scientist|research\s+engineer|quantitative\s+research)\b/i,
};

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const onlyArg = argv[argv.indexOf('--only') + 1];
const active = argv.includes('--only')
  ? Object.fromEntries(Object.entries(FAMILIES).filter(([k]) => onlyArg.split(',').includes(k)))
  : FAMILIES;

const { src, companies } = readCompanies(DATA);

const classify = (title) => {
  for (const [name, re] of Object.entries(active)) if (re.test(title)) return name;
  return null;
};

const dropped = [];
const emptied = [];
const kept = [];
for (const c of companies) {
  const survivors = [];
  for (const j of (c.jobs || [])) {
    const family = classify(j.title);
    if (family) dropped.push({ family, company: c.name, title: j.title });
    else survivors.push(j);
  }
  c.jobs = survivors;
  // totalRoles is documented as == jobs.length; keep that invariant true.
  if (c.totalRoles !== undefined) c.totalRoles = survivors.length;
  if (!survivors.length) emptied.push(c.name);
  else kept.push(c);
}

const byFamily = {};
for (const d of dropped) (byFamily[d.family] ||= []).push(d);
for (const [family, list] of Object.entries(byFamily)) {
  console.log(`\n${family}: ${list.length} job(s)`);
  for (const d of list) console.log(`   ${d.company} — ${d.title}`);
}
console.log(`\n${dropped.length} job(s) dropped, ${kept.length} companies kept`
  + (emptied.length ? `, ${emptied.length} company/companies left empty and removed: ${emptied.join(', ')}` : ''));

if (dry) { console.log('\n--dry: js/data.js not modified'); process.exit(0); }
if (!dropped.length) { console.log('nothing to do'); process.exit(0); }

writeCompanies(DATA, src, kept);
console.log(`\nRewrote ${DATA}: ${kept.reduce((n, c) => n + c.jobs.length, 0)} jobs across ${kept.length} companies.`);
