#!/usr/bin/env node
/* Additive merge for "refresh jobs": keep EVERY existing company + job and only
 * ADD newly-discovered ones. Nothing is ever removed (user: "Focus on new jobs
 * don't remove"). Companies keyed by id; jobs keyed by url within each company.
 *
 *   node scripts/merge-additive.js js/data.js <source> [--baseline f.js] [--today YYYY-MM-DD]
 *
 * <source> is either another data.js (its COMPANIES literal is extracted) or a
 * JSON file {verified, rows:[{id,name,...,jobs:[{title,url,level,posted}]}]}
 * emitted by `refresh-companies.py --emit-json`.
 *
 * Date stamping — every job gets an `added` (YYYY-MM-DD = when it entered our
 * dataset) so the UI can sort by recency:
 *   - a job that already has `added` keeps it;
 *   - else, if --baseline is given and the url exists there, it gets the
 *     baseline's COMPANIES_VERIFIED_AT (accurate backfill of pre-existing jobs);
 *   - else it gets --today (a genuinely new posting).
 * `posted` (the ATS publish date) is carried through when the source provides it.
 *
 * Rewrites js/data.js in place, bumps COMPANIES_VERIFIED_AT to --today (or the
 * JSON source's `verified`), and prints what changed. */
'use strict';
const fs = require('fs');

const argv = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
  else pos.push(argv[i]);
}
const [targetPath, sourcePath] = pos;
if (!targetPath || !sourcePath) {
  console.error('usage: node scripts/merge-additive.js js/data.js <source.js|source.json> [--baseline f.js] [--today YYYY-MM-DD]');
  process.exit(1);
}

// Pull the `const COMPANIES = [ ... \n];` array literal out of a data.js and eval it.
function extractCompanies(src) {
  const start = src.indexOf('const COMPANIES = [');
  if (start < 0) throw new Error('COMPANIES not found');
  const open = src.indexOf('[', start);
  const end = src.indexOf('\n];', open);
  if (end < 0) throw new Error('end of COMPANIES not found');
  // eslint-disable-next-line no-eval
  return eval('(' + src.slice(open, end + 2) + ')');
}
function verifiedAt(src) {
  const m = src.match(/const COMPANIES_VERIFIED_AT = '([^']+)'/);
  return m ? m[1] : null;
}
function loadCompanies(path) {
  const src = fs.readFileSync(path, 'utf8');
  if (path.endsWith('.json')) {
    const d = JSON.parse(src);
    return { companies: d.rows || d, verified: d.verified || null };
  }
  return { companies: extractCompanies(src), verified: verifiedAt(src) };
}

const origSrc = fs.readFileSync(targetPath, 'utf8');
const orig = extractCompanies(origSrc);
const src = loadCompanies(sourcePath);
const today = flags.today || src.verified || verifiedAt(origSrc);

// Baseline: accurate `added` backfill for jobs that pre-existed the very first refresh.
let baselineUrls = null, baselineDate = null;
if (flags.baseline) {
  const b = loadCompanies(flags.baseline);
  baselineDate = b.verified;
  baselineUrls = new Set(b.companies.flatMap((c) => (c.jobs || []).map((j) => j.url)));
}

const byId = new Map(orig.map((c) => [c.id, c]));
let newCompanies = 0, newJobs = 0;
const added = [];

for (const rc of src.companies) {
  const ec = byId.get(rc.id);
  if (!ec) {
    orig.push(rc);
    byId.set(rc.id, rc);
    newCompanies++;
    newJobs += (rc.jobs || []).length;
    added.push(`+ NEW COMPANY ${rc.name} (${(rc.jobs || []).length} jobs)`);
    continue;
  }
  const have = new Map((ec.jobs || []).map((j) => [j.url, j]));
  const fresh = (rc.jobs || []).filter((j) => !have.has(j.url));
  // carry posted onto already-present jobs if the source now has it
  for (const j of rc.jobs || []) {
    const e = have.get(j.url);
    if (e && j.posted && !e.posted) e.posted = j.posted;
  }
  if (fresh.length) {
    ec.jobs = (ec.jobs || []).concat(fresh);
    newJobs += fresh.length;
    added.push(`+ ${ec.name}: ${fresh.length} new job(s)`);
  }
}

// Stamp `added` on every job across the whole dataset.
let stampedNew = 0;
for (const c of orig) {
  for (const j of c.jobs || []) {
    if (j.added) continue;
    if (baselineUrls && baselineUrls.has(j.url) && baselineDate) j.added = baselineDate;
    else { j.added = today; stampedNew++; }
  }
  c.totalRoles = Math.max(c.totalRoles || 0, (c.jobs || []).length);
}

// ── Serialize one company in the file's hand-written style ────────────────
const esc = (s) => JSON.stringify(s).slice(1, -1).replace(/—/g, '\\u2014');
function emitJob(j) {
  let s = `      { title:"${esc(j.title)}", url:"${esc(j.url)}"`;
  if (j.level) s += `, level:"${esc(j.level)}"`;
  if (j.added) s += `, added:"${esc(j.added)}"`;
  if (j.posted) s += `, posted:"${esc(j.posted)}"`;
  return s + ' }';
}
function emitCompany(c) {
  const L = [];
  L.push(`  { id:${JSON.stringify(c.id)}, name:"${esc(c.name)}", vertical:${JSON.stringify(c.vertical)},`);
  if (c.sub !== undefined) L.push(`    sub:"${esc(c.sub)}",`);
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
}

const block = 'const COMPANIES = [\n' + orig.map(emitCompany).join(',\n') + '\n];';
const start = origSrc.indexOf('const COMPANIES = [');
const end = origSrc.indexOf('\n];', origSrc.indexOf('[', start)) + 3;
let out = origSrc.slice(0, start) + block + origSrc.slice(end);
if (today) {
  out = out.replace(/const COMPANIES_VERIFIED_AT = '[^']+';/, `const COMPANIES_VERIFIED_AT = '${today}';`);
}
fs.writeFileSync(targetPath, out);

const totalJobs = orig.reduce((n, c) => n + (c.jobs || []).length, 0);
console.log(`Companies: ${orig.length} (added ${newCompanies})`);
console.log(`Jobs:      ${totalJobs} (added ${newJobs})`);
console.log(`Verified:  ${today}${baselineDate ? `   (backfilled added=${baselineDate} for baseline jobs, added=${today} for ${stampedNew} newer)` : ''}`);
console.log('---');
for (const a of added) console.log(a);
