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
 * The live board is authoritative for the title. The stored `desc` was
 * summarized from the OLD posting, but most drift is a seniority relabel
 * ("Senior+ Software Engineer, Research Tools" -> "Software Engineer,
 * Research Tools"), and the description of the work is still correct. So the
 * desc is kept when the titles match after seniority tokens are stripped, and
 * dropped only on a substantive change, for the descriptions stage to
 * regenerate. Dropping all of them would throw away good copy to no purpose.
 *
 * `level` is recomputed from the new title, since it is derived from exactly
 * the seniority words that changed.
 *
 * Only title, level and (sometimes) desc are touched. The url, city, added
 * and posted values stand — the link itself was never wrong.
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
// Seniority words only. If two titles agree once these are removed, the role
// is the same and its description still holds.
const SENIORITY = /\b(senior|sr|staff|principal|lead|junior|associate|entry|new\s+grad|i{1,3}|iv|[1-4])\b\+?|\+/gi;
const core = (s) => norm(s.replace(SENIORITY, ' '));
// Mirrors level() in scripts/refresh-companies.py.
const levelOf = (t) => {
  const low = t.toLowerCase();
  if (low.includes('founding')) return 'founding';
  if (low.includes('senior') || low.includes('sr.') || low.includes('sr ')) return 'senior';
  return 'mid';
};

let fixed = 0, descDropped = 0, levelChanged = 0, seniorityOnly = 0;
for (const c of companies) {
  for (const j of c.jobs || []) {
    const live = liveTitle.get(j.url);
    if (!live || norm(live) === norm(j.title)) continue;
    const sameRole = core(live) === core(j.title);
    console.log(`  ${c.name}${sameRole ? '  [seniority only]' : ''}\n     was: ${j.title}\n     now: ${live}`);
    j.title = live;
    const lvl = levelOf(live);
    if (j.level !== lvl) { j.level = lvl; levelChanged++; }
    if (sameRole) seniorityOnly++;
    else if (j.desc) { delete j.desc; descDropped++; }
    fixed++;
  }
}

console.log(`\n${fixed} title(s) corrected from the live board`
  + ` (${seniorityOnly} seniority-only, desc kept)`
  + (descDropped ? `, ${descDropped} stale desc(s) dropped for regeneration` : '')
  + (levelChanged ? `, ${levelChanged} level(s) recomputed` : ''));
if (dry) { console.log('--dry: js/data.js not modified'); process.exit(0); }
if (!fixed) { console.log('nothing to write'); process.exit(0); }
writeCompanies(DATA, src, companies);
console.log(`wrote ${DATA}`);
