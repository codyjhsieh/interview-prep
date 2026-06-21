/* =========================================================================
 * gamification.js — XP, levels, streaks, badges, spaced repetition,
 * daily quests, variable rewards. Pure functions over a state object
 * that's persisted in localStorage by app.js.
 * ========================================================================= */

window.GAMI = (function () {

const STORAGE_KEY = 'fdeprep.v1';
const DEVICE_KEY  = 'fdeprep.deviceId.v1';

// Fallback for any old browser without structuredClone (browser target is modern, but be safe)
const clone = (typeof structuredClone === 'function')
  ? (o) => structuredClone(o)
  : (o) => JSON.parse(JSON.stringify(o));

/* ---------- Defaults ---------- */
const DEFAULT_STATE = {
  version: 1,
  onboarded: true,
  user: { name: 'Candidate', track: 'both', goal: 180, when_cue: 'After morning coffee · 9:00am' },
  xp: 0,
  level: 1,
  streak: { count: 0, lastDay: null, freezeAvailable: 1 }, // freeze = 1 day skipped without breaking streak
  todayXP: 0,
  todayDate: null,
  completedLessons: {},          // lessonId -> { ts, xp }
  flashcards: {},                // cardId -> { ease, interval, due, reps, lapses, lastReviewed }
  /* SRS on wrong-answer MCQs — every miss accumulates with SM-2 scheduling.
     missedQuestions[qid] = { q, options, correct, explain, cat, source,
                              ease, interval, due, reps, lapses, lastReviewed } */
  missedQuestions: {},
  /* SRS on concept self-ratings — driven by the 1-4 self-rate widget.
     conceptReviews[lessonId] = { ease, interval, due, reps, lastReviewed, lastRating } */
  conceptReviews: {},
  /* Free-recall attempts — log of attempts so user can review their own past phrasing */
  freeRecallAttempts: {},        // lessonId -> [{ ts, text, selfRated }]
  /* Cue surfacing — track which dates we've shown the when-then nudge */
  cueShownDates: {},             // dateKey -> true
  dailyQuests: { date: null, quests: [] },
  badges: {},                    // badgeId -> { earnedAt }
  history: [],                   // [{ date:'YYYY-MM-DD', xp, lessons }]
  mocks: [],                     // [{ ts, vertical, score, notes }]
  starStories: {},               // storyId -> {situation, task, action, result, updatedAt}
  /* Flashcard failure stats — incremented when a card is rated "Again" (1).
     byCard tracks per-card; byCat/byModule/byLesson aggregate. Used for the
     "× N fails" badge on cards and for a future regrouped-by-weakness view. */
  flashcardFailStats: { byCat: {}, byModule: {}, byLesson: {}, byCard: {} },
  /* Append-only fail-event log. Each entry: { id, ts, cardId, cat,
     module, lesson }. flashcardFailStats above is a derived cache --
     authoritative count is the LENGTH of this array per axis.
     Solves the race where two devices both fail the same card offline:
     the old per-key max merge picked one count, losing the other; the
     ledger unions by id so both fails count. Capped at 2000 entries
     to keep state size bounded under heavy review. */
  flashcardFailEvents: [],
  companySeen: {},               // companyId -> true
  visitedSources: false,
  rewardsRoll: 0,                // variable-reward seed bump
  /* Job-application log — each entry awards XP via awardXP at log time.
     Calibrated so 10 apps = half the daily XP goal (per-app = goal/20). */
  jobApps: [],                   // [{ date, ts, company, role, url, xp }]
  /* Tombstones for deleted job apps. Union-based sync can't otherwise
     propagate deletions — both devices end up with the superset. When
     removeLastJobApp removes a ts, we record it here so the other
     device's merge filters it back out. Cleaned to entries < 30 days. */
  jobAppsDeletedTs: {},          // { [ts:number]: deletedAt:number }
};

/* ---------- Persistence ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const merged = Object.assign(clone(DEFAULT_STATE), parsed);
    // Re-sync level from XP in case of old/broken stored values
    merged.xp = Math.max(0, merged.xp || 0);
    merged.todayXP = Math.max(0, merged.todayXP || 0);
    merged.level = levelFromXP(merged.xp);
    return merged;
  } catch {
    return clone(DEFAULT_STATE);
  }
}
let _saveTimeout = null;
function save(state) {
  // Debounced write to avoid hammering localStorage
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('save failed', e); }
  }, 80);
}
function saveImmediate(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('save failed', e); }
}
function reset() {
  localStorage.removeItem(STORAGE_KEY);
}

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const rand = (typeof crypto !== 'undefined' && crypto.getRandomValues)
        ? Array.from(crypto.getRandomValues(new Uint32Array(2))).map(n => n.toString(36)).join('')
        : Math.random().toString(36).slice(2);
      id = `d${Date.now().toString(36)}${rand}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch (_) {
    return 'device';
  }
}

function awardEventId(ts, reason) {
  const rand = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    : Math.random().toString(36).slice(2);
  return `${deviceId()}:${ts}:${reason}:${rand}`;
}

/* ---------- Dates ---------- */
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function daysBetween(a, b) {
  const da = new Date(a), db = new Date(b);
  return Math.round((db - da) / 86400000);
}

/* ---------- Levels: XP curve ----------
 * `xpForLevel(n)` returns the cumulative XP at which level N STARTS.
 *   level 1 starts at 0 XP   (you begin here)
 *   level 2 starts at 100    (100 XP earned in level 1 to advance)
 *   level 3 starts at 300    (+200 XP in level 2)
 *   level 4 starts at 600    (+300 XP in level 3)
 *   ... level N starts at 100 * (N-1) * N / 2
 * inLevel = xp - xpForLevel(currentLevel) is ALWAYS ≥ 0.
 */
function xpForLevel(n) {
  if (n <= 1) return 0;
  return Math.round(100 * (n - 1) * n / 2);
}
function levelFromXP(xp) {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  return n;
}
function levelProgress(xp) {
  const lvl = levelFromXP(xp);
  const lower = xpForLevel(lvl);
  const upper = xpForLevel(lvl + 1);
  return { level: lvl, lower, upper, inLevel: xp - lower, levelSpan: upper - lower };
}

/* ---------- Streak management ---------- */
/* One-shot backfill: derive history[date].events counts from raw
 * timestamps (flashcards.lastReviewed, completedLessons[].ts,
 * jobApps[].ts) for entries written before the audit-trail commit
 * (79c7c69). Idempotent -- after the first pass every entry has an
 * .events field and the function early-returns on its existence check.
 *
 * eventsXP is NOT backfilled: the per-award XP included a variable
 * +9% bonus, so reverse-engineering per-kind XP totals from counts
 * would invent fake numbers. The dashboard XP-breakdown card simply
 * skips entries that lack eventsXP. New writes append hentry.awards[]
 * records, which sync can union by id across multiple devices. */
function _backfillHistoryEvents(state) {
  if (!state.history || !state.history.length) return;
  // Fast-skip if every entry already has events.
  let needsBackfill = false;
  for (const h of state.history) { if (!h.events) { needsBackfill = true; break; } }
  if (!needsBackfill) return;

  const counts = new Map();          // date -> { flashcard, lesson, app }
  const bump = (date, kind) => {
    if (!date) return;
    if (!counts.has(date)) counts.set(date, { flashcard: 0, lesson: 0, app: 0 });
    counts.get(date)[kind] += 1;
  };
  // Local-midnight bucketing — must match the rest of the app (tickDay,
  // state.todayDate, logJobApp entries). Using toISOString() here would
  // bucket evening-local activity into the next UTC day, mismatching
  // history dates with state.todayDate by up to one full row.
  const dateOf = (ts) => ts ? todayKey(new Date(ts)) : null;

  for (const meta of Object.values(state.flashcards || {})) {
    bump(dateOf(meta && meta.lastReviewed), 'flashcard');
  }
  for (const meta of Object.values(state.completedLessons || {})) {
    // New shape {ts,xp}; very old shape was `true` (no ts -- can't bucket).
    const ts = (meta && typeof meta === 'object') ? meta.ts : null;
    bump(dateOf(ts), 'lesson');
  }
  for (const app of (state.jobApps || [])) {
    bump(dateOf(app && app.ts), 'app');
  }

  for (const h of state.history) {
    if (h.events) continue;
    h.events = counts.get(h.date) || { flashcard: 0, lesson: 0, app: 0 };
  }
}

function _historyEntryFor(state, date) {
  if (!Array.isArray(state.history)) state.history = [];
  let hentry = state.history.find(h => h.date === date);
  if (!hentry) {
    hentry = { date, xp: 0, lessons: 0, events: {}, eventsXP: {}, awards: [] };
    state.history.push(hentry);
  }
  if (!hentry.events)   hentry.events   = {};
  if (!hentry.eventsXP) hentry.eventsXP = {};
  if (!Array.isArray(hentry.awards)) hentry.awards = [];
  return hentry;
}

function appendHistoryAward(state, date, reason, xp, ts = Date.now()) {
  const hentry = _historyEntryFor(state, date);
  const event = { id: awardEventId(ts, reason), ts, reason, xp };
  hentry.awards.push(event);
  hentry.xp += xp;
  hentry.events[reason] = (hentry.events[reason] || 0) + 1;
  hentry.eventsXP[reason] = (hentry.eventsXP[reason] || 0) + xp;
  return event;
}

function tickDay(state) {
  const today = todayKey();
  _backfillHistoryEvents(state);
  // Compute unspent food-pile XP from yesterday BEFORE the todayXP reset
  // below clobbers it. Capturing the delta here lets the rollover branch
  // push leftover piles into pet.carryoverXP so they survive midnight.
  const isNewDay = state.todayDate !== today;
  const isPetNewDay = !!state.pet && state.pet.lastEatenDate !== today;
  const priorUnspent = (isNewDay && isPetNewDay)
    ? Math.max(0, (state.todayXP || 0) - ((state.pet && state.pet.eatenTodayXP) || 0))
    : 0;
  if (isNewDay) {
    state.todayDate = today;
    state.todayXP = 0;
  }
  // Roll the pet's "eaten today" counter in lockstep with todayXP. Both
  // are "today" concepts and must reset atomically — splitting them
  // (eatenTodayXP in petState, todayXP here) produced a window where iOS
  // PWA resume after midnight ran the sync path (which calls petState
  // but NOT tickDay), zeroing eatenTodayXP while todayXP kept yesterday's
  // value. The dashboard then showed phantom food piles = floor(stale/5).
  if (isPetNewDay) {
    state.pet.carryoverXP = (state.pet.carryoverXP || 0) + priorUnspent;
    state.pet.eatenTodayXP = 0;
    state.pet.lastEatenDate = today;
  }
  // Reconcile todayXP against history[today].xp. The merge function in
  // sync.js takes MAX on per-date history entries but takes the fresher
  // side\'s todayXP — those rules disagree when devices diverge, and
  // todayXP can be clipped below the (correct) history total. Use
  // history as the audit-of-record. One-way: never decrease todayXP.
  const hentry = (state.history || []).find(h => h.date === today);
  if (hentry && (hentry.xp || 0) > (state.todayXP || 0)) {
    state.todayXP = hentry.xp;
  }
  if (state.streak.lastDay === today) return state; // already counted

  const last = state.streak.lastDay;
  if (!last) {
    state.streak.count = 1;
  } else {
    const gap = daysBetween(last, today);
    if (gap === 1) state.streak.count += 1;
    else if (gap === 2 && state.streak.freezeAvailable > 0) {
      // streak freeze auto-burns: keep streak, lose freeze
      state.streak.freezeAvailable -= 1;
      // don't increment (we missed a day) — keep at current
    } else if (gap > 0) {
      state.streak.count = 1;
    }
  }
  state.streak.lastDay = today;
  // Earn back a freeze every 14 days
  if (state.streak.count > 0 && state.streak.count % 14 === 0) state.streak.freezeAvailable = Math.min(2, state.streak.freezeAvailable + 1);
  return state;
}

/* ---------- XP / activity logging ---------- */
function awardXP(state, amount, reason) {
  tickDay(state);
  // Variable reward: 8% chance of 1.5x bonus, 1% of 2x
  const roll = Math.random();
  let multiplier = 1, bonusLabel = '';
  if (roll < 0.01) { multiplier = 2;   bonusLabel = ' (2× JACKPOT!)'; }
  else if (roll < 0.09) { multiplier = 1.5; bonusLabel = ' (1.5× bonus)'; }
  const finalXP = Math.round(amount * multiplier);

  // Track whether THIS award crossed the daily goal threshold so callers
  // can surface a "Bit's hungry — feed time" toast without polling.
  const goal = (state.user && state.user.goal) || 60;
  const prevTodayXP = state.todayXP || 0;
  const crossedFeedGoal = prevTodayXP < goal && (prevTodayXP + finalXP) >= goal;

  state.xp += finalXP;
  state.todayXP += finalXP;
  state.level = levelFromXP(state.xp);

  /* History + audit trail.
   *
   * Every awardXP call writes:
   *   - hentry.xp           cumulative XP earned that day
   *   - hentry.events[k]    count of awards of kind k (lesson, flashcard, ...)
   *   - hentry.eventsXP[k]  total XP attributed to kind k
   *   - hentry.awards[]     append-only per-award records with stable ids
   *
   * So "what's in my todayXP=140?" can be answered without grepping:
   *   {lesson: 5, flashcard: 7, focus: 3}  with xp split per-kind.
   *
   * Sync safety: awards[] is the source of truth for new writes. Two
   * devices can both award XP on the same day; sync unions award ids
   * and recomputes the aggregate fields instead of taking max().
   *
   * Migration: old history entries (no awards field) work unchanged --
   * sync treats their aggregate xp as a legacy base. */
  const today = todayKey();
  const awardEvent = appendHistoryAward(state, today, reason, finalXP);
  // cap history at 365
  if (state.history.length > 365) state.history.splice(0, state.history.length - 365);

  // Goal-crossed toast — Bit needs feeding. Once per day; subsequent
  // crossings (after page reload, etc.) suppress via lastFeedToastDate.
  if (crossedFeedGoal && state.pet && state.pet.lastFeedToastDate !== today) {
    state.pet.lastFeedToastDate = today;
    const petName = (state.pet && state.pet.name) || 'Bit';
    if (typeof window !== 'undefined' && window.ANIM && window.ANIM.toast) {
      // Inline Lucide carrot SVG (kept as a literal string here because
      // gamification.js can run before views.js exports iconHTML).
      const carrotIcon = '<span class="icon" style="display:inline-block;width:18px;height:18px;background-color:currentColor;-webkit-mask:url(\'assets/icons/carrot.svg\') no-repeat center/contain;mask:url(\'assets/icons/carrot.svg\') no-repeat center/contain;vertical-align:-3px"></span>';
      window.ANIM.toast({
        icon: carrotIcon,
        title: `${petName} is hungry`,
        body: 'You hit today\'s XP goal — head to the dashboard and drop food.',
        href: '#dashboard',
      });
    }
  }

  return { state, xpGained: finalXP, bonusLabel, levelUp: undefined, crossedFeedGoal, awardId: awardEvent.id };
}

/* Manual feed — called when the user drops a food pile. XP-to-
 * vitality is 1:1 -- a 5-XP pile restores +5 vitality. With 1:1 it
 * takes the full 100 XP worth of piles (20 piles) to restore Bit from
 * 0 to 100 vitality, which matches the 100-pts-per-24h decay rate
 * exactly. Halving the unit cost from 10 to 5 keeps the daily total
 * unchanged but adds granularity -- a 7-XP day can still drop one
 * pile (vs zero at the 10-XP unit), and the feeding gesture happens
 * twice as often per session. Each pile still shifts body form per
 * the workout-vs-sedentary threshold below.
 *
 * Vitality model: a snapshot value lives in p.vitality + a timestamp
 * p.lastFedAt; the displayed value decays linearly from that snapshot
 * at 100 points per 24 hours. Feeding RESETS the snapshot to
 * (current live + bonus) and writes a fresh lastFedAt.
 */
function feedPetWithPile(state) {
  if (!state || !state.pet) return false;
  const p = state.pet;
  // Roll the time-decayed live value back into the stored snapshot
  // before adding the bonus. Without this, every feed event would
  // discard accumulated decay (you could feed once a day and stay
  // at 100 forever).
  p.vitality = Math.min(100, _liveVitality(p) + 5);
  p.lastFedAt = Date.now();
  const today = todayKey();
  p.lastFedDate = today;
  const goal = (state.user && state.user.goal) || 60;
  const todayXP = state.todayXP || 0;
  if (todayXP >= goal * 1.5) {
    p.form = Math.min(50, (p.form || 0) + 1);
  } else {
    p.form = Math.max(-50, (p.form || 0) - 1);
  }
  // Audit trail — each drop is a 0-XP event in today's history. Until
  // now drops only mutated eatenTodayXP (a single counter), so "did I
  // really drop 10 piles?" was unverifiable across devices. Per-drop
  // event lets us reconstruct the feeding timeline.
  try { appendHistoryAward(state, today, 'food', 0); } catch (_) {}
  return true;
}

// Calibration constants — the daily goal (default 180) should require
// roughly "10 applications + one curriculum subcategory" of effort.
// With these values: 10 apps × 9 XP = 90, 5 lessons × 18 XP = 90,
// total 180 — exactly hitting goal. Tuned 2026-05-15.
const XP_LESSON_MULT = 1.5;       // 12-XP lesson → 18; 20-XP drill → 30
const XP_APP_BASE    = 15;        // hard floor; actual = max(this, goal/12)
                                  // Re-weighted upward because applications
                                  // are the actual job-getting bottleneck.
                                  // One app = roughly one mid-weight lesson
                                  // worth of XP, before morning 2× bonus.

function logLessonComplete(state, lessonId, baseXP) {
  if (state.completedLessons[lessonId]) {
    return { state, xpGained: 0, alreadyDone: true };
  }
  const prevLevel = state.level;
  const boostedXP = Math.max(1, Math.round((baseXP || 0) * XP_LESSON_MULT));
  const { state: s, xpGained, bonusLabel } = awardXP(state, boostedXP, 'lesson');
  s.completedLessons[lessonId] = { ts: Date.now(), xp: xpGained };
  const today = todayKey();
  const hentry = s.history.find(h => h.date === today);
  if (hentry) hentry.lessons = (hentry.lessons || 0) + 1;
  const levelUp = s.level > prevLevel ? s.level : null;
  return { state: s, xpGained, bonusLabel, levelUp };
}

/* ---------- Spaced repetition (SM-2 simplified) ---------- */
/* Flashcard-fail event ledger + derived stats.
 *
 * recordFlashcardFail() appends an immutable {id, ts, cardId, cat,
 * module, lesson} event and refreshes the cached aggregate counts.
 * Stable per-device ids (devXYZ:ts:flashcard-fail:rand) so two
 * devices that both record a fail for the same card offline union
 * by id instead of being collapsed to max(a,b)=1 by the merge.
 *
 * deriveFlashcardFailStats(events) rebuilds the byCard/byCat/byModule/
 * byLesson counts from the event log. Used by sync after merging
 * the ledgers. */
function recordFlashcardFail(state, card) {
  if (!card) return;
  if (!Array.isArray(state.flashcardFailEvents)) state.flashcardFailEvents = [];
  const ts = Date.now();
  const ev = {
    id: awardEventId(ts, 'flashcard-fail'),
    ts,
    cardId: card.id,
    cat:    card.cat || null,
    module: card.module || null,
    lesson: card.lesson || null,
  };
  state.flashcardFailEvents.push(ev);
  if (state.flashcardFailEvents.length > 2000) {
    state.flashcardFailEvents.splice(0, state.flashcardFailEvents.length - 2000);
  }
  // INCREMENTAL cache bump. Don't re-derive the cache from events --
  // doing so would wipe out any legacy pre-ledger fails (those have no
  // event records). Counterpart on the merge side computes
  // legacyBase = cached - count(own events) for each axis/key and adds
  // it back, so historical fails survive cross-device merges too.
  if (!state.flashcardFailStats) state.flashcardFailStats = { byCat: {}, byModule: {}, byLesson: {}, byCard: {} };
  const s = state.flashcardFailStats;
  if (ev.cardId) s.byCard[ev.cardId]   = (s.byCard[ev.cardId]   || 0) + 1;
  if (ev.cat)    s.byCat[ev.cat]       = (s.byCat[ev.cat]       || 0) + 1;
  if (ev.module) s.byModule[ev.module] = (s.byModule[ev.module] || 0) + 1;
  if (ev.lesson) s.byLesson[ev.lesson] = (s.byLesson[ev.lesson] || 0) + 1;
}
function deriveFlashcardFailStats(events) {
  const stats = { byCat: {}, byModule: {}, byLesson: {}, byCard: {} };
  for (const e of (events || [])) {
    if (!e) continue;
    if (e.cardId) stats.byCard[e.cardId]   = (stats.byCard[e.cardId]   || 0) + 1;
    if (e.cat)    stats.byCat[e.cat]       = (stats.byCat[e.cat]       || 0) + 1;
    if (e.module) stats.byModule[e.module] = (stats.byModule[e.module] || 0) + 1;
    if (e.lesson) stats.byLesson[e.lesson] = (stats.byLesson[e.lesson] || 0) + 1;
  }
  return stats;
}

function reviewCard(state, cardId, quality /* 1..4 */) {
  const card = state.flashcards[cardId] || { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 };
  // Quality 1=again, 2=hard, 3=good, 4=easy
  if (quality === 1) {
    card.interval = 1; card.lapses += 1; card.ease = Math.max(1.3, card.ease - 0.2);
  } else {
    if (card.reps === 0) card.interval = quality === 2 ? 1 : (quality === 3 ? 2 : 4);
    else if (card.reps === 1) card.interval = quality === 2 ? 3 : (quality === 3 ? 4 : 7);
    else card.interval = Math.round(card.interval * card.ease * (quality === 2 ? 0.7 : (quality === 4 ? 1.3 : 1)));
    card.ease = Math.max(1.3, card.ease + (quality === 4 ? 0.15 : (quality === 2 ? -0.15 : 0)));
    card.reps += 1;
  }
  card.lastReviewed = Date.now();
  card.due = Date.now() + card.interval * 86400000;
  state.flashcards[cardId] = card;

  // XP based on quality. Capped LOW (1-2) so flashcards stay maintenance,
  // not the primary XP driver — daily goal should come from lessons + apps.
  // Was 5/10/15/20; 10 Good cards used to clear the entire 180 daily goal.
  const xpMap = { 1: 1, 2: 1, 3: 2, 4: 2 };
  return awardXP(state, xpMap[quality] || 2, 'flashcard');
}

/* Job-application log. Each entry awards XP via the normal awardXP path
 * so it counts toward today's total + vitality + streak. Per-app XP is
 * calibrated to `goal / 20` (so 10 apps == half the daily goal) with a
 * floor of 1 XP. No metadata captured — it's a pure counter.
 *
 * The actual `xpGained` (including any random-multiplier bonus from
 * awardXP) is what we store on the entry, so unlogging via
 * `removeLastJobApp` can subtract exactly that amount back out. */
/* Morning bonus — every app logged before 11am local pays out 2× XP.
 * Single-purpose mechanic: cold-applying in the morning has higher
 * response rates (every applicant-tracking blog says so) and it's also
 * the easiest hour to procrastinate past. The XP doubler is a flat,
 * visible, hard-to-ignore nudge.
 *
 * Cutoff is 11:00 local — generous enough to catch realistic-morning
 * starts (8–10am) without rewarding the "just-woke-up-at-noon" lie. */
const APP_MORNING_CUTOFF_HOUR = 11;
const APP_MORNING_BONUS_MULT  = 2;
function appMorningBonusActive() {
  return new Date().getHours() < APP_MORNING_CUTOFF_HOUR;
}
function appMorningMultiplier() {
  return appMorningBonusActive() ? APP_MORNING_BONUS_MULT : 1;
}

/* Daily application target — ramped smoothstep, tuned for habit
 * psychology rather than aspirational benchmarks:
 *   - START=1: two-minute-rule day 0. A "bad day" can still hit "log
 *     one application." Hitting the target preserves the streak and
 *     reinforces the identity ("I am someone who applies daily")
 *     instead of breaking it.
 *   - ELITE=15: a number you can sustain for *months* of active job-
 *     searching without burnout. 25/day is sprint territory and
 *     rewards quantity over quality; 15/day is heavy but sustainable.
 *   - RAMP=21 days: matches the habit-formation literature midpoint
 *     (21-66 days range). Slow enough that the early streak compounds.
 * Source of truth so the dashboard apps card + chart agree. */
const APP_RAMP_DAYS  = 14;
const APP_TARGET_START = 2;
const APP_TARGET_ELITE = 20;
function dailyAppTarget(state) {
  // Anchor priority: explicit state.appsRampAnchor (set when user
  // chooses "start today") → first-history date → today. The override
  // lets a returning user (whose history starts weeks ago) reset the
  // apps ramp without affecting flashcard/lesson ramps.
  const anchor = state.appsRampAnchor
    || (state.history && state.history[0] && state.history[0].date)
    || todayKey();
  const days   = Math.max(0, Math.floor((new Date(todayKey()) - new Date(anchor)) / 86400000));
  const t      = Math.min(1, days / APP_RAMP_DAYS);
  const ease   = 3 * t * t - 2 * t * t * t;
  return Math.round(APP_TARGET_START + (APP_TARGET_ELITE - APP_TARGET_START) * ease);
}

/* Two-tier app targets — "realistic" meets the user where they are
 * (recent average + 1), "stretch" is the calendar-day ramp (where the
 * user *should* be at this point in the 10-day ramp).
 *
 * Shipping both makes the gap visible: a user behind the ramp sees
 * "realistic 5 · stretch 12" rather than just "12" (demoralizing) or
 * just "5" (hides reality). For a candidate with a long employment
 * gap, that gap-as-information is the right design.
 *
 * `realistic` falls back to `stretch` when there isn't enough recent
 * history (<3 days with app data) — without a baseline, the calendar
 * ramp IS the realistic target. */
function dailyAppTargets(state) {
  const stretch = dailyAppTarget(state);
  const hist = (state.history || []);
  // Use the last 7 calendar days with any app activity. Days with 0
  // apps DO count toward the average — they're real signal about
  // sustained pace, and excluding them would let "5 apps once a week"
  // produce a realistic target of 5.
  const last7 = hist.slice(-7);
  if (last7.length < 3) return { realistic: stretch, stretch };
  const sum = last7.reduce((acc, h) => acc + ((h.events && h.events.app) || 0), 0);
  const avg = sum / last7.length;
  // +1 buffer so today's realistic is always a small stretch above the
  // recent average — never a coast.
  const realistic = Math.max(APP_TARGET_START, Math.min(APP_TARGET_ELITE, Math.round(avg + 1)));
  return { realistic, stretch };
}

function logJobApp(state) {
  tickDay(state);
  if (!Array.isArray(state.jobApps)) state.jobApps = [];
  const goal = (state.user && state.user.goal) || 60;
  // Per-app XP: goal/20 floor XP_APP_BASE. Morning 2× multiplier applies
  // before awardXP so the random-multiplier bonus stacks on top of it.
  const baseXP = Math.max(XP_APP_BASE, Math.round(goal / 12));
  const mult   = appMorningMultiplier();
  const award  = awardXP(state, baseXP * mult, 'app');
  const entry = {
    date: todayKey(), ts: Date.now(), xp: award.xpGained, awardId: award.awardId,
    morning: mult > 1 ? true : undefined,
  };
  state.jobApps.push(entry);
  // Cap retained history (~1y of heavy use) to keep state size bounded.
  if (state.jobApps.length > 1000) state.jobApps.splice(0, state.jobApps.length - 1000);
  return { entry, ...award, morningBonus: mult > 1 };
}

/* Toggle-on a specific role as "applied to". Same XP rules as logJobApp
 * but the entry carries a roleKey (+ display metadata) so the same row
 * can later be toggled OFF, and so it shows as checked across devices
 * after sync. Re-applying the SAME roleKey while already checked is a
 * no-op (returns null). */
function applyRole(state, roleKey, meta) {
  tickDay(state);
  if (!Array.isArray(state.jobApps)) state.jobApps = [];
  if (state.jobApps.some(j => j.roleKey === roleKey)) return null;   // already applied
  const goal = (state.user && state.user.goal) || 60;
  // Match logJobApp — goal/20, floor XP_APP_BASE, 2× before 11am local.
  const baseXP = Math.max(XP_APP_BASE, Math.round(goal / 12));
  const mult   = appMorningMultiplier();
  const award  = awardXP(state, baseXP * mult, 'app');
  const entry = {
    date: todayKey(), ts: Date.now(), xp: award.xpGained,
    awardId: award.awardId,
    roleKey,
    company: meta && meta.company,
    title:   meta && meta.title,
    url:     meta && meta.url,
    morning: mult > 1 ? true : undefined,
  };
  state.jobApps.push(entry);
  if (state.jobApps.length > 1000) state.jobApps.splice(0, state.jobApps.length - 1000);
  return { entry, ...award, morningBonus: mult > 1 };
}

/* Toggle-off — remove the jobApp entry matching roleKey, refund its
 * xp, and tombstone the ts so the other paired device's merge
 * doesn't resurrect it. */
function unapplyRole(state, roleKey) {
  if (!Array.isArray(state.jobApps)) return null;
  const idx = state.jobApps.findIndex(j => j.roleKey === roleKey);
  if (idx === -1) return null;
  const [removed] = state.jobApps.splice(idx, 1);
  const xp = removed.xp || 0;
  state.xp      = Math.max(0, (state.xp      || 0) - xp);
  state.level   = levelFromXP(state.xp);
  // Only refund todayXP + today's history if the entry is today.
  if (removed.date === todayKey()) {
    state.todayXP = Math.max(0, (state.todayXP || 0) - xp);
    appendHistoryAward(state, removed.date, 'app_undo', -xp);
  }
  if (!state.jobAppsDeletedTs) state.jobAppsDeletedTs = {};
  if (removed.ts != null) state.jobAppsDeletedTs[removed.ts] = Date.now();
  // Garbage-collect tombstones older than 30 days
  const cutoff = Date.now() - 30 * 86400000;
  for (const k of Object.keys(state.jobAppsDeletedTs)) {
    if ((state.jobAppsDeletedTs[k] || 0) < cutoff) delete state.jobAppsDeletedTs[k];
  }
  return { removed, xpRemoved: xp };
}

/* Is this roleKey currently applied (i.e., present in state.jobApps)?
 * Cheap lookup used by the role-row checkbox renderer. */
function isRoleApplied(state, roleKey) {
  if (!Array.isArray(state.jobApps)) return false;
  for (let i = 0; i < state.jobApps.length; i++) {
    if (state.jobApps[i].roleKey === roleKey) return true;
  }
  return false;
}

/* Undo the most recent job application logged TODAY. Subtracts the
 * entry's xp back out of state.xp / state.todayXP / history, and
 * recomputes level. Returns null if there's nothing to undo. */
function removeLastJobApp(state) {
  if (!Array.isArray(state.jobApps) || state.jobApps.length === 0) return null;
  const today = todayKey();
  let idx = -1;
  for (let i = state.jobApps.length - 1; i >= 0; i--) {
    if (state.jobApps[i].date === today) { idx = i; break; }
  }
  if (idx === -1) return null;
  const [removed] = state.jobApps.splice(idx, 1);
  const xp = removed.xp || 0;
  state.xp      = Math.max(0, (state.xp      || 0) - xp);
  state.todayXP = Math.max(0, (state.todayXP || 0) - xp);
  state.level   = levelFromXP(state.xp);
  appendHistoryAward(state, today, 'app_undo', -xp);
  // Tombstone the deleted ts so the other paired device's union merge
  // filters this entry back out instead of resurrecting it.
  if (!state.jobAppsDeletedTs) state.jobAppsDeletedTs = {};
  if (removed && removed.ts != null) state.jobAppsDeletedTs[removed.ts] = Date.now();
  // Garbage-collect tombstones older than 30 days
  const cutoff = Date.now() - 30 * 86400000;
  for (const k of Object.keys(state.jobAppsDeletedTs)) {
    if ((state.jobAppsDeletedTs[k] || 0) < cutoff) delete state.jobAppsDeletedTs[k];
  }
  return { removed, xpRemoved: xp };
}

function dueCards(state, allCards, limit=20, pinFirstId=null) {
  const now = Date.now();
  const due = allCards
    .map(c => ({ card: c, meta: state.flashcards[c.id] }))
    .filter(({ meta }) => !meta || meta.due <= now);

  /* Strategic ordering — random within, structured across.
   *
   * The aim: when you crack open the flashcards page, the first cards
   * you see should reinforce ONE lesson at a time (cluster by lesson
   * so the concepts compound), and the lessons themselves should march
   * down the curriculum priority order (Tier 1 first, Tier 4 last).
   * Within those constraints, every other axis is randomized so
   * repeated sessions don't drill the identical sequence -- the user
   * still sees fresh-feeling sessions, just with pedagogical structure.
   *
   * Sort keys (in priority order):
   *   1. Category tier      ascending  (1 = highest ROI per curriculum)
   *   2. Random per-cat tag stable in this call  (within same tier,
   *                                               shuffle which cat goes first)
   *   3. Module curriculum index   ascending  (curriculum order within cat)
   *   4. Random per-lesson tag stable in this call  (cluster lessons; order
   *                                                  of clusters within a
   *                                                  module is shuffled)
   *   5. Random per-card  (shuffle WITHIN a lesson cluster)
   *
   * Resume-pinning is applied LAST, so it overrides everything if set. */
  const DATA = (typeof window !== 'undefined' && window.DATA) || {};
  const CATEGORIES = DATA.CATEGORIES || [];
  const MODULES    = DATA.MODULES    || [];
  const tierOf = (catId) => {
    const c = CATEGORIES.find(x => x.id === catId);
    return c ? (c.tier || 4) : 4;
  };
  const moduleIndex = new Map(MODULES.map((m, i) => [m.id, i]));
  const modIdx = (moduleId) => moduleIndex.has(moduleId) ? moduleIndex.get(moduleId) : 9999;

  // Stable per-call random keys so the sort is deterministic during the
  // sort itself (multiple comparisons reference the same key).
  const catKey = new Map();
  const lessonKey = new Map();
  const cardKey = new Map();
  for (const d of due) {
    const c = d.card;
    if (!catKey.has(c.cat))       catKey.set(c.cat, Math.random());
    const lessonId = c.lesson || `__no_${c.cat}`;
    if (!lessonKey.has(lessonId)) lessonKey.set(lessonId, Math.random());
    cardKey.set(c.id, Math.random());
  }

  due.sort((a, b) => {
    const ac = a.card, bc = b.card;
    const at = tierOf(ac.cat), bt = tierOf(bc.cat);
    if (at !== bt) return at - bt;
    const ak = catKey.get(ac.cat), bk = catKey.get(bc.cat);
    if (ac.cat !== bc.cat) return ak - bk;
    const am = modIdx(ac.module), bm = modIdx(bc.module);
    if (am !== bm) return am - bm;
    const al = lessonKey.get(ac.lesson || `__no_${ac.cat}`);
    const bl = lessonKey.get(bc.lesson || `__no_${bc.cat}`);
    if (al !== bl) return al - bl;
    return cardKey.get(ac.id) - cardKey.get(bc.id);
  });

  // Resume-pin: hoist the user's last card to position 0 if requested.
  // Survives the slice below.
  if (pinFirstId) {
    const pinIdx = due.findIndex(d => d.card.id === pinFirstId);
    if (pinIdx > 0) {
      const [pinned] = due.splice(pinIdx, 1);
      due.unshift(pinned);
    }
  }
  return due.slice(0, limit);
}

/* ---------- Wrong-answer SRS queue ----------
 * Every MCQ miss accumulates into state.missedQuestions with SM-2 scheduling.
 * Surfaced on dashboard; user can review and re-attempt.
 */
function recordWrongAnswer(state, qid, questionData) {
  // First miss → schedule for tomorrow with default ease
  if (!state.missedQuestions[qid]) {
    state.missedQuestions[qid] = {
      ...questionData,
      ease: 2.3,         // start slightly below default (this was missed)
      interval: 1,
      due: Date.now() + 86400000,  // tomorrow
      reps: 0,
      lapses: 1,
      firstMissedAt: Date.now(),
      lastReviewed: null,
    };
  } else {
    // Already in queue and missed again — reset interval, increment lapses
    const m = state.missedQuestions[qid];
    m.interval = 1;
    m.lapses += 1;
    m.ease = Math.max(1.3, m.ease - 0.2);
    m.due = Date.now() + 86400000;
  }
  return state;
}

function reviewMissedQuestion(state, qid, gotItRight) {
  const m = state.missedQuestions[qid];
  if (!m) return state;
  m.reps += 1;
  m.lastReviewed = Date.now();
  if (gotItRight) {
    // Promote: longer interval, slight ease boost
    if (m.reps === 1) m.interval = 3;
    else if (m.reps === 2) m.interval = 7;
    else m.interval = Math.round(m.interval * m.ease);
    m.ease = Math.min(2.8, m.ease + 0.1);
    // If they've nailed it three times, graduate out of the queue
    if (m.reps >= 3 && m.interval >= 21) {
      delete state.missedQuestions[qid];
      return state;
    }
  } else {
    m.interval = 1;
    m.lapses += 1;
    m.ease = Math.max(1.3, m.ease - 0.2);
  }
  m.due = Date.now() + m.interval * 86400000;
  return state;
}

function dueMissedQuestions(state, limit=20) {
  const now = Date.now();
  return Object.entries(state.missedQuestions || {})
    .filter(([_, m]) => m.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([qid, m]) => ({ qid, ...m }));
}

function totalMissedCount(state) {
  return Object.keys(state.missedQuestions || {}).length;
}

/* ---------- Concept review SRS queue (self-rate driven) ----------
 * After a concept's activity completes, user self-rates 1-4 ("shaky" → "could teach it").
 * Schedule for re-encounter accordingly. Lower rating = sooner review.
 */
function scheduleConceptReview(state, lessonId, rating /* 1-4 */) {
  const intervals = { 1: 1, 2: 3, 3: 7, 4: 21 };  // days until next review
  const easeAdj   = { 1: -0.2, 2: -0.05, 3: 0, 4: 0.1 };
  const prev = state.conceptReviews[lessonId];
  const ease = Math.max(1.3, Math.min(2.8, (prev?.ease ?? 2.3) + easeAdj[rating]));
  const baseInterval = intervals[rating] || 7;
  const scaledInterval = prev
    ? (rating <= 1 ? 1 : Math.round((prev.interval || 1) * ease))
    : baseInterval;
  state.conceptReviews[lessonId] = {
    ease,
    interval: scaledInterval,
    due: Date.now() + scaledInterval * 86400000,
    reps: (prev?.reps || 0) + 1,
    lastReviewed: Date.now(),
    lastRating: rating,
  };
  return state;
}

function dueConceptReviews(state, modules, limit=20) {
  const now = Date.now();
  const lookup = {};
  for (const m of modules) for (const l of m.lessons) lookup[l.id] = { lesson: l, modName: m.name, modCat: m.cat };
  return Object.entries(state.conceptReviews || {})
    .filter(([_, r]) => r.due <= now && lookup[_])
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([id, r]) => ({ id, ...r, ...lookup[id] }));
}

function totalConceptReviewsCount(state) {
  return Object.keys(state.conceptReviews || {}).length;
}

/* ---------- Free-recall log ----------
 * Log each free-recall attempt so the user can revisit past phrasings + see
 * how they've improved over time.
 */
function logFreeRecall(state, lessonId, text, selfRated) {
  if (!state.freeRecallAttempts[lessonId]) state.freeRecallAttempts[lessonId] = [];
  state.freeRecallAttempts[lessonId].push({
    ts: Date.now(),
    text: text.slice(0, 1500),
    selfRated, // 1-4
  });
  // Cap at 5 most-recent per lesson to avoid bloat
  state.freeRecallAttempts[lessonId] = state.freeRecallAttempts[lessonId].slice(-5);
  return state;
}

/* ---------- Daily quests ---------- */
// Quest ids that should always appear in today's quest list (always shown,
// not subject to the random pool). Mock interview is core to the daily prep
// loop so users get the rep every day.
const PINNED_QUEST_IDS = ['q-mock'];

function ensureDailyQuests(state, pool) {
  const today = todayKey();
  // Rebuild today's slate when (a) it's a new day, (b) the list is empty, or
  // (c) any pinned quest is missing from the existing slate. (c) handles the
  // case where the pinned set changed since the user's state was last saved
  // — without it, returning users would never see new pinned quests.
  const existingIds = new Set((state.dailyQuests.quests || []).map(q => q.id));
  const allPinnedPresent = PINNED_QUEST_IDS.every(id => existingIds.has(id));
  if (state.dailyQuests.date === today &&
      state.dailyQuests.quests.length &&
      allPinnedPresent) {
    return state;
  }
  // Always-on quests go first; remaining slots are filled randomly (deterministic per day)
  const pinned = pool.filter(q => PINNED_QUEST_IDS.includes(q.id));
  const remaining = pool.filter(q => !PINNED_QUEST_IDS.includes(q.id));
  const seed = parseInt(today.replaceAll('-',''), 10);
  const shuffled = [...remaining].sort((a,b) => ((seed * (a.id.charCodeAt(0)+1)) % 7) - ((seed * (b.id.charCodeAt(0)+1)) % 7));
  const slate = [...pinned, ...shuffled.slice(0, Math.max(0, 3 - pinned.length))];
  // Preserve existing progress on any quest that survives into the new slate
  const oldById = Object.fromEntries((state.dailyQuests.quests || []).map(q => [q.id, q]));
  state.dailyQuests = {
    date: today,
    quests: slate.map(q => {
      const prior = oldById[q.id];
      return prior
        ? { ...q, progress: prior.progress || 0, done: prior.done || false, _earned: prior._earned }
        : { ...q, progress: 0, done: false };
    })
  };
  return state;
}

/* ---------- Pet (tamagotchi) ----------
 * An 8-bit companion that lives or dies based on your daily XP discipline.
 *
 * Life-sim mechanics:
 *   • Stages: egg → baby (days 0-2) → teen (days 3-7) → adult (8+)
 *   • Health (0-100): -25 per day the goal is missed. Reaches 0 → death,
 *                     pet respawns as an egg the next day.
 *   • Fullness (0-100): +60 on feed (goal hit). -30 per day not fed.
 *   • Fitness (0-100): +12 when XP > 1.5× goal (over-achievement = exercise).
 *                      -3 per sedentary day. Builds toward "jacked" body.
 *   • Fatness (0-100): +8 when fed without exercise that day.
 *                      -4 per day with exercise. Builds toward "chubby" body.
 *
 * Body shape (visual):
 *   • Egg → just an oval, no body type
 *   • Baby/teen → cute, neutral
 *   • Adult: skinny / normal / chubby / jacked (by fitness vs fatness)
 *
 * Activities (random, render-time choice):
 *   walk · idle · eat · sleep · workout · play · cough (sick) · droop (sad)
 *
 * State fields (persisted):
 *   { stage, ageDays, health, fullness, fitness, fatness,
 *     lastFedDate, lastTickDate, deathCount, name }
 */

/* ---------- Pet — simplified to 2 metrics ----------
 *
 *   vitality (0..100)  — health + fullness combined. Death at 0.
 *   form    (-50..+50) — body axis. Negative = chubby. Positive = jacked.
 *
 * XP → pet rules:
 *   Hit daily goal           →  toast: "Bit is hungry, drop food" (one-shot
 *                                /day). NOTE: no automatic vitality bump
 *                                anymore — actively topping vitality up
 *                                requires the manual "Drop food" button.
 *   Drop food pile (manual)  →  vitality +8 (cap 100); form ±1 depending
 *                                on whether the user is on the workout path
 *   Hit ≥1.5× daily goal     →  form += +6 (jacked path) — counts as exercise
 *   Hit ≥1.0× but <1.5×      →  form += -2 (chubby drift — fed without exercise)
 *   PRIOR day = 0 XP         →  vitality -= 30  AND  skip counter += 1.
 *                                On the SECOND consecutive 0-XP day,
 *                                vitality = 0 → death.
 *   PRIOR day 0<XP<goal      →  vitality -= 30 × (1 − XP/goal)  (scaled
 *                                penalty) + skip counter resets to 0
 *   PRIOR day XP ≥ goal      →  no penalty + skip counter resets to 0
 *   vitality < 30            →  pet appears sick (cough activity)
 *   vitality < 50            →  pet begs (empty food bowl in room)
 *   vitality = 0             →  pet dies, respawns as baby tomorrow; deaths++
 *   form > +25               →  body = "jacked" (>+15 = "fit")
 *   form < -25               →  body = "chubby"
 *
 * The "PRIOR day" rules run every time `_petTick` fires after a calendar-
 * day rollover, walking from the last-tick date through yesterday. They
 * do NOT apply to today's in-progress XP — only fully-completed days.
 */

/* A small curated palette of pleasant body hues. Every time Bit is born
 * (first spawn OR respawn after death), one of these is chosen at random
 * so each life feels visually distinct. */
const _PET_HUES = [
  0x8FD9B6,  // mint
  0xF6A65A,  // peach
  0xB5A6E8,  // lavender
  0x6BC7DA,  // sky teal
  0xE88FB0,  // rose
  0xE6D572,  // gold
  0x9BD8A7,  // grass
  0xD9938F,  // coral
  0x7DB8F0,  // sky blue
  0xC998E8,  // lilac
  0xE8AC5A,  // amber
  0x8FE0CC,  // seafoam
];

function _randomHue() {
  return _PET_HUES[Math.floor(Math.random() * _PET_HUES.length)];
}

function _newPet(name = 'Bit') {
  return {
    stage: 'baby',
    ageDays: 0,
    vitality: 80,                  // snapshot (live = vitality − decay since lastFedAt)
    lastFedAt: Date.now(),         // ms timestamp — drives live decay (50 pts / 24h; ~40h to zero)
    form: 0,
    lastFedDate: null,
    lastTickDate: todayKey(),
    deathCount: 0,
    name,
    eatenTodayXP: 0,        // XP-worth that Bit has visually eaten today
    lastEatenDate: null,    // resets eatenTodayXP each day
    carryoverXP: 0,         // food-pile XP earned but not dropped — rolls over at midnight
    bodyHue: _randomHue(),  // fresh body color per life
  };
}

// Migrate old (4-metric or egg-stage) state shape to new (2-metric) shape.
// Idempotent — running it twice does nothing. Also fills in any missing
// fields a long-offline user might be missing entirely.
function _migratePet(p) {
  // Egg → baby (we no longer have an egg stage)
  if (p.stage === 'egg') {
    p.stage = 'baby';
    p.ageDays = Math.max(0, p.ageDays || 0);
  }
  // Old 4-metric shape → 2-metric
  if (p.vitality == null) {
    if (p.health != null || p.fullness != null) {
      p.vitality = Math.round(((p.health || 100) + (p.fullness || 80)) / 2);
      p.form = Math.round((p.fitness || 0) - (p.fatness || 0));
    } else {
      p.vitality = 80;
      p.form = 0;
    }
    p.form = Math.max(-50, Math.min(50, p.form));
    delete p.health; delete p.fullness; delete p.fitness; delete p.fatness;
  }
  // Safety fills (in case state was hand-edited or partially corrupted)
  if (p.lastTickDate == null) p.lastTickDate = todayKey();
  if (p.deathCount == null)   p.deathCount = 0;
  if (p.name == null)         p.name = 'Bit';
  if (p.ageDays == null)      p.ageDays = 0;
  if (p.stage == null)        p.stage = 'baby';
  if (p.eatenTodayXP == null) p.eatenTodayXP = 0;
  if (p.lastEatenDate == null) p.lastEatenDate = null;
  if (p.carryoverXP == null) p.carryoverXP = 0;
  if (p.bodyHue == null)      p.bodyHue = _randomHue();
  return p;
}

function _petTick(p, today, state) {
  if (p.lastTickDate === today) return p;
  let daysElapsed = daysBetween(p.lastTickDate || today, today);
  if (daysElapsed <= 0) { p.lastTickDate = today; return p; }
  daysElapsed = Math.min(daysElapsed, 30);
  // Snapshot pre-tick lifecycle state so we can detect stage transitions
  // after the tick block and write audit events.
  const _preStage = p.stage;

  // ── New model: death is a DERIVED predicate, not stored state ──────
  // Pet is "dead" when _liveVitality(p, now) === 0 — i.e. more than
  // 24h have passed since the last feed without enough fuel to keep
  // the snapshot above the decay curve. This is purely a computed
  // function of (p.vitality, p.lastFedAt, now); it isn't recorded on
  // the pet object and doesn't trigger any state change inside this
  // function.
  //
  // Why this matters for sync: the old model auto-respawned dead pets
  // here (Object.assign(p, _newPet(...))), which silently mutated
  // (stage, ageDays, lastFedDate, lastTickDate, deathCount) every
  // calendar rollover. Two paired devices ticking near-simultaneously
  // produced racy respawn states the merge couldn't always reconcile,
  // hence the recurring "Bit died again between sessions / phantom
  // day-0" bug class.
  //
  // Under the new rule, _petTick only handles aging + form drift.
  // Liveness/death is observed at render time via _liveVitality.
  // deathCount is no longer auto-incremented; if we eventually add an
  // explicit user "revive" action it can bump it deterministically.
  p.consecutiveSkipDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    if (p.form > 0)      p.form = Math.max(0, p.form - 1);
    else if (p.form < 0) p.form = Math.min(0, p.form + 1);
    p.ageDays += 1;
  }
  p.lastTickDate = today;
  if (p.stage === 'baby' && p.ageDays >= 3) p.stage = 'teen';
  if (p.stage === 'teen' && p.ageDays >= 8) p.stage = 'adult';
  // Audit trail — stage transitions get 0-XP events in today's history
  // so the timeline can show "Bit evolved to teen on 2026-05-24"
  // without diffing snapshots.
  if (state && p.stage !== _preStage) {
    try { appendHistoryAward(state, today, `pet-${p.stage}`, 0); } catch (_) {}
  }
  return p;
}

/* Public: is this pet currently dead?
 * Derived from (vitality snapshot, lastFedAt, now). No stored "dead"
 * flag — feed Bit when this returns true and he reanimates from the
 * fed-now decay snapshot. */
function isPetDead(p) {
  return !!p && _liveVitality(p) === 0;
}

/* Public: respawn a dead pet as a fresh baby. Preserves the user-chosen
 * name and increments deathCount so the skull counter sticks across
 * lives. New bodyHue and stage='baby' so the 3D scene visibly resets.
 * Caller is responsible for persisting state + triggering a re-render. */
function respawnPet(state) {
  if (!state) return state;
  const prior = state.pet || {};
  const fresh = _newPet(prior.name || 'Bit');
  fresh.deathCount = (prior.deathCount || 0) + 1;
  state.pet = fresh;
  return state;
}

function _petBody(p) {
  if (p.stage === 'baby') return 'baby';
  if (p.form >  25) return 'jacked';
  if (p.form >  15) return 'fit';
  if (p.form < -25) return 'chubby';
  return 'normal';
}

/* Live continuous-decay spectrum.
 *
 * The stored `p.vitality` only updates at calendar rollover (see _petTick).
 * For display + activity-selection, we compute a *live* vitality that
 * smoothly approaches whatever the rollover commit would be IF today
 * continued on its current trajectory.
 *
 * Vitality penalty is independent of the skip-credit logic — any sub-
 * goal day (including a 0-XP day) drops vitality by 30 × shortfall.
 * The skip credit only gates DEATH on the second consecutive 0-XP day.
 *
 * Two regimes:
 *
 * 1.  Normal trajectory (partial-credit or fresh-skip first-day)
 *     ───────────────────────────────────────────────────────────────
 *     Standard time-scaled pending penalty:
 *       pendingPenalty = (1 - todayXP/goal) × 30 × (hours-into-day / 24)
 *     At t=0:                penalty 0          → live = stored
 *     At t=24h, todayXP = 0: penalty 30          → live = stored − 30
 *     At t=24h, XP = goal:   penalty 0          → live = stored
 *
 *     This applies whether todayXP is 0 with a fresh skip credit or
 *     anywhere between 0 and goal. The skip credit handles death
 *     separately; vitality always declines on a sub-goal day.
 *
 * 2.  Death trajectory: todayXP == 0  AND  consecutiveSkipDays >= 1
 *     ───────────────────────────────────────────────────────────────
 *     The midnight commit will set vitality = 0 (second consecutive
 *     skip). Live vitality drops linearly from `stored` toward 0
 *     across the day. Earning ANY XP mid-day snaps trajectory back
 *     to regime 1 — the skip counter will reset at midnight, no
 *     death, vitality recovers visibly.
 */
/* Live vitality — pure time-since-fed decay.
 *
 *   live = max(0, snapshot − 50 × (now − lastFedAt) / 24h)
 *
 * Snapshot (p.vitality) only changes on real EVENTS: a feed bumps
 * the snapshot up; nothing decays the snapshot — the displayed
 * value just slides down as time passes.
 *
 * Rate calibration (2026-06-20, v2): decay is 50 pts / 24h.
 *   - The original 100/24h killed Bit on every skip day (too punishing).
 *   - 30/24h allowed 2 free skip days (too permissive).
 *   - 50/24h: ONE skip day is the max. Bit dies mid-second skip day.
 *
 * Curve from a typical 80-vitality feed:
 *   - +24h skip: 30 vitality (alive but visibly sick — yellow zone)
 *   - +40h:      ~0   vitality (death modal triggers)
 *   - +48h:      0    vitality (definitely dead)
 *
 * So skipping a SINGLE day costs you the buffer; skipping a second
 * day costs you Bit. Forcing function matches stated intent.
 */
const VITALITY_DECAY_PER_DAY = 50;
function _liveVitality(p /* legacy 2nd/3rd args ignored */) {
  if (!p || p.vitality == null) return 0;
  const last = p.lastFedAt || Date.now();
  const elapsed = Math.max(0, Date.now() - last);
  const decay = VITALITY_DECAY_PER_DAY * (elapsed / 86400000);
  return Math.max(0, Math.round((p.vitality || 0) - decay));
}

function _petActivity(p, today, justFed, liveVitality) {
  // Simplified to six polished states:
  //   dead  → live vitality has hit 0 (must respawn to clear)
  //   walk  → default during waking hours (dominant)
  //   play  → occasional burst of hopping
  //   sleep → late night / early morning
  //   eat   → transient, when goal hit + not yet fed today
  //   sick  → low vitality, visual cue to feed
  // Activity branches on the LIVE vitality (the continuously-decaying
  // display value) so Bit can drift into 'sick' mid-day as the user
  // falls behind pace — not just at midnight rollover.
  const v = (liveVitality != null) ? liveVitality : p.vitality;
  if (v <= 0)             return 'dead';
  if (justFed)            return 'eat';
  if (v < 25)             return 'sick';
  const h = new Date().getHours();
  if (h < 6 || h >= 22)   return 'sleep';
  // ~20% of 4-hour windows roll into play; the rest is walk so Bit is
  // visibly moving most of the time the user looks at him.
  const seed = parseInt(today.replaceAll('-', ''), 10) + (p.ageDays * 7) + Math.floor(h / 4);
  if (seed % 5 === 0)     return 'play';
  return 'walk';
}

function petState(state) {
  if (!state.pet || !state.pet.stage) state.pet = _newPet();
  _migratePet(state.pet);
  const today = todayKey();
  const goal = (state.user && state.user.goal) || 60;
  const todayXP = state.todayXP || 0;

  _petTick(state.pet, today, state);
  const p = state.pet;

  // Note: the eatenTodayXP/lastEatenDate rollover used to live here but
  // moved into tickDay() so both day-counters reset atomically in one
  // place. petState now trusts that tickDay has run; every caller of
  // petState (render, syncSurgicalUpdates) ticks first.

  // justFed is purely a flag for the activity-selection function (so Bit
  // briefly shows 'eat' on goal-crossing). It NO LONGER auto-increments
  // vitality or form — those only change when the user explicitly drops
  // food via the "Drop food" button, which calls feedPetWithPile().
  const justFed = (todayXP >= goal) && p.lastFedDate !== today;

  // Food piles: every 5 XP earned today = 1 pile. Each drop consumes
  // one pile. Available = (today's earned − today's consumed) + carryover
  // from prior days. carryoverXP accumulates at midnight from any unspent
  // XP and is decremented first when the user drops food (see app.js).
  // Vitality caps at 100; form math runs per drop.
  const PILE_XP = 5;
  const todayUnspent = Math.max(0, todayXP - (p.eatenTodayXP || 0));
  const uneatenXP = todayUnspent + (p.carryoverXP || 0);
  const foodPilesAvailable = Math.floor(uneatenXP / PILE_XP);

  const liveVit = _liveVitality(p, todayXP, goal);
  return {
    name: p.name,
    stage: p.stage,
    body: _petBody(p),
    activity: _petActivity(p, today, justFed, liveVit),
    vitality: liveVit,                  // continuously-decaying display value
    vitalityStored: p.vitality,         // raw value persisted between days
    dead: liveVit === 0,                // derived predicate; feed to revive
    consecutiveSkipDays: p.consecutiveSkipDays || 0,   // 0 = fresh, 1 = used skip credit
    form: p.form,
    ageDays: p.ageDays,
    deathCount: p.deathCount || 0,
    fedToday: p.lastFedDate === today,
    bodyHue: p.bodyHue,
    justFed,
    goal,
    todayXP,
    xpToFeed: Math.max(0, goal - todayXP),
    xpProgress: Math.min(100, Math.round((todayXP / goal) * 100)),
    eatenTodayXP: p.eatenTodayXP || 0,
    carryoverXP: p.carryoverXP || 0,
    foodPilesAvailable,
    pileXP: PILE_XP,
  };
}

/* ---------- Struggle stats ----------
 * Aggregates signals that point to "where this user struggles":
 *   1. Wrong-answer queue counts per category (raw + per-lesson)
 *   2. Concept-review low-ease lessons (SM-2 ease < 2.0 = repeated failure)
 *   3. Repeat-wrong count per question (>1 attempt = sticky struggle)
 * Returns:
 *   { byCategory: [{ catId, wrongCount, lowEaseCount, severity }],
 *     byLesson:   [{ lessonId, cat, ease, reps, lessonName, severity }],
 *     totals:     { totalWrong, stickyWrong, lowEaseLessons } }
 *
 * Severity is wrongCount + 2*lowEaseCount + repeatBonus, designed so
 * "high volume" and "repeat failures" both count, with repeat weighted higher. */
function struggleStats(state, categories, modules) {
  const lessonNameById = {};
  const lessonCatById = {};
  for (const m of modules) {
    for (const l of m.lessons) {
      lessonNameById[l.id] = l.name;
      lessonCatById[l.id]  = m.cat;
    }
  }
  const wrongByCat = {};
  let totalWrong = 0;
  let stickyWrong = 0;          // a question missed > 1 time
  for (const q of Object.values(state.missedQuestions || {})) {
    const cat = q.cat || 'general';
    if (!wrongByCat[cat]) wrongByCat[cat] = { wrongCount: 0, stickyCount: 0 };
    wrongByCat[cat].wrongCount += 1;
    totalWrong += 1;
    if ((q.attempts || 1) > 1) {
      wrongByCat[cat].stickyCount += 1;
      stickyWrong += 1;
    }
  }
  const lowEaseLessons = [];
  for (const [lessonId, r] of Object.entries(state.conceptReviews || {})) {
    if (r.ease != null && r.ease < 2.0) {
      lowEaseLessons.push({
        lessonId,
        ease: r.ease,
        reps: r.reps || 0,
        lessonName: lessonNameById[lessonId] || lessonId,
        cat: lessonCatById[lessonId] || 'general',
      });
    }
  }
  const lowEaseByCat = {};
  for (const l of lowEaseLessons) {
    lowEaseByCat[l.cat] = (lowEaseByCat[l.cat] || 0) + 1;
  }
  // Build per-category aggregate
  const allCats = new Set([
    ...Object.keys(wrongByCat),
    ...Object.keys(lowEaseByCat),
  ]);
  const byCategory = [...allCats].map(catId => {
    const w = wrongByCat[catId] || { wrongCount: 0, stickyCount: 0 };
    const le = lowEaseByCat[catId] || 0;
    const severity = w.wrongCount + 2 * le + w.stickyCount;
    const catMeta = (categories || []).find(c => c.id === catId);
    return {
      catId,
      catName: catMeta ? catMeta.name : catId,
      catIcon: catMeta ? catMeta.icon : '•',
      wrongCount: w.wrongCount,
      stickyCount: w.stickyCount,
      lowEaseCount: le,
      severity,
    };
  }).sort((a, b) => b.severity - a.severity);

  // Per-lesson struggles: combine low-ease + per-lesson wrong count
  const wrongByLesson = {};
  for (const q of Object.values(state.missedQuestions || {})) {
    // Wrong-answer records have `source` like "concept-rag-3" or "mock-..."
    const m = q.source && q.source.match(/^concept-(.+)$/);
    if (m) {
      const lid = m[1];
      wrongByLesson[lid] = (wrongByLesson[lid] || 0) + 1;
    }
  }
  const lessonSeverity = {};
  for (const l of lowEaseLessons) {
    lessonSeverity[l.lessonId] = (lessonSeverity[l.lessonId] || { ...l, severity: 0 });
    lessonSeverity[l.lessonId].severity += (3.0 - l.ease) * 5; // bigger gap from neutral ease = worse
  }
  for (const [lid, n] of Object.entries(wrongByLesson)) {
    if (!lessonSeverity[lid]) {
      lessonSeverity[lid] = {
        lessonId: lid,
        cat: lessonCatById[lid] || 'general',
        ease: null, reps: 0,
        lessonName: lessonNameById[lid] || lid,
        severity: 0,
      };
    }
    lessonSeverity[lid].severity += n * 2;
  }
  const byLesson = Object.values(lessonSeverity)
    .filter(l => l.severity > 0)
    .sort((a, b) => b.severity - a.severity);

  return {
    byCategory,
    byLesson,
    totals: { totalWrong, stickyWrong, lowEaseLessons: lowEaseLessons.length },
  };
}

function bumpQuestProgress(state, kind, amount=1) {
  state.dailyQuests.quests.forEach(q => {
    if (q.kind === kind && !q.done) {
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress >= q.target) {
        q.done = true;
        const { state: s, xpGained } = awardXP(state, q.xp, 'quest');
        q._earned = xpGained;
      }
    }
  });
}

/* ---------- Badges ---------- */
function checkBadges(state, allBadges) {
  const earn = (id) => { if (!state.badges[id]) state.badges[id] = { earnedAt: Date.now() }; };
  if (state.onboarded) earn('first-day');
  if (state.streak.count >= 3)  earn('streak-3');
  if (state.streak.count >= 7)  earn('streak-7');
  if (state.streak.count >= 30) earn('streak-30');
  if (state.level >= 5)  earn('lvl-5');
  if (state.level >= 10) earn('lvl-10');
  const hour = new Date().getHours();
  if (hour < 7  && state.todayXP > 0) earn('early-bird');
  if (hour >= 0 && hour < 4 && state.todayXP > 0) earn('night-owl');
  // module-specific
  const ragDone = ['rag-1','rag-2','rag-3','rag-4','rag-5','rag-6'].every(id => state.completedLessons[id]);
  if (ragDone) earn('rag-master');
  const sqlDone = ['sq-1','sq-2','sq-3','sq-4','sq-5'].every(id => state.completedLessons[id]);
  if (sqlDone) earn('sql-snake');
  const decompFirst = ['d-3','d-4','d-5','d-6'].some(id => state.completedLessons[id]);
  if (decompFirst) earn('first-decomp');
  if (state.mocks.length >= 5) earn('mock-1');
  if (Object.keys(state.companySeen || {}).length >= 20) earn('company-deep');
  // comeback: if last streak gap was ≥3 and we just resumed
  // (simple proxy: if today is first day after a 3+ day gap)
  // skip computing for now — handled at tickDay
  return state;
}

/* ---------- Coverage / progress metrics ---------- */
function coverage(state, categories, modules) {
  // For each category: count lessons total vs done; weight-adjusted score
  const out = categories.map(cat => {
    const mods = modules.filter(m => m.cat === cat.id);
    const lessons = mods.flatMap(m => m.lessons);
    const done = lessons.filter(l => state.completedLessons[l.id]).length;
    const total = lessons.length;
    const pct = total ? done / total : 0;
    return { ...cat, total, done, pct, lessonCount: total };
  });
  // overall weighted
  const totalWeight = categories.reduce((s,c) => s + c.weight, 0);
  const weightedDone = out.reduce((s,c) => s + c.pct * c.weight, 0);
  const overall = totalWeight ? weightedDone / totalWeight : 0;
  return { categories: out, overall };
}

return {
  STORAGE_KEY, load, save, saveImmediate, reset,
  tickDay, awardXP, logLessonComplete, logJobApp, removeLastJobApp,
  applyRole, unapplyRole, isRoleApplied,
  dailyAppTarget, dailyAppTargets, appMorningBonusActive, appMorningMultiplier,
  APP_MORNING_CUTOFF_HOUR, APP_MORNING_BONUS_MULT,
  isPetDead, respawnPet,
  feedPetWithPile,
  reviewCard, dueCards,
  recordFlashcardFail, deriveFlashcardFailStats,
  recordWrongAnswer, reviewMissedQuestion, dueMissedQuestions, totalMissedCount,
  scheduleConceptReview, dueConceptReviews, totalConceptReviewsCount,
  logFreeRecall,
  ensureDailyQuests, bumpQuestProgress,
  struggleStats,
  petState,
  checkBadges,
  coverage,
  xpForLevel, levelFromXP, levelProgress,
  todayKey, daysBetween,
};
})();
