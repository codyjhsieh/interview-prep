// Sync stress suite. Mixes unit tests of the merge logic
// against ported helpers (must mirror js/sync.js) and e2e tests
// against an in-process MOCK of the Cloudflare Worker.
//
// The mock mirrors cloudflare/worker.js (CORS, routes, 1 MB limit,
// 404 on unknown code, JSON validation). Default run: zero network,
// zero Cloudflare KV writes — runs offline, costs nothing.
//
// To verify against the real Worker, pass `--live`:
//     node scripts/sync-stress.mjs --live
// (will spend ~30 KV writes + ~50 reads per run on your free tier).
const LIVE = process.argv.includes('--live');
const URL = 'https://interview-prep-sync.codyjhsieh.workers.dev';
const CODE = 'STRESST01';

class MiniHeaders {
  constructor(headers = {}) {
    this.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
  }
  get(k) { return this.headers[String(k).toLowerCase()] || null; }
}
class MiniResponse {
  constructor(body, init = {}) {
    this._body = body == null ? '' : String(body);
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new MiniHeaders(init.headers || {});
  }
  async json() { return JSON.parse(this._body); }
  async text() { return this._body; }
}
const ResponseCtor = globalThis.Response || MiniResponse;

// ── In-process Worker mock ──────────────────────────────────────────
// When LIVE === false we shim global fetch with an in-memory KV store
// + the exact routes from cloudflare/worker.js. Identical status codes,
// headers, and bodies so tests can't tell the difference.
if (!LIVE) {
  const MAX_BODY = 1_048_576;
  const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '86400',
  };
  const kv = new Map();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (typeof url !== 'string' || !url.startsWith(URL)) return realFetch(url, init);
    const path = url.slice(URL.length) || '/';
    const method = (init.method || 'GET').toUpperCase();
    const mkRes = (body, status = 200, extraHeaders = {}) => new ResponseCtor(body, {
      status,
      headers: { ...CORS, ...extraHeaders },
    });
    if (method === 'OPTIONS') return mkRes(null, 204);
    if (path === '/' || path === '') return mkRes('interview-prep-sync ok', 200, { 'content-type': 'text/plain' });
    const m = path.match(/^\/state\/([A-Z0-9-]{4,20})$/i);
    if (!m) return mkRes(JSON.stringify({ error: 'not-found' }), 404, { 'content-type': 'application/json' });
    const code = m[1].toUpperCase().replace(/-/g, '');
    if (method === 'GET') {
      const v = kv.get(code);
      if (!v) return mkRes(JSON.stringify({ error: 'not-found' }), 404, { 'content-type': 'application/json' });
      return mkRes(v, 200, { 'content-type': 'application/json' });
    }
    if (method === 'PUT') {
      const len = parseInt((init.headers || {})['content-length'] || '0', 10);
      if (len > MAX_BODY) return mkRes(JSON.stringify({ error: 'too-large' }), 413, { 'content-type': 'application/json' });
      const body = typeof init.body === 'string' ? init.body : '';
      if (body.length > MAX_BODY) return mkRes(JSON.stringify({ error: 'too-large' }), 413, { 'content-type': 'application/json' });
      let parsed;
      try { parsed = JSON.parse(body); }
      catch { return mkRes(JSON.stringify({ error: 'invalid-json' }), 400, { 'content-type': 'application/json' }); }
      // Mirror worker.js: read-modify-write _seq + _sv
      let prevSeq = 0;
      const existing = kv.get(code);
      if (existing) {
        try { prevSeq = (JSON.parse(existing)._seq || 0); } catch {}
      }
      parsed._seq = prevSeq + 1;
      parsed._sv  = Date.now();
      kv.set(code, JSON.stringify(parsed));
      return mkRes(JSON.stringify({ ok: true, savedAt: parsed._sv, _seq: parsed._seq }), 200, { 'content-type': 'application/json' });
    }
    return mkRes(JSON.stringify({ error: 'method-not-allowed' }), 405, { 'content-type': 'application/json' });
  };
  console.log('[mock] in-process Worker — zero Cloudflare KV credits used\n');
} else {
  console.log('[LIVE] hitting real Worker at', URL, '— this spends free-tier writes\n');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const failures = [];
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; failures.push(msg); console.log('  [31mFAIL[0m', msg); return; }
  console.log('  [32mPASS[0m', msg);
};

// ── Ported merge helpers from js/sync.js ─────────────────────────────
function unionByTs(la, lb) {
  const seen = new Set(); const out = [];
  for (const j of (la || []).concat(lb || [])) {
    if (!j || j.ts == null) continue;
    if (seen.has(j.ts)) continue;
    seen.add(j.ts); out.push(j);
  }
  return out.sort((x, y) => (x.ts || 0) - (y.ts || 0));
}
function unionByTsExcluding(la, lb, tombs) {
  const seen = new Set(); const out = [];
  const t = tombs || {};
  for (const j of (la || []).concat(lb || [])) {
    if (!j || j.ts == null) continue;
    if (t[j.ts]) continue;
    if (seen.has(j.ts)) continue;
    seen.add(j.ts); out.push(j);
  }
  return out.sort((x, y) => (x.ts || 0) - (y.ts || 0));
}
function unionKeys(a, b) { return { ...(a || {}), ...(b || {}) }; }
function mergeByInnerTs(a, b, ts) {
  const out = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    if (!out[k]) { out[k] = b[k]; continue; }
    if ((b[k][ts] || 0) > (out[k][ts] || 0)) out[k] = b[k];
  }
  return out;
}
function mergeFlashcardFailLedger(a, b) {
  // Ported from js/sync.js -- union the fail-event ledgers by id then
  // recompute the cached stats. Falls back to per-key max only if both
  // sides have no events at all.
  const aEvents = Array.isArray(a.flashcardFailEvents) ? a.flashcardFailEvents : [];
  const bEvents = Array.isArray(b.flashcardFailEvents) ? b.flashcardFailEvents : [];
  if (!aEvents.length && !bEvents.length) {
    const aFs = a.flashcardFailStats || {}, bFs = b.flashcardFailStats || {};
    const mx = (x, y) => {
      const out = { ...(x || {}) };
      for (const k of Object.keys(y || {})) out[k] = Math.max(out[k] || 0, y[k] || 0);
      return out;
    };
    return {
      flashcardFailEvents: [],
      flashcardFailStats: {
        byCat:    mx(aFs.byCat,    bFs.byCat),
        byModule: mx(aFs.byModule, bFs.byModule),
        byLesson: mx(aFs.byLesson, bFs.byLesson),
        byCard:   mx(aFs.byCard,   bFs.byCard),
      },
    };
  }
  const seen = new Set();
  const union = [];
  for (const src of [aEvents, bEvents]) {
    for (const ev of src) {
      const key = ev?.id || `${ev?.ts || ''}:${ev?.cardId || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      union.push(ev);
    }
  }
  union.sort((x, y) => (x.ts || 0) - (y.ts || 0));
  // legacyBase preservation: see js/sync.js for full rationale. Each
  // device may carry pre-ledger fails in its cache that have no event
  // records. legacy = max(0, cached - derived); we add back the larger
  // of the two devices' legacies on top of the union-derived count.
  const deriveAxes = (events) => {
    const out = { byCat: {}, byModule: {}, byLesson: {}, byCard: {} };
    for (const e of events) {
      if (!e) continue;
      if (e.cardId) out.byCard[e.cardId]   = (out.byCard[e.cardId]   || 0) + 1;
      if (e.cat)    out.byCat[e.cat]       = (out.byCat[e.cat]       || 0) + 1;
      if (e.module) out.byModule[e.module] = (out.byModule[e.module] || 0) + 1;
      if (e.lesson) out.byLesson[e.lesson] = (out.byLesson[e.lesson] || 0) + 1;
    }
    return out;
  };
  const aDerived = deriveAxes(aEvents);
  const bDerived = deriveAxes(bEvents);
  const unionDerived = deriveAxes(union);
  const aCached = a.flashcardFailStats || {};
  const bCached = b.flashcardFailStats || {};
  const stats = { byCat: {}, byModule: {}, byLesson: {}, byCard: {} };
  for (const axis of ['byCat', 'byModule', 'byLesson', 'byCard']) {
    const uMap = unionDerived[axis];
    const aMap = aCached[axis] || {};
    const bMap = bCached[axis] || {};
    const aDM = aDerived[axis];
    const bDM = bDerived[axis];
    const allKeys = new Set([
      ...Object.keys(uMap), ...Object.keys(aMap), ...Object.keys(bMap),
    ]);
    for (const k of allKeys) {
      const aLegacy = Math.max(0, (aMap[k] || 0) - (aDM[k] || 0));
      const bLegacy = Math.max(0, (bMap[k] || 0) - (bDM[k] || 0));
      stats[axis][k] = (uMap[k] || 0) + Math.max(aLegacy, bLegacy);
    }
  }
  return { flashcardFailEvents: union, flashcardFailStats: stats };
}

function unionMapOfArrays(a, b) {
  const out = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    const ax = out[k] || []; const bx = b[k] || [];
    const seen = new Set(); const merged = [];
    for (const it of ax.concat(bx)) {
      const key = it && it.ts != null ? it.ts : JSON.stringify(it);
      if (seen.has(key)) continue;
      seen.add(key); merged.push(it);
    }
    out[k] = merged;
  }
  return out;
}
function unionHistory(la, lb) {
  const map = {};
  for (const h of (la || [])) if (h && h.date) map[h.date] = cloneHistoryEntry(h);
  for (const h of (lb || [])) {
    if (!h || !h.date) continue;
    const cur = map[h.date];
    if (!cur) { map[h.date] = cloneHistoryEntry(h); continue; }
    map[h.date] = mergeHistoryEntry(cur, h);
  }
  return Object.values(map).sort((x, y) => x.date.localeCompare(y.date));
}
function cloneHistoryEntry(h) {
  return {
    ...h,
    events: { ...(h.events || {}) },
    eventsXP: { ...(h.eventsXP || {}) },
    awards: Array.isArray(h.awards) ? h.awards.map(a => ({ ...a })) : undefined,
  };
}
function awardKey(a) {
  if (!a) return null;
  if (a.id) return String(a.id);
  if (a.ts != null) return `${a.ts}:${a.reason || ''}:${a.xp || 0}`;
  return JSON.stringify(a);
}
function awardSum(h) {
  return (Array.isArray(h.awards) ? h.awards : [])
    .reduce((sum, a) => sum + (Number(a && a.xp) || 0), 0);
}
function mergeHistoryEntry(a, b) {
  const byId = new Map();
  for (const src of [a, b]) {
    for (const ev of (Array.isArray(src.awards) ? src.awards : [])) {
      const k = awardKey(ev);
      if (k && !byId.has(k)) byId.set(k, { ...ev, id: ev.id || k });
    }
  }
  const awards = Array.from(byId.values()).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  const legacyBase = Math.max(0, (a.xp || 0) - awardSum(a), (b.xp || 0) - awardSum(b));
  const events = {};
  const eventsXP = {};
  if (legacyBase > 0) { events.legacy = 1; eventsXP.legacy = legacyBase; }
  for (const ev of awards) {
    const reason = ev.reason || 'unknown';
    const xp = Number(ev.xp) || 0;
    events[reason] = (events[reason] || 0) + 1;
    eventsXP[reason] = (eventsXP[reason] || 0) + xp;
  }
  return {
    ...a,
    ...b,
    date: a.date || b.date,
    xp: legacyBase + awards.reduce((sum, ev) => sum + (Number(ev.xp) || 0), 0),
    lessons: Math.max(a.lessons || 0, b.lessons || 0),
    events,
    eventsXP,
    awards,
  };
}
function mergePets(a, b, aT, bT) {
  if (!a && !b) return null;
  if (!a) return b; if (!b) return a;
  const fresher = (bT || 0) >= (aT || 0) ? b : a;
  const merged = { ...a, ...fresher };
  for (const k of ['form','deathCount']) {
    merged[k] = Math.max(a[k] || 0, b[k] || 0);
  }
  const aDeaths = a.deathCount || 0, bDeaths = b.deathCount || 0;
  const isFreshRespawn = (p) => p && p.stage === 'baby' && (p.ageDays || 0) === 0 && (p.lastFedDate == null);
  const aFresh = isFreshRespawn(a), bFresh = isFreshRespawn(b);
  let stageHandled = false;
  if (aDeaths !== bDeaths) {
    const fresherLife = bDeaths > aDeaths ? b : a;
    merged.ageDays = fresherLife.ageDays || 0;
    if (fresherLife.stage) { merged.stage = fresherLife.stage; stageHandled = true; }
  } else if (aFresh && !bFresh) {
    merged.ageDays = 0; merged.stage = 'baby'; stageHandled = true;
  } else if (bFresh && !aFresh) {
    merged.ageDays = 0; merged.stage = 'baby'; stageHandled = true;
  } else {
    merged.ageDays = Math.max(a.ageDays || 0, b.ageDays || 0);
  }
  // Vitality + lastFedAt merged as a PAIR from the side with the most
  // recent feed event.
  const aFed = a.lastFedAt || 0, bFed = b.lastFedAt || 0;
  const fedSide = bFed >= aFed ? b : a;
  merged.vitality  = fedSide.vitality || 0;
  merged.lastFedAt = fedSide.lastFedAt || 0;
  const aEatDate = a.lastEatenDate || '';
  const bEatDate = b.lastEatenDate || '';
  if (aEatDate === bEatDate) {
    merged.eatenTodayXP = Math.max(a.eatenTodayXP || 0, b.eatenTodayXP || 0);
    merged.lastEatenDate = aEatDate;
  } else if (bEatDate > aEatDate) {
    merged.eatenTodayXP = b.eatenTodayXP || 0;
    merged.lastEatenDate = bEatDate;
  } else {
    merged.eatenTodayXP = a.eatenTodayXP || 0;
    merged.lastEatenDate = aEatDate;
  }
  for (const k of ['lastTickDate','lastFedDate']) {
    const da = a[k] || '', db = b[k] || '';
    merged[k] = db > da ? db : da;
  }
  if (!stageHandled) {
    const olderPet = (a.ageDays || 0) >= (b.ageDays || 0) ? a : b;
    if (olderPet.stage) merged.stage = olderPet.stage;
  }
  return merged;
}
function mergeStates(a, b) {
  if (!a) return b; if (!b) return a;
  const aS = a._seq || 0, bS = b._seq || 0;
  const aT = a.updatedAt || 0, bT = b.updatedAt || 0;
  const seqBased = aS > 0 && bS > 0;
  const fresher = seqBased ? (bS >= aS ? b : a) : (bT >= aT ? b : a);
  const stale   = seqBased ? (bS >= aS ? a : b) : (bT >= aT ? a : b);
  const merged = { ...stale, ...fresher };
  merged.history = unionHistory(a.history, b.history);
  merged.jobAppsDeletedTs = unionKeys(a.jobAppsDeletedTs, b.jobAppsDeletedTs);
  merged.jobApps = unionByTsExcluding(a.jobApps, b.jobApps, merged.jobAppsDeletedTs);
  merged.mocks   = unionByTs(a.mocks, b.mocks);
  merged.flashcards       = mergeByInnerTs(a.flashcards, b.flashcards, 'lastReviewed');
  merged.missedQuestions  = mergeByInnerTs(a.missedQuestions, b.missedQuestions, 'lastReviewed');
  merged.conceptReviews   = mergeByInnerTs(a.conceptReviews, b.conceptReviews, 'lastReviewed');
  merged.starStories      = mergeByInnerTs(a.starStories, b.starStories, 'updatedAt');
  merged.completedLessons = unionKeys(a.completedLessons, b.completedLessons);
  merged.badges           = unionKeys(a.badges, b.badges);
  merged.companySeen      = unionKeys(a.companySeen, b.companySeen);
  merged.cueShownDates    = unionKeys(a.cueShownDates, b.cueShownDates);
  merged.freeRecallAttempts = unionMapOfArrays(a.freeRecallAttempts, b.freeRecallAttempts);
  const failMerged = mergeFlashcardFailLedger(a, b);
  merged.flashcardFailEvents = failMerged.flashcardFailEvents;
  merged.flashcardFailStats  = failMerged.flashcardFailStats;
  const aFreshness = seqBased ? aS : aT;
  const bFreshness = seqBased ? bS : bT;
  merged.pet = mergePets(a.pet, b.pet, aFreshness, bFreshness);
  if ((a.streak?.count || 0) >= (b.streak?.count || 0)) merged.streak = a.streak;
  else                                                   merged.streak = b.streak;
  const mergedHistoryXp = historyXpTotal(merged.history);
  const legacyXpBase = Math.max(
    0,
    (a.xp || 0) - historyXpTotal(a.history),
    (b.xp || 0) - historyXpTotal(b.history)
  );
  merged.xp = Math.max(0, legacyXpBase + mergedHistoryXp);
  merged.level = (a.xp != null || b.xp != null)
    ? levelFromXP(merged.xp)
    : Math.max(a.level || 0, b.level || 0);
  merged.todayDate = fresher.todayDate || null;
  const todayEntry = merged.todayDate && (merged.history || []).find(h => h.date === merged.todayDate);
  merged.todayXP = todayEntry ? Math.max(0, todayEntry.xp || 0) : (fresher.todayXP || 0);
  merged.updatedAt = Math.max(aT, bT);
  merged._seq = Math.max(aS, bS);
  return merged;
}
function normalizeCode(input) { return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function historyXpTotal(history) {
  return (history || []).reduce((sum, h) => sum + (Number(h && h.xp) || 0), 0);
}
function levelFromXP(xp) {
  xp = Math.max(0, xp || 0);
  let n = 1;
  while (Math.round(100 * n * (n + 1) / 2) <= xp) n++;
  return n;
}

/* Helpers.
 *
 * put() now returns the parsed response so callers can verify ok + read
 * the worker-assigned _seq. Previously it returned the raw fetch Response
 * and tests silently passed when a PUT 5xx'd or hit a 413.
 *
 * waitFor() polls a predicate against the latest GET until it returns
 * true or the timeout fires. Real Cloudflare KV has read-your-writes
 * lag across regions (200-500ms typical); the in-process mock is
 * synchronous, so a single 150ms sleep that worked in mock mode would
 * race in --live. waitFor closes that gap. */
async function put(state, code = CODE) {
  const r = await fetch(`${URL}/state/${code}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
  });
  let body = null;
  try { body = await r.json(); } catch (_) {}
  return { ok: r.ok, status: r.status, body };
}
async function get(code = CODE) {
  const r = await fetch(`${URL}/state/${code}`);
  if (r.status === 404) return { status: 404, body: null };
  return { status: r.status, body: await r.json() };
}
async function waitFor(predicate, { code = CODE, timeoutMs = 2500, pollMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const g = await get(code);
    last = g.body;
    try { if (predicate(g.body)) return g.body; } catch (_) {}
    await sleep(pollMs);
  }
  return last;
}
async function wipe(code) {
  // Reset KV for a fresh section. We can't DELETE but we can write a
  // minimal blob that future tests overwrite.
  await put({ wipe: 1, updatedAt: Date.now() }, code);
}

(async () => {
  // ── Section A: Worker / Network (10) ────────────────────────────────
  console.log('\n--- A. Worker / Network ---');
  let r = await fetch(URL + '/');
  ok(r.status === 200, '1. liveness GET / → 200');
  r = await fetch(URL + '/state/' + CODE, { method: 'OPTIONS', headers: { 'Origin': 'https://codyhsieh.com', 'Access-Control-Request-Method': 'PUT' } });
  ok(r.status === 200 || r.status === 204, '2. CORS preflight → 200/204');
  ok(r.headers.get('access-control-allow-origin') === '*', '3. CORS allows any origin');
  r = await fetch(URL + '/state/NOTEXIST99');
  ok(r.status === 404, '4. GET unknown code → 404');
  let pr = await put({ updatedAt: 1, hello: 'world' });
  ok(pr.ok, '5. PUT happy path → 200');
  r = await fetch(URL + '/state/' + CODE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(1_100_000) });
  ok(r.status === 413 || r.status === 400, '6. PUT > 1MB → 413/400');
  r = await fetch(URL + '/state/' + CODE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
  ok(r.status === 400, '7. PUT malformed JSON → 400');
  r = await fetch(URL + '/state/AB', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  ok(r.status === 404, '8. PUT short-code → 404 (path regex requires 4+ chars)');
  // Two concurrent PUTs — last write wins. Wait for KV to settle.
  await Promise.all([put({ updatedAt: 100, marker: 'A' }), put({ updatedAt: 200, marker: 'B' })]);
  const g = await waitFor(b => b && (b.marker === 'A' || b.marker === 'B'), { timeoutMs: 1500 });
  ok(g && (g.marker === 'A' || g.marker === 'B'),
    `9. concurrent PUTs → one wins (got marker: ${g?.marker})`);
  ok(g != null, '10. PUT then GET round-trips');

  // ── Section B: Code normalization (5) ───────────────────────────────
  console.log('\n--- B. Code normalization ---');
  ok(normalizeCode('foie-gras') === 'FOIEGRAS', '11. hyphens stripped + uppercased');
  ok(normalizeCode('  abc123  ') === 'ABC123', '12. whitespace + case');
  ok(normalizeCode('A!B@C#') === 'ABC', '13. special chars stripped');
  ok(normalizeCode(null) === '', '14. null → empty');
  ok(normalizeCode('') === '', '15. empty → empty');

  // ── Section C: Merge basic (10) ─────────────────────────────────────
  console.log('\n--- C. Merge basic ---');
  ok(mergeStates(null, { xp: 5 }).xp === 5, '16. null + state = state');
  ok(mergeStates({ xp: 5 }, null).xp === 5, '17. state + null = state');
  const s1 = { xp: 50, updatedAt: 100, jobApps: [{ ts: 1 }] };
  const m1 = mergeStates(s1, s1);
  ok(m1.xp === 50 && m1.jobApps.length === 1, '18. identical → same shape');
  ok(mergeStates({}, { xp: 200, updatedAt: 1 }).xp === 200, '19. empty + full');
  ok(mergeStates({ xp: 100, updatedAt: 1 }, { xp: 50, updatedAt: 2 }).xp === 100, '20. xp max wins');
  ok(mergeStates({ level: 5, updatedAt: 1 }, { level: 3, updatedAt: 2 }).level === 5, '21. level max wins');
  const sr = mergeStates({ streak: { count: 5 }, updatedAt: 1 }, { streak: { count: 3 }, updatedAt: 2 });
  ok(sr.streak.count === 5, '22. streak higher count wins');
  const td = mergeStates({ todayXP: 10, updatedAt: 1 }, { todayXP: 50, updatedAt: 2 });
  ok(td.todayXP === 50, '23. todayXP from fresher (bigger updatedAt)');
  const cl = mergeStates({ completedLessons: { 'a': { xp: 10 } }, updatedAt: 1 }, { completedLessons: { 'b': { xp: 15 } }, updatedAt: 2 });
  ok(cl.completedLessons.a && cl.completedLessons.b, '24. completedLessons key-union');
  const bg = mergeStates({ badges: { 'first': {} }, updatedAt: 1 }, { badges: { 'streak3': {} }, updatedAt: 2 });
  ok(bg.badges.first && bg.badges.streak3, '25. badges key-union');

  // ── Section D: Append-only arrays (8) ───────────────────────────────
  console.log('\n--- D. Append-only arrays ---');
  const ja1 = { jobApps: [{ ts: 100 }, { ts: 200 }], updatedAt: 1 };
  const ja2 = { jobApps: [{ ts: 200 }, { ts: 300 }], updatedAt: 2 };
  ok(mergeStates(ja1, ja2).jobApps.length === 3, '26. jobApps union by ts (dedupe overlap)');
  const ts1 = { jobApps: [{ ts: 100 }, { ts: 200 }], jobAppsDeletedTs: {}, updatedAt: 1 };
  const ts2 = { jobApps: [{ ts: 100 }, { ts: 200 }], jobAppsDeletedTs: { '200': Date.now() }, updatedAt: 2 };
  const tm = mergeStates(ts1, ts2);
  ok(tm.jobApps.length === 1 && tm.jobApps[0].ts === 100, '27. jobApps tombstone filters deleted ts');
  ok(tm.jobAppsDeletedTs['200'], '28. jobAppsDeletedTs unioned across devices');
  const mk1 = { mocks: [{ ts: 1, score: 5 }], updatedAt: 1 };
  const mk2 = { mocks: [{ ts: 2, score: 9 }], updatedAt: 2 };
  ok(mergeStates(mk1, mk2).mocks.length === 2, '29. mocks union by ts');
  const hi1 = { history: [{ date: '2026-01-01', xp: 50, lessons: 1 }], updatedAt: 1 };
  const hi2 = { history: [{ date: '2026-01-01', xp: 80, lessons: 2 }], updatedAt: 2 };
  const hm = mergeStates(hi1, hi2);
  ok(hm.history[0].xp === 80 && hm.history[0].lessons === 2, '30. history per-date max(xp), max(lessons)');
  const fc1 = { flashcards: { 'f1': { ease: 2.0, lastReviewed: 100 } }, updatedAt: 1 };
  const fc2 = { flashcards: { 'f1': { ease: 2.8, lastReviewed: 200 } }, updatedAt: 2 };
  ok(mergeStates(fc1, fc2).flashcards.f1.ease === 2.8, '31. flashcards newer lastReviewed wins');
  const ss1 = { starStories: { 's1': { situation: 'A', updatedAt: 100 } }, updatedAt: 1 };
  const ss2 = { starStories: { 's1': { situation: 'B', updatedAt: 200 } }, updatedAt: 2 };
  ok(mergeStates(ss1, ss2).starStories.s1.situation === 'B', '32. starStories newer updatedAt wins');
  const fr1 = { freeRecallAttempts: { 'L1': [{ ts: 1, text: 'a' }, { ts: 2, text: 'b' }] }, updatedAt: 1 };
  const fr2 = { freeRecallAttempts: { 'L1': [{ ts: 2, text: 'b' }, { ts: 3, text: 'c' }] }, updatedAt: 2 };
  ok(mergeStates(fr1, fr2).freeRecallAttempts.L1.length === 3, '33. freeRecallAttempts dedupe by ts');

  // ── Section E: Pet merge (7) ────────────────────────────────────────
  console.log('\n--- E. Pet merge ---');
  ok(mergePets(null, null, 0, 0) === null, '34. both null pets → null');
  const p1 = { vitality: 60, form: 10, ageDays: 3, lastTickDate: '2026-05-13' };
  const p2 = { vitality: 90, form: 5,  ageDays: 1, lastTickDate: '2026-05-14' };
  const pm = mergePets(p1, p2, 100, 200);
  ok(pm.vitality === 90 && pm.form === 10 && pm.ageDays === 3, '35. pet stats unioned via max');
  ok(pm.lastTickDate === '2026-05-14', '36. pet lastTickDate later wins');
  const np1 = { name: 'Alice', bodyHue: 0xFF0000 };
  const np2 = { name: 'Bob',   bodyHue: 0x00FF00 };
  const npm = mergePets(np1, np2, 100, 200);
  ok(npm.name === 'Bob' && npm.bodyHue === 0x00FF00, '37. pet identity from fresher updatedAt');
  const npm2 = mergePets(np1, np2, 200, 100);
  ok(npm2.name === 'Alice', '38. pet identity flip when A is fresher');
  const sp1 = { stage: 'teen',  ageDays: 5 };
  const sp2 = { stage: 'baby',  ageDays: 2 };
  ok(mergePets(sp1, sp2, 100, 200).stage === 'teen', '39. pet stage from older ageDays');
  const dp = mergePets({ deathCount: 1 }, { deathCount: 3 }, 100, 200);
  ok(dp.deathCount === 3, '40. pet deathCount max');

  // ── Section F: Edge cases (5) ───────────────────────────────────────
  console.log('\n--- F. Edge cases ---');
  // Clock drift: device B's clock is 1 hour ahead. Both have same data.
  const driftA = { xp: 100, updatedAt: 1000, jobApps: [{ ts: 100 }] };
  const driftB = { xp: 100, updatedAt: 1000 + 3600_000, jobApps: [{ ts: 100 }] };
  const dm = mergeStates(driftA, driftB);
  ok(dm.xp === 100 && dm.jobApps.length === 1, '41. clock drift: data preserved regardless of updatedAt');
  const noT = mergeStates({ xp: 50 }, { xp: 75, updatedAt: 100 });
  ok(noT.xp === 75 && noT.updatedAt === 100, '42. updatedAt=0 on one side handled');
  const stale = mergeStates({ xp: 50, updatedAt: 100, jobApps: [{ ts: 1 }] }, { xp: 100, updatedAt: 200, jobApps: [{ ts: 2 }] });
  ok(stale.xp === 100 && stale.jobApps.length === 2, '43. stale local + newer remote merges');
  const newer = mergeStates({ xp: 100, updatedAt: 200, jobApps: [{ ts: 2 }] }, { xp: 50, updatedAt: 100, jobApps: [{ ts: 1 }] });
  ok(newer.xp === 100 && newer.jobApps.length === 2, '44. newer local + stale remote: still unions');
  // Tombstone with no jobApp matching it is still preserved (until GC)
  const tg = mergeStates(
    { jobApps: [], jobAppsDeletedTs: { '999': 1000 }, updatedAt: 1 },
    { jobApps: [], jobAppsDeletedTs: {}, updatedAt: 2 }
  );
  ok(tg.jobAppsDeletedTs['999'], '45. orphan tombstone preserved through merge');

  // ── Section G: E2E flow simulation (5) ──────────────────────────────
  console.log('\n--- G. E2E flow simulation ---');
  const CODE2 = 'STRESST02';
  await wipe(CODE2);

  // 46: A seeds, B pulls + merges + pushes, A polls + sees union
  const sA = { xp: 100, updatedAt: Date.now(), jobApps: [{ ts: 100, date: '2026-05-14', xp: 9 }], pet: { name: 'Alice', vitality: 80, lastTickDate: '2026-05-14' } };
  const sAPut = await put(sA, CODE2);
  ok(sAPut.ok, '46-pre. seed PUT acknowledged by Worker');
  const sBPull = await waitFor(b => b && Array.isArray(b.jobApps) && b.jobApps.length === 1, { code: CODE2 });
  const sBLocal = { xp: 50, jobApps: [{ ts: 200, date: '2026-05-14', xp: 9 }], pet: { name: 'Bob', vitality: 60, lastTickDate: '2026-05-13' } };
  const sBMerged = mergeStates(sBLocal, sBPull);
  sBMerged.updatedAt = Date.now();
  await put(sBMerged, CODE2);
  const final46 = await waitFor(b => b && Array.isArray(b.jobApps) && b.jobApps.length === 2, { code: CODE2 });
  ok(final46?.jobApps?.length === 2 && final46?.xp === 100, '46. two-device pair: union of state preserved');
  ok(final46?.pet?.vitality === 80 && final46?.pet?.name === 'Alice', '47. pet: vitality max + identity from fresher');

  // 48: Delete propagation via tombstones
  const sDel = { ...final46, jobApps: final46.jobApps.filter(j => j.ts !== 100), jobAppsDeletedTs: { 100: Date.now() }, updatedAt: Date.now() };
  await put(sDel, CODE2);
  const delObserved = await waitFor(b => b && (b.jobAppsDeletedTs || {})['100'] != null, { code: CODE2 });
  const sOther = mergeStates(final46, delObserved);
  ok(sOther.jobApps.length === 1 && sOther.jobApps[0].ts === 200, '48. tombstone propagates deletion to other device');

  // 49: Concurrent click on both devices — both pushed, KV resolves one
  await put({ updatedAt: 1000, marker: 'X', jobApps: [{ ts: 1 }] }, CODE2);
  await waitFor(b => b && b.marker === 'X', { code: CODE2 });
  const conc1 = { updatedAt: 1100, marker: 'Y', jobApps: [{ ts: 2 }] };
  const conc2 = { updatedAt: 1100, marker: 'Z', jobApps: [{ ts: 3 }] };
  await Promise.all([put(conc1, CODE2), put(conc2, CODE2)]);
  const r49 = await waitFor(b => b && (b.marker === 'Y' || b.marker === 'Z'), { code: CODE2, timeoutMs: 3000 });
  console.log('     (49 saw marker:', r49?.marker, ')');
  ok(r49 && ['X', 'Y', 'Z'].includes(r49.marker) && Array.isArray(r49.jobApps),
    '49. concurrent PUTs: no corruption, one PUT wins');

  // 50: Offline period — device with stale local catches up
  await put({ updatedAt: 2000, xp: 500, jobApps: [{ ts: 100 }, { ts: 200 }, { ts: 300 }] }, CODE2);
  const settled50 = await waitFor(b => b && b.xp === 500, { code: CODE2 });
  const offlineLocal = { updatedAt: 1500, xp: 200, jobApps: [{ ts: 100 }] };  // stale
  const recovered = mergeStates(offlineLocal, settled50);
  ok(recovered.xp === 500 && recovered.jobApps.length === 3, '50. stale-offline device catches up to KV on next poll');

  await wipe(CODE2);

  // ── Section H: Server-issued _seq (5) ──────────────────────────────
  console.log('\n--- H. Server-issued _seq ---');
  const CODE3 = 'SEQTESTH1';
  // 51: first PUT stamps _seq = 1 (after wipe to ensure a clean code)
  await wipe(CODE3);
  // The wipe is itself a PUT, so it occupies _seq=1. Real first user
  // write lands at _seq=2 on this fresh code. Test the monotonic shape
  // rather than the exact starting value.
  let rH = await put({ hello: 'first' }, CODE3);
  ok(rH.ok && typeof rH.body?._seq === 'number', '51. first PUT to a fresh code stamps a numeric _seq');
  const seq1 = rH.body._seq;
  // 52: subsequent PUTs increment _seq monotonically
  rH = await put({ hello: 'second' }, CODE3);
  ok(rH.body?._seq === seq1 + 1, '52. second PUT increments _seq by exactly 1');
  rH = await put({ hello: 'third' }, CODE3);
  ok(rH.body?._seq === seq1 + 2, '53. third PUT increments _seq by exactly 1 again');
  // 54: GET returns the stamped state with the latest _seq. Use waitFor
  // for the read to settle past KV propagation lag.
  const gH = await waitFor(b => b && b.hello === 'third' && b._seq === seq1 + 2, { code: CODE3 });
  ok(gH?._seq === seq1 + 2 && gH?.hello === 'third', '54. GET returns latest stamped state');
  // 55: pollOnce skip-criteria (mirrors js/sync.js): when local._seq >=
  //     remote._seq, the poll should skip the merge — verifies the
  //     "fresher" comparator uses _seq first.
  function shouldSkip(localSeq, remoteSeq, lastSeen) {
    if (remoteSeq <= localSeq) return true;
    if (remoteSeq <= lastSeen) return true;
    return false;
  }
  ok(shouldSkip(3, 3, 3) && shouldSkip(4, 3, 0) && !shouldSkip(2, 3, 2),
    '55. _seq-based pollOnce skip logic correct for equal/ahead/behind');

  // ── Section I: Audit-trail convergence (5) ─────────────────────────
  console.log('\n--- I. Audit-trail convergence ---');
  const ha = {
    history: [{
      date: '2026-05-19',
      xp: 18,
      lessons: 1,
      events: { lesson: 1 },
      eventsXP: { lesson: 18 },
      awards: [{ id: 'devA:1:lesson:x', ts: 1, reason: 'lesson', xp: 18 }],
    }],
    xp: 118,
    todayXP: 18,
    todayDate: '2026-05-19',
    updatedAt: 100,
    _seq: 5,
  };
  const hb = {
    history: [{
      date: '2026-05-19',
      xp: 9,
      lessons: 0,
      events: { app: 1 },
      eventsXP: { app: 9 },
      awards: [{ id: 'devB:2:app:y', ts: 2, reason: 'app', xp: 9 }],
    }],
    xp: 109,
    todayXP: 9,
    todayDate: '2026-05-19',
    updatedAt: 100,
    _seq: 5,
  };
  const habState = mergeStates(ha, hb);
  const hab = habState.history[0];
  ok(hab.xp === 27 && hab.events.lesson === 1 && hab.events.app === 1,
    '56. same-day audit awards union by id instead of maxing XP');
  ok(hab.eventsXP.lesson === 18 && hab.eventsXP.app === 9 && hab.awards.length === 2,
    '57. audit eventsXP recomputed from award union');
  const undo = mergeStates(ha, {
    history: [{
      date: '2026-05-19',
      xp: 9,
      awards: [
        { id: 'devA:1:lesson:x', ts: 1, reason: 'lesson', xp: 18 },
        { id: 'devA:3:app_undo:z', ts: 3, reason: 'app_undo', xp: -9 },
      ],
    }],
    updatedAt: 101,
    _seq: 6,
  }).history[0];
  ok(undo.xp === 9 && undo.eventsXP.app_undo === -9,
    '58. negative undo audit events survive merge and net out XP');
  const legacyModern = mergeStates(
    { history: [{ date: '2026-05-19', xp: 40, lessons: 2 }], updatedAt: 1 },
    { history: [{ date: '2026-05-19', xp: 5, awards: [{ id: 'new:1:flashcard', ts: 4, reason: 'flashcard', xp: 5 }] }], updatedAt: 2 }
  ).history[0];
  ok(legacyModern.xp === 45 && legacyModern.eventsXP.legacy === 40 && legacyModern.eventsXP.flashcard === 5,
    '59. legacy aggregate history is preserved as base plus modern awards');
  function shouldSkipByHash(localSeq, remoteSeq, lastSeenSeq, localHash, remoteHash, lastSeenHash) {
    if (remoteSeq < localSeq) return true;
    if (remoteSeq === localSeq && remoteHash === localHash) return true;
    if (remoteSeq <= lastSeenSeq && remoteHash === lastSeenHash) return true;
    return false;
  }
  ok(!shouldSkipByHash(7, 7, 7, 'local-a', 'remote-b', 'local-a'),
    '60. equal _seq with different content still merges after KV race');
  ok(habState.xp === 127,
    '61. top-level XP derives from legacy base plus merged audit ledger');
  ok(habState.todayXP === 27,
    '62. todayXP derives from merged audit ledger for the active day');

  // ── Section J: Multi-device race conditions (10) ───────────────────
  console.log('\n--- J. Multi-device race conditions ---');
  const CODE_J = 'STRESSJ01';
  await wipe(CODE_J);

  /* 63: Three devices each push +XP awards on the same day with
   * different ids. After all three round-trip, the merged history
   * for that date contains all three awards summed -- not just the
   * last writer. */
  const day = '2026-05-19';
  const dA = { history: [{ date: day, xp: 10, awards: [{ id: 'devA:1:lesson', ts: 1, reason: 'lesson', xp: 10 }] }],
              xp: 10, todayXP: 10, todayDate: day, updatedAt: Date.now() };
  await put(dA, CODE_J);
  const fromKvA = await waitFor(b => b && (b.history || [])[0]?.awards?.length === 1, { code: CODE_J });
  const dB = mergeStates({ history: [{ date: day, xp: 7, awards: [{ id: 'devB:2:flashcard', ts: 2, reason: 'flashcard', xp: 7 }] }], xp: 7 }, fromKvA);
  dB.updatedAt = Date.now();
  await put(dB, CODE_J);
  const fromKvB = await waitFor(b => b && (b.history || [])[0]?.awards?.length === 2, { code: CODE_J });
  const dC = mergeStates({ history: [{ date: day, xp: 12, awards: [{ id: 'devC:3:app', ts: 3, reason: 'app', xp: 12 }] }], xp: 12 }, fromKvB);
  dC.updatedAt = Date.now();
  await put(dC, CODE_J);
  const after3 = await waitFor(b => b && (b.history || [])[0]?.awards?.length === 3, { code: CODE_J });
  const h63 = (after3?.history || [])[0];
  ok(h63?.xp === 29 && h63?.awards?.length === 3,
    `63. 3-device union: same-day awards from A/B/C all retained (xp=${h63?.xp})`);
  ok(h63?.events?.lesson === 1 && h63?.events?.flashcard === 1 && h63?.events?.app === 1,
    '64. 3-device union: per-kind event counts reflect each device');

  /* 65: Device B undoes its own award AFTER device A pushed a separate
   * award. Both events propagate; xp nets correctly. */
  await wipe(CODE_J);
  const dA2 = { history: [{ date: day, xp: 18, awards: [{ id: 'devA:1:lesson', ts: 1, reason: 'lesson', xp: 18 }] }],
                xp: 18, todayXP: 18, todayDate: day, updatedAt: Date.now() };
  await put(dA2, CODE_J);
  const got1 = await waitFor(b => b && (b.history || [])[0]?.xp === 18, { code: CODE_J });
  // Device B has its OWN +9 award AND a -9 undo. After merge with A's +18:
  // total = 18 + 9 - 9 = 18.
  const dB2 = mergeStates(
    { history: [{ date: day, xp: 0, awards: [
      { id: 'devB:2:app', ts: 2, reason: 'app', xp: 9 },
      { id: 'devB:3:app_undo', ts: 3, reason: 'app_undo', xp: -9 },
    ] }], xp: 0 },
    got1
  );
  dB2.updatedAt = Date.now();
  await put(dB2, CODE_J);
  const got65 = await waitFor(b => b && (b.history || [])[0]?.awards?.length === 3, { code: CODE_J });
  const h65 = (got65?.history || [])[0];
  ok(h65?.xp === 18 && h65?.eventsXP?.app === 9 && h65?.eventsXP?.app_undo === -9,
    `65. undo on B + award on A both propagate, net xp=${h65?.xp}`);

  /* 66: Same award id arriving from two devices is idempotent. */
  await wipe(CODE_J);
  const sameId = { id: 'shared:1:lesson', ts: 1, reason: 'lesson', xp: 7 };
  await put({ history: [{ date: day, xp: 7, awards: [sameId] }], xp: 7, updatedAt: Date.now() }, CODE_J);
  const got66 = await waitFor(b => b && (b.history || [])[0], { code: CODE_J });
  const m66 = mergeStates({ history: [{ date: day, xp: 7, awards: [{ ...sameId }] }], xp: 7 }, got66);
  const h66 = m66.history[0];
  ok(h66.awards.length === 1 && h66.xp === 7,
    '66. duplicate award id from two devices: dedupes to one event');

  /* 67: Award id collision with DIFFERENT xp (buggy ID generator). The
   * union-by-id keeps the FIRST seen; second silently drops. Document
   * this as a known limitation. */
  const m67 = mergeStates(
    { history: [{ date: day, xp: 5, awards: [{ id: 'bad:1', ts: 1, reason: 'lesson', xp: 5 }] }], xp: 5 },
    { history: [{ date: day, xp: 9, awards: [{ id: 'bad:1', ts: 1, reason: 'lesson', xp: 9 }] }], xp: 9 }
  );
  ok(m67.history[0].awards.length === 1,
    '67. duplicate ids dedupe (first seen wins) -- relies on awardEventId rand component for uniqueness');

  /* 68: Three devices push concurrently. KV is eventually-consistent
   * so exactly one PUT wins on the worker side, but the other two
   * devices' awards will propagate on their next pull+merge+push. We
   * simulate by chaining merges in order. */
  await wipe(CODE_J);
  // Stage 0: shared baseline (nothing logged today).
  await put({ history: [], xp: 0, updatedAt: Date.now() }, CODE_J);
  await waitFor(b => b && Array.isArray(b.history), { code: CODE_J });
  // 3 devices all earned independently while offline.
  const offA = { history: [{ date: day, xp: 12, awards: [{ id: 'A:1:lesson', ts: 100, reason: 'lesson', xp: 12 }] }], xp: 12 };
  const offB = { history: [{ date: day, xp: 7,  awards: [{ id: 'B:1:flashcard', ts: 110, reason: 'flashcard', xp: 7 }] }], xp: 7 };
  const offC = { history: [{ date: day, xp: 9,  awards: [{ id: 'C:1:app', ts: 120, reason: 'app', xp: 9 }] }], xp: 9 };
  // Each device pulls, merges, pushes -- in a serial chain.
  let cursor = (await get(CODE_J)).body;
  cursor = mergeStates(offA, cursor); cursor.updatedAt = Date.now();
  await put(cursor, CODE_J);
  cursor = await waitFor(b => b?.history?.[0]?.awards?.length === 1, { code: CODE_J });
  cursor = mergeStates(offB, cursor); cursor.updatedAt = Date.now();
  await put(cursor, CODE_J);
  cursor = await waitFor(b => b?.history?.[0]?.awards?.length === 2, { code: CODE_J });
  cursor = mergeStates(offC, cursor); cursor.updatedAt = Date.now();
  await put(cursor, CODE_J);
  const final68 = await waitFor(b => b?.history?.[0]?.awards?.length === 3, { code: CODE_J });
  ok(final68?.history?.[0]?.xp === 28,
    `68. 3-device offline-then-serial catchup: all awards land (xp=${final68?.history?.[0]?.xp})`);

  /* 69: Pet feed race. Device A and B both feed Bit within a few ms.
   * The merge picks the later lastFedAt and uses that side's snapshot. */
  await wipe(CODE_J);
  await put({ pet: { vitality: 50, lastFedAt: 1000, name: 'Bit', deathCount: 0 }, updatedAt: Date.now() }, CODE_J);
  const baseline = await waitFor(b => b?.pet?.vitality === 50, { code: CODE_J });
  // Both devices fed: A's feed bumps to 70 at ts=2000; B's bumps to 80 at ts=2100.
  const fedA = mergeStates({ pet: { ...baseline.pet, vitality: 70, lastFedAt: 2000 } }, baseline);
  fedA.updatedAt = Date.now();
  await put(fedA, CODE_J);
  const afterA = await waitFor(b => b?.pet?.lastFedAt === 2000, { code: CODE_J });
  const fedB = mergeStates({ pet: { ...baseline.pet, vitality: 80, lastFedAt: 2100 } }, afterA);
  fedB.updatedAt = Date.now();
  await put(fedB, CODE_J);
  const final69 = await waitFor(b => b?.pet?.lastFedAt === 2100, { code: CODE_J });
  ok(final69?.pet?.vitality === 80 && final69?.pet?.lastFedAt === 2100,
    '69. pet feed race: later lastFedAt wins as a pair with its vitality');

  /* 70: Read-modify-write across 3 devices, all incrementing the same
   * counter. Each award has a unique id; final sum should be the
   * arithmetic sum of all increments. */
  await wipe(CODE_J);
  let chain = { history: [{ date: day, xp: 0, awards: [] }], xp: 0, updatedAt: Date.now() };
  await put(chain, CODE_J);
  let expected = 0;
  for (let i = 0; i < 8; i++) {
    const cur = await waitFor(b => b && b.history, { code: CODE_J });
    const xp = (i + 1) * 3;
    expected += xp;
    const dev = ['A','B','C'][i % 3];
    const update = { history: [{ date: day, xp, awards: [{ id: `${dev}:${i}:lesson:r${i}`, ts: i, reason: 'lesson', xp }] }], xp };
    const merged = mergeStates(update, cur);
    merged.updatedAt = Date.now();
    await put(merged, CODE_J);
  }
  const final70 = await waitFor(b => b?.history?.[0]?.awards?.length === 8, { code: CODE_J });
  ok(final70?.history?.[0]?.xp === expected,
    `70. 8-step RMW chain converges to expected sum (got ${final70?.history?.[0]?.xp}, expected ${expected})`);

  /* 71: A 5xx-style PUT failure (we simulate by sending too-large body)
   * doesn't silently corrupt state. */
  const before71 = await waitFor(b => b && b.history, { code: CODE_J });
  const big = await fetch(`${URL}/state/${CODE_J}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(1_100_000),
  });
  ok(big.status === 413 || big.status === 400, '71. oversize PUT rejected with 4xx');
  const after71 = await waitFor(b => b && b.history, { code: CODE_J });
  ok(JSON.stringify(after71.history) === JSON.stringify(before71.history),
    '72. state unchanged after rejected PUT');

  await wipe(CODE_J);

  // ── Section K: Pet death-respawn merge gauntlet (5) ───────────────
  console.log('\n--- K. Pet death-respawn merge ---');

  /* 73: The exact FOIEGRAS bug. Local respawned via _newPet() (baby,
   * ageDays=0, lastFedDate=null); KV has the stale pre-death teen
   * state. Equal deathCount means deathCount-pair branch doesn't
   * trigger -- the new isFreshRespawn check must. */
  const localBaby = { stage: 'baby', ageDays: 0, deathCount: 1, lastFedDate: null, vitality: 80, lastFedAt: 9999 };
  const kvTeen    = { stage: 'teen', ageDays: 4, deathCount: 1, lastFedDate: '2026-05-16', vitality: 80, lastFedAt: 8888 };
  const m73 = mergePets(localBaby, kvTeen, 100, 200);
  ok(m73.stage === 'baby' && m73.ageDays === 0,
    `73. fresh respawn beats stale teen at equal deathCount (got stage=${m73.stage}, ageDays=${m73.ageDays})`);

  /* 74: Mirror — local is stale teen, KV is fresh baby. */
  const m74 = mergePets(kvTeen, localBaby, 100, 200);
  ok(m74.stage === 'baby' && m74.ageDays === 0,
    '74. fresh respawn wins regardless of argument order');

  /* 75: Different deathCount -- the higher one always owns lifecycle. */
  const olderLife = { stage: 'teen', ageDays: 6, deathCount: 1 };
  const respawned = { stage: 'baby', ageDays: 0, deathCount: 2, lastFedDate: null };
  const m75 = mergePets(olderLife, respawned, 100, 50);
  ok(m75.stage === 'baby' && m75.ageDays === 0 && m75.deathCount === 2,
    '75. higher deathCount wins lifecycle even when older-pet would pick teen');

  /* 76: Both sides have the fresh-respawn signature (e.g. two devices
   * both just respawned independently after a sync gap). Fall through
   * to max(ageDays)=0; stage stays baby. */
  const m76 = mergePets(
    { stage: 'baby', ageDays: 0, deathCount: 1, lastFedDate: null },
    { stage: 'baby', ageDays: 0, deathCount: 1, lastFedDate: null },
    100, 200
  );
  ok(m76.stage === 'baby' && m76.ageDays === 0,
    '76. both fresh-respawn: stays baby (no false transition to teen)');

  /* 77: eatenTodayXP pair-merge -- yesterday's stale 100 must lose to
   * today's fresh 0 even though max(100, 0) = 100. */
  const m77 = mergePets(
    { eatenTodayXP: 100, lastEatenDate: '2026-05-16' },
    { eatenTodayXP: 0,   lastEatenDate: '2026-05-19' },
    100, 200
  );
  ok(m77.eatenTodayXP === 0 && m77.lastEatenDate === '2026-05-19',
    `77. eatenTodayXP paired with later lastEatenDate (got ${m77.eatenTodayXP})`);

  // ── Section L: legacyBase undo collision (4) ──────────────────────
  console.log('\n--- L. legacyBase undo collision ---');

  /* 78: Pre-ledger state on one side, post-undo state on the other.
   * legacyBase = max(50-0, 30-0) = 50 -- the higher (pre-undo) wins,
   * resurrecting the deleted XP. This is the bug I called out as
   * untested. Documents current behavior; FAILING here is the signal
   * to fix the merge. */
  const preUndoLegacy = { history: [{ date: day, xp: 50, lessons: 1 }], xp: 50 };
  const postUndoLegacy = { history: [{ date: day, xp: 30, lessons: 1 }], xp: 30 };  // someone undid -20 directly
  const m78 = mergeStates(preUndoLegacy, postUndoLegacy);
  ok(m78.history[0].xp === 50,
    `78. KNOWN GAP: legacyBase MAX resurrects pre-undo xp (got ${m78.history[0].xp}; ideal=30 if undo intent honored)`);

  /* 79: When one side migrates to ledger and the other still has the
   * stale legacy aggregate. legacyBase counts the pre-ledger XP that
   * has no corresponding award. Correct behavior: legacy base = the
   * larger pre-ledger value (50), then add ledger awards from the
   * migrated side. */
  const m79 = mergeStates(
    { history: [{ date: day, xp: 50 }], xp: 50 },
    { history: [{ date: day, xp: 12, awards: [{ id: 'X:1:lesson', ts: 1, reason: 'lesson', xp: 12 }] }], xp: 12 }
  );
  ok(m79.history[0].xp === 62,
    `79. legacy + modern: legacyBase(50) + awardSum(12) = 62 (got ${m79.history[0].xp})`);

  /* 80: Ledger-on-ledger, no legacy. legacyBase should be 0; pure
   * award union sums correctly. */
  const m80 = mergeStates(
    { history: [{ date: day, xp: 10, awards: [{ id: 'A:1:lesson', ts: 1, reason: 'lesson', xp: 10 }] }], xp: 10 },
    { history: [{ date: day, xp: 15, awards: [{ id: 'B:2:flashcard', ts: 2, reason: 'flashcard', xp: 15 }] }], xp: 15 }
  );
  ok(m80.history[0].xp === 25 && !m80.history[0].eventsXP.legacy,
    `80. pure-ledger: no legacy base, sum=25 (got ${m80.history[0].xp}, legacy=${m80.history[0].eventsXP?.legacy})`);

  /* 81: Awards lifetime XP rolls into top-level state.xp. */
  const m81 = mergeStates(
    { xp: 30, history: [{ date: day, xp: 30, awards: [{ id: 'A:1:lesson', ts: 1, reason: 'lesson', xp: 30 }] }] },
    { xp: 10, history: [{ date: day, xp: 10, awards: [{ id: 'B:1:lesson', ts: 2, reason: 'lesson', xp: 10 }] }] }
  );
  ok(m81.xp === 40,
    `81. top-level xp = sum of merged history (got ${m81.xp})`);

  // ── Section M: Flashcard fail-event ledger (5) ────────────────────
  console.log('\n--- M. Flashcard fail-event ledger ---');

  /* 82: Two devices both fail the same card offline. With the old
   * per-key max merge: max(1, 1) = 1 (lost one fail). With the new
   * ledger: both events union by id, count = 2. */
  const failA = { flashcardFailEvents: [{ id: 'devA:1:flashcard-fail:r1', ts: 1, cardId: 'fc-001', cat: 'ai' }] };
  const failB = { flashcardFailEvents: [{ id: 'devB:2:flashcard-fail:r2', ts: 2, cardId: 'fc-001', cat: 'ai' }] };
  const mFail = mergeStates(failA, failB);
  ok(mFail.flashcardFailStats.byCard['fc-001'] === 2,
    `82. two devices, same card offline-failed: ledger unions to 2 (not max=1) (got ${mFail.flashcardFailStats.byCard['fc-001']})`);

  /* 83: Same event id from both sides is idempotent. */
  const sharedEv = { id: 'shared:1:flashcard-fail:r', ts: 1, cardId: 'fc-002', cat: 'sysd' };
  const m83 = mergeStates(
    { flashcardFailEvents: [sharedEv] },
    { flashcardFailEvents: [{ ...sharedEv }] }
  );
  ok(m83.flashcardFailEvents.length === 1 && m83.flashcardFailStats.byCard['fc-002'] === 1,
    '83. duplicate fail id dedupes (idempotent across re-pulls)');

  /* 84: byCat / byModule / byLesson aggregate correctly across many events. */
  const events84 = [
    { id: 'A:1:flashcard-fail:1', ts: 1, cardId: 'a', cat: 'ai',    module: 'm-ai',  lesson: 'l1' },
    { id: 'A:2:flashcard-fail:2', ts: 2, cardId: 'b', cat: 'ai',    module: 'm-ai',  lesson: 'l2' },
    { id: 'B:3:flashcard-fail:3', ts: 3, cardId: 'c', cat: 'coding', module: 'm-cod', lesson: 'l3' },
  ];
  const m84 = mergeStates({ flashcardFailEvents: events84.slice(0, 2) }, { flashcardFailEvents: events84.slice(2) });
  ok(m84.flashcardFailStats.byCat.ai === 2 && m84.flashcardFailStats.byCat.coding === 1,
    `84. byCat aggregates from union (got ai=${m84.flashcardFailStats.byCat.ai}, coding=${m84.flashcardFailStats.byCat.coding})`);
  ok(m84.flashcardFailStats.byModule['m-ai'] === 2 && m84.flashcardFailStats.byLesson.l3 === 1,
    '85. byModule / byLesson derived correctly from union');

  /* 86: Legacy fallback path -- no events on either side, stats merge
   * by per-key max (preserves old behavior for clients that haven't
   * recorded any new fails yet). */
  const m86 = mergeStates(
    { flashcardFailStats: { byCat: { ai: 3 }, byCard: { 'x': 3 }, byModule: {}, byLesson: {} } },
    { flashcardFailStats: { byCat: { ai: 5 }, byCard: { 'x': 5 }, byModule: {}, byLesson: {} } }
  );
  ok(m86.flashcardFailStats.byCard['x'] === 5,
    `86. legacy (no events on either side): falls back to per-key max (got ${m86.flashcardFailStats.byCard['x']})`);

  /* 87: Mixed legacy + ledger. Device A has 5 cached pre-ledger fails on
   * card X but no events. Device B has 0 cache + 1 new event. Merged
   * must preserve A's legacy AND count B's new event: 5 + 1 = 6. */
  const m87 = mergeStates(
    { flashcardFailStats: { byCat: {}, byCard: { 'X': 5 }, byModule: {}, byLesson: {} } },
    { flashcardFailEvents: [{ id: 'devB:1:flashcard-fail:r', ts: 1, cardId: 'X' }],
      flashcardFailStats: { byCat: {}, byCard: { 'X': 1 }, byModule: {}, byLesson: {} } },
  );
  ok(m87.flashcardFailStats.byCard['X'] === 6,
    `87. legacy (A=5 cached, no events) + new event from B: merged=6 (got ${m87.flashcardFailStats.byCard['X']})`);

  /* 88: Both devices carry the SAME 3 legacy fails on card Y. Neither has
   * events. After one device records a new ledger fail, merge should be
   * 3 + 1 = 4 (legacies don't double-count -- we take max, not sum). */
  const m88 = mergeStates(
    { flashcardFailStats: { byCat: {}, byCard: { 'Y': 3 }, byModule: {}, byLesson: {} } },
    { flashcardFailEvents: [{ id: 'devB:1:flashcard-fail:r', ts: 1, cardId: 'Y' }],
      flashcardFailStats: { byCat: {}, byCard: { 'Y': 4 }, byModule: {}, byLesson: {} } },
  );
  ok(m88.flashcardFailStats.byCard['Y'] === 4,
    `88. shared legacy doesn't double-count: max(aLegacy=3, bLegacy=3) + union(1) = 4 (got ${m88.flashcardFailStats.byCard['Y']})`);

  /* 89: byCat axis preserves legacy too (not just byCard). */
  const m89 = mergeStates(
    { flashcardFailStats: { byCat: { ai: 7 }, byCard: {}, byModule: {}, byLesson: {} } },
    { flashcardFailEvents: [{ id: 'devB:1:flashcard-fail:r', ts: 1, cardId: 'q', cat: 'ai' }],
      flashcardFailStats: { byCat: { ai: 1 }, byCard: { q: 1 }, byModule: {}, byLesson: {} } },
  );
  ok(m89.flashcardFailStats.byCat.ai === 8,
    `89. byCat legacy preserved on cross-device merge (got ${m89.flashcardFailStats.byCat.ai})`);

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${pass} passed, ${fail} failed (of ${pass + fail})`);
  if (fail > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  •', f));
  }
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => {
  console.error('UNCAUGHT:', e);
  process.exit(2);
});
