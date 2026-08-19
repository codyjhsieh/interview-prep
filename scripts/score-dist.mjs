#!/usr/bin/env node
/* score-dist.mjs — audit the fit-score distribution across live COMPANIES.
 *
 * Re-implements companyFitScore (js/views.js) in JS so the Python and JS
 * stacks stay in sync (previously scripts/score-dist.py — retired).
 *
 * Prints a 5-point histogram + mean/median/min/max, top 15, bottom 10,
 * and flags anomalies (>15% at cap or floor → distribution collapsed;
 * bimodal → check for missing metadata on entire vertical).
 *
 *   node scripts/score-dist.mjs              # human-readable
 *   node scripts/score-dist.mjs --json       # machine-readable
 *
 * Exit code 0 always. */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const s = src.indexOf('const COMPANIES = [');
const o = src.indexOf('[', s), e = src.indexOf('\n];', o);
const cos = eval('(' + src.slice(o, e + 2) + ')');

const ELITE = new Set(['openai','anthropic','stripe','figma','notion','cognition','cursor','perplexity','cohere','glean','sierra','jane-street','scaleai','ramp','airtable']);
const HEAVY = new Set(['plaid','brex','mercury','datadog','mongodb','vercel','attentive','gusto','carta','hopper','patreon','seatgeek','navan','block','metropolis','spotify','reddit','lyft','peloton','chime','robinhood','sofi','asana','iterable','braze','squarespace','talkspace','oscar']);

const CRYPTO_RE   = /\b(crypto|web3|blockchain|nft|defi|on-?chain|cryptocurrency|tokeniz|stablecoin)\b/i;
const CREATIVE_RE = /\b(creative|design|video|image|music|audio|film|content creator|filmmaker|generative.*(video|image|audio|music)|3d|animation|publishing)\b/i;
const HOSP_RE     = /\b(travel|hotel|restaurant|dining|hospitality|airline|trip|reservation)\b/i;

function score(c) {
  let s = 35;
  const v = c.vertical || '';
  if (v === 'ai') s += 14;
  else if (v === 'devtools' || v === 'infra') s += 7;
  else if (v === 'fintech') s += 2;
  else if (v === 'health' || v === 'saas') s += 0;
  else s -= 2;

  const st = (c.stage || '').toLowerCase();
  if (/seed/.test(st)) s += 22;
  else if (/series a\b/.test(st)) s += 18;
  else if (/series b\b/.test(st)) s += 11;
  else if (/series c\b/.test(st)) s += 3;
  else if (/series d\b/.test(st)) s -= 5;
  else if (/series e\b/.test(st)) s -= 7;
  else if (/series [fghij]\b|late|take-private/.test(st)) s -= 10;
  else if (/public/.test(st)) s -= 12;

  const r = c.raised || '';
  const num = parseFloat(r.replace(/[^\d.]/g, '')) || 0;
  if (/B/.test(r) && num >= 5) s -= 10;
  else if (/B/.test(r) && num >= 1) s -= 7;
  else if (/B/.test(r)) s -= 4;
  else if (num >= 500) s -= 3;
  else if (num >= 200) s -= 1;
  else if (num <= 30) s += 6;

  if (ELITE.has(c.id)) s -= 16;
  if (HEAVY.has(c.id)) s -= 8;
  const levels = (c.jobs || []).map(j => j.level || '');
  if (levels.includes('founding')) s += 12;

  const blob = ((c.sub || '') + ' ' + (c.notes || '')).toLowerCase();
  if (CRYPTO_RE.test(blob))                                s -= 15;
  if (v === 'media' || CREATIVE_RE.test(blob))             s += 10;
  if (v === 'hospitality' || HOSP_RE.test(blob))           s += 10;

  return Math.max(15, Math.min(85, Math.round(s)));
}

const scored = cos.map(c => ({ name: c.name, vertical: c.vertical || '', id: c.id, score: score(c) }));
scored.sort((a, b) => b.score - a.score);

const asJson = process.argv.includes('--json');
const N = scored.length;
const scores = scored.map(x => x.score);
const total = scores.reduce((a, b) => a + b, 0);
const mean = total / N;
const sorted = [...scores].sort((a, b) => a - b);
const median = sorted[Math.floor(N / 2)];
const atCap = scores.filter(s => s >= 85).length;
const atFloor = scores.filter(s => s <= 15).length;

// 5-point buckets
const buckets = new Map();
for (const s of scores) {
  const k = Math.floor(s / 5) * 5;
  buckets.set(k, (buckets.get(k) || 0) + 1);
}

// Anomaly flags
const anomalies = [];
if (atCap / N > 0.15) anomalies.push(`>15% at cap (${atCap}/${N}) — distribution collapsed at 85`);
if (atFloor / N > 0.15) anomalies.push(`>15% at floor (${atFloor}/${N}) — distribution collapsed at 15`);
const bucketCounts = [...buckets.values()];
const modes = bucketCounts.filter(c => c > N * 0.20).length;
if (modes >= 2) anomalies.push(`bimodal distribution (${modes} peaks > 20%) — check vertical metadata`);

if (asJson) {
  console.log(JSON.stringify({
    total: N, mean, median, min: sorted[0], max: sorted[N - 1],
    atCap, atFloor, anomalies,
    top15: scored.slice(0, 15),
    bottom10: scored.slice(-10),
  }, null, 2));
} else {
  console.log(`Total companies: ${N}\n`);
  console.log('Score distribution (5-point buckets, bar = 1 company):');
  for (const k of [...buckets.keys()].sort((a, b) => b - a)) {
    const bar = '#'.repeat(buckets.get(k));
    console.log(`  ${String(k).padStart(3)}-${String(k + 4).padEnd(3)}  ${String(buckets.get(k)).padStart(3)}  ${bar}`);
  }
  console.log();
  console.log(`Mean:   ${mean.toFixed(1)}`);
  console.log(`Median: ${median}`);
  console.log(`Min:    ${sorted[0]}`);
  console.log(`Max:    ${sorted[N - 1]}`);
  console.log(`At cap (85):  ${atCap}`);
  console.log(`At floor (15): ${atFloor}`);
  if (anomalies.length) {
    console.log(`\nAnomalies:`);
    for (const a of anomalies) console.log(`  ⚠ ${a}`);
  }
  console.log('\nTop 15:');
  for (const x of scored.slice(0, 15)) console.log(`  ${String(x.score).padStart(3)}  ${x.name.padEnd(30)}  [${x.vertical}]`);
  console.log('\nBottom 10:');
  for (const x of scored.slice(-10)) console.log(`  ${String(x.score).padStart(3)}  ${x.name.padEnd(30)}  [${x.vertical}]`);
}
