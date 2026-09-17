#!/usr/bin/env node
/* prune-cities.mjs — drop jobs whose city is no longer covered.
 *
 *   node scripts/prune-cities.mjs --dry
 *   node scripts/prune-cities.mjs
 *
 * The merge step is additive, so narrowing CITIES in refresh-companies.py stops
 * NEW postings in a dropped city from arriving but never removes the ones
 * already in js/data.js. This is the cleanup half, and the counterpart to
 * prune-titles.mjs for the geography axis rather than the role-family one.
 *
 * The keep-list is read from refresh-companies.py's CITY_LABEL rather than
 * duplicated here, so there is exactly one place to edit when the covered set
 * changes. Rows with no `city` field predate the multi-city board and are
 * always NYC (see jobCity() in js/views.js), so they are kept.
 */
'use strict';
import fs from 'node:fs';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';
const SRC  = 'scripts/refresh-companies.py';

const m = fs.readFileSync(SRC, 'utf8').match(/CITY_LABEL\s*=\s*\{([\s\S]*?)\}/);
if (!m) { console.error('could not find CITY_LABEL in ' + SRC); process.exit(1); }
const KEEP = new Set([...m[1].matchAll(/"([a-z]+)"\s*:/g)].map(x => x[1]));
if (!KEEP.size) { console.error('CITY_LABEL parsed empty — refusing to prune'); process.exit(1); }
console.log('covered cities:', [...KEEP].join(', '));

const dry = process.argv.includes('--dry');
const { src, companies } = readCompanies(DATA);

const dropped = [];
for (const c of companies) {
  const keep = [];
  for (const j of (c.jobs || [])) {
    const city = j.city || 'nyc';
    if (KEEP.has(city)) keep.push(j);
    else dropped.push({ company: c.name, city, title: j.title });
  }
  c.jobs = keep;
}

const byCity = {};
for (const d of dropped) (byCity[d.city] = byCity[d.city] || []).push(d);
for (const [city, rows] of Object.entries(byCity)) {
  console.log(`\n${city}: ${rows.length} job(s)`);
  const byCo = {};
  for (const r of rows) byCo[r.company] = (byCo[r.company] || 0) + 1;
  console.log('   ' + Object.entries(byCo).sort((a, b) => b[1] - a[1])
    .map(([n, k]) => `${n}:${k}`).join(', '));
}

const empty = companies.filter(c => !(c.jobs || []).length).map(c => c.name);
const jobs = companies.reduce((s, c) => s + (c.jobs || []).length, 0);
console.log(`\n${dropped.length} job(s) dropped, ${jobs} remain across ${companies.length} companies`);
console.log(`${empty.length} left with no live roles (record retained, card hidden)`);

if (dry) { console.log('\n--dry: js/data.js not modified'); process.exit(0); }
if (!dropped.length) { console.log('nothing to do'); process.exit(0); }
writeCompanies(DATA, src, companies);
console.log(`Rewrote ${DATA}: ${jobs} jobs across ${companies.length} companies.`);
