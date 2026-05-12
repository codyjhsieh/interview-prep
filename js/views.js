/* =========================================================================
 * views.js — Renders each route into #view.
 * Pure render functions; mutations go through app.js handlers.
 * ========================================================================= */

window.VIEWS = (function () {

const { CATEGORIES, MODULES, COMPANIES, INFOGRAPHICS, DAILY_QUESTS, BADGES, FLASHCARDS, SOURCES, IMAGE_REFS, COMPANY_DOMAINS, GAMES } = window.DATA;

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const verticalPill = {
  ai: 'pill-ai', hospitality: 'pill-hosp', marketplace: 'pill-mkt',
  devtools: 'pill-dev', fintech: 'pill-both'
};
const verticalLabel = { ai:'AI', hospitality:'Hospitality', marketplace:'Marketplace', devtools:'Dev Tools', fintech:'Fintech' };

/* ====================== DASHBOARD ====================== */
function renderDashboard(state, hub) {
  const cov = GAMI.coverage(state, CATEGORIES, MODULES);
  const lvlInfo = GAMI.levelProgress(state.xp);
  const name = state.user.name || 'friend';

  // Compute next recommended lesson: highest ROI × weight × (1 - completion).
  // ROI prioritizes high-impact technical first (Tier 1 categories at the top).
  const sortedCats = [...cov.categories].sort((a,b) => {
    const aScore = (a.roi || 3) * a.weight * (1 - a.pct);
    const bScore = (b.roi || 3) * b.weight * (1 - b.pct);
    return bScore - aScore;
  });
  let next = null;
  for (const c of sortedCats) {
    const mods = MODULES.filter(m => m.cat === c.id);
    for (const m of mods) {
      for (const l of m.lessons) {
        if (!state.completedLessons[l.id]) { next = { cat: c, mod: m, lesson: l }; break; }
      }
      if (next) break;
    }
    if (next) break;
  }

  const quests = state.dailyQuests.quests || [];
  const dailyGoalPct = Math.min(100, Math.round((state.todayXP / Math.max(1, state.user.goal*2)) * 100));

  const container = el('div','space-y-5 fade-in');

  // Pick today's game deterministically (interleaved across days)
  const dayN = parseInt(GAMI.todayKey().replaceAll('-',''), 10);
  const todaysGame = DATA.GAMES[dayN % DATA.GAMES.length];

  // Reviews due today — wrong-answer queue + concept-review queue
  const missedDue = GAMI.dueMissedQuestions(state, 50).length;
  const conceptReviewsDue = GAMI.dueConceptReviews(state, MODULES, 50).length;
  const missedTotal = GAMI.totalMissedCount(state);
  const conceptReviewsTotal = GAMI.totalConceptReviewsCount(state);

  // Largest ROI-weighted gap (highest ROI × weight × incompletion)
  const sortedGaps = [...cov.categories].sort((a,b) => {
    const aScore = (a.roi || 3) * a.weight * (1 - a.pct);
    const bScore = (b.roi || 3) * b.weight * (1 - b.pct);
    return bScore - aScore;
  });
  const topGap = sortedGaps[0];

  // When-then cue surfacing — first-visit-of-day prompt to anchor the habit
  const today = GAMI.todayKey();
  const cueAlreadyShown = state.cueShownDates && state.cueShownDates[today];
  const showCueNudge = state.user.when_cue && !cueAlreadyShown;
  if (showCueNudge) {
    // Mark shown so subsequent reloads today don't re-trigger
    state.cueShownDates = state.cueShownDates || {};
    state.cueShownDates[today] = true;
    GAMI.saveImmediate(state);
  }

  // Hero — single primary CTA
  const hero = el('div','card card-glow');
  hero.innerHTML = `
    ${showCueNudge ? `
      <div class="rounded-md p-3 mb-4 flex items-start gap-2" style="background:rgba(46,111,224,0.06); border:1px solid rgba(46,111,224,0.25)">
        <span style="color:var(--sde); font-size:14px">⏰</span>
        <div class="flex-1">
          <div class="text-[11px] uppercase tracking-wider" style="color:var(--sde); font-weight:600; letter-spacing:0.08em">Your when-then cue</div>
          <div class="text-[13.5px] mt-0.5">${esc(state.user.when_cue)}</div>
          <div class="text-[12px] muted mt-1">Tying study to this anchor doubles habit stickiness (Gollwitzer). First visit today — let's go.</div>
        </div>
      </div>
    ` : ''}
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex-1 min-w-0">
        <div class="text-xs muted uppercase tracking-wider">${state.streak.count ? 'Welcome back' : 'Welcome'}</div>
        <h1 class="font-display text-2xl sm:text-3xl font-semibold mt-1 leading-tight">${esc(name)}<span class="muted font-normal"> — let's continue.</span></h1>
        <div class="text-xs muted mt-2 mobile-hide">Cue: <span class="text-[color:var(--text)]">${esc(state.user.when_cue || 'set in profile')}</span></div>
        <div class="flex gap-2 mt-4 flex-wrap">
          ${next ? `<a class="btn btn-primary max-w-full" href="#category/${next.cat.id}/${next.mod.id}" id="primary-cta" style="overflow:hidden"><span class="truncate inline-block max-w-[260px] sm:max-w-[400px] align-middle">Continue · ${esc(next.lesson.name)}</span><span class="ml-1">→</span><span class="ml-2 dim text-[10px] hidden sm:inline">J</span></a>` : `<a class="btn btn-primary" href="#flashcards">Review flashcards →</a>`}
          <a class="btn max-w-full" href="#games/${todaysGame.id}" id="todays-game" style="overflow:hidden"><span class="truncate inline-block max-w-[200px] sm:max-w-[400px] align-middle">Today's game: ${esc(todaysGame.name)}</span><span class="ml-2 dim text-[10px] hidden sm:inline">G</span></a>
          ${topGap && topGap.weight >= 8 && topGap.pct < 0.5 ? `<a class="btn max-w-full mobile-hide" href="#category/${topGap.id}" style="color:var(--warn);border-color:rgba(255,195,107,0.4);overflow:hidden"><span class="truncate inline-block max-w-[200px] sm:max-w-[400px] align-middle">⚠ Close gap · ${esc(topGap.name)}</span></a>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0">
        <div class="ring" style="--pct: ${Math.round(cov.overall*100)};">
          <div class="ring-inner">
            <div class="text-2xl font-bold numeric">${Math.round(cov.overall*100)}%</div>
            <div class="text-[10px] uppercase tracking-wider muted">curriculum</div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(hero);

  // Stats row
  const stats = el('div','grid grid-cols-2 sm:grid-cols-4 gap-4');
  stats.innerHTML = `
    <div class="card !p-4">
      <div class="text-xs text-slate-400 uppercase tracking-wide">Streak</div>
      <div class="text-3xl font-bold mt-1 flex items-center gap-1">🔥 <span class="float">${state.streak.count}</span></div>
      <div class="text-xs text-slate-500 mt-1 mobile-hide">${state.streak.freezeAvailable} freeze${state.streak.freezeAvailable===1?'':'s'} available</div>
    </div>
    <div class="card !p-4">
      <div class="text-xs text-slate-400 uppercase tracking-wide">Level</div>
      <div class="text-3xl font-bold mt-1 text-accent-400">${state.level}</div>
      <div class="bar mt-2 mobile-hide"><i style="width:${Math.round(lvlInfo.inLevel/lvlInfo.levelSpan*100)}%"></i></div>
      <div class="text-xs text-slate-500 mt-1 font-mono mobile-hide">${lvlInfo.inLevel} / ${lvlInfo.levelSpan} XP</div>
    </div>
    <div class="card !p-4">
      <div class="text-xs muted uppercase tracking-wider">Today</div>
      <div class="text-3xl font-bold mt-1 numeric">${state.todayXP} <span class="text-sm muted font-normal">xp</span></div>
      <div class="bar mt-2 mobile-hide"><i style="width:${dailyGoalPct}%"></i></div>
      <div class="text-xs muted mt-1 mobile-hide">Goal: ${Math.round(state.user.goal/60*10)/10}h/day · <button class="underline hover:text-white" data-focus="50">+ Start 50-min focus</button></div>
    </div>
    <div class="card !p-4">
      <div class="text-xs muted uppercase tracking-wider">Lessons</div>
      <div class="text-3xl font-bold mt-1 numeric">${Object.keys(state.completedLessons).length}</div>
      <div class="text-xs muted mt-1 mobile-hide">of ${totalLessonCount()} · ${formatTime(totalRemainingTime(state))} left of ${formatTime(totalCurriculumTime())}</div>
    </div>
  `;
  container.appendChild(stats);

  // SRS review tiles — surface only when there's something due / queued
  if (missedTotal > 0 || conceptReviewsTotal > 0) {
    const reviews = el('div','grid grid-cols-1 sm:grid-cols-2 gap-4');
    reviews.innerHTML = `
      <a class="card card-glow block" href="#review/missed">
        <div class="flex items-start justify-between">
          <div>
            <div class="eyebrow" style="color:var(--bad)">Wrong-answer queue</div>
            <div class="text-2xl font-display font-semibold mt-1 numeric">${missedDue}<span class="text-sm muted ml-1">due today</span></div>
            <div class="text-xs muted mt-1 mobile-hide">${missedTotal} total · SM-2 scheduled · retrieval practice</div>
          </div>
          <div class="text-2xl" style="color:var(--bad)">📍</div>
        </div>
        ${missedDue > 0 ? '<div class="text-xs mt-3" style="color:var(--bad)">→ Start review</div>' : '<div class="text-xs mt-3 muted">All caught up — next batch tomorrow</div>'}
      </a>
      <a class="card card-glow block" href="#review/concepts">
        <div class="flex items-start justify-between">
          <div>
            <div class="eyebrow" style="color:var(--sde)">Concept review queue</div>
            <div class="text-2xl font-display font-semibold mt-1 numeric">${conceptReviewsDue}<span class="text-sm muted ml-1">due today</span></div>
            <div class="text-xs muted mt-1 mobile-hide">${conceptReviewsTotal} scheduled · driven by your self-ratings</div>
          </div>
          <div class="text-2xl" style="color:var(--sde)">🔁</div>
        </div>
        ${conceptReviewsDue > 0 ? '<div class="text-xs mt-3" style="color:var(--sde)">→ Start review</div>' : '<div class="text-xs mt-3 muted">Nothing due · next concept review when scheduled</div>'}
      </a>
    `;
    container.appendChild(reviews);
  }

  // Daily quests + Next up
  const row = el('div','grid lg:grid-cols-3 gap-4');

  // Map each quest kind → destination route. Clicking the tile deeplinks to
  // the place where the user can actually advance that quest end-to-end.
  const questRoute = (q) => {
    switch (q.kind) {
      case 'flashcard': return '#flashcards';
      case 'lesson':    return next ? `#category/${next.cat.id}/${next.mod.id}` : '#curriculum';
      case 'drill':     return '#category/decomp';
      case 'decomp':    return '#category/decomp';
      case 'story':     return '#prep/stories';
      case 'coding':    return '#category/coding';
      default:          return '#curriculum';
    }
  };
  const questsCard = el('div','card lg:col-span-2');
  questsCard.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-semibold text-lg">Today's quests</h3>
      <span class="text-xs text-slate-400 mobile-hide">Resets at midnight · variable XP bonuses</span>
    </div>
    <div class="space-y-2">
      ${quests.map(q => {
        const pct = Math.round(q.progress/q.target*100);
        const inner = `
          <div class="text-xl">${q.done?'✅':'🎯'}</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm flex items-center justify-between gap-2">
              <span class="truncate">${esc(q.name)}</span>
              <span class="text-[10px] font-mono dim shrink-0">${q.progress}/${q.target}</span>
            </div>
            <div class="bar mt-1"><i style="width:${pct}%"></i></div>
          </div>
          <div class="text-sm font-mono text-accent-400 shrink-0">+${q.xp}</div>
        `;
        if (q.done) {
          return `<div class="flex items-center gap-3 p-3 rounded-lg bg-accent-500/10 border border-accent-500/30 opacity-80">${inner}</div>`;
        }
        return `<a href="${questRoute(q)}" class="flex items-center gap-3 p-3 rounded-lg bg-ink-800/60 border border-ink-600/50 hover:border-accent-500/50 transition" title="Go to where you can advance this quest">${inner}</a>`;
      }).join('')}
    </div>
  `;
  row.appendChild(questsCard);

  const nextCard = el('div','card');
  if (next) {
    nextCard.innerHTML = `
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Next up</div>
      <div class="text-sm text-slate-500 mb-2">${next.cat.icon} ${esc(next.cat.name)}</div>
      <div class="font-semibold mb-2">${esc(next.lesson.name)}</div>
      <div class="text-xs text-slate-400 mb-3">${esc(next.mod.intro || '').slice(0, 110)}…</div>
      <button class="btn btn-primary w-full" data-action="goto" data-route="#category/${next.cat.id}/${next.mod.id}">Start →</button>
    `;
  } else {
    nextCard.innerHTML = `<div class="text-center py-8">
      <div class="text-3xl mb-2">🏁</div>
      <div class="font-semibold">All lessons done.</div>
      <div class="text-sm text-slate-400 mt-1">Run a mock interview or review flashcards.</div>
    </div>`;
  }
  row.appendChild(nextCard);
  container.appendChild(row);

  // Heatmap
  const heat = el('div','card');
  heat.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-semibold text-lg">Last 90 days</h3>
      <span class="text-xs text-slate-400 mobile-hide">XP per day</span>
    </div>
    <div id="heatmap" class="grid grid-flow-col auto-cols-min gap-[3px]"></div>
  `;
  container.appendChild(heat);

  // Category progress
  const catProg = el('div','card');
  catProg.innerHTML = `
    <h3 class="font-display font-semibold text-lg mb-3">Curriculum coverage by category</h3>
    <div class="space-y-3">
      ${cov.categories.map(c => `
        <div>
          <div class="flex items-center justify-between text-sm mb-1">
            <a href="#category/${c.id}" class="hover:text-accent-400 transition">${c.icon} ${esc(c.name)} <span class="text-xs text-slate-500 mobile-hide">· weight ${c.weight}%</span></a>
            <span class="text-xs font-mono">${c.done}/${c.total}</span>
          </div>
          <div class="bar"><i style="width:${Math.round(c.pct*100)}%"></i></div>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(catProg);

  // Learning-science card — labels reflect what's ACTUALLY active in the platform.
  // Heavy on text → hide on phones, show desktop+
  const sci = el('div','card mobile-hide');
  sci.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-semibold text-lg">The science behind your prep</h3>
      <span class="text-[10px] muted uppercase tracking-wider">live · what's actually firing</span>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[13px]">
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--accent)">Spaced retrieval <span class="text-[9px] px-1 rounded" style="background:rgba(14,163,113,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">SM-2 on flashcards (${state.flashcards ? Object.keys(state.flashcards).length : 0} scheduled), wrong-answer MCQs (${missedTotal} in queue), and concept self-ratings (${conceptReviewsTotal} scheduled).</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--accent)">Retrieval before reading <span class="text-[9px] px-1 rounded" style="background:rgba(14,163,113,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">Every concept opens with the activity; body sits below. Engagement-gate blocks Mark complete until you interact <span class="dim">(Roediger &amp; Karpicke)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--accent)">Generation effect <span class="text-[9px] px-1 rounded" style="background:rgba(14,163,113,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">Free-recall prompt on every concept (type-your-answer before the structured activity). Producing &gt; recognizing <span class="dim">(Slamecka &amp; Graf)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--sde)">Implementation intentions <span class="text-[9px] px-1 rounded" style="background:rgba(46,111,224,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">Your cue (${esc(state.user.when_cue || 'set in profile')}) is surfaced once per day at first visit <span class="dim">(Gollwitzer ~2× stickiness)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--warn)">Interleaving <span class="text-[9px] px-1 rounded" style="background:rgba(199,120,14,0.15)">PARTIAL</span></div>
        <div class="muted mt-1 leading-snug">Lightning Quiz mixes categories. Curriculum / Mark-&amp;-next default to blocked practice <span class="dim">(Rohrer &amp; Taylor)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--accent)">Metacognition (self-rate) <span class="text-[9px] px-1 rounded" style="background:rgba(14,163,113,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">1-4 self-rating after each concept activity now drives SM-2 scheduling. Lower rating = sooner review.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--accent)">Variable reward <span class="text-[9px] px-1 rounded" style="background:rgba(14,163,113,0.15)">ACTIVE</span></div>
        <div class="muted mt-1 leading-snug">Random 1.5× / 2× XP rolls on awards. Reinforcement-schedule basics <span class="dim">(Skinner)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--bad)">Desirable difficulty <span class="text-[9px] px-1 rounded" style="background:rgba(215,56,76,0.15)">PARTIAL</span></div>
        <div class="muted mt-1 leading-snug">Engagement gate forces interaction but not correctness. MCQ length-bias audit ongoing <span class="dim">(Bjork)</span>.</div>
      </div>
      <div class="p-3 rounded-md border border-[color:var(--hairline)]">
        <div class="font-medium flex items-center gap-1" style="color:var(--dim)">Mastery learning <span class="text-[9px] px-1 rounded" style="background:rgba(15,23,42,0.08);color:var(--muted)">DESIGN CHOICE: OFF</span></div>
        <div class="muted mt-1 leading-snug">Wrong answers credit completion identically to right ones. Wrong answers DO enqueue for SRS — the platform corrects via repetition, not gating.</div>
      </div>
    </div>
  `;
  container.appendChild(sci);

  hub.appendChild(container);

  // Build heatmap after mount
  buildHeatmap(state);
}

function totalLessonCount() {
  return MODULES.flatMap(m => m.lessons).length;
}

/* Time helpers — sum lesson minutes for various scopes */
function categoryTime(catId) {
  return MODULES
    .filter(m => m.cat === catId)
    .flatMap(m => m.lessons)
    .reduce((s, l) => s + (l.time || 0), 0);
}
function categoryRemainingTime(catId, state) {
  return MODULES
    .filter(m => m.cat === catId)
    .flatMap(m => m.lessons)
    .filter(l => !state.completedLessons[l.id])
    .reduce((s, l) => s + (l.time || 0), 0);
}
function totalCurriculumTime() {
  return MODULES.flatMap(m => m.lessons).reduce((s, l) => s + (l.time || 0), 0);
}
function totalRemainingTime(state) {
  return MODULES.flatMap(m => m.lessons)
    .filter(l => !state.completedLessons[l.id])
    .reduce((s, l) => s + (l.time || 0), 0);
}
function formatTime(min) {
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function buildHeatmap(state) {
  const wrap = document.getElementById('heatmap');
  if (!wrap) return;
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = GAMI.todayKey(d);
    const h = state.history.find(x => x.date === key);
    const xp = h ? h.xp : 0;
    days.push({ key, xp });
  }
  // Group by week (7-day columns)
  for (let col = 0; col < 13; col++) {
    const colEl = document.createElement('div');
    colEl.className = 'grid grid-rows-7 gap-[3px]';
    for (let row = 0; row < 7; row++) {
      const idx = col*7 + row;
      const d = days[idx];
      if (!d) {
        colEl.appendChild(document.createElement('div'));
        continue;
      }
      const cell = document.createElement('div');
      cell.className = 'heat-cell';
      if (d.xp >= 200) cell.classList.add('heat-4');
      else if (d.xp >= 100) cell.classList.add('heat-3');
      else if (d.xp >= 40) cell.classList.add('heat-2');
      else if (d.xp > 0)   cell.classList.add('heat-1');
      cell.title = `${d.key}: ${d.xp} XP`;
      colEl.appendChild(cell);
    }
    wrap.appendChild(colEl);
  }
}

/* ====================== CURRICULUM (CATEGORIES INDEX) ====================== */
function renderCurriculum(state, hub) {
  const cov = GAMI.coverage(state, CATEGORIES, MODULES);
  const container = el('div','fade-in space-y-6');

  const tierLabels = {
    1: { name: 'Technical core',           sub: 'Highest pass-rate impact. Start here.' },
    2: { name: 'Technical supporting',     sub: 'Fills production gaps after tier 1.'    },
    3: { name: 'Interpersonal & context',  sub: 'Binary by company; high ROI when in your loop.' },
    4: { name: 'Cumulative habit',         sub: 'Low per-hour but compounds over weeks.' },
  };

  const grandMin = totalCurriculumTime();
  const remainingMin = totalRemainingTime(state);
  const dailyGoalMin = state.user.goal || 60;
  const daysToFinish = Math.ceil(remainingMin / dailyGoalMin);

  container.innerHTML = `
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold">Curriculum</h1>
        <p class="muted mt-1 text-sm">Sorted by ROI — technical first.</p>
      </div>
      <div class="tabs">
        <div class="tab active" data-filter="all">All</div>
        <div class="tab" data-filter="fde">FDE</div>
        <div class="tab" data-filter="sde">SDE</div>
        <div class="tab" data-filter="both">Both</div>
      </div>
    </div>

    <div class="card elevated">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div class="eyebrow">Total</div>
          <div class="text-2xl font-display font-semibold mt-1 numeric">${formatTime(grandMin)}</div>
          <div class="text-xs muted mobile-hide">${CATEGORIES.length} cats · ${MODULES.length} mods · ${totalLessonCount()} lessons</div>
        </div>
        <div>
          <div class="eyebrow">Remaining</div>
          <div class="text-2xl font-display font-semibold mt-1 numeric" style="color:var(--accent)">${formatTime(remainingMin)}</div>
          <div class="text-xs muted mobile-hide">${remainingMin === 0 ? 'all complete' : Math.round((1 - remainingMin/grandMin)*100) + '% complete'}</div>
        </div>
        <div class="mobile-hide">
          <div class="eyebrow">At your ${dailyGoalMin}-min goal</div>
          <div class="text-2xl font-display font-semibold mt-1 numeric">${daysToFinish}d</div>
          <div class="text-xs muted">~${(daysToFinish/7).toFixed(1)} weeks to finish</div>
        </div>
        <div class="mobile-hide">
          <div class="eyebrow">Reality check</div>
          <div class="text-xs muted leading-snug mt-1">Doubling for reviews + mocks + drills, plan ~${(grandMin/60*2).toFixed(0)}h actual prep over 6–10 weeks.</div>
        </div>
      </div>
    </div>

    <div id="tier-stack" class="space-y-8"></div>
  `;
  hub.appendChild(container);

  const stack = container.querySelector('#tier-stack');

  function renderStars(n) {
    return '★★★★★'.slice(0, n) + '<span class="dim">' + '★★★★★'.slice(n) + '</span>';
  }

  function paint(filter) {
    stack.innerHTML = '';
    // Group categories by tier (already sorted in array order)
    const byTier = {};
    cov.categories.forEach(c => {
      if (filter !== 'all' && c.track !== filter && c.track !== 'both') return;
      const t = c.tier || 4;
      if (!byTier[t]) byTier[t] = [];
      byTier[t].push(c);
    });
    const tierKeys = Object.keys(byTier).sort();

    for (const t of tierKeys) {
      const meta = tierLabels[t] || { name: 'Other', sub: '' };
      const tierTotal = byTier[t].reduce((s,c) => s + categoryTime(c.id), 0);
      const tierRemaining = byTier[t].reduce((s,c) => s + categoryRemainingTime(c.id, state), 0);
      const section = document.createElement('div');
      section.className = 'space-y-3';
      section.innerHTML = `
        <div class="flex items-end justify-between border-b border-[color:var(--hairline)] pb-2">
          <div>
            <div class="eyebrow">Tier ${t}</div>
            <div class="font-display text-xl font-semibold mt-1">${esc(meta.name)}</div>
            <div class="text-xs muted mt-0.5">${esc(meta.sub)}</div>
          </div>
          <div class="text-right">
            <div class="text-xs muted">${byTier[t].length} categor${byTier[t].length === 1 ? 'y' : 'ies'} · ${formatTime(tierTotal)} total</div>
            <div class="text-xs mt-0.5" style="color:var(--accent)">${tierRemaining > 0 ? formatTime(tierRemaining) + ' remaining' : '✓ complete'}</div>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-tier="${t}"></div>
      `;
      stack.appendChild(section);
      const grid = section.querySelector('[data-tier]');
      byTier[t].forEach(c => {
        const catTotal = categoryTime(c.id);
        const catRemaining = categoryRemainingTime(c.id, state);
        const card = el('a','card card-glow block');
        card.href = `#category/${c.id}`;
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="text-2xl">${c.icon}</div>
            <span class="pill pill-${c.track === 'both' ? 'both' : c.track}">${c.track.toUpperCase()}</span>
          </div>
          <div class="font-display font-semibold text-lg mt-3">${esc(c.name)}</div>
          <div class="flex items-center gap-3 text-[11px] muted mt-1 flex-wrap mobile-hide">
            <span>Weight · <span class="text-[color:var(--text)] numeric">${c.weight}%</span></span>
            <span>ROI · <span title="${c.roi || 3}/5">${renderStars(c.roi || 3)}</span></span>
            <span>Time · <span class="text-[color:var(--text)] numeric">${formatTime(catTotal)}</span></span>
          </div>
          <p class="text-sm muted mt-2 leading-relaxed mobile-hide">${esc(c.blurb)}</p>
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="muted">${c.done}/${c.total} lessons · ${catRemaining === 0 ? 'done' : formatTime(catRemaining) + ' left'}</span>
              <span class="numeric" style="color:var(--accent)">${Math.round(c.pct*100)}%</span>
            </div>
            <div class="bar"><i style="width:${Math.round(c.pct*100)}%"></i></div>
          </div>
        `;
        grid.appendChild(card);
      });
      ANIM.stagger(grid.children, { stagger: 0.04 });
    }
  }
  paint('all');
  container.querySelectorAll('[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      paint(tab.dataset.filter);
    });
  });
}

/* ====================== CATEGORY DETAIL ====================== */
function renderCategory(state, hub, catId, openModuleId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) { hub.innerHTML = '<div class="text-slate-400">Unknown category.</div>'; return; }
  const mods = MODULES.filter(m => m.cat === catId);
  const container = el('div','fade-in space-y-5');

  const totalLessons = mods.flatMap(m => m.lessons).length;
  const doneLessons  = mods.flatMap(m => m.lessons).filter(l => state.completedLessons[l.id]).length;

  container.innerHTML = `
    <div>
      <a href="#curriculum" class="text-xs muted hover:text-white">← All categories</a>
      <div class="flex items-end justify-between flex-wrap gap-2 mt-2">
        <div class="min-w-0">
          <h1 class="font-display text-2xl sm:text-3xl font-semibold">${cat.icon} ${esc(cat.name)}</h1>
          <p class="muted mt-1 text-sm max-w-3xl mobile-hide">${esc(cat.blurb)}</p>
          <div class="text-xs muted mt-2 mobile-hide">Total time · <span class="text-[color:var(--text)] numeric">${formatTime(categoryTime(cat.id))}</span> · Remaining · <span class="text-[color:var(--text)] numeric">${formatTime(categoryRemainingTime(cat.id, state))}</span></div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs uppercase tracking-wider muted">Progress</div>
          <div class="text-2xl font-bold font-mono numeric">${doneLessons}/${totalLessons}</div>
        </div>
      </div>
      <div class="bar mt-3"><i style="width:${Math.round(doneLessons/Math.max(1,totalLessons)*100)}%"></i></div>
      <div class="flex gap-2 mt-4 flex-wrap">
        <button class="btn btn-primary" data-cat-quiz="${cat.id}">📝 Take quiz (${(DATA.CATEGORY_QUIZZES[cat.id]||[]).length}q)</button>
        <button class="btn mobile-hide" data-cat-dl-svg="${cat.id}">Download cheatsheet · SVG</button>
        <button class="btn mobile-hide" data-cat-dl-png="${cat.id}">Download cheatsheet · PNG</button>
      </div>
    </div>
    <div class="space-y-3" id="mod-list"></div>
  `;
  hub.appendChild(container);
  const list = container.querySelector('#mod-list');

  mods.forEach(m => {
    const mCard = el('div','card');
    const mDone = m.lessons.filter(l => state.completedLessons[l.id]).length;
    const openByDefault = m.id === openModuleId || (!openModuleId && m === mods[0]);
    mCard.innerHTML = `
      <details ${openByDefault ? 'open' : ''}>
        <summary class="cursor-pointer list-none flex items-center justify-between">
          <div>
            <div class="font-display font-semibold text-lg">${esc(m.name)}</div>
            <div class="text-xs text-slate-400 mt-1">${esc(m.intro || '')}</div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono text-slate-400">${mDone}/${m.lessons.length}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </summary>
        <div class="mt-4 space-y-1">
          ${m.lessons.map(l => `
            <div class="lesson-row ${state.completedLessons[l.id] ? 'done' : ''}" data-lesson="${l.id}">
              <div class="check"></div>
              <div class="flex-1 min-w-0">
                <div class="title text-sm font-medium">${esc(l.name)}</div>
                <div class="text-xs text-slate-500 flex items-center gap-2">
                  <span>${esc(l.type)}</span>
                  <span>·</span>
                  <span>${l.time} min</span>
                  <span>·</span>
                  <span class="text-accent-400">+${l.xp} XP</span>
                </div>
              </div>
              <button class="btn btn-ghost text-xs" data-open="${l.id}">Open</button>
            </div>
          `).join('')}
        </div>
      </details>
    `;
    list.appendChild(mCard);
  });
}

/* ====================== LESSON MODAL ====================== */
function renderLesson(state, lessonId) {
  let lesson, mod, cat;
  for (const m of MODULES) {
    const l = m.lessons.find(x => x.id === lessonId);
    if (l) { lesson = l; mod = m; cat = CATEGORIES.find(c => c.id === m.cat); break; }
  }
  if (!lesson) return null;

  const wrap = el('div','fixed inset-0 z-40 grid place-items-center p-4');
  wrap.style.background = 'rgba(248,249,252,0.55)';
  wrap.style.backdropFilter = 'blur(24px) saturate(180%)';
  wrap.style.webkitBackdropFilter = 'blur(24px) saturate(180%)';
  const card = el('div','card elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto');
  card.style.padding = '1.5rem 1.7rem';
  const done = !!state.completedLessons[lessonId];

  /* Engagement gate — Mark complete + Mark & next are disabled until the user
     engages with the lesson type's required signal:
       concept:   attempted the interactive (any pick / first reveal)
       question:  revealed the model answer
       drill:     started the timer or explicit "I did the drill"
       checklist: ticked at least one item
     Already-completed lessons skip the gate (re-opens are free to navigate). */
  let engaged = done;

  // Engagement-step labels per lesson type
  const stepLabel = {
    concept:   'Try the activity',
    question:  'Reveal the model answer',
    drill:     'Start the drill timer',
    checklist: 'Tick at least one item',
  }[lesson.type] || 'Engage with the lesson';

  card.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="text-xs muted mb-1">${esc(cat.name)} · ${esc(mod.name)}</div>
        <h2 class="font-display text-2xl font-semibold leading-tight">${esc(lesson.name)}</h2>
        <div class="flex items-center gap-2 mt-2 text-xs muted">
          <span class="pill pill-${cat.track==='both'?'both':cat.track}">${cat.track.toUpperCase()}</span>
          <span class="mobile-hide">${esc(lesson.type)}</span><span class="mobile-hide">·</span>
          <span>${lesson.time} min</span><span>·</span>
          <span style="color:var(--accent)">+${lesson.xp} XP</span>
        </div>
      </div>
      <button class="text-2xl muted hover:text-white" data-close="lesson" aria-label="Close">×</button>
    </div>
    <div id="engagement-status" class="mt-4 px-3 py-2 rounded-md text-[12.5px] flex items-center gap-2"
         style="background:rgba(199,120,14,0.08); border:1px solid rgba(199,120,14,0.25); color:var(--warn)">
      <span class="font-mono">○</span>
      <span>${esc(stepLabel)} to unlock Mark complete</span>
    </div>

    <!-- Activity FIRST — most prominent, slot for mountLessonInteraction -->
    <div id="lesson-interaction" class="mt-4 min-h-[2rem]"></div>

    <!-- Body always visible below the activity -->
    <div class="mt-5 pt-5 border-t border-[color:var(--hairline)] leading-relaxed text-[14.5px]">
      <div class="eyebrow mb-2 mobile-hide">Reference · the full insight</div>
      ${lesson.body}
    </div>
    <div class="mt-6 flex items-center justify-between gap-2 flex-wrap">
      <div class="flex gap-2 items-center">
        <button class="btn btn-ghost" data-close="lesson">Close <span class="dim text-[10px] ml-1 hidden sm:inline">Esc</span></button>
        ${done ? '' : `<button class="btn btn-ghost text-[12.5px]" data-skip="${lesson.id}" title="Mark complete with 0 XP — for material you already know cold">Skip · no XP</button>`}
      </div>
      <div class="flex gap-2">
        ${done ? '' : `<button class="btn" data-complete="${lesson.id}" data-just-complete="1" data-gated="1" disabled style="opacity:0.5;pointer-events:none">Mark complete</button>`}
        <button class="btn ${done?'btn-ghost':'btn-primary'}" data-complete="${lesson.id}" data-next-after="1" data-gated="${done?0:1}"
                ${done?'':'disabled style="opacity:0.5;pointer-events:none"'}>
          ${done ? 'Next →' : `Mark & next →`}<span class="dim text-[10px] ml-2 hidden sm:inline">Enter</span>
        </button>
      </div>
    </div>
  `;
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  // When the lesson's interaction fires its engagement signal, unlock buttons.
  const status = card.querySelector('#engagement-status');
  const unlockButtons = () => {
    if (engaged) return;
    engaged = true;
    card.querySelectorAll('[data-gated="1"]').forEach(b => {
      b.disabled = false;
      b.style.opacity = '';
      b.style.pointerEvents = '';
      b.dataset.gated = '0';
    });
    if (status) {
      status.style.background = 'rgba(14,163,113,0.08)';
      status.style.borderColor = 'rgba(14,163,113,0.3)';
      status.style.color = 'var(--accent)';
      status.innerHTML = '<span class="font-mono">✓</span><span>Engagement recorded — Mark complete unlocked</span>';
    }
  };

  // Mount interaction with the engagement callback. Surface errors loudly.
  // NOTE: local `GAMES` is the metadata array from window.DATA.GAMES.
  // The functions namespace lives at window.GAMES — use it explicitly here.
  const interaction = card.querySelector('#lesson-interaction');
  try {
    window.GAMES.mountLessonInteraction(interaction, state, lesson, mod.cat, { onEngaged: unlockButtons });
    if (!interaction.innerHTML.trim()) {
      // Nothing rendered — make this visible so we can diagnose
      interaction.innerHTML = `<div class="rounded-md p-3" style="background:rgba(215,56,76,0.08);border:1px solid rgba(215,56,76,0.3);color:var(--bad);font-size:13px">⚠ Activity did not render. Lesson type=${esc(lesson.type)}, has-interactive=${lesson.interactive ? 'yes ('+esc(lesson.interactive.type)+')' : 'no'}.</div>`;
    }
  } catch (err) {
    console.error('mountLessonInteraction failed:', err);
    interaction.innerHTML = `<div class="rounded-md p-3" style="background:rgba(215,56,76,0.08);border:1px solid rgba(215,56,76,0.3);color:var(--bad);font-size:13px;font-family:monospace;white-space:pre-wrap">⚠ Activity failed to mount:\n${esc(String(err && err.stack || err))}</div>`;
  }
  ANIM.viewIn(card);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });

  // Enter = mark & next (only when button is actually enabled)
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && (!e.target.tagName || ['DIV','BODY','BUTTON'].includes(e.target.tagName))) {
      e.preventDefault();
      const btn = card.querySelector('[data-next-after]');
      if (btn && !btn.disabled) btn.click();
    }
  };
  wrap.addEventListener('keydown', onKey);
  return wrap;
}

/* ====================== COMPANIES ====================== */
function renderCompanies(state, hub) {
  const container = el('div','fade-in space-y-4');
  container.innerHTML = `
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-semibold">Companies</h1>
      <p class="muted text-sm mt-1">${COMPANIES.length} targets. Type to filter — press <kbd class="px-1 rounded border border-[color:var(--border-2)] font-mono text-[10px]">/</kbd> to focus.</p>
    </div>
    <div class="flex items-center gap-3 flex-wrap">
      <input id="co-search" type="search" placeholder="Search companies…" class="flex-1 min-w-[200px] max-w-md"/>
      <div class="tabs flex-wrap">
        <div class="tab active" data-vfilter="all">All</div>
        <div class="tab" data-vfilter="ai">AI</div>
        <div class="tab" data-vfilter="hospitality">Hospitality</div>
        <div class="tab" data-vfilter="marketplace">Marketplace</div>
        <div class="tab" data-vfilter="devtools">Dev Tools</div>
        <div class="tab" data-vfilter="fintech">Fintech</div>
      </div>
    </div>
    <div id="co-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
  `;
  hub.appendChild(container);

  const grid = container.querySelector('#co-grid');
  let curFilter = 'all';
  let curQuery = '';
  function paint() {
    grid.innerHTML = '';
    const q = curQuery.trim().toLowerCase();
    COMPANIES
      .filter(c => curFilter === 'all' || c.vertical === curFilter)
      .filter(c => !q || (c.name+' '+c.sub+' '+c.notes).toLowerCase().includes(q))
      .forEach(c => {
        const cardEl = el('a','card card-glow block');
        cardEl.href = `#company/${c.id}`;
        const domain = COMPANY_DOMAINS[c.id];
        const logo = domain
          ? `<img src="https://logo.clearbit.com/${domain}" alt="${esc(c.name)} logo" onerror="this.style.display='none';this.parentElement.textContent='${esc(c.name[0])}'" />`
          : esc(c.name[0]);
        cardEl.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="co-logo">${logo}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 justify-between flex-wrap">
                <div class="font-display font-semibold text-lg">${esc(c.name)}</div>
                <span class="pill ${verticalPill[c.vertical]}">${verticalLabel[c.vertical]}</span>
              </div>
              <div class="text-xs muted mt-0.5">${esc(c.sub)}</div>
            </div>
          </div>
          <p class="text-sm muted mt-3 leading-relaxed line-clamp-3">${esc(c.notes)}</p>
          <div class="flex flex-wrap gap-1 mt-3">
            ${c.focus.slice(0,4).map(f => { const cat = CATEGORIES.find(x => x.id === f); return cat ? `<span class="chip">${esc(cat.name)}</span>` : ''; }).join('')}
          </div>
        `;
        grid.appendChild(cardEl);
      });
    ANIM.stagger(grid.children, { stagger: 0.025 });
  }
  paint();
  container.querySelectorAll('[data-vfilter]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-vfilter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      curFilter = tab.dataset.vfilter;
      paint();
    });
  });
  const search = container.querySelector('#co-search');
  search.addEventListener('input', e => { curQuery = e.target.value; paint(); });
  search.addEventListener('keydown', e => { if (e.key === 'Escape') { search.value=''; curQuery=''; paint(); search.blur(); } });
}

function renderCompany(state, hub, id) {
  const c = COMPANIES.find(x => x.id === id);
  if (!c) { hub.innerHTML = '<div class="muted">Unknown company.</div>'; return; }
  state.companySeen[id] = true;

  const container = el('div','fade-in space-y-5');
  const focusCats = c.focus.map(fid => CATEGORIES.find(x => x.id === fid)).filter(Boolean);
  const domain = COMPANY_DOMAINS[c.id];
  const logo = domain
    ? `<img src="https://logo.clearbit.com/${domain}" alt="${esc(c.name)} logo" onerror="this.style.display='none';this.parentElement.textContent='${esc(c.name[0])}'" />`
    : esc(c.name[0]);
  container.innerHTML = `
    <a href="#companies" class="text-xs muted hover:text-white">← All companies</a>
    <div class="card elevated">
      <div class="flex items-start gap-4 flex-wrap">
        <div class="co-logo" style="width:56px;height:56px">${logo}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="font-display text-2xl font-semibold">${esc(c.name)}</h1>
            <span class="pill ${verticalPill[c.vertical]}">${verticalLabel[c.vertical]}</span>
          </div>
          <div class="muted text-sm mt-0.5">${esc(c.sub)}</div>
        </div>
      </div>
      <p class="mt-4 leading-relaxed text-[14.5px]">${esc(c.notes)}</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card">
        <h3 class="font-display font-semibold text-lg mb-3">Prep emphasis</h3>
        <div class="space-y-2">
          ${focusCats.map((cat,i) => `
            <a href="#category/${cat.id}" class="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-700/40 transition">
              <div class="w-8 h-8 grid place-items-center rounded-lg bg-ink-700/60">${cat.icon}</div>
              <div class="flex-1">
                <div class="text-sm font-medium">${esc(cat.name)}</div>
                <div class="text-xs text-slate-400">${esc(cat.blurb).slice(0,90)}…</div>
              </div>
              <div class="text-xs text-slate-500">#${i+1}</div>
            </a>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h3 class="font-display font-semibold text-lg mb-3">Illustrative interview prompts</h3>
        <p class="text-xs text-slate-500 mb-3">Patterns reported for ${esc(c.name)} or its vertical in public 2026 interview discussions. Verify the latest JD before relying on specific phrasing.</p>
        <ol class="list-decimal list-inside space-y-2 text-sm text-slate-300">
          ${c.sample.map(s => `<li>${esc(s)}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
  hub.appendChild(container);
}

/* ====================== FLASHCARDS ====================== */
function renderFlashcards(state, hub) {
  const due = GAMI.dueCards(state, FLASHCARDS, 50);
  const container = el('div','fade-in space-y-5');
  container.innerHTML = `
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold">Flashcards</h1>
        <p class="text-slate-400 mt-1 text-sm">Spaced repetition (SM-2). Rate honestly — bad ratings ≠ moral failure, they're scheduling input.</p>
      </div>
      <div class="text-right">
        <div class="text-xs uppercase tracking-wide text-slate-400">Due now</div>
        <div class="text-2xl font-bold">${due.length}</div>
      </div>
    </div>
    <div id="fc-stage"></div>
  `;
  hub.appendChild(container);

  const stage = container.querySelector('#fc-stage');
  let idx = 0;
  // Keyboard: Space/Enter flips, 1-4 rates
  const onKey = (e) => {
    if (idx >= due.length) return;
    const fc = stage.querySelector('.flashcard');
    if (!fc) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!fc.classList.contains('flipped')) {
        fc.classList.add('flipped');
        const row = fc.querySelector('#rate-row');
        if (row) row.style.display = 'grid';
      }
    } else if (['1','2','3','4'].includes(e.key) && fc.classList.contains('flipped')) {
      e.preventDefault();
      const btn = stage.querySelector(`[data-rate="${e.key}"]`);
      btn?.click();
    }
  };
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => document.removeEventListener('keydown', onKey), { once: true });
  function paint() {
    stage.innerHTML = '';
    if (idx >= due.length) {
      stage.innerHTML = `<div class="card text-center py-12">
        <div class="text-4xl mb-3">🎉</div>
        <div class="font-display font-semibold text-xl">All caught up.</div>
        <div class="text-slate-400 mt-2 text-sm">Come back tomorrow — your schedule is set.</div>
      </div>`;
      ANIM.confettiBurst('m');
      return;
    }
    const { card } = due[idx];
    const fc = el('div','flashcard');
    fc.innerHTML = `
      <div class="flashcard-inner">
        <div class="flashcard-face">
          <div class="text-xs uppercase tracking-wide text-slate-400 mb-3">${CATEGORIES.find(c=>c.id===card.cat)?.icon || ''} ${card.cat}</div>
          <div class="text-xl font-display font-semibold leading-snug">${esc(card.q)}</div>
          <div class="absolute bottom-5 right-6 text-xs text-slate-500">Click to reveal</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="text-xs uppercase tracking-wide text-slate-400 mb-3">Answer</div>
          <div class="text-[15px] leading-relaxed">${esc(card.a)}</div>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2 mt-4" id="rate-row" style="display:none">
        <button class="btn btn-danger" data-rate="1">Again<span class="block text-[10px] mt-0.5">+5</span></button>
        <button class="btn btn-ghost" data-rate="2">Hard<span class="block text-[10px] mt-0.5">+10</span></button>
        <button class="btn btn-ghost" data-rate="3">Good<span class="block text-[10px] mt-0.5">+15</span></button>
        <button class="btn btn-primary" data-rate="4">Easy<span class="block text-[10px] mt-0.5">+20</span></button>
      </div>
    `;
    stage.appendChild(fc);
    const flashEl = fc;
    flashEl.querySelector('.flashcard-inner').addEventListener('click', () => {
      flashEl.classList.add('flipped');
      flashEl.querySelector('#rate-row').style.display = 'grid';
    });
    flashEl.querySelectorAll('[data-rate]').forEach(b => {
      b.addEventListener('click', () => {
        const q = parseInt(b.dataset.rate, 10);
        const r = GAMI.reviewCard(state, card.id, q);
        APP.afterStateChange();
        ANIM.toast({ icon: q===1?'😬':q===4?'⚡':'👍', title:`+${r.xpGained} XP${r.bonusLabel||''}`, body: q===1?'Rescheduled tomorrow.':'Logged.' });
        GAMI.bumpQuestProgress(state, 'flashcard');
        idx++;
        paint();
      });
    });
  }
  paint();
}

/* ====================== INFOGRAPHICS ====================== */
function renderInfographics(state, hub) {
  const container = el('div','fade-in space-y-5');
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Infographics</h1>
      <p class="muted mt-1 text-sm max-w-2xl">Curriculum-specific infographics generated on-the-fly. Plus canonical CC-licensed reference images from Wikimedia for foundational topics.</p>
    </div>
    <div>
      <div class="text-xs muted uppercase tracking-wider mb-3">Downloadable (curriculum-specific)</div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="ig-grid"></div>
    </div>
    <div id="ig-preview" class="hidden card elevated"></div>
    <div>
      <div class="text-xs muted uppercase tracking-wider mb-3 mt-2">Reference images (Wikimedia · CC BY-SA)</div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="ref-grid"></div>
    </div>
  `;
  hub.appendChild(container);

  const refGrid = container.querySelector('#ref-grid');
  IMAGE_REFS.forEach(r => {
    const c = el('div','card');
    const cat = CATEGORIES.find(x => x.id === r.cat);
    c.innerHTML = `
      <div class="ref-img mb-3"><img src="${r.src}" alt="${esc(r.topic)}" loading="lazy"/></div>
      <div class="text-xs muted uppercase tracking-wider">${esc(cat?.name || r.cat)}</div>
      <div class="font-medium mt-1">${esc(r.topic)}</div>
      <div class="muted text-xs mt-1">${esc(r.caption)}</div>
      <div class="flex items-center justify-between mt-3">
        <span class="text-[10px] dim">${esc(r.license)}</span>
        <a class="text-xs underline hover:text-white" href="${r.page}" target="_blank" rel="noopener">Source ↗</a>
      </div>
    `;
    refGrid.appendChild(c);
  });

  const grid = container.querySelector('#ig-grid');
  INFOGRAPHICS.forEach(ig => {
    const c = el('div','card card-glow cursor-pointer');
    c.innerHTML = `
      <div class="font-display font-semibold text-lg">${esc(ig.name)}</div>
      <p class="text-sm text-slate-400 mt-2">${esc(ig.desc)}</p>
      <div class="flex gap-2 mt-4">
        <button class="btn btn-primary text-xs" data-preview="${ig.id}">Preview</button>
        <button class="btn btn-ghost text-xs"   data-dl-svg="${ig.id}">SVG</button>
        <button class="btn btn-ghost text-xs"   data-dl-png="${ig.id}">PNG</button>
      </div>
    `;
    grid.appendChild(c);
  });

  const preview = container.querySelector('#ig-preview');
  grid.addEventListener('click', e => {
    const pId = e.target?.dataset?.preview;
    const sId = e.target?.dataset?.dlSvg;
    const pngId = e.target?.dataset?.dlPng;
    if (pId) {
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="font-display font-semibold text-lg">${esc(INFOGRAPHICS.find(x=>x.id===pId).name)}</div>
          <div class="flex gap-2">
            <button class="btn btn-ghost text-xs" data-dl-svg="${pId}">Download SVG</button>
            <button class="btn btn-primary text-xs" data-dl-png="${pId}">Download PNG</button>
          </div>
        </div>
        <div class="overflow-x-auto">${INFOG.previewHTML(pId)}</div>
      `;
      preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (sId) INFOG.downloadSVG(sId);
    if (pngId) INFOG.downloadPNG(pngId);
  });
  preview.addEventListener('click', e => {
    const sId = e.target?.dataset?.dlSvg;
    const pngId = e.target?.dataset?.dlPng;
    if (sId) INFOG.downloadSVG(sId);
    if (pngId) INFOG.downloadPNG(pngId);
  });
}

/* ====================== COVERAGE AUDIT ====================== */
function renderCoverage(state, hub) {
  const cov = GAMI.coverage(state, CATEGORIES, MODULES);
  const container = el('div','fade-in space-y-5');

  // Detect gaps: any category with weight ≥ 8 and < 30% done is a "gap"
  const gaps = cov.categories.filter(c => c.weight >= 8 && c.pct < 0.3);
  const weakSpots = cov.categories.filter(c => c.pct < 0.6 && c.pct >= 0.3);

  // Topic coverage: which "topic tags" exist
  // We use module.id as a topic.
  const topicCount = {};
  MODULES.forEach(m => topicCount[m.cat] = (topicCount[m.cat] || 0) + 1);

  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Coverage Audit</h1>
      <p class="text-slate-400 mt-1 text-sm max-w-2xl">Quick read of where you're strong, where the curriculum is thinly covered, and which gaps the weighting flags as urgent.</p>
    </div>

    <div class="grid sm:grid-cols-3 gap-4">
      <div class="card !p-4">
        <div class="text-xs text-slate-400 uppercase">Overall</div>
        <div class="text-3xl font-bold mt-1">${Math.round(cov.overall*100)}%</div>
        <div class="text-xs text-slate-500 mt-1">weight-adjusted</div>
      </div>
      <div class="card !p-4">
        <div class="text-xs text-slate-400 uppercase">Categories at risk</div>
        <div class="text-3xl font-bold mt-1 text-rose-400">${gaps.length}</div>
        <div class="text-xs text-slate-500 mt-1">weight ≥ 8% and &lt; 30% done</div>
      </div>
      <div class="card !p-4">
        <div class="text-xs text-slate-400 uppercase">Lessons in curriculum</div>
        <div class="text-3xl font-bold mt-1">${totalLessonCount()}</div>
        <div class="text-xs text-slate-500 mt-1">across ${MODULES.length} modules</div>
      </div>
    </div>

    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-3">Curriculum-side coverage check</h3>
      <p class="text-xs text-slate-400 mb-3">Verifies the platform itself covers each topic with sufficient depth (≥ 1 module per category, ≥ 4 lessons in any high-weight category).</p>
      <div class="space-y-2">
        ${CATEGORIES.map(c => {
          const ml = MODULES.filter(m => m.cat === c.id);
          const lcount = ml.flatMap(m => m.lessons).length;
          const expected = c.weight >= 10 ? 6 : c.weight >= 6 ? 4 : 3;
          const ok = lcount >= expected;
          return `
          <div class="flex items-center justify-between text-sm py-1.5 border-b border-ink-700/40 last:border-0">
            <span>${c.icon} ${esc(c.name)} <span class="text-xs text-slate-500">· weight ${c.weight}%</span></span>
            <span class="${ok?'text-accent-400':'text-rose-400'} font-mono text-xs">${lcount} lessons / target ≥${expected} ${ok?'✓':'⚠'}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${gaps.length ? `<div class="card border-rose-500/40">
      <h3 class="font-display font-semibold text-lg text-rose-400">⚠ Prep gaps to close first</h3>
      <p class="text-xs text-slate-400 mt-1 mb-3">High-weight categories where you're under 30%. These move your overall score the most for the least effort.</p>
      <div class="space-y-2">
        ${gaps.map(c => `
          <a href="#category/${c.id}" class="flex items-center justify-between p-2 rounded-lg hover:bg-ink-700/40 transition">
            <span>${c.icon} ${esc(c.name)}</span>
            <span class="text-xs font-mono text-rose-400">${Math.round(c.pct*100)}% · weight ${c.weight}%</span>
          </a>
        `).join('')}
      </div>
    </div>`:''}

    ${weakSpots.length ? `<div class="card">
      <h3 class="font-display font-semibold text-lg">Areas to firm up</h3>
      <div class="space-y-2 mt-3">
        ${weakSpots.map(c => `
          <a href="#category/${c.id}" class="flex items-center justify-between p-2 rounded-lg hover:bg-ink-700/40 transition">
            <span>${c.icon} ${esc(c.name)}</span>
            <span class="text-xs font-mono text-warm-400">${Math.round(c.pct*100)}%</span>
          </a>
        `).join('')}
      </div>
    </div>`:''}

    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-2">Chart: progress vs weight</h3>
      <div style="height:240px"><canvas id="cov-chart"></canvas></div>
    </div>
  `;
  hub.appendChild(container);

  setTimeout(() => {
    const ctx = document.getElementById('cov-chart');
    if (ctx && window.Chart) {
      new Chart(ctx, {
        type:'bar',
        data:{
          labels: cov.categories.map(c => c.name),
          datasets: [
            { label:'Done %', data: cov.categories.map(c => Math.round(c.pct*100)), backgroundColor:'#7CF1C2' },
            { label:'Weight', data: cov.categories.map(c => c.weight), backgroundColor:'#8B5CF6' },
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          scales:{ x:{ ticks:{color:'#94A3B8'} }, y:{ ticks:{color:'#94A3B8'}, grid:{color:'rgba(255,255,255,0.05)'} }},
          plugins:{ legend:{ labels:{ color:'#cbd5e1'} } }
        }
      });
    }
  }, 0);
}

/* ====================== PROFILE ====================== */
function renderProfile(state, hub) {
  const container = el('div','fade-in space-y-5');
  const earned = Object.keys(state.badges || {});
  container.innerHTML = `
    <h1 class="font-display text-3xl font-bold">Profile</h1>
    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-3">You</h3>
      <form id="profile-form" class="grid sm:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-xs text-slate-400">Name</span>
          <input name="name" value="${esc(state.user.name)}" class="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 mt-1 focus:border-accent-500 focus:outline-none"/>
        </label>
        <label class="block">
          <span class="text-xs text-slate-400">Track</span>
          <select name="track" class="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 mt-1">
            <option value="fde" ${state.user.track==='fde'?'selected':''}>FDE</option>
            <option value="sde" ${state.user.track==='sde'?'selected':''}>SDE</option>
            <option value="both" ${state.user.track==='both'?'selected':''}>Both</option>
          </select>
        </label>
        <label class="block">
          <span class="text-xs text-slate-400">Daily goal (min)</span>
          <input type="number" min="5" max="240" name="goal" value="${state.user.goal}" class="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 mt-1"/>
        </label>
        <label class="block">
          <span class="text-xs text-slate-400">Anchor cue ("when X, then I study")</span>
          <input name="when_cue" value="${esc(state.user.when_cue)}" class="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 mt-1"/>
        </label>
        <div class="sm:col-span-2 flex gap-2">
          <button class="btn btn-primary" type="submit">Save</button>
          <button type="button" class="btn btn-danger" data-action="reset">Reset all progress</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-3">Badges <span class="text-xs text-slate-400">${earned.length}/${BADGES.length}</span></h3>
      <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        ${BADGES.map(b => {
          const got = !!state.badges[b.id];
          return `<div class="text-center p-3 rounded-lg ${got?'bg-accent-500/10 border border-accent-500/30':'bg-ink-800/40 border border-ink-700/40 opacity-50'}">
            <div class="text-3xl ${got?'':'grayscale'}">${b.icon}</div>
            <div class="text-xs mt-1 font-medium">${esc(b.name)}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${esc(b.desc)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  hub.appendChild(container);
}

/* ====================== SOURCES ====================== */
function renderSources(state, hub) {
  state.visitedSources = true;
  const container = el('div','fade-in space-y-5');
  const tier = (t) => SOURCES.filter(s => s.tier === t);
  const tierCard = (label, items, color) => `
    <div class="card">
      <h3 class="font-display font-semibold text-lg" style="color:${color}">${label}</h3>
      <div class="space-y-3 mt-3">
        ${items.map(s => `
          <div class="border-l-2 pl-3" style="border-color:${color}">
            <a href="${s.url}" target="_blank" rel="noopener" class="text-sm font-medium hover:underline">${esc(s.name)} ↗</a>
            <div class="text-xs text-slate-400 mt-0.5">${esc(s.why)}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-1 truncate">${esc(s.url)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Sources & methodology</h1>
      <p class="text-slate-400 mt-1 text-sm max-w-2xl">Every pattern in the curriculum is corroborated across ≥2 sources or is established CS canon. Primary sources are weighted heavier. Treat individual Glassdoor entries as signal-in-aggregate only.</p>
    </div>
    ${tierCard('Primary — editorially reviewed or first-party', tier('primary'), '#7CF1C2')}
    ${tierCard('Aggregate — community signal, useful in triangulation', tier('aggregate'), '#FFB95C')}
    ${tierCard('Secondary — niche prep blogs, cross-check before relying', tier('secondary'), '#A78BFA')}
    ${tierCard('Verification tools', tier('verify'), '#60A5FA')}

    <div class="card border-rose-500/30">
      <h3 class="font-display font-semibold text-lg text-rose-400">What is NOT cited</h3>
      <p class="text-sm text-slate-300 mt-2 leading-relaxed">Specific verbatim questions attributed to individual companies are <i>illustrative</i> — pulled from public patterns and vertical norms. Always verify with the current JD, your recruiter, and recent candidate writeups before relying on specific phrasing. Smaller portfolio companies (e.g. Bikky, Airgoods, Nory, Hang, Mirage, Felicity, Coast) have sparse public 2026 interview reports; their sample prompts are pattern-matched to vertical, not sourced verbatim.</p>
    </div>
  `;
  hub.appendChild(container);
}

/* ====================== MOCKS ====================== */
function renderMocks(state, hub) {
  const container = el('div','fade-in space-y-5');
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Mock Interview Log</h1>
      <p class="text-slate-400 mt-1 text-sm">Recording mocks is the single highest-leverage prep activity. Log each one; review the painful parts.</p>
    </div>
    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-3">Log a mock</h3>
      <form id="mock-form" class="grid sm:grid-cols-4 gap-3">
        <select name="vertical" class="bg-ink-900 border border-ink-600 rounded-lg px-3 py-2">
          <option value="">Vertical…</option>
          <option value="ai">AI / LLM</option>
          <option value="hospitality">Hospitality</option>
          <option value="marketplace">Marketplace</option>
          <option value="devtools">DevTools</option>
          <option value="fintech">Fintech</option>
        </select>
        <select name="kind" class="bg-ink-900 border border-ink-600 rounded-lg px-3 py-2">
          <option value="">Round…</option>
          <option value="decomp">Decomposition</option>
          <option value="coding">Coding</option>
          <option value="sysd">System Design</option>
          <option value="client">Client Simulation</option>
          <option value="behav">Behavioral</option>
        </select>
        <select name="score" class="bg-ink-900 border border-ink-600 rounded-lg px-3 py-2">
          <option value="">Self-score…</option>
          <option value="1">1 — bombed</option>
          <option value="2">2 — rough</option>
          <option value="3">3 — passing</option>
          <option value="4">4 — strong</option>
          <option value="5">5 — nailed it</option>
        </select>
        <button class="btn btn-primary">Log mock</button>
        <textarea name="notes" rows="2" placeholder="What was the painful part? What would you do differently?" class="sm:col-span-4 bg-ink-900 border border-ink-600 rounded-lg px-3 py-2"></textarea>
      </form>
    </div>
    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-3">History (${state.mocks.length})</h3>
      ${state.mocks.length === 0 ? '<div class="text-slate-500 text-sm">No mocks logged yet.</div>' : `
        <div class="space-y-2">
          ${[...state.mocks].reverse().map(m => `
            <div class="p-3 bg-ink-800/60 border border-ink-700/40 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium">${esc(verticalLabel[m.vertical] || m.vertical)} · ${esc(m.kind)}</div>
                <div class="text-sm font-mono">${'★'.repeat(m.score)}${'☆'.repeat(5-m.score)}</div>
              </div>
              <div class="text-xs text-slate-400 mt-1">${new Date(m.ts).toLocaleString()}</div>
              ${m.notes ? `<div class="text-sm text-slate-300 mt-2">${esc(m.notes)}</div>`:''}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  hub.appendChild(container);
}

/* ====================== STAR STORY BANK ====================== */
function renderStories(state, hub) {
  const slots = [
    { id:'fix',       label:'Production fix under pressure' },
    { id:'pushback',  label:'Pushing back on a client request' },
    { id:'failure',   label:'Deployment failure ownership' },
    { id:'limit',     label:'Explaining a technical limit' },
    { id:'ambiguity', label:'Decision with incomplete info' },
  ];
  const container = el('div','fade-in space-y-5');
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">STAR Story Bank</h1>
      <p class="text-slate-400 mt-1 text-sm">The 5 required FDE stories. Draft each in STAR (Action-weighted). Save = +30 XP.</p>
    </div>
    <div class="space-y-4" id="story-list"></div>
  `;
  hub.appendChild(container);
  const list = container.querySelector('#story-list');
  slots.forEach(s => {
    const v = state.starStories[s.id] || { situation:'', task:'', action:'', result:'' };
    const card = el('div','card');
    card.innerHTML = `
      <details>
        <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
          <div class="font-display font-semibold text-lg">${esc(s.label)}</div>
          <div class="flex items-center gap-2 text-xs">
            <span data-saved-indicator class="dim hidden">saved</span>
            <span style="color:${v.action ? 'var(--accent)' : 'var(--dim)'}">${v.action ? '✓ drafted' : 'not drafted'}</span>
          </div>
        </summary>
        <form class="mt-4 grid gap-3" data-story="${s.id}">
          <div><label class="text-xs muted">Situation <span class="dim">(2–3 sentences)</span></label><textarea rows="2" name="situation" class="w-full mt-1">${esc(v.situation)}</textarea></div>
          <div><label class="text-xs muted">Task <span class="dim">(YOUR ownership)</span></label><textarea rows="2" name="task" class="w-full mt-1">${esc(v.task)}</textarea></div>
          <div><label class="text-xs" style="color:var(--warn)">Action <span class="dim">(~60% of the story — be specific)</span></label><textarea rows="5" name="action" class="w-full mt-1">${esc(v.action)}</textarea></div>
          <div><label class="text-xs muted">Result <span class="dim">(technical + quantified business impact)</span></label><textarea rows="2" name="result" class="w-full mt-1">${esc(v.result)}</textarea></div>
          <div class="flex items-center justify-between">
            <div class="text-[11px] dim">Auto-saves on blur</div>
            <button class="btn btn-ghost">Save now</button>
          </div>
        </form>
      </details>
    `;
    list.appendChild(card);
    // Auto-save on blur
    const form = card.querySelector('form');
    const indicator = card.querySelector('[data-saved-indicator]');
    form.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('blur', () => {
        const fd = new FormData(form);
        const wasFreshDraft = !state.starStories[s.id]?.action && fd.get('action');
        state.starStories[s.id] = {
          situation: fd.get('situation') || '',
          task:      fd.get('task') || '',
          action:    fd.get('action') || '',
          result:    fd.get('result') || '',
          updatedAt: Date.now()
        };
        if (wasFreshDraft) {
          const r = GAMI.awardXP(state, 30, 'story');
          GAMI.bumpQuestProgress(state, 'story');
          ANIM.toast({ icon:'⭐', title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'First draft saved.' });
        }
        GAMI.saveImmediate(state);
        APP.afterStateChange();
        indicator.classList.remove('hidden');
        clearTimeout(indicator._t);
        indicator._t = setTimeout(() => indicator.classList.add('hidden'), 1500);
      });
    });
  });
}

/* ====================== PREP TOOLS (combined) ====================== */
function renderPrep(state, hub, tab='stories') {
  const container = el('div','fade-in space-y-4');
  container.innerHTML = `
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-semibold">Prep tools</h1>
      <p class="muted text-sm mt-1">Stories, mocks, coverage — your behavioral &amp; meta-prep dashboard.</p>
    </div>
    <div class="tabs">
      <div class="tab ${tab==='stories'?'active':''}"  data-tab="stories">STAR Bank</div>
      <div class="tab ${tab==='mocks'?'active':''}"    data-tab="mocks">Mock Log</div>
      <div class="tab ${tab==='coverage'?'active':''}" data-tab="coverage">Coverage</div>
    </div>
    <div id="prep-pane"></div>
  `;
  hub.appendChild(container);

  const pane = container.querySelector('#prep-pane');
  function paint(t) {
    pane.innerHTML = '';
    if (t === 'stories')  renderStories(state,  pane);
    if (t === 'mocks')    renderMocks(state,    pane);
    if (t === 'coverage') renderCoverage(state, pane);
    // strip the inner h1 so it doesn't repeat — the parent already has one
    const innerH1 = pane.querySelector('h1');
    if (innerH1) innerH1.remove();
    const innerSub = pane.querySelector('h1 + p, h1 + .text-slate-400, p.muted');
    // keep subtitles
  }
  paint(tab);
  container.querySelectorAll('[data-tab]').forEach(b => {
    b.addEventListener('click', () => {
      location.hash = '#prep/' + b.dataset.tab;
    });
  });
}

/* ====================== REVIEW (SRS queues) ====================== */
function renderReview(state, hub, mode='missed') {
  const container = el('div','fade-in space-y-4');
  const missed = GAMI.dueMissedQuestions(state, 100);
  const concepts = GAMI.dueConceptReviews(state, MODULES, 100);
  container.innerHTML = `
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-semibold">Review</h1>
      <p class="muted text-sm mt-1">Spaced repetition keeps misses + low-confidence concepts in your queue until they\'re actually learned.</p>
    </div>
    <div class="tabs">
      <div class="tab ${mode==='missed'?'active':''}"  data-rmode="missed">Wrong-answer queue · <span class="numeric">${missed.length}</span></div>
      <div class="tab ${mode==='concepts'?'active':''}" data-rmode="concepts">Concept review · <span class="numeric">${concepts.length}</span></div>
    </div>
    <div id="review-pane"></div>
  `;
  hub.appendChild(container);
  const pane = container.querySelector('#review-pane');

  function paint(m) {
    pane.innerHTML = '';
    if (m === 'missed') {
      if (missed.length === 0) {
        pane.innerHTML = '<div class="card text-center py-10"><div class="text-4xl mb-2">🎉</div><div class="font-display font-semibold text-lg">No misses due today.</div><div class="muted text-sm mt-2">Keep doing quizzes — missed ones land here on a SM-2 schedule.</div></div>';
        return;
      }
      pane.innerHTML = '<div id="missed-stage"></div>';
      const stage = pane.querySelector('#missed-stage');
      let idx = 0;
      function paintQ() {
        if (idx >= missed.length) {
          stage.innerHTML = '<div class="card text-center py-10"><div class="text-4xl mb-2">✓</div><div class="font-display font-semibold text-lg">Queue clear for today</div><div class="muted text-sm mt-2">Items you got right have been promoted on the SM-2 schedule. Items you missed again will resurface tomorrow.</div></div>';
          ANIM.confettiBurst('m');
          return;
        }
        const m = missed[idx];
        const cardEl = el('div','card');
        cardEl.innerHTML = `
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs muted">Item ${idx+1} / ${missed.length} · lapses: <span class="numeric">${m.lapses}</span> · reps: <span class="numeric">${m.reps}</span></div>
            <div class="text-xs muted">cat: ${esc(m.cat || 'general')}</div>
          </div>
          <div id="mq-stage"></div>
        `;
        stage.innerHTML = '';
        stage.appendChild(cardEl);
        GAMES.mountQuiz; // ensure module loaded — but we use renderMCQ directly via window.GAMES
        // We need direct access to renderMCQ; not exported. Re-render inline.
        const qStage = cardEl.querySelector('#mq-stage');
        qStage.innerHTML = `
          <div class="text-[14px] font-medium mb-3">${esc(m.q)}</div>
          <div class="grid gap-2">
            ${m.options.map((o,i) => `<button class="btn justify-start text-left w-full !py-2.5" data-opt="${i}"><span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}</button>`).join('')}
          </div>
          <div id="mq-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
        `;
        qStage.querySelectorAll('[data-opt]').forEach(btn => {
          btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.opt,10);
            const right = i === m.correct;
            qStage.querySelectorAll('[data-opt]').forEach(x => x.disabled = true);
            qStage.querySelectorAll('[data-opt]').forEach((x,j) => {
              if (j === m.correct) { x.style.borderColor = 'var(--accent)'; x.style.color = 'var(--accent)'; }
              if (j === i && !right) { x.style.borderColor = 'var(--bad)'; x.style.color = 'var(--bad)'; }
            });
            GAMI.reviewMissedQuestion(state, m.qid, right);
            APP.afterStateChange();
            const fb = qStage.querySelector('#mq-fb');
            fb.classList.remove('hidden');
            fb.style.background = right ? 'rgba(14,163,113,0.08)' : 'rgba(215,56,76,0.06)';
            fb.style.border = `1px solid ${right ? 'rgba(14,163,113,0.3)' : 'rgba(215,56,76,0.25)'}`;
            const promo = right
              ? 'Promoted — next review further out. After 3 correct reps + 3 weeks, it graduates out.'
              : 'Reset to 1-day interval. Lapse count + ease adjusted.';
            fb.innerHTML = `<div style="color:${right?'var(--accent)':'var(--bad)'};font-weight:500">${right?'✓ Got it':'✗ Still missed'}</div><div class="muted mt-1">${esc(m.explain)}</div><div class="text-[11px] mt-2" style="color:${right?'var(--accent)':'var(--bad)'}">${promo}</div><div class="mt-3 text-right"><button class="btn btn-primary" id="mq-next">Next →</button></div>`;
            fb.querySelector('#mq-next').addEventListener('click', () => { idx++; paintQ(); });
            if (right) ANIM.confettiBurst('s');
          });
        });
      }
      paintQ();
    } else if (m === 'concepts') {
      if (concepts.length === 0) {
        pane.innerHTML = '<div class="card text-center py-10"><div class="text-4xl mb-2">🎉</div><div class="font-display font-semibold text-lg">No concepts due today.</div><div class="muted text-sm mt-2">Self-rate concepts after activities to schedule them here.</div></div>';
        return;
      }
      pane.innerHTML = concepts.map(c => `
        <a class="card card-glow block mb-3" href="#category/${c.modCat}">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-xs muted">${esc(c.modName)} · last rating: ${c.lastRating}/4 · reps: <span class="numeric">${c.reps}</span></div>
              <div class="font-display font-semibold mt-1">${esc(c.lesson.name)}</div>
              <div class="text-xs muted mt-1">Due since ${new Date(c.due).toLocaleDateString()}</div>
            </div>
            <div class="text-xl">🔁</div>
          </div>
        </a>
      `).join('');
    }
  }
  paint(mode);
  container.querySelectorAll('[data-rmode]').forEach(t => {
    t.addEventListener('click', () => { location.hash = '#review/' + t.dataset.rmode; });
  });
}

return {
  renderDashboard, renderCurriculum, renderCategory, renderLesson,
  renderCompanies, renderCompany, renderFlashcards, renderInfographics,
  renderCoverage, renderProfile, renderSources, renderMocks, renderStories,
  renderPrep, renderReview,
};
})();
