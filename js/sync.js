/* sync.js — cross-device state sync via Cloudflare Worker + KV.
 *
 * No accounts, no email — pairing is by 8-char code (the code IS the
 * credential). One device generates a code, the other enters it; both
 * then share a single state blob via the Worker. Local state is the
 * source of truth between sync events; remote state is fetched on a
 * 5-second poll and merged in when newer.
 *
 * Hooks:
 *   - On window load: if a code is stored, fetch remote and merge
 *   - On every GAMI.saveImmediate(state): debounced PUT to remote
 *   - Every 5 sec (when paired): GET remote; if newer, merge in
 *   - On window focus: GET remote immediately so coming back from
 *     another device feels instant
 *
 * Deploy:
 *   1. cd cloudflare && wrangler deploy
 *   2. Replace SYNC_ENDPOINT below with the deployed Worker URL
 *   3. Re-deploy GH Pages (just push)
 */

window.SYNC = (function () {

  // ── Configuration ───────────────────────────────────────────────────
  //
  // After deploying the Cloudflare Worker (see cloudflare/README.md),
  // replace this URL with the one wrangler prints.
  const SYNC_ENDPOINT = 'https://interview-prep-sync.codyjhsieh.workers.dev';

  const CODE_KEY     = 'fdeprep.syncCode.v1';
  const POLL_MS      = 2500;   // 2.5s — snappier real-time feel; still
                               // ~34k reads/day per device (free tier = 100k)
  const PUSH_DEBOUNCE_MS = 1000;
  const STORAGE_KEY  = 'fdeprep.v1';            // matches GAMI.STORAGE_KEY

  let pollTimer = null;
  let pushTimer = null;
  let pushPending = false;
  // lastSeenRemoteSeq — monotonic counter from the Worker (stamped per
  // code, not per device). Drives "is the remote newer than what I
  // already saw" without relying on Date.now() agreement between
  // devices. updatedAt-based comparison kept as a fallback for legacy
  // state blobs that pre-date _seq.
  let lastSeenRemoteSeq = 0;
  let lastSeenRemoteUpdatedAt = 0;
  let statusCb = null;
  let lastStatus = 'idle';

  // ── Helpers ─────────────────────────────────────────────────────────
  const getCode   = () => localStorage.getItem(CODE_KEY);
  const setCode   = (c) => localStorage.setItem(CODE_KEY, c);
  const clearCode = () => localStorage.removeItem(CODE_KEY);

  function isConfigured() {
    return SYNC_ENDPOINT && !SYNC_ENDPOINT.includes('example.workers.dev');
  }

  function setStatus(s) {
    lastStatus = s;
    if (statusCb) try { statusCb(s); } catch (_) {}
    paintLiveIndicator(s);
  }

  /*
   * Live sync indicator — diffuse colored glow around the nav pill
   * (mobile #liquid-tabbar and desktop #sidebar). Sets a data-sync
   * attribute on <body> which CSS picks up to paint a box-shadow
   * halo. Brief pulse on activity events (pulled / synced).
   *
   * States:
   *   - synced  / pulled   — green glow pulse (fresh data flowed)
   *   - polling / paired   — neutral (transparent / very faint)
   *   - offline            — amber glow
   *   - error              — red glow
   *   - idle               — no attribute (hidden)
   */
  function paintLiveIndicator(s) {
    try {
      if (!document.body) return;
      if (s === 'idle' || !s) {
        document.body.removeAttribute('data-sync');
      } else {
        document.body.setAttribute('data-sync', s);
      }
      // Brief pulse class on pulled/synced so the glow flares then settles
      if (s === 'pulled' || s === 'synced') {
        document.body.classList.add('sync-pulse');
        clearTimeout(paintLiveIndicator._pulseTimer);
        paintLiveIndicator._pulseTimer = setTimeout(() => {
          document.body.classList.remove('sync-pulse');
        }, 700);
      }
    } catch (_) {}
  }

  function generateCode() {
    // Crockford base32 minus visually-ambiguous chars (0, 1, I, O, U).
    // 8 chars ≈ 40 bits of entropy — infeasible to brute-force on
    // Cloudflare's request budget, but still short enough to read aloud.
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTVWXYZ';
    let s = '';
    const buf = new Uint32Array(8);
    crypto.getRandomValues(buf);
    for (let i = 0; i < 8; i++) s += alphabet[buf[i] % alphabet.length];
    return s.slice(0, 4) + '-' + s.slice(4);
  }

  function normalizeCode(input) {
    return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // ── Network ─────────────────────────────────────────────────────────
  async function pushNow() {
    if (!isConfigured()) return;
    const code = getCode();
    if (!code) return;
    const state = window.APP && window.APP.getState ? window.APP.getState() : null;
    if (!state) return;
    state.updatedAt = Date.now();
    try {
      const res = await fetch(`${SYNC_ENDPOINT}/state/${normalizeCode(code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (res.ok) {
        // Read the server-assigned _seq back so the local state knows
        // what KV holds. Without this, the next poll would see remote
        // ._seq > local._seq and re-merge our own push (a no-op but
        // wasteful).
        try {
          const j = await res.json();
          if (j && typeof j._seq === 'number') {
            state._seq = j._seq;
            lastSeenRemoteSeq = j._seq;
          }
        } catch (_) {}
        lastSeenRemoteUpdatedAt = state.updatedAt;
        setStatus('synced');
      } else {
        setStatus('error');
      }
    } catch (_) {
      setStatus('offline');
    }
  }

  async function pullNow() {
    if (!isConfigured()) return null;
    const code = getCode();
    if (!code) return null;
    try {
      const res = await fetch(`${SYNC_ENDPOINT}/state/${normalizeCode(code)}`);
      if (res.status === 404) return null;
      if (!res.ok) { setStatus('error'); return null; }
      return await res.json();
    } catch (_) {
      setStatus('offline');
      return null;
    }
  }

  // ── Merge ───────────────────────────────────────────────────────────
  /*
   * Two-device merge for the interview-prep state shape. The hard
   * problem: each device may have made independent local writes since
   * the last sync; we need to combine them without losing work.
   *
   * Strategy per field family:
   *   - Append-only arrays (history, jobApps, mocks): union by ts/date,
   *     summing/maxing values for same-key entries (history.xp).
   *   - Keyed maps with inner timestamps (flashcards, missedQuestions,
   *     conceptReviews, starStories): union keys; for overlapping keys,
   *     keep the entry with the newer inner timestamp.
   *   - Boolean / counter maps (badges, completedLessons, companySeen,
   *     cueShownDates): plain key union (any presence wins).
   *   - Pet: take the side with the higher lastTickDate / deathCount.
   *   - Numeric monotonic stats (xp, level): max.
   *   - Streak: take side with higher .count.
   *   - "Today" values (todayXP, todayDate): take fresher side's pair
   *     as a unit so they stay consistent.
   *   - Everything else: take fresher side's value.
   */
  function mergeStates(a, b) {
    if (!a) return b;
    if (!b) return a;
    // Determine "fresher" side. Prefer server-issued _seq (monotonic
    // per code, no clock-drift sensitivity). Fall back to updatedAt
    // when _seq is missing on either side (legacy blobs).
    const aS = a._seq || 0, bS = b._seq || 0;
    const aT = a.updatedAt || 0, bT = b.updatedAt || 0;
    const seqBased = aS > 0 && bS > 0;
    const fresher = seqBased ? (bS >= aS ? b : a) : (bT >= aT ? b : a);
    const stale   = seqBased ? (bS >= aS ? a : b) : (bT >= aT ? a : b);
    const merged = { ...stale, ...fresher };

    // Append-only arrays
    merged.history = unionHistory(a.history, b.history);
    // Tombstone-aware union for jobApps so deletes on one device
    // actually propagate to the other (plain union resurrects them).
    merged.jobAppsDeletedTs = unionKeys(a.jobAppsDeletedTs, b.jobAppsDeletedTs);
    merged.jobApps = unionByTsExcluding(a.jobApps, b.jobApps, merged.jobAppsDeletedTs);
    merged.mocks   = unionByTs(a.mocks,   b.mocks);

    // Keyed maps with timestamps — keep newer inner entry
    merged.flashcards       = mergeByInnerTs(a.flashcards,       b.flashcards,       'lastReviewed');
    merged.missedQuestions  = mergeByInnerTs(a.missedQuestions,  b.missedQuestions,  'lastReviewed');
    merged.conceptReviews   = mergeByInnerTs(a.conceptReviews,   b.conceptReviews,   'lastReviewed');
    merged.starStories      = mergeByInnerTs(a.starStories,      b.starStories,      'updatedAt');

    // Plain key-union maps
    merged.completedLessons = unionKeys(a.completedLessons, b.completedLessons);
    merged.badges           = unionKeys(a.badges,           b.badges);
    merged.companySeen      = unionKeys(a.companySeen,      b.companySeen);
    merged.cueShownDates    = unionKeys(a.cueShownDates,    b.cueShownDates);

    // Free-recall: array-per-key, concat + dedupe by ts
    merged.freeRecallAttempts = unionMapOfArrays(a.freeRecallAttempts, b.freeRecallAttempts);

    // Pet: deep-merge so name / color / stats all sync. Stats (vitality,
    // form, ageDays, etc.) are unioned via max; date fields take the
    // later string; identity fields (name, bodyHue) come from the
    // device with the fresher overall _seq (falling back to updatedAt).
    const aFreshness = seqBased ? aS : aT;
    const bFreshness = seqBased ? bS : bT;
    merged.pet = mergePets(a.pet, b.pet, aFreshness, bFreshness);

    // Streak: prefer higher count (monotonic per active day)
    if ((a.streak?.count || 0) >= (b.streak?.count || 0)) merged.streak = a.streak;
    else                                                    merged.streak = b.streak;

    // Monotonic counters
    merged.xp    = Math.max(a.xp    || 0, b.xp    || 0);
    merged.level = Math.max(a.level || 0, b.level || 0);

    // Today values come from the fresher side as a pair so they stay
    // consistent (todayXP belongs to todayDate, not yesterday's).
    merged.todayXP   = fresher.todayXP   || 0;
    merged.todayDate = fresher.todayDate || null;

    merged.updatedAt = Math.max(aT, bT);
    // Propagate the higher _seq so the merged state carries the most
    // recent server stamp. The next PUT will increment from here.
    merged._seq = Math.max(aS, bS);
    return merged;
  }

  function unionHistory(la, lb) {
    const map = {};
    for (const h of (la || [])) if (h && h.date) map[h.date] = { ...h };
    for (const h of (lb || [])) {
      if (!h || !h.date) continue;
      const cur = map[h.date];
      if (!cur) { map[h.date] = { ...h }; continue; }
      // Same-date conflict: take the max — both sides may have written
      // independently; max is the most-progress interpretation.
      cur.xp      = Math.max(cur.xp      || 0, h.xp      || 0);
      cur.lessons = Math.max(cur.lessons || 0, h.lessons || 0);
    }
    return Object.values(map).sort((x, y) => x.date.localeCompare(y.date));
  }

  function unionByTs(la, lb) {
    const seen = new Set();
    const out = [];
    for (const j of (la || []).concat(lb || [])) {
      if (!j || j.ts == null) continue;
      if (seen.has(j.ts)) continue;
      seen.add(j.ts);
      out.push(j);
    }
    return out.sort((x, y) => (x.ts || 0) - (y.ts || 0));
  }
  // Like unionByTs but filters out any entry whose ts is present in the
  // tombstones map. Used for jobApps so deletes propagate across devices.
  function unionByTsExcluding(la, lb, tombstones) {
    const seen = new Set();
    const out = [];
    const t = tombstones || {};
    for (const j of (la || []).concat(lb || [])) {
      if (!j || j.ts == null) continue;
      if (t[j.ts]) continue;                    // tombstoned — skip
      if (seen.has(j.ts)) continue;
      seen.add(j.ts);
      out.push(j);
    }
    return out.sort((x, y) => (x.ts || 0) - (y.ts || 0));
  }

  function unionKeys(a, b) {
    return { ...(a || {}), ...(b || {}) };
  }

  function mergeByInnerTs(a, b, tsField) {
    const out = { ...(a || {}) };
    for (const k of Object.keys(b || {})) {
      if (!out[k]) { out[k] = b[k]; continue; }
      const at = out[k][tsField] || 0;
      const bt = b[k][tsField]   || 0;
      if (bt > at) out[k] = b[k];
    }
    return out;
  }

  function unionMapOfArrays(a, b) {
    const out = { ...(a || {}) };
    for (const k of Object.keys(b || {})) {
      const ax = out[k] || [];
      const bx = b[k]   || [];
      const seen = new Set();
      const merged = [];
      for (const it of ax.concat(bx)) {
        const key = it && it.ts != null ? it.ts : JSON.stringify(it);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(it);
      }
      out[k] = merged;
    }
    return out;
  }

  /*
   * Deep-merge two pet states. Strategy per field:
   *   - Numeric stats (vitality, form, ageDays, eatenTodayXP, deathCount):
   *     max() — neither device's progress is lost.
   *   - Date strings (lastTickDate, lastFedDate, lastEatenDate): later
   *     ISO string wins (string compare works for YYYY-MM-DD).
   *   - Stage: take from whichever pet has the higher ageDays (the more
   *     "grown-up" timeline is canonical).
   *   - Identity fields (name, bodyHue, …): from the device with the
   *     fresher overall updatedAt — that's where the user most recently
   *     interacted, so their customization wins.
   * Replaces the old atomic pickPet which permanently kept each device's
   * own pet because ties broke local-side.
   */
  function mergePets(a, b, aTimestamp, bTimestamp) {
    if (!a && !b) return null;
    if (!a) return b;
    if (!b) return a;
    const fresher = (bTimestamp || 0) >= (aTimestamp || 0) ? b : a;
    // Start with all of fresher's fields, then explicit per-field overrides.
    const merged = { ...a, ...fresher };
    // Numeric stats: union via max
    for (const k of ['vitality', 'form', 'ageDays', 'eatenTodayXP', 'deathCount']) {
      merged[k] = Math.max(a[k] || 0, b[k] || 0);
    }
    // Date strings: take the later one (works for YYYY-MM-DD compare)
    for (const k of ['lastTickDate', 'lastFedDate', 'lastEatenDate']) {
      const da = a[k] || '', db = b[k] || '';
      merged[k] = db > da ? db : da;
    }
    // Stage: pick from the older pet (higher ageDays)
    const olderPet = (a.ageDays || 0) >= (b.ageDays || 0) ? a : b;
    if (olderPet.stage) merged.stage = olderPet.stage;
    return merged;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────
  function scheduleSync() {
    pushPending = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushPending = false; pushNow(); }, PUSH_DEBOUNCE_MS);
  }

  async function pollOnce() {
    if (pushPending) return;                  // local changes queued — let the PUT settle first
    setStatus('polling');
    const remote = await pullNow();
    if (!remote) { setStatus('paired'); return; }
    const local = window.APP && window.APP.getState();
    if (!local) return;
    // Primary ordering: server-stamped _seq (monotonic, per code).
    // Fallback: updatedAt (for blobs from clients pre-_seq, or while
    // the Worker hasn't been upgraded yet).
    const remoteSeq = remote._seq || 0;
    const localSeq  = local._seq  || 0;
    if (remoteSeq && localSeq) {
      if (remoteSeq <= localSeq)             return;
      if (remoteSeq <= lastSeenRemoteSeq)    return;
    } else {
      const remoteT = remote.updatedAt || 0;
      if (remoteT <= (local.updatedAt || 0)) return;
      if (remoteT <= lastSeenRemoteUpdatedAt) return;
    }
    const merged = mergeStates(local, remote);
    lastSeenRemoteSeq = Math.max(lastSeenRemoteSeq, remoteSeq);
    lastSeenRemoteUpdatedAt = Math.max(lastSeenRemoteUpdatedAt, remote.updatedAt || 0);
    // ─── Convergence fix ───────────────────────────────────────────
    // If the merged state added local-only data not present in remote
    // (e.g. concurrent edits where the other device's push overwrote
    // ours on KV), schedule a corrective push so the union goes back
    // up. Without this, our local stays correct but KV — and therefore
    // the other device — sits in the partial state until something
    // else triggers a push.
    const mergedAddsLocal =
      (merged.jobApps && merged.jobApps.length > (remote.jobApps || []).length) ||
      (merged.history && merged.history.length > (remote.history || []).length) ||
      (Object.keys(merged.completedLessons || {}).length >
        Object.keys(remote.completedLessons || {}).length) ||
      (merged.mocks && merged.mocks.length > (remote.mocks || []).length) ||
      ((merged.xp || 0) > (remote.xp || 0));
    if (mergedAddsLocal) scheduleSync();
    // Use the SOFT setter so the live view doesn't flash on every
    // poll. setStateFromSync swaps state + refreshes only the header
    // chips; the current view's cards stay put until next navigation.
    if (window.APP && window.APP.setStateFromSync) window.APP.setStateFromSync(merged);
    else if (window.APP && window.APP.setState)    window.APP.setState(merged);
    else                                           localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setStatus('pulled');
  }

  function startLoop() {
    stopLoop();
    if (!getCode() || !isConfigured()) return;
    pollTimer = setInterval(pollOnce, POLL_MS);
    pollOnce();
    setStatus(getCode() ? 'paired' : 'idle');
  }

  function stopLoop() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  // ── Public API ─────────────────────────────────────────────────────
  /*
   * pair(code): if remote already has a state under this code, adopt it
   * (overwriting local). Otherwise, PUT the current local state up under
   * the code — that device becomes the seed. Either way, start the loop.
   */
  async function pair(code) {
    if (!isConfigured()) throw new Error('SYNC_ENDPOINT not configured');
    const c = normalizeCode(code);
    if (c.length < 6) throw new Error('Code must be at least 6 characters');
    setCode(c);
    const remote = await pullNow();
    const local  = window.APP && window.APP.getState();
    if (remote && local) {
      const merged = mergeStates(local, remote);
      // Stamp a fresh updatedAt so any other paired device's next poll
      // is guaranteed to see this as newer.
      merged.updatedAt = Date.now();
      if (window.APP && window.APP.setState) window.APP.setState(merged);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      // Push merged state up SYNCHRONOUSLY before returning, so the
      // other device's next 5s poll sees the union without waiting on
      // the 1s debounce. Closes the race where the seeding device
      // could otherwise miss the merge between pair() and the next push.
      await pushNow();
    } else if (local) {
      await pushNow();
    }
    startLoop();
    setStatus('paired');
    return { code: c, adopted: !!remote };
  }

  function unpair() {
    clearCode();
    stopLoop();
    setStatus('idle');
  }

  function status() {
    return {
      configured: isConfigured(),
      endpoint:   SYNC_ENDPOINT,
      code:       getCode(),
      last:       lastStatus,
    };
  }

  function init() {
    // Wrap GAMI.saveImmediate so every local save triggers a debounced
    // remote PUT (when paired).
    if (window.GAMI && window.GAMI.saveImmediate && !window.GAMI.__syncWrapped) {
      const orig = window.GAMI.saveImmediate;
      window.GAMI.saveImmediate = function (state) {
        orig.call(this, state);
        if (getCode() && isConfigured()) scheduleSync();
      };
      window.GAMI.__syncWrapped = true;
    }
    // Start the pull loop if we already had a paired code.
    if (getCode() && isConfigured()) startLoop();
    // Pull on focus so coming back from another device feels instant.
    window.addEventListener('focus', () => { if (getCode() && isConfigured()) pollOnce(); });
  }

  return {
    init, pair, unpair, status, generateCode,
    pushNow, pullNow,           // exposed for manual sync / testing
    onStatusChange: (cb) => { statusCb = cb; },
  };

})();
