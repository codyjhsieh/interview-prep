#!/usr/bin/env node
/* apply-descriptions.mjs — additively merge agent-produced descriptions
 * back into js/data.js.
 *
 *   node scripts/apply-descriptions.mjs <path/to/agent-output.json> [--force]
 *
 * Input JSON format:
 *   { jobs:      [{url, desc}],      // one-line desc per job (by url)
 *     companies: [{id, tagline}] }   // punchy tagline per company (by id)
 *
 * Rules:
 *   - Additive by default: never overwrites an existing desc/tagline.
 *   - --force overwrites existing values. Use only for a deliberate backfill
 *     (e.g. re-cutting the corpus to a new length budget), never in a routine
 *     refresh — it will happily replace good copy with worse copy.
 *   - Strips any trailing newlines / quotes from desc; caps to 140 chars, and
 *     reports anything over the render budgets (32 tagline / 70 desc).
 *   - Drops `descRaw` from any job that has a `desc`. descRaw is the raw ATS
 *     body -- input to the summarization step, never read by the UI -- and at
 *     ~800 bytes per job it was 0.77 MB of the 2.6 MB data.js shipped to every
 *     visitor. Jobs still awaiting a desc keep theirs (check-descriptions.mjs
 *     uses `descRaw && !desc` to find them). Running this with an empty
 *     payload ({}) performs the prune alone.
 *   - Re-serializes data.js in the same hand-written style used by
 *     merge-additive.js and check-dead.js (so all three stay in sync).
 *   - Reports how many jobs / companies were updated. */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const force = args.includes('--force');
const inPath = args.find((a) => !a.startsWith('--'));
if (!inPath) {
  console.error('usage: apply-descriptions.mjs <agent-output.json> [--force]');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'js/data.js');
const src = fs.readFileSync(DATA, 'utf8');
const payload = JSON.parse(fs.readFileSync(inPath, 'utf8'));

const cStart = src.indexOf('const COMPANIES = [');
const cOpen  = src.indexOf('[', cStart);
const cEnd   = src.indexOf('\n];', cOpen);
const companies = eval('(' + src.slice(cOpen, cEnd + 2) + ')');

const clean = (s) => String(s || '').replace(/\s+/g, ' ').replace(/^["'`]+|["'`]+$/g, '').trim().slice(0, 140);

const descByUrl = new Map();
for (const j of (payload.jobs || [])) if (j.url && j.desc) descByUrl.set(j.url, clean(j.desc));
const tagById = new Map();
for (const c of (payload.companies || [])) if (c.id && c.tagline) tagById.set(c.id, clean(c.tagline));

// Render budgets (see .claude/skills/refresh-descriptions/SKILL.md).
const TAGLINE_BUDGET = 32, DESC_BUDGET = 70;

let jobsUpdated = 0, companiesUpdated = 0, jobsReplaced = 0, companiesReplaced = 0;
let tagOver = 0, descOver = 0;
for (const c of companies) {
  if (tagById.has(c.id) && (force || !c.tagline)) {
    if (c.tagline) companiesReplaced++;
    c.tagline = tagById.get(c.id);
    if (c.tagline.length > TAGLINE_BUDGET) tagOver++;
    companiesUpdated++;
  }
  for (const j of (c.jobs || [])) {
    if (descByUrl.has(j.url) && (force || !j.desc)) {
      if (j.desc) jobsReplaced++;
      j.desc = descByUrl.get(j.url);
      if (j.desc.length > DESC_BUDGET) descOver++;
      jobsUpdated++;
    }
  }
}

// descRaw has done its job once a desc exists: it is summarization input, not
// render data (no reference to it anywhere in js/). Dropping it here keeps the
// payload from regrowing on every refresh.
let rawDropped = 0, rawBytes = 0;
for (const c of companies) {
  for (const j of (c.jobs || [])) {
    if (j.desc && j.descRaw) { rawBytes += j.descRaw.length; delete j.descRaw; rawDropped++; }
  }
}

// Re-serialize in the same hand-written style as merge-additive.js.
const esc = (s) => JSON.stringify(s).slice(1, -1).replace(/—/g, '\\u2014');
const emitJob = (j) => {
  let s = `      { title:"${esc(j.title)}", url:"${esc(j.url)}"`;
  if (j.level) s += `, level:"${esc(j.level)}"`;
  if (j.added) s += `, added:"${esc(j.added)}"`;
  if (j.posted) s += `, posted:"${esc(j.posted)}"`;
  if (j.desc) s += `, desc:"${esc(j.desc)}"`;
  if (j.descRaw) s += `, descRaw:"${esc(j.descRaw)}"`;
  return s + ' }';
};
const emitCompany = (c) => {
  const L = [];
  L.push(`  { id:${JSON.stringify(c.id)}, name:"${esc(c.name)}", vertical:${JSON.stringify(c.vertical)},`);
  if (c.sub !== undefined) L.push(`    sub:"${esc(c.sub)}",`);
  if (c.tagline !== undefined) L.push(`    tagline:"${esc(c.tagline)}",`);
  const meta = [];
  if (c.stage !== undefined) meta.push(`stage:"${esc(c.stage)}"`);
  if (c.raised !== undefined) meta.push(`raised:"${esc(c.raised)}"`);
  if (c.lead !== undefined) meta.push(`lead:"${esc(c.lead)}"`);
  if (meta.length) L.push('    ' + meta.join(', ') + ',');
  if (c.badges !== undefined) L.push(`    badges:${JSON.stringify(c.badges)},`);
  if (c.totalRoles !== undefined) L.push(`    totalRoles:${c.totalRoles},`);
  if (c.notes !== undefined) L.push(`    notes:"${esc(c.notes)}",`);
  L.push('    jobs:[');
  L.push((c.jobs || []).map(emitJob).join(',\n'));
  L.push('    ] }');
  return L.join('\n');
};

const block = 'const COMPANIES = [\n' + companies.map(emitCompany).join(',\n') + '\n];';
const a = src.indexOf('const COMPANIES = [');
const e = src.indexOf('\n];', src.indexOf('[', a)) + 3;
fs.writeFileSync(DATA, src.slice(0, a) + block + src.slice(e));

console.log(`Applied ${jobsUpdated} job desc(s) and ${companiesUpdated} company tagline(s).`);
if (force) console.log(`  --force replaced ${jobsReplaced} existing desc(s), ${companiesReplaced} existing tagline(s).`);
if (rawDropped) {
  console.log(`  dropped descRaw from ${rawDropped} job(s) that already have a desc (${(rawBytes / 1024).toFixed(0)} KB).`);
}
if (tagOver || descOver) {
  console.log(`  over budget: ${tagOver} tagline(s) > ${TAGLINE_BUDGET} chars, ${descOver} desc(s) > ${DESC_BUDGET} chars.`);
}
