/* =========================================================================
 * gamification.js — XP, levels, streaks, badges, spaced repetition,
 * daily quests, variable rewards. Pure functions over a state object
 * that's persisted in localStorage by app.js.
 * ========================================================================= */

window.GAMI = (function () {

const STORAGE_KEY = 'fdeprep.v1';

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
  companySeen: {},               // companyId -> true
  visitedSources: false,
  rewardsRoll: 0,                // variable-reward seed bump
  /* Job-application log — each entry awards XP via awardXP at log time.
     Calibrated so 10 apps = half the daily XP goal (per-app = goal/20). */
  jobApps: [],                   // [{ date, ts, company, role, url, xp }]
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
function tickDay(state) {
  const today = todayKey();
  if (state.todayDate !== today) {
    state.todayDate = today;
    state.todayXP = 0;
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

  // History
  const today = todayKey();
  const hentry = state.history.find(h => h.date === today);
  if (hentry) { hentry.xp += finalXP; }
  else { state.history.push({ date: today, xp: finalXP, lessons: 0 }); }
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

  return { state, xpGained: finalXP, bonusLabel, levelUp: undefined, crossedFeedGoal };
}

/* Manual feed — called when the user clicks "Drop food" and a pile spawns
 * in the scene. Each pile is worth +8 vitality (capped at 100) and shifts
 * body form by +1 if the user is on the workout path (todayXP > goal*1.5)
 * else -1 (sedentary → chubby). This replaces the previous automatic
 * vitality bump that fired the moment todayXP crossed the goal. */
function feedPetWithPile(state) {
  if (!state || !state.pet) return false;
  const p = state.pet;
  p.vitality = Math.min(100, (p.vitality || 0) + 8);
  const today = todayKey();
  p.lastFedDate = today;
  const goal = (state.user && state.user.goal) || 60;
  const todayXP = state.todayXP || 0;
  if (todayXP >= goal * 1.5) {
    p.form = Math.min(50, (p.form || 0) + 1);
  } else {
    p.form = Math.max(-50, (p.form || 0) - 1);
  }
  return true;
}

function logLessonComplete(state, lessonId, baseXP) {
  if (state.completedLessons[lessonId]) {
    return { state, xpGained: 0, alreadyDone: true };
  }
  const prevLevel = state.level;
  const { state: s, xpGained, bonusLabel } = awardXP(state, baseXP, 'lesson');
  s.completedLessons[lessonId] = { ts: Date.now(), xp: xpGained };
  const today = todayKey();
  const hentry = s.history.find(h => h.date === today);
  if (hentry) hentry.lessons = (hentry.lessons || 0) + 1;
  const levelUp = s.level > prevLevel ? s.level : null;
  return { state: s, xpGained, bonusLabel, levelUp };
}

/* ---------- Spaced repetition (SM-2 simplified) ---------- */
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

  // XP based on quality
  const xpMap = { 1: 5, 2: 10, 3: 15, 4: 20 };
  return awardXP(state, xpMap[quality] || 10, 'flashcard');
}

/* Job-application log. Each entry awards XP via the normal awardXP path
 * so it counts toward today's total + vitality + streak. Per-app XP is
 * calibrated to `goal / 20` (so 10 apps == half the daily goal) with a
 * floor of 1 XP. No metadata captured — it's a pure counter.
 *
 * The actual `xpGained` (including any random-multiplier bonus from
 * awardXP) is what we store on the entry, so unlogging via
 * `removeLastJobApp` can subtract exactly that amount back out. */
function logJobApp(state) {
  tickDay(state);
  if (!Array.isArray(state.jobApps)) state.jobApps = [];
  const goal = (state.user && state.user.goal) || 60;
  const perAppXP = Math.max(1, Math.round(goal / 20));
  const award = awardXP(state, perAppXP, 'app');
  const entry = { date: todayKey(), ts: Date.now(), xp: award.xpGained };
  state.jobApps.push(entry);
  // Cap retained history (~1y of heavy use) to keep state size bounded.
  if (state.jobApps.length > 1000) state.jobApps.splice(0, state.jobApps.length - 1000);
  return { entry, ...award };
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
  const hentry  = (state.history || []).find(h => h.date === today);
  if (hentry) hentry.xp = Math.max(0, (hentry.xp || 0) - xp);
  return { removed, xpRemoved: xp };
}

function dueCards(state, allCards, limit=20) {
  const now = Date.now();
  return allCards
    .map(c => ({ card: c, meta: state.flashcards[c.id] }))
    .filter(({ meta }) => !meta || meta.due <= now)
    .slice(0, limit);
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
    vitality: 80,
    form: 0,
    lastFedDate: null,
    lastTickDate: todayKey(),
    deathCount: 0,
    name,
    eatenTodayXP: 0,        // XP-worth that Bit has visually eaten today
    lastEatenDate: null,    // resets eatenTodayXP each day
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
  if (p.bodyHue == null)      p.bodyHue = _randomHue();
  return p;
}

function _petTick(p, today, state) {
  if (p.lastTickDate === today) return p;
  let daysElapsed = daysBetween(p.lastTickDate || today, today);
  if (daysElapsed <= 0) { p.lastTickDate = today; return p; }
  daysElapsed = Math.min(daysElapsed, 30);

  // ── DAILY-GOAL RULE ─────────────────────────────────────────────────
  // For every *complete* calendar day from p.lastTickDate (inclusive) up
  // to (but not including) today, look at how much XP the user earned:
  //
  //   • 0 XP (full skip)           → counts toward p.consecutiveSkipDays.
  //                                  ONE skip is OK; a SECOND consecutive
  //                                  skip (counter reaches 2) → death.
  //   • 0 < XP < goal (shortfall)  → vitality -= 30 × (1 - XP/goal),
  //                                  i.e. heavier penalty the further
  //                                  short of the goal you were. Also
  //                                  resets the consecutive-skip counter
  //                                  (any nonzero XP day breaks a run).
  //   • XP >= goal (kept up)       → no penalty + reset skip counter.
  //                                  Manual food drops are still the
  //                                  only way to actively top up
  //                                  vitality at that point.
  //
  // The consecutive-skip counter is persisted on the pet so the rule
  // works correctly across _petTick invocations (e.g. user opens day
  // N+1 having skipped day N, gets the "1 skip used" state — then opens
  // day N+3 having ALSO skipped N+2: the counter reaches 2, death).
  //
  // Grace period: a brand-new pet (ageDays === 0) is exempt on its very
  // first day after creation, otherwise creating Bit at 11 PM and not
  // earning the goal in the remaining hour would kill him by morning.
  const goal = (state && state.user && state.user.goal) || 60;
  const history = (state && state.history) || [];
  const xpByDate = Object.create(null);
  for (const h of history) xpByDate[h.date] = h.xp || 0;
  if (p.consecutiveSkipDays == null) p.consecutiveSkipDays = 0;
  const checkStarvation = p.lastTickDate && (p.ageDays > 0 || daysElapsed > 1);
  if (checkStarvation) {
    const dayMs = 24 * 3600 * 1000;
    const lastT  = new Date(p.lastTickDate + 'T00:00:00').getTime();
    const todayT = new Date(today          + 'T00:00:00').getTime();
    for (let t = lastT; t < todayT; t += dayMs) {
      const dKey = new Date(t).toISOString().slice(0, 10);
      const dayXP = xpByDate[dKey] || 0;
      // Vitality penalty is uniform across all sub-goal days (scaled by
      // the shortfall); skip-credit logic is independent and only gates
      // DEATH on the second consecutive 0-XP day.
      if (dayXP < goal) {
        const shortfall = (goal - dayXP) / goal;          // 0..1
        const penalty = Math.round(30 * shortfall);       // 0..30
        p.vitality = Math.max(0, p.vitality - penalty);
      }
      if (dayXP === 0) {
        p.consecutiveSkipDays += 1;
        if (p.consecutiveSkipDays >= 2) {
          // Second consecutive 0-XP day → death (regardless of how
          // much vitality remained after the proportional penalty).
          p.vitality = 0;
          break;
        }
      } else {
        // Any nonzero XP day resets the consecutive-skip counter.
        p.consecutiveSkipDays = 0;
      }
      if (p.vitality === 0) break;
    }
  } else if (!checkStarvation) {
    // Fallback for the grace-period case (brand-new pet, first day):
    // apply the original gentle -30/day so vitality still moves.
    for (let i = 0; i < daysElapsed; i++) {
      p.vitality = Math.max(0, p.vitality - 30);
      if (p.vitality === 0) break;
    }
  }
  // Form & age advance every day regardless
  for (let i = 0; i < daysElapsed; i++) {
    if (p.form > 0)      p.form = Math.max(0, p.form - 1);
    else if (p.form < 0) p.form = Math.min(0, p.form + 1);
    p.ageDays += 1;
    if (p.vitality === 0) break;
  }
  p.lastTickDate = today;
  if (p.vitality === 0) {
    const oldName = p.name;
    const deaths = (p.deathCount || 0) + 1;
    Object.assign(p, _newPet(oldName));
    p.deathCount = deaths;
  }
  if (p.stage === 'baby' && p.ageDays >= 3) p.stage = 'teen';
  if (p.stage === 'teen' && p.ageDays >= 8) p.stage = 'adult';
  return p;
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
function _liveVitality(p, todayXP, goal) {
  if (!p || p.vitality == null) return 0;
  const now = new Date();
  const hourFraction = (now.getHours() * 3600
                     + now.getMinutes() * 60
                     + now.getSeconds()) / 86400;
  const xp = todayXP || 0;
  // Regime 2: pre-locked death trajectory (second consecutive skip).
  if (xp === 0 && (p.consecutiveSkipDays || 0) >= 1) {
    return Math.max(0, Math.round(p.vitality * (1 - hourFraction)));
  }
  // Regime 1: standard partial-credit decay (also covers fresh first-skip
  // days — vitality still drops, only DEATH is gated by the skip credit).
  const xpRatio = Math.min(1, xp / (goal || 60));
  const pendingPenalty = (1 - xpRatio) * 30 * hourFraction;
  return Math.max(0, Math.round(p.vitality - pendingPenalty));
}

function _petActivity(p, today, justFed, liveVitality) {
  // Simplified to five polished states:
  //   walk  → default during waking hours (dominant)
  //   play  → occasional burst of hopping
  //   sleep → late night / early morning
  //   eat   → transient, when goal hit + not yet fed today
  //   sick  → low vitality, visual cue to feed
  // Activity branches on the LIVE vitality (the continuously-decaying
  // display value) so Bit can drift into 'sick' mid-day as the user
  // falls behind pace — not just at midnight rollover.
  const v = (liveVitality != null) ? liveVitality : p.vitality;
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

  // Reset the "eaten today" counter when the calendar day rolls over.
  // This is independent of _petTick so it fires even on the same day if
  // state was loaded from an earlier session.
  if (p.lastEatenDate !== today) {
    p.eatenTodayXP = 0;
    p.lastEatenDate = today;
  }

  // justFed is purely a flag for the activity-selection function (so Bit
  // briefly shows 'eat' on goal-crossing). It NO LONGER auto-increments
  // vitality or form — those only change when the user explicitly drops
  // food via the "Drop food" button, which calls feedPetWithPile().
  const justFed = (todayXP >= goal) && p.lastFedDate !== today;

  // Food piles: every 10 XP earned (not yet spent on a drop) is one
  // droppable pile. No cap — crossing the daily goal doesn't stop the
  // user from earning more food. The user is in charge of when to drop;
  // unspent XP just accumulates.
  const PILE_XP = 10;
  const uneatenXP = Math.max(0, todayXP - (p.eatenTodayXP || 0));
  const foodPilesAvailable = Math.floor(uneatenXP / PILE_XP);

  const liveVit = _liveVitality(p, todayXP, goal);
  return {
    name: p.name,
    stage: p.stage,
    body: _petBody(p),
    activity: _petActivity(p, today, justFed, liveVit),
    vitality: liveVit,                  // continuously-decaying display value
    vitalityStored: p.vitality,         // raw value persisted between days
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
  tickDay, awardXP, logLessonComplete, logJobApp, removeLastJobApp, feedPetWithPile,
  reviewCard, dueCards,
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
