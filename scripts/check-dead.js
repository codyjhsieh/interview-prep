#!/usr/bin/env node
/* Dead-link checker. For every company, re-fetch its FULL ATS board (unfiltered)
 * and check whether each posting's job-id still exists on it. A posting is DEAD
 * only when its company's board fetched successfully AND the id is absent (so a
 * network blip never falsely flags a role; a role that merely moved location or
 * changed title still counts live because we match the unfiltered board).
 *
 *   node scripts/check-dead.js            # report only
 *   node scripts/check-dead.js --prune    # also remove confirmed-dead from data.js
 *
 * ATS + slug come from refresh-companies.py's CANDIDATES; for hand-curated
 * companies absent there, they're inferred from a posting URL. */
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const DATA = 'js/data.js';
const prune = process.argv.includes('--prune');

function extractCompanies(src) {
  const a = src.indexOf('[', src.indexOf('const COMPANIES = ['));
  const e = src.indexOf('\n];', a);
  return { companies: eval('(' + src.slice(a, e + 2) + ')'), a, e };
}
const src = fs.readFileSync(DATA, 'utf8');
const { companies } = extractCompanies(src);

// id -> [ats, slug] from CANDIDATES tuples (id, name, ats, slug, ...)
const py = fs.readFileSync('scripts/refresh-companies.py', 'utf8');
const slugMap = {};
for (const m of py.matchAll(/\("([^"]+)","[^"]*","([^"]+)","([^"]+)"/g)) slugMap[m[1]] = [m[2], m[3]];

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function inferAtsSlug(jobs) {
  for (const j of jobs) {
    const u = j.url || '';
    let m;
    if ((m = u.match(/ashbyhq\.com\/([^/]+)\//))) return ['ashby', m[1]];
    if ((m = u.match(/(?:job-boards|boards)\.(?:eu\.)?greenhouse\.io\/([^/]+)\//))) return ['greenhouse', m[1]];
    if ((m = u.match(/lever\.co\/([^/]+)\//))) return ['lever', m[1]];
    if ((m = u.match(/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/[^/]*\/([^/]+)/i)))
      return ['workday', `${m[1]}/${m[2]}/${m[3]}`];
  }
  return null;
}
// token that identifies a posting within its company's board
function urlToken(ats, url) {
  let m;
  if ((m = url.match(UUID))) return m[0].toLowerCase();
  if ((m = url.match(/[?&]gh_jid=(\d+)/))) return m[1];
  if ((m = url.match(/\/jobs\/(\d+)/))) return m[1];
  if ((m = url.match(/_(\d+)(?:[/?]|$)/))) return m[1];          // workday
  if ((m = url.match(/\/j\/([A-F0-9]+)/i))) return m[1];          // workable
  return null;
}

function curl(url, opts = {}) {
  const args = ['-sS', '-L', '--max-time', '20'];
  if (opts.post) { args.push('-X', 'POST', '-H', 'Content-Type: application/json', '-d', opts.post); }
  if (opts.referer) args.push('-H', `Referer: ${opts.referer}`);
  args.push(url);
  try { return JSON.parse(execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024 }).toString()); }
  catch { return null; }
}

// Returns { ok:bool, tokens:Set } of all live postings on a board.
function boardTokens(ats, slug) {
  const toks = new Set();
  if (ats === 'greenhouse') {
    for (const host of ['boards-api.greenhouse.io', 'boards-api.eu.greenhouse.io']) {
      const d = curl(`https://${host}/v1/boards/${slug}/jobs`);
      if (d && d.jobs) { d.jobs.forEach(j => toks.add(String(j.id))); return { ok: true, tokens: toks }; }
    }
    return { ok: false, tokens: toks };
  }
  if (ats === 'ashby') {
    const d = curl(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`);
    if (!d || !d.jobs) return { ok: false, tokens: toks };
    d.jobs.forEach(j => toks.add(String(j.id).toLowerCase()));
    return { ok: true, tokens: toks };
  }
  if (ats === 'lever') {
    const d = curl(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(d)) return { ok: false, tokens: toks };
    d.forEach(j => toks.add(String(j.id).toLowerCase()));
    return { ok: true, tokens: toks };
  }
  if (ats === 'workday') {
    const [tenant, wdn, site] = slug.split('/');
    if (!site) return { ok: false, tokens: toks };
    const base = `https://${tenant}.${wdn}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`;
    const ref = `https://${tenant}.${wdn}.myworkdayjobs.com/en-US/${site}`;
    let offset = 0, any = false;
    while (offset <= 500) {
      const d = curl(base, { post: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }), referer: ref });
      if (!d || !d.jobPostings) break;
      any = true;
      d.jobPostings.forEach(j => { const mm = (j.externalPath || '').match(/_(\d+)$/); if (mm) toks.add(mm[1]); });
      const total = d.total || 0; offset += 20;
      if (offset >= total || !d.jobPostings.length) break;
    }
    return { ok: any, tokens: toks };
  }
  return { ok: false, tokens: toks };
}

(async () => {
  // Resolve (ats, slug) per company.
  const targets = companies.map(c => {
    const as = slugMap[c.id] || inferAtsSlug(c.jobs || []);
    return { c, ats: as && as[0], slug: as && as[1] };
  });

  // Fetch boards with limited concurrency.
  const LIMIT = 8;
  let i = 0;
  const boards = {};
  async function worker() {
    while (i < targets.length) {
      const t = targets[i++];
      if (!t.ats) { boards[t.c.id] = { ok: false, tokens: new Set(), noslug: true }; continue; }
      boards[t.c.id] = boardTokens(t.ats, t.slug);
      boards[t.c.id].ats = t.ats; boards[t.c.id].slug = t.slug;
    }
  }
  await Promise.all(Array.from({ length: LIMIT }, worker));

  const dead = [], unverifiable = [];
  let liveCount = 0, total = 0;
  for (const { c, ats } of targets) {
    const b = boards[c.id];
    for (const j of c.jobs || []) {
      total++;
      if (!b.ok) { unverifiable.push({ co: c.id, url: j.url, why: b.noslug ? 'no-slug' : 'fetch-failed' }); continue; }
      const tok = urlToken(ats, j.url);
      if (tok && b.tokens.has(tok)) { liveCount++; continue; }
      // token couldn't be parsed -> can't judge; treat as unverifiable, not dead
      if (!tok) { unverifiable.push({ co: c.id, url: j.url, why: 'no-token' }); continue; }
      dead.push({ co: c.id, name: c.name, title: j.title, url: j.url });
    }
  }

  console.log(`Checked ${total} postings across ${companies.length} companies`);
  console.log(`  live: ${liveCount}   dead: ${dead.length}   unverifiable: ${unverifiable.length}`);
  const badBoards = targets.filter(t => !boards[t.c.id].ok).map(t => t.c.id);
  if (badBoards.length) console.log(`  boards not fetched (${badBoards.length}): ${badBoards.join(', ')}`);
  console.log('\nDEAD (confirmed gone from live board):');
  const byCo = {};
  dead.forEach(d => (byCo[d.name] = byCo[d.name] || []).push(d));
  Object.entries(byCo).forEach(([n, arr]) => {
    console.log(`  ${n} (${arr.length}):`);
    arr.forEach(d => console.log(`     ${d.title}  ${d.url}`));
  });

  fs.writeFileSync('/tmp/dead_links.json', JSON.stringify({ dead, unverifiable }, null, 2));

  if (prune && dead.length) {
    const deadUrls = new Set(dead.map(d => d.url));
    for (const c of companies) {
      const before = (c.jobs || []).length;
      c.jobs = (c.jobs || []).filter(j => !deadUrls.has(j.url));
      if (c.jobs.length !== before) c.totalRoles = c.jobs.length;
    }
    // Re-serialize the COMPANIES block in data.js's hand-written style
    // (identical to scripts/merge-additive.js).
    const esc = (s) => JSON.stringify(s).slice(1, -1).replace(/—/g, '\\u2014');
    const emitJob = (j) => {
      let s = `      { title:"${esc(j.title)}", url:"${esc(j.url)}"`;
      if (j.level) s += `, level:"${esc(j.level)}"`;
      if (j.added) s += `, added:"${esc(j.added)}"`;
      if (j.posted) s += `, posted:"${esc(j.posted)}"`;
      return s + ' }';
    };
    const emitCompany = (c) => {
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
    };
    const block = 'const COMPANIES = [\n' + companies.map(emitCompany).join(',\n') + '\n];';
    const a = src.indexOf('const COMPANIES = [');
    const e = src.indexOf('\n];', src.indexOf('[', a)) + 3;
    fs.writeFileSync(DATA, src.slice(0, a) + block + src.slice(e));
    console.log(`\n--prune: removed ${dead.length} confirmed-dead links from ${DATA}.`);
  }
})();
