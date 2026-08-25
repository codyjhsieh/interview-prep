#!/usr/bin/env node
/* fix-links.mjs — repair links that are alive but inaccurate.
 *
 *   node scripts/fix-links.mjs .tmp/refresh.json --dry
 *   node scripts/fix-links.mjs .tmp/refresh.json
 *
 * Fixes title drift: the posting behind a URL still exists but has been
 * retitled on the ATS, so js/data.js shows a title the link no longer leads
 * to. merge-additive.js cannot fix this — it matches on URL and only ever
 * ADDS jobs, so a stale title survives every refresh once it is written.
 *
 * The live board is authoritative for the title. When a title changes, the
 * stored `desc` was summarized from the OLD posting, so it is dropped rather
 * than left describing a role that no longer exists under that name; the
 * descriptions stage regenerates it from the current body on the next run.
 *
 * Only the title is touched. A retitled posting keeps its url, level, city,
 * added and posted values — the link itself was never wrong.
 */
'use strict';
import fs from 'node:fs';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const inPath = args.find((a) => !a.startsWith('--'));
if (!inPath) { console.error('usage: fix-links.mjs <refresh.json> [--dry]'); process.exit(1); }

const rows = JSON.parse(fs.readFileSync(inPath, 'utf8')).rows || [];
const liveTitle = new Map();
for (const c of rows) for (const j of c.jobs || []) liveTitle.set(j.url, j.title);

const { src, companies } = readCompanies(DATA);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

let fixed = 0, descDropped = 0;
for (const c of companies) {
  for (const j of c.jobs || []) {
    const live = liveTitle.get(j.url);
    if (!live || norm(live) === norm(j.title)) continue;
    console.log(`  ${c.name}\n     was: ${j.title}\n     now: ${live}`);
    j.title = live;
    if (j.desc) { delete j.desc; descDropped++; }
    fixed++;
  }
}

console.log(`\n${fixed} title(s) corrected from the live board`
  + (descDropped ? `, ${descDropped} stale desc(s) dropped for regeneration` : ''));
if (dry) { console.log('--dry: js/data.js not modified'); process.exit(0); }
if (!fixed) { console.log('nothing to write'); process.exit(0); }
writeCompanies(DATA, src, companies);
console.log(`wrote ${DATA}`);
