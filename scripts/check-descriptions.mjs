#!/usr/bin/env node
/* check-descriptions.mjs — detect description gaps in js/data.js.
 *
 *   node scripts/check-descriptions.mjs
 *
 * Emits a JSON payload:
 *   { jobs:      [{company, id: companyId, url, title, level, descRaw}],
 *     companies: [{id, name, sub, notes}],
 *     stats:     {jobsTotal, jobsWithDesc, jobsWithDescRaw, jobsNoData,
 *                 companiesTotal, companiesWithTagline} }
 *
 * `jobs` lists postings that have `descRaw` (raw ATS body) but no `desc`
 * (LLM-generated one-liner) — those are ready to summarize.
 * `companies` lists companies without a `tagline`. */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');

const cStart = src.indexOf('const COMPANIES = [');
const cOpen  = src.indexOf('[', cStart);
const cEnd   = src.indexOf('\n];', cOpen);
const companies = eval('(' + src.slice(cOpen, cEnd + 2) + ')');

const jobs = [];
let jobsTotal = 0, jobsWithDesc = 0, jobsWithDescRaw = 0, jobsNoData = 0;
for (const c of companies) {
  for (const j of (c.jobs || [])) {
    jobsTotal++;
    if (j.desc) jobsWithDesc++;
    if (j.descRaw) jobsWithDescRaw++;
    if (!j.desc && !j.descRaw) jobsNoData++;
    if (j.descRaw && !j.desc) {
      jobs.push({
        company: c.name, id: c.id, url: j.url, title: j.title,
        level: j.level || '', descRaw: j.descRaw,
      });
    }
  }
}

const companiesNeedingTagline = companies
  .filter(c => !c.tagline)
  .map(c => ({ id: c.id, name: c.name, sub: c.sub || '', notes: c.notes || '' }));

const stats = {
  jobsTotal, jobsWithDesc, jobsWithDescRaw, jobsNoData,
  jobsReadyForLLM: jobs.length,
  companiesTotal: companies.length,
  companiesWithTagline: companies.length - companiesNeedingTagline.length,
  companiesNeedingTagline: companiesNeedingTagline.length,
};

if (process.argv.includes('--count')) {
  console.log(`Jobs total:              ${stats.jobsTotal}`);
  console.log(`  with desc (LLM):       ${stats.jobsWithDesc}`);
  console.log(`  with descRaw only:     ${stats.jobsReadyForLLM}   ← ready to summarize`);
  console.log(`  no description data:   ${stats.jobsNoData}`);
  console.log(`Companies total:         ${stats.companiesTotal}`);
  console.log(`  with tagline:          ${stats.companiesWithTagline}`);
  console.log(`  needing tagline:       ${stats.companiesNeedingTagline}`);
} else {
  console.log(JSON.stringify({ jobs, companies: companiesNeedingTagline, stats }, null, 2));
}
