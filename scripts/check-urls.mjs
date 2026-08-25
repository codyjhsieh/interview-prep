#!/usr/bin/env node
/* check-urls.mjs — request every job URL and find the ones that land on a
 * "page not found" page.
 *
 *   node scripts/check-urls.mjs                     # report -> .tmp/url-status.json
 *   node scripts/check-urls.mjs --prune             # also remove confirmed-dead
 *   node scripts/check-urls.mjs --workers 16 --only ashby
 *
 * check-dead.js asks the company's BOARD whether a posting id is still listed.
 * That misses two things, and both leave a broken link on the board:
 *   1. companies whose board could not be fetched are skipped entirely
 *      (13 of them on the last run) — their dead postings are never seen;
 *   2. an ATS that serves a "this job is no longer available" page with HTTP
 *      200 looks alive to any status-code check.
 * So this fetches the URL a visitor would click and reads what comes back.
 *
 * A URL is DEAD only on an unambiguous signal:
 *   - HTTP 404 or 410
 *   - a <title> that is a known not-found title for that ATS
 *   - a redirect that drops the posting id and lands on the board root
 * Anything else — timeouts, 403 bot walls, 5xx, empty bodies — is UNKNOWN and
 * never pruned. A transient failure must not delete a live posting, and the
 * proxy in this environment 403s several career domains that work fine in a
 * browser.
 */
'use strict';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';
const argv = process.argv.slice(2);
const prune = argv.includes('--prune');
const WORKERS = Number(argv[argv.indexOf('--workers') + 1]) || 12;
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : '';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/125.0 Safari/537.36';

// Phrases an ATS puts in the <title> or early body when a posting is gone.
const NOT_FOUND_TITLE = /(404|page not found|not found|job board$|^error|oops)/i;
const NOT_FOUND_BODY = new RegExp([
  'this job is no longer (?:available|accepting|open)',
  'the job you are looking for',
  'position (?:is|has been) (?:closed|filled)',
  'no longer accepting applications',
  'job posting (?:is )?(?:no longer|not) (?:available|found)',
  'this posting (?:is|has) (?:closed|expired)',
  'we could(?:n.t| not) find (?:that|the) (?:job|page|posting)',
  'sorry, this job',
].join('|'), 'i');

const curl = (url) => new Promise((resolve) => {
  // -L follow, -m hard timeout, write the final status + url after the body.
  execFile('curl', ['-sSL', '-m', '25', '-A', UA,
    '-w', '\\n@@STATUS:%{http_code}@@URL:%{url_effective}', url],
  { maxBuffer: 8 * 1024 * 1024, timeout: 30000 }, (err, stdout) => {
    if (err && !stdout) return resolve({ status: 0, final: '', body: '' });
    const m = /\n@@STATUS:(\d+)@@URL:(.*)$/s.exec(stdout || '');
    const body = m ? stdout.slice(0, m.index) : (stdout || '');
    resolve({ status: m ? Number(m[1]) : 0, final: m ? m[2].trim() : '', body });
  });
});

const titleOf = (b) => (/<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(b || '')?.[1] || '')
  .replace(/\s+/g, ' ').trim();

// The posting id inside a job URL. If the final URL no longer contains it, the
// ATS bounced the visitor to a listing page — the posting is gone.
const idOf = (u) => {
  let m;
  if ((m = u.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i))) return m[0];
  if ((m = u.match(/gh_jid=(\d+)/))) return m[1];
  if ((m = u.match(/\/jobs\/(\d+)/))) return m[1];
  if ((m = u.match(/smartrecruiters\.com\/[^/]+\/(\d+)/))) return m[1];
  if ((m = u.match(/_(?:JR|R)\d+/i))) return m[0];
  return null;
};

function classify(job, res) {
  const { status, final, body } = res;
  if (status === 404 || status === 410) return ['dead', `HTTP ${status}`];
  if (status === 0) return ['unknown', 'no response (timeout or blocked)'];
  if (status === 403) return ['unknown', 'HTTP 403 (bot wall / proxy)'];
  if (status === 429) return ['unknown', 'HTTP 429 (rate limited)'];
  if (status >= 500) return ['unknown', `HTTP ${status}`];
  const title = titleOf(body);
  if (title && NOT_FOUND_TITLE.test(title)) return ['dead', `title: "${title.slice(0, 60)}"`];
  const head = (body || '').slice(0, 20000).replace(/<[^>]+>/g, ' ');
  const hit = NOT_FOUND_BODY.exec(head);
  if (hit) return ['dead', `body: "${hit[0].slice(0, 60)}"`];
  const id = idOf(job.url);
  if (id && final && !final.includes(id)) return ['dead', `redirected off the posting -> ${final.slice(0, 70)}`];
  if (!body) return ['unknown', 'empty body'];
  return ['live', title.slice(0, 60)];
}

// ── Ashby: the HTTP response cannot be trusted ───────────────────────────
// Ashby job pages are client-rendered, and whether the server returns the
// full page or a 7,270-byte shell titled "Jobs" depends on how the COMPANY's
// board is configured, not on whether the posting is alive. OpenAI's postings
// render server-side; Cursor's live postings return the same bare shell a
// deleted posting does. Reading that shell as "gone" flagged all 20 live
// Cursor roles for deletion.
// So Ashby is resolved against the public board API instead, which lists the
// posting ids that actually exist. One fetch per slug, cached.
const ashbyBoard = new Map();          // slug -> Set(id) | null (unfetchable)
async function ashbyIds(slug) {
  if (ashbyBoard.has(slug)) return ashbyBoard.get(slug);
  // Retry with backoff: the board API rate-limits under concurrency, and a
  // throttled response must not be read as "this company has no postings" —
  // that would condemn every one of its links.
  let ids = null;
  for (let attempt = 0; attempt < 3 && ids === null; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500 * attempt));
    const { status, body } = await curl(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    if (status !== 200) continue;
    try {
      const jobs = JSON.parse(body).jobs;
      // An empty array is a real answer only if the board truly has no
      // postings; treat it as one, but a parse failure stays null (retry).
      if (Array.isArray(jobs)) ids = new Set(jobs.map((j) => j.id));
    } catch { /* malformed — retry */ }
  }
  ashbyBoard.set(slug, ids);
  return ids;
}

async function classifyAshby(job) {
  const m = job.url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{36})/i);
  if (!m) return ['unknown', 'unparseable Ashby URL'];
  const ids = await ashbyIds(m[1]);
  if (!ids) return ['unknown', `Ashby board ${m[1]} unfetchable`];
  return ids.has(m[2].toLowerCase())
    ? ['live', 'listed on the Ashby board']
    : ['dead', `absent from the Ashby board (${ids.size} postings listed)`];
}

const { src, companies } = readCompanies(DATA);
const tasks = [];
for (const c of companies) for (const j of c.jobs || []) {
  if (only && !j.url.includes(only)) continue;
  tasks.push({ company: c.name, id: c.id, title: j.title, url: j.url });
}
console.error(`checking ${tasks.length} URLs with ${WORKERS} workers…`);

const results = [];
let cursor = 0, done = 0;
async function worker() {
  while (cursor < tasks.length) {
    const t = tasks[cursor++];
    const [verdict, why] = /jobs\.ashbyhq\.com/.test(t.url)
      ? await classifyAshby(t)
      : classify(t, await curl(t.url));
    results.push({ ...t, verdict, why });
    if (++done % 100 === 0) console.error(`  ${done}/${tasks.length}`);
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));

const dead = results.filter((r) => r.verdict === 'dead');
const unknown = results.filter((r) => r.verdict === 'unknown');
console.log(`\nlive ${results.length - dead.length - unknown.length}  dead ${dead.length}  unknown ${unknown.length}`);
if (dead.length) {
  console.log('\nDEAD (page not found):');
  for (const d of dead) console.log(`  ${d.company} — ${d.title}\n     ${d.why}\n     ${d.url}`);
}
if (unknown.length) {
  const by = {};
  for (const u of unknown) by[u.why] = (by[u.why] || 0) + 1;
  console.log('\nUNKNOWN (never pruned):', JSON.stringify(by));
}
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync('.tmp/url-status.json', JSON.stringify({ dead, unknown }, null, 1));

if (!prune) { console.log('\nreport only — pass --prune to remove the dead ones'); process.exit(0); }
if (!dead.length) { console.log('\nnothing to prune'); process.exit(0); }
const deadUrls = new Set(dead.map((d) => d.url));
for (const c of companies) {
  const before = (c.jobs || []).length;
  c.jobs = (c.jobs || []).filter((j) => !deadUrls.has(j.url));
  if (c.jobs.length !== before && c.totalRoles !== undefined) c.totalRoles = c.jobs.length;
}
writeCompanies(DATA, src, companies);
console.log(`\npruned ${dead.length} dead link(s) from ${DATA}`);
