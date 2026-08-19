#!/usr/bin/env node
/* check-logos.mjs — print companies missing from COMPANY_DOMAINS.
 *
 *   node scripts/check-logos.mjs           # JSON list of {id,name} to stdout
 *   node scripts/check-logos.mjs --count   # just the number
 *
 * Exit code 0 always. Silent-missing is a soft failure (letter-tile fallback). */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');

// COMPANIES ids
const cStart = src.indexOf('const COMPANIES = [');
const cOpen  = src.indexOf('[', cStart);
const cEnd   = src.indexOf('\n];', cOpen);
const companies = eval('(' + src.slice(cOpen, cEnd + 2) + ')');

// COMPANY_DOMAINS keys
const dStart = src.indexOf('const COMPANY_DOMAINS = {');
const dOpen  = src.indexOf('{', dStart);
const dEnd   = src.indexOf('\n};', dOpen);
const domains = eval('(' + src.slice(dOpen, dEnd + 2) + ')');
const have = new Set(Object.keys(domains));

const missing = companies
  .filter(c => !have.has(c.id))
  .map(c => ({ id: c.id, name: c.name }));

if (process.argv.includes('--count')) {
  console.log(missing.length);
} else {
  console.log(JSON.stringify(missing, null, 2));
}
