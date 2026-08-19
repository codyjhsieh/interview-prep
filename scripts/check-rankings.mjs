#!/usr/bin/env node
/* check-rankings.mjs — detect ranking gaps in views.js.
 *
 * Reports three sets:
 *   - missingCoolness: companies in COMPANIES with no COOLNESS entry
 *   - missingQuant:    hft-vertical companies not in QUANT_GATED
 *   - staleKeys:       COOLNESS keys that no longer correspond to a company
 *
 *   node scripts/check-rankings.mjs           # JSON report
 *   node scripts/check-rankings.mjs --count   # one-line summary
 *
 * Exit code 0 always. Silent-approximate is a soft failure (fallback in
 * views.js:_coolness handles anything missing). */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataSrc = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const viewsSrc = fs.readFileSync(path.join(ROOT, 'js/views.js'), 'utf8');

// COMPANIES from data.js
const cStart = dataSrc.indexOf('const COMPANIES = [');
const cOpen  = dataSrc.indexOf('[', cStart);
const cEnd   = dataSrc.indexOf('\n];', cOpen);
const companies = eval('(' + dataSrc.slice(cOpen, cEnd + 2) + ')');

// COOLNESS from views.js
const kStart = viewsSrc.indexOf('const COOLNESS = {');
const kOpen  = viewsSrc.indexOf('{', kStart);
const kEnd   = viewsSrc.indexOf('\n};', kOpen);
const coolness = eval('(' + viewsSrc.slice(kOpen, kEnd + 2) + ')');

// QUANT_GATED from views.js
const qStart = viewsSrc.indexOf('const QUANT_GATED = new Set([');
const qOpen  = viewsSrc.indexOf('[', qStart);
const qEnd   = viewsSrc.indexOf('\n]);', qOpen);
const quantGated = new Set(eval('(' + viewsSrc.slice(qOpen, qEnd + 2) + ')'));

const coolKeys = new Set(Object.keys(coolness));
const companyIds = new Set(companies.map(c => c.id));

const missingCoolness = companies
  .filter(c => !coolKeys.has(c.id))
  .map(c => ({ id: c.id, name: c.name, vertical: c.vertical || '' }));

const missingQuant = companies
  .filter(c => c.vertical === 'hft' && !quantGated.has(c.id))
  .map(c => ({ id: c.id, name: c.name }));

const staleKeys = [...coolKeys].filter(k => !companyIds.has(k));

if (process.argv.includes('--count')) {
  console.log(`COOLNESS gaps:    ${missingCoolness.length}`);
  console.log(`QUANT_GATED gaps: ${missingQuant.length}`);
  console.log(`Stale keys:       ${staleKeys.length}`);
} else {
  console.log(JSON.stringify({ missingCoolness, missingQuant, staleKeys }, null, 2));
}
