// 50-test sync stress suite. Mixes unit tests of the merge logic
// against ported helpers (must mirror js/sync.js) and e2e tests
// against the live Cloudflare Worker.

const URL = 'https://interview-prep-sync.codyjhsieh.workers.dev';
const CODE = 'STRESST01';

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
  for (const h of (la || [])) if (h && h.date) map[h.date] = { ...h };
  for (const h of (lb || [])) {
    if (!h || !h.date) continue;
    const cur = map[h.date];
    if (!cur) { map[h.date] = { ...h }; continue; }
    cur.xp = Math.max(cur.xp || 0, h.xp || 0);
    cur.lessons = Math.max(cur.lessons || 0, h.lessons || 0);
  }
  return Object.values(map).sort((x, y) => x.date.localeCompare(y.date));
}
function mergePets(a, b, aT, bT) {
  if (!a && !b) return null;
  if (!a) return b; if (!b) return a;
  const fresher = (bT || 0) >= (aT || 0) ? b : a;
  const merged = { ...a, ...fresher };
  for (const k of ['vitality','form','ageDays','eatenTodayXP','deathCount']) {
    merged[k] = Math.max(a[k] || 0, b[k] || 0);
  }
  for (const k of ['lastTickDate','lastFedDate','lastEatenDate']) {
    const da = a[k] || '', db = b[k] || '';
    merged[k] = db > da ? db : da;
  }
  const olderPet = (a.ageDays || 0) >= (b.ageDays || 0) ? a : b;
  if (olderPet.stage) merged.stage = olderPet.stage;
  return merged;
}
function mergeStates(a, b) {
  if (!a) return b; if (!b) return a;
  const aT = a.updatedAt || 0, bT = b.updatedAt || 0;
  const fresher = bT >= aT ? b : a;
  const stale   = bT >= aT ? a : b;
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
  merged.pet = mergePets(a.pet, b.pet, aT, bT);
  if ((a.streak?.count || 0) >= (b.streak?.count || 0)) merged.streak = a.streak;
  else                                                   merged.streak = b.streak;
  merged.xp = Math.max(a.xp || 0, b.xp || 0);
  merged.level = Math.max(a.level || 0, b.level || 0);
  merged.todayXP = fresher.todayXP || 0;
  merged.todayDate = fresher.todayDate || null;
  merged.updatedAt = Math.max(aT, bT);
  return merged;
}
function normalizeCode(input) { return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

async function put(state, code = CODE) {
  return fetch(`${URL}/state/${code}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
  });
}
async function get(code = CODE) {
  const r = await fetch(`${URL}/state/${code}`);
  if (r.status === 404) return { status: 404, body: null };
  return { status: r.status, body: await r.json() };
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
  r = await put({ updatedAt: 1, hello: 'world' });
  ok(r.status === 200, '5. PUT happy path → 200');
  r = await fetch(URL + '/state/' + CODE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(1_100_000) });
  ok(r.status === 413 || r.status === 400, '6. PUT > 1MB → 413/400');
  r = await fetch(URL + '/state/' + CODE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
  ok(r.status === 400, '7. PUT malformed JSON → 400');
  r = await fetch(URL + '/state/AB', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  ok(r.status === 404, '8. PUT short-code → 404 (path regex requires 4+ chars)');
  // Two concurrent PUTs — last write wins
  await Promise.all([put({ updatedAt: 100, marker: 'A' }), put({ updatedAt: 200, marker: 'B' })]);
  await sleep(300);                          // KV propagation
  const g = await get();
  ok(g.body && (g.body.marker === 'A' || g.body.marker === 'B'),
    `9. concurrent PUTs → one wins (got marker: ${g.body?.marker})`);
  ok(g.status === 200, '10. PUT then GET round-trips');

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
  try { await fetch(`${URL}/state/${CODE2}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wipe: 1, updatedAt: 1 }) }); } catch (_) {}

  // 46: A seeds, B pulls + merges + pushes, A polls + sees union
  const sA = { xp: 100, updatedAt: Date.now(), jobApps: [{ ts: 100, date: '2026-05-14', xp: 9 }], pet: { name: 'Alice', vitality: 80, lastTickDate: '2026-05-14' } };
  await put(sA, CODE2);
  await sleep(150);
  const sBPull = (await get(CODE2)).body;
  if (!sBPull || !sBPull.jobApps) {
    ok(false, `46. setup: expected sBPull.jobApps, got: ${JSON.stringify(sBPull)?.slice(0,200)}`);
    process.exit(1);
  }
  const sBLocal = { xp: 50, jobApps: [{ ts: 200, date: '2026-05-14', xp: 9 }], pet: { name: 'Bob', vitality: 60, lastTickDate: '2026-05-13' } };
  const sBMerged = mergeStates(sBLocal, sBPull);
  sBMerged.updatedAt = Date.now();
  await put(sBMerged, CODE2);
  await sleep(150);
  const final46 = (await get(CODE2)).body;
  ok(final46?.jobApps?.length === 2 && final46?.xp === 100, '46. two-device pair: union of state preserved');
  ok(final46?.pet?.vitality === 80 && final46?.pet?.name === 'Alice', '47. pet: vitality max + identity from fresher');

  // 48: Delete propagation via tombstones
  const sDel = { ...final46, jobApps: final46.jobApps.filter(j => j.ts !== 100), jobAppsDeletedTs: { 100: Date.now() }, updatedAt: Date.now() };
  await put(sDel, CODE2);
  await sleep(150);
  const sOther = mergeStates(final46, (await get(CODE2)).body);
  ok(sOther.jobApps.length === 1 && sOther.jobApps[0].ts === 200, '48. tombstone propagates deletion to other device');

  // 49: Concurrent click on both devices — both pushed, KV resolves one
  await put({ updatedAt: 1000, marker: 'X', jobApps: [{ ts: 1 }] }, CODE2);
  const conc1 = { updatedAt: 1100, marker: 'Y', jobApps: [{ ts: 2 }] };
  const conc2 = { updatedAt: 1100, marker: 'Z', jobApps: [{ ts: 3 }] };
  await Promise.all([put(conc1, CODE2), put(conc2, CODE2)]);
  await sleep(500);                          // bigger window for KV propagation
  const r49 = (await get(CODE2)).body;
  console.log('     (49 saw marker:', r49?.marker, ')');
  // KV is eventually-consistent — any of X/Y/Z is OK as long as it's
  // one of those (not corrupted/missing fields).
  ok(r49 && ['X', 'Y', 'Z'].includes(r49.marker) && Array.isArray(r49.jobApps),
    '49. concurrent PUTs: no corruption, one PUT wins');

  // 50: Offline period — device with stale local catches up
  await put({ updatedAt: 2000, xp: 500, jobApps: [{ ts: 100 }, { ts: 200 }, { ts: 300 }] }, CODE2);
  await sleep(150);
  const offlineLocal = { updatedAt: 1500, xp: 200, jobApps: [{ ts: 100 }] };  // stale
  const recovered = mergeStates(offlineLocal, (await get(CODE2)).body);
  ok(recovered.xp === 500 && recovered.jobApps.length === 3, '50. stale-offline device catches up to KV on next poll');

  // Cleanup
  try { await fetch(`${URL}/state/${CODE2}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wipe: 1 }) }); } catch (_) {}

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${pass} passed, ${fail} failed (of 50)`);
  if (fail > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  •', f));
  }
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => {
  console.error('UNCAUGHT:', e);
  process.exit(2);
});
