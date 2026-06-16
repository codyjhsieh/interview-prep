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

// Overrides for hand-curated companies (absent from CANDIDATES) whose careers
// page is a custom domain that hides a known ATS board behind it.
const OVERRIDE = {
  linear: ['ashby', 'linear'],
  mercor: ['ashby', 'mercor'],
  hex: ['greenhouse', 'hextechnologies'],
};
Object.assign(slugMap, OVERRIDE);

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
// Title liveness matching. Hand-curated links and board titles drift in
// punctuation ("Engineer, Clinical Fit" vs "Engineer (Clinical Fit)") and in
// location suffixes ("(NYC)"). So: lowercase, punctuation -> space, drop a small
// set of location stopwords, then match by WORD-SUBSET (a posting is live if its
// significant words are all present in some board title). This handles both the
// "(NYC)" extra and the "(Clinical Fit)" meaningful-team cases without the
// over-deletion a blanket paren-strip caused.
const LOC_STOP = new Set(['nyc', 'remote', 'hybrid', 'onsite', 'ny']);
const titleWords = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  .split(' ').filter((w) => w && !LOC_STOP.has(w));
function titleLive(jobTitle, boardTitleSets) {
  const jw = titleWords(jobTitle);
  if (jw.length < 2) return false;                       // too generic to match safely
  return boardTitleSets.some((bs) => jw.every((w) => bs.has(w)));
}
// token that identifies a posting within its company's board
function urlToken(ats, url) {
  let m;
  if ((m = url.match(UUID))) return m[0].toLowerCase();
  if ((m = url.match(/[?&]gh_jid=(\d+)/))) return m[1];
  if ((m = url.match(/\/jobs\/(\d+)/))) return m[1];
  if ((m = url.match(/\/j\/([A-F0-9]+)/i))) return m[1];           // workable
  // Workday: id is the trailing segment after the LAST underscore — may be
  // numeric (10149739), prefixed (JR5288, R263961), or suffixed (R-1459, 10151328-2).
  if (/myworkdayjobs\.com/.test(url) && (m = url.match(/_([A-Za-z0-9-]+)(?:[?#].*)?$/))) return m[1];
  // NB: deliberately NO generic "trailing number" token — a company-hosted URL's
  // trailing id is often NOT the ATS id, which would cause false "dead" calls.
  // Those fall through to title-matching against the live board instead.
  return null;
}

function curl(url, opts = {}) {
  const args = ['-sS', '-L', '--max-time', '20'];
  if (opts.post) { args.push('-X', 'POST', '-H', 'Content-Type: application/json', '-d', opts.post); }
  if (opts.referer) args.push('-H', `Referer: ${opts.referer}`);
  args.push(url);
  // Retry a few times: Ashby/Greenhouse rate-limit under concurrency and return
  // non-JSON; a transient null must not be mistaken for an empty board.
  for (let attempt = 0; attempt < 4; attempt++) {
    try { return JSON.parse(execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024 }).toString()); }
    catch { try { execFileSync('sleep', [String(0.4 * (attempt + 1))]); } catch {} }
  }
  return null;
}

// Returns { ok, complete, tokens:Set, titleSets:[Set<word>] } of all live
// postings on a board. complete=false means we may not have the full board
// (oversized Workday) -> callers must NOT call an unmatched posting dead.
function boardTokens(ats, slug) {
  const toks = new Set(), titleSets = [];
  const addT = (t) => titleSets.push(new Set(titleWords(t)));
  const R = (ok, complete = true) => ({ ok, complete, tokens: toks, titleSets });
  if (ats === 'greenhouse') {
    for (const host of ['boards-api.greenhouse.io', 'boards-api.eu.greenhouse.io']) {
      const d = curl(`https://${host}/v1/boards/${slug}/jobs`);
      if (d && d.jobs) { d.jobs.forEach(j => { toks.add(String(j.id)); addT(j.title); }); return R(true); }
    }
    return R(false);
  }
  if (ats === 'ashby') {
    const d = curl(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`);
    if (!d || !d.jobs) return R(false);
    d.jobs.forEach(j => { toks.add(String(j.id).toLowerCase()); addT(j.title); });
    return R(true);
  }
  if (ats === 'lever') {
    const d = curl(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(d)) return R(false);
    d.forEach(j => { toks.add(String(j.id).toLowerCase()); addT(j.text); });
    return R(true);
  }
  if (ats === 'workable') {
    const d = curl(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`,
      { post: '{"query":"","department":[],"location":[]}', referer: `https://apply.workable.com/${slug}/` });
    if (!d || !d.results) return R(false);
    d.results.forEach(j => { toks.add(String(j.shortcode)); addT(j.title); });
    return R(true);
  }
  if (ats === 'workday') {
    const [tenant, wdn, site] = slug.split('/');
    if (!site) return R(false);
    const base = `https://${tenant}.${wdn}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`;
    const ref = `https://${tenant}.${wdn}.myworkdayjobs.com/en-US/${site}`;
    let offset = 0, any = false, total = 0, complete = false;
    const CAP = 4000;
    while (offset <= CAP) {
      const d = curl(base, { post: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }), referer: ref });
      if (!d || !d.jobPostings) break;
      any = true; total = d.total || 0;
      d.jobPostings.forEach(j => {
        const mm = (j.externalPath || '').match(/_([A-Za-z0-9-]+)$/);
        if (mm) toks.add(mm[1]);
        addT(j.title);
      });
      offset += 20;
      if (offset >= total) { complete = true; break; }
      if (!d.jobPostings.length) { complete = true; break; }
    }
    return R(any, complete);
  }
  return R(false);
}

(async () => {
  // Resolve (ats, slug) per company.
  const targets = companies.map(c => {
    const as = slugMap[c.id] || inferAtsSlug(c.jobs || []);
    return { c, ats: as && as[0], slug: as && as[1] };
  });

  // Fetch boards with limited concurrency (low, to avoid ATS rate-limits).
  const LIMIT = 5;
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
      // Token-authoritative when the URL carries a real ATS id: that exact
      // posting is what the link points to, so its absence = a dead link even
      // if a same-title role still exists. Title-match only when there's no id.
      const matched = tok ? b.tokens.has(tok) : titleLive(j.title, b.titleSets);
      if (matched) { liveCount++; continue; }
      // Not found. Only call it dead if we have the FULL board; otherwise we
      // can't be sure it's gone (e.g. a truncated oversized Workday board).
      if (b.complete) dead.push({ co: c.id, name: c.name, title: j.title, url: j.url });
      else unverifiable.push({ co: c.id, url: j.url, why: 'board-truncated' });
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
