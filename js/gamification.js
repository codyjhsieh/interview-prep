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

  return { state, xpGained: finalXP, bonusLabel, levelUp: undefined };
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
  tickDay, awardXP, logLessonComplete,
  reviewCard, dueCards,
  recordWrongAnswer, reviewMissedQuestion, dueMissedQuestions, totalMissedCount,
  scheduleConceptReview, dueConceptReviews, totalConceptReviewsCount,
  logFreeRecall,
  ensureDailyQuests, bumpQuestProgress,
  struggleStats,
  checkBadges,
  coverage,
  xpForLevel, levelFromXP, levelProgress,
  todayKey, daysBetween,
};
})();
