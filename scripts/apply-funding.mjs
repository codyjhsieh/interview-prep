#!/usr/bin/env node
/* apply-funding.mjs — write funding proposals into js/data.js.
 *
 *   node scripts/apply-funding.mjs .tmp/funding.json
 *   node scripts/apply-funding.mjs .tmp/funding.json --dry
 *   node scripts/apply-funding.mjs .tmp/funding.json --include-flagged
 *
 * Input is fetch-funding.py's output: {proposals:[{id,raised,stage,lead,
 * source,evidence,flag?}]}.
 *
 * Rules:
 *   - Additive only. A company that already carries `raised` keeps it —
 *     hand-curated funding is better sourced than anything extracted here,
 *     and the whole point is to fill blanks, not to relitigate.
 *   - Flagged proposals are skipped unless --include-flagged. fetch-funding.py
 *     flags claims of $1B or more (easy to confuse with a valuation) and cases
 *     where SEC filings contradict the posting.
 *   - Writes `fundingSrc` alongside, so a later reader can tell an extracted
 *     figure from a curated one without digging through git history.
 */
'use strict';
import fs from 'node:fs';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const includeFlagged = args.includes('--include-flagged');
const inPath = args.find((a) => !a.startsWith('--'));
if (!inPath) {
  console.error('usage: apply-funding.mjs <funding.json> [--dry] [--include-flagged]');
  process.exit(1);
}

const { proposals = [] } = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const { src, companies } = readCompanies(DATA);
const byId = new Map(companies.map((c) => [c.id, c]));

let applied = 0, skippedHave = 0, skippedFlag = 0, missing = 0;
const notes = [];
for (const p of proposals) {
  const c = byId.get(p.id);
  if (!c) { missing++; continue; }
  if (c.raised) { skippedHave++; continue; }
  if (p.flag && !includeFlagged) {
    skippedFlag++;
    notes.push(`  flagged, not applied: ${c.name} — ${p.flag}`);
    continue;
  }
  c.raised = p.raised;
  if (p.stage && !c.stage) c.stage = p.stage;
  if (p.lead && !c.lead) c.lead = p.lead;
  c.fundingSrc = p.source || 'posting';
  applied++;
  notes.push(`  ${c.name}: ${p.raised}${p.stage ? ' ' + p.stage : ''}${p.lead ? ' · ' + p.lead : ''}`);
}

for (const n of notes) console.log(n);
console.log(`\napplied ${applied}, skipped ${skippedHave} already funded, `
  + `${skippedFlag} flagged for review, ${missing} not on the board`);

if (dry) { console.log('--dry: js/data.js not modified'); process.exit(0); }
if (!applied) { console.log('nothing to write'); process.exit(0); }

writeCompanies(DATA, src, companies);
console.log(`wrote ${DATA}`);
