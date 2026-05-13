/* =========================================================================
 * app.js — Router, state lifecycle, global event handlers, side effects.
 * ========================================================================= */

window.APP = (function () {

let state = GAMI.load();

// Sidebar — 6 items. Profile lives behind the header avatar.
// Infographics + Sources live in the footer. Stories/Mocks/Coverage
// are combined into a single "Prep tools" page with tabs.
const ROUTES = [
  { id:'dashboard',  label:'Today' },
  { id:'curriculum', label:'Curriculum' },
  { id:'games',      label:'Games' },
  { id:'flashcards', label:'Flashcards' },
  { id:'companies',  label:'Companies' },
  { id:'prep',       label:'Prep tools' },
];

function buildSidebar() {
  const nav = document.getElementById('sidenav');
  if (!nav) return;
  nav.innerHTML = '';
  ROUTES.forEach(r => {
    const a = document.createElement('a');
    a.href = '#' + r.id;
    a.className = 'nav-item';
    a.dataset.route = r.id;
    a.innerHTML = `<span class="flex-1">${r.label}</span>`;
    nav.appendChild(a);
  });

  const footer = document.getElementById('sidebar-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="leading-snug">Cue: <span class="text-slate-200">${state.user.when_cue ? escapeHtml(state.user.when_cue) : '—'}</span></div>
      <div class="mt-1">Goal: <span class="text-slate-200">${state.user.goal} min/day</span></div>
      <div class="mt-2 text-[10px] text-slate-500">v1 · localStorage</div>
    `;
  }
}

function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function updateHeader() {
  document.getElementById('streak-count').textContent = state.streak.count;
  document.getElementById('level').textContent = state.level;
  const lvl = GAMI.levelProgress(state.xp);
  const pct = Math.round(lvl.inLevel / lvl.levelSpan * 100);
  document.getElementById('xp-bar').style.width = pct + '%';
  document.getElementById('xp-text').textContent = `${lvl.inLevel}/${lvl.levelSpan}`;
  const initial = (state.user.name || '?').trim().charAt(0).toUpperCase() || '?';
  document.getElementById('profile-initial').textContent = initial;
  const dailyPct = Math.min(100, Math.round((state.todayXP / Math.max(1, state.user.goal*2)) * 100));
  document.getElementById('daily-bar').style.width = dailyPct + '%';
}

function setActiveNav(routeId) {
  document.querySelectorAll('#sidenav .nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.route === routeId);
  });
  const r = ROUTES.find(x => x.id === routeId);
  document.getElementById('route-title').textContent = r ? r.label : '';
}

function parseHash() {
  const h = (location.hash || '#dashboard').slice(1);
  const parts = h.split('/');
  return { route: parts[0] || 'dashboard', a: parts[1], b: parts[2] };
}

function render() {
  GAMI.tickDay(state);
  GAMI.ensureDailyQuests(state, DATA.DAILY_QUESTS);
  GAMI.checkBadges(state, DATA.BADGES);
  GAMI.save(state);

  const { route, a, b } = parseHash();
  const hub = document.getElementById('view');
  hub.innerHTML = '';
  setActiveNav(route);

  switch (route) {
    case 'dashboard':    VIEWS.renderDashboard(state, hub); break;
    case 'curriculum':   VIEWS.renderCurriculum(state, hub); break;
    case 'category':     VIEWS.renderCategory(state, hub, a, b); break;
    case 'companies':    VIEWS.renderCompanies(state, hub); break;
    case 'company':      VIEWS.renderCompany(state, hub, a); break;
    case 'flashcards':   VIEWS.renderFlashcards(state, hub); break;
    case 'stories':      VIEWS.renderStories(state, hub); break;
    case 'mocks':        VIEWS.renderMocks(state, hub); break;
    case 'mock':         VIEWS.renderMockInterview(state, hub, a); break;
    case 'games':        a ? GAMES.renderGame(state, hub, a) : GAMES.renderGamesIndex(state, hub); break;
    case 'infographics': VIEWS.renderInfographics(state, hub); break;
    case 'coverage':     VIEWS.renderCoverage(state, hub); break;
    case 'prep':         VIEWS.renderPrep(state, hub, a || 'stories'); break;
    case 'review':       VIEWS.renderReview(state, hub, a || 'missed'); break;
    case 'sources':      VIEWS.renderSources(state, hub); break;
    case 'profile':      VIEWS.renderProfile(state, hub); break;
    default:             VIEWS.renderDashboard(state, hub);
  }
  updateHeader();
  ANIM.viewIn(hub.firstElementChild);
}

function afterStateChange() {
  GAMI.checkBadges(state, DATA.BADGES);
  GAMI.save(state);
  updateHeader();
}

/* ---------- Onboarding (auto, no welcome form) ---------- */
function ensureOnboarded() {
  // Auto-bootstrap; user can edit name + cue in Profile any time.
  state.onboarded = true;
  GAMI.save(state);
}

/* ---------- Focus session (deep-work timer) ----------
 * 50/10 cycles by default, configurable, runs in the corner. Built-in
 * break-after-50min nudge maps to widely cited focus-attention research.
 */
let focusSession = null;
function startFocusSession(focusMin = 50, breakMin = 10) {
  if (focusSession) stopFocusSession();
  const bar = document.getElementById('focus-bar');
  const clock = document.getElementById('focus-clock');
  const stateEl = document.getElementById('focus-state');
  const pauseBtn = document.getElementById('focus-pause');
  bar.classList.remove('hidden');
  let phase = 'focus';
  let secsLeft = focusMin * 60;
  let paused = false;
  function paint() {
    const m = Math.floor(secsLeft/60), s = secsLeft%60;
    clock.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    stateEl.textContent = phase === 'focus' ? 'Focus' : 'Break';
    clock.style.color = phase === 'focus' ? 'var(--accent)' : 'var(--warn)';
  }
  paint();
  pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause'; };
  document.getElementById('focus-stop').onclick = () => stopFocusSession();
  focusSession = setInterval(() => {
    if (paused) return;
    secsLeft--;
    if (secsLeft <= 0) {
      ANIM.confettiBurst('s');
      if (phase === 'focus') {
        ANIM.toast({ icon:'☕', title:'Focus block done', body:`Take a ${breakMin}-min break — research-backed.` });
        const r = GAMI.awardXP(state, 25, 'focus');
        afterStateChange();
        phase = 'break'; secsLeft = breakMin * 60;
      } else {
        ANIM.toast({ icon:'🚀', title:'Break done', body:'Back to it. Next focus block started.' });
        phase = 'focus'; secsLeft = focusMin * 60;
      }
    }
    paint();
  }, 1000);
}
function stopFocusSession() {
  clearInterval(focusSession); focusSession = null;
  document.getElementById('focus-bar').classList.add('hidden');
}

/* ---------- Global event delegation ---------- */
function bindEvents() {
  // Track the last clicked element so Liquid-Glass FLIP can grow the modal
  // out of that source rect. Captured at pointerdown so we have it before
  // any handler dispatches navigation.
  document.addEventListener('pointerdown', e => {
    window._lastClickSource = e.target?.closest?.('.lesson-row, [data-open], [data-lesson], a, button, .card') || e.target;
  }, true);

  document.addEventListener('click', e => {
    // Lesson open — pass the source (button or row) so the modal grows from it.
    const openBtn = e.target?.closest?.('[data-open]');
    if (openBtn) {
      const src = e.target.closest('.lesson-row') || openBtn;
      VIEWS.renderLesson(state, openBtn.dataset.open, src);
      return;
    }
    // Lesson row click also opens
    const row = e.target.closest('[data-lesson]');
    if (row && !e.target.closest('button')) {
      VIEWS.renderLesson(state, row.dataset.lesson, row);
      return;
    }
    // Close lesson modal
    if (e.target?.dataset?.close === 'lesson') {
      const modal = e.target.closest('.fixed');
      modal?.remove();
      return;
    }
    // Skip — mark complete with 0 XP, then optionally advance to next
    const skipId = e.target?.dataset?.skip;
    if (skipId) {
      if (!state.completedLessons[skipId]) {
        state.completedLessons[skipId] = { ts: Date.now(), xp: 0, skipped: true };
        GAMI.saveImmediate(state);
        ANIM.toast({ icon:'⏭️', title:'Skipped', body:'Marked complete · 0 XP awarded.' });
      }
      const modal = e.target.closest('.fixed'); modal?.remove();
      const next = findNextLessonAfter(skipId);
      if (next) setTimeout(() => VIEWS.renderLesson(state, next.id), 180);
      else render();
      return;
    }

    // Mark lesson complete (+ optionally open next)
    const completeId = e.target?.dataset?.complete;
    if (completeId) {
      const wantsNext = e.target?.dataset?.nextAfter === '1';
      const r = GAMI.logLessonComplete(state, completeId, lessonXP(completeId));
      if (!r.alreadyDone) {
        ANIM.confettiBurst('s');
        ANIM.toast({ icon:'✅', title:`+${r.xpGained} XP${r.bonusLabel || ''}`, body: 'Lesson saved.' });
        GAMI.bumpQuestProgress(state, 'lesson');
        const lesson = findLesson(completeId);
        if (lesson?.type === 'drill') GAMI.bumpQuestProgress(state, 'drill');
        if (lesson?.cat === 'decomp') GAMI.bumpQuestProgress(state, 'decomp');
        if (lesson?.cat === 'coding') GAMI.bumpQuestProgress(state, 'coding');
        if (r.levelUp) ANIM.celebrateLevelUp(r.levelUp);
        afterStateChange();
      }
      // Close current modal regardless of already-done
      const modal = e.target.closest('.fixed'); modal?.remove();
      if (wantsNext) {
        const nextLesson = findNextLessonAfter(completeId);
        if (nextLesson) {
          // Brief delay for confetti/toast visibility
          setTimeout(() => VIEWS.renderLesson(state, nextLesson.id), 180);
        } else {
          ANIM.toast({ icon:'🏁', title:'Category complete', body:'No more lessons in this module.' });
          render();
        }
      } else {
        render();
      }
      return;
    }
    // Goto
    const goto = e.target?.dataset?.route;
    if (e.target?.dataset?.action === 'goto' && goto) { location.hash = goto.startsWith('#')?goto:('#'+goto); return; }
    // Reset
    if (e.target?.dataset?.action === 'reset') {
      if (confirm('Wipe all progress? This cannot be undone.')) {
        GAMI.reset();
        state = GAMI.load();
        location.hash = '#dashboard';
        location.reload();
      }
      return;
    }
    // Profile button
    if (e.target.closest('#open-profile')) { location.hash = '#profile'; return; }
    // Focus session
    const focusMin = parseInt(e.target?.dataset?.focus || '0', 10);
    if (focusMin) { startFocusSession(focusMin, 10); return; }
    // Per-category infographic downloads
    const catSvg = e.target?.dataset?.catDlSvg;
    if (catSvg) { INFOG.downloadSVG('cat-' + catSvg, `cheatsheet-${catSvg}`); return; }
    const catPng = e.target?.dataset?.catDlPng;
    if (catPng) { INFOG.downloadPNG('cat-' + catPng, `cheatsheet-${catPng}`); return; }
    // Per-category quiz
    const catQuiz = e.target?.dataset?.catQuiz;
    if (catQuiz) { GAMES.runCategoryQuiz(state, catQuiz); return; }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'profile-form') {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.user.name = fd.get('name') || state.user.name;
      state.user.track = fd.get('track') || state.user.track;
      state.user.goal  = parseInt(fd.get('goal') || state.user.goal, 10);
      state.user.when_cue = fd.get('when_cue') || '';
      afterStateChange();
      buildSidebar();
      ANIM.toast({ icon:'💾', title:'Saved' });
      return;
    }
    if (e.target.id === 'mock-form') {
      e.preventDefault();
      const fd = new FormData(e.target);
      const m = {
        ts: Date.now(),
        vertical: fd.get('vertical') || 'unknown',
        kind: fd.get('kind') || 'unknown',
        score: parseInt(fd.get('score') || '3', 10),
        notes: fd.get('notes') || ''
      };
      if (!fd.get('vertical') || !fd.get('kind') || !fd.get('score')) {
        ANIM.toast({ icon:'⚠️', title:'Pick vertical, round, score' }); return;
      }
      state.mocks.push(m);
      const r = GAMI.awardXP(state, 60, 'mock');
      ANIM.confettiBurst('m');
      ANIM.toast({ icon:'🎯', title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'Mock logged.' });
      afterStateChange();
      render();
      return;
    }
    const storyId = e.target.dataset?.story;
    if (storyId) {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fresh = !state.starStories[storyId]?.action && fd.get('action');
      state.starStories[storyId] = {
        situation: fd.get('situation') || '',
        task:      fd.get('task') || '',
        action:    fd.get('action') || '',
        result:    fd.get('result') || '',
        updatedAt: Date.now()
      };
      if (fresh) {
        const r = GAMI.awardXP(state, 30, 'story');
        GAMI.bumpQuestProgress(state, 'story');
        ANIM.toast({ icon:'⭐', title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'Story saved.' });
      } else {
        ANIM.toast({ icon:'💾', title:'Updated' });
      }
      afterStateChange();
      render();
      return;
    }
  });

  window.addEventListener('hashchange', render);
}

function findLesson(id) {
  for (const m of DATA.MODULES) {
    const l = m.lessons.find(x => x.id === id);
    if (l) return { ...l, cat: m.cat, moduleId: m.id };
  }
  return null;
}
function lessonXP(id) {
  const l = findLesson(id);
  return l ? l.xp : 10;
}

/* For "Mark & next": find the next INCOMPLETE lesson after the current one.
   Priority:
     1. Next incomplete lesson in the same module (preserves the user's flow)
     2. First incomplete lesson in the next module of the same category
     3. First incomplete lesson in the next category (ROI-sorted order)
     4. null = nothing left
*/
function findNextLessonAfter(currentId) {
  const cur = findLesson(currentId);
  if (!cur) return null;
  const state = APP.getState();

  // 1. Same module — lessons AFTER current
  const curModule = DATA.MODULES.find(m => m.id === cur.moduleId);
  if (curModule) {
    const curIdx = curModule.lessons.findIndex(l => l.id === currentId);
    for (let i = curIdx + 1; i < curModule.lessons.length; i++) {
      if (!state.completedLessons[curModule.lessons[i].id]) return curModule.lessons[i];
    }
    // also scan BEFORE current in the same module — in case the user skipped some
    for (let i = 0; i < curIdx; i++) {
      if (!state.completedLessons[curModule.lessons[i].id]) return curModule.lessons[i];
    }
  }

  // 2. Next modules in the same category
  const catModules = DATA.MODULES.filter(m => m.cat === cur.cat);
  const curModuleCatIdx = catModules.findIndex(m => m.id === cur.moduleId);
  for (let i = curModuleCatIdx + 1; i < catModules.length; i++) {
    for (const l of catModules[i].lessons) {
      if (!state.completedLessons[l.id]) return l;
    }
  }

  // 3. Other categories in ROI-sorted order
  const catIdx = DATA.CATEGORIES.findIndex(c => c.id === cur.cat);
  for (let i = catIdx + 1; i < DATA.CATEGORIES.length; i++) {
    const cat = DATA.CATEGORIES[i];
    for (const m of DATA.MODULES.filter(mm => mm.cat === cat.id)) {
      for (const l of m.lessons) {
        if (!state.completedLessons[l.id]) return l;
      }
    }
  }
  // Also wrap around: earlier categories that might have unfinished lessons
  for (let i = 0; i < catIdx; i++) {
    const cat = DATA.CATEGORIES[i];
    for (const m of DATA.MODULES.filter(mm => mm.cat === cat.id)) {
      for (const l of m.lessons) {
        if (!state.completedLessons[l.id]) return l;
      }
    }
  }

  return null;
}

function init() {
  try {
    buildSidebar();
    bindEvents();
    bindMobileNav();
    bindKeyboard();
    ensureOnboarded();
    render();
    // Auto-save safeguards
    window.addEventListener('visibilitychange', () => GAMI.saveImmediate(state));
    window.addEventListener('beforeunload', () => GAMI.saveImmediate(state));
    setInterval(() => GAMI.saveImmediate(state), 20000);

    // Liquid-glass pointer-tracked specular highlight.
    // Updates --mx/--my CSS vars on the .card under the cursor so the
    // ::before highlight follows the pointer with a soft falloff.
    // rAF-throttled to one update per frame; skipped on touch + reduced-motion.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let pending = null;
      document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        if (pending !== null) return;
        pending = requestAnimationFrame(() => {
          pending = null;
          const card = e.target && e.target.closest && e.target.closest('.card');
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 100;
          const my = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mx', mx + '%');
          card.style.setProperty('--my', my + '%');
        });
      }, { passive: true });
    }
    console.log('[FDE/SDE prep] loaded · state restored · auto-save on');
  } catch (err) {
    console.error('[FDE/SDE prep] init failed:', err);
    const v = document.getElementById('view');
    if (v) v.innerHTML = `<div style="padding:24px;color:#FF7A8C;font-family:monospace;white-space:pre-wrap">Initialization error:\n${String(err && err.stack || err)}</div>`;
  }
}

/* ---------- Global keyboard shortcuts ---------- */
function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Don't intercept typing in inputs / textareas / contenteditable
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
      // Allow Esc to close even from inputs
      if (e.key === 'Escape') t.blur();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '?') { e.preventDefault(); showHelp(); return; }
    if (e.key === 'j' || e.key === 'J') { e.preventDefault(); jumpToNextLesson(); return; }
    if (e.key === 'g' || e.key === 'G') { e.preventDefault(); jumpToTodaysGame(); return; }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); location.hash = '#flashcards'; return; }
    if (e.key === '/') {
      // Focus search if on Companies
      const s = document.getElementById('co-search');
      if (s) { e.preventDefault(); s.focus(); }
      return;
    }
    if (e.key === 'Escape') {
      // Close any open modal
      const modal = document.querySelector('.fixed.inset-0.grid');
      if (modal) modal.remove();
      return;
    }
  });
}
function jumpToNextLesson() {
  for (const cat of DATA.CATEGORIES) {
    for (const mod of DATA.MODULES.filter(m => m.cat === cat.id)) {
      for (const l of mod.lessons) {
        if (!state.completedLessons[l.id]) {
          VIEWS.renderLesson(state, l.id);
          return;
        }
      }
    }
  }
  ANIM.toast({ icon:'🏁', title:'No incomplete lessons', body:'Try a mock or flashcards.' });
}
function jumpToTodaysGame() {
  const day = parseInt(GAMI.todayKey().replaceAll('-',''), 10);
  const g = DATA.GAMES[day % DATA.GAMES.length];
  location.hash = '#games/' + g.id;
}
function showHelp() {
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-50 grid place-items-center p-4';
  wrap.style.background = 'rgba(248,249,252,0.55)';
  wrap.style.backdropFilter = 'blur(24px) saturate(180%)';
  wrap.style.webkitBackdropFilter = 'blur(24px) saturate(180%)';
  wrap.innerHTML = `
    <div class="card elevated max-w-md w-full">
      <div class="flex items-center justify-between mb-3">
        <div class="font-display font-semibold text-lg">Keyboard shortcuts</div>
        <button class="muted hover:text-white text-2xl" data-close-help>×</button>
      </div>
      <div class="space-y-2 text-sm">
        ${[
          ['J','Jump to next incomplete lesson'],
          ['G','Open today\'s game'],
          ['F','Open flashcards'],
          ['/','Focus the search (Companies page)'],
          ['?','Show this help'],
          ['Esc','Close modal / sidebar'],
          ['Space','(in Flashcards) flip the card'],
          ['1–4','(in Flashcards) rate again/hard/good/easy'],
          ['Enter','(in Lesson modal) mark complete & open next'],
        ].map(([k,d]) => `<div class="flex items-center justify-between gap-3 py-1.5 border-b border-[color:var(--border)] last:border-0">
          <span class="muted">${esc(d)}</span><kbd class="px-2 py-0.5 rounded border border-[color:var(--border-2)] font-mono text-xs">${esc(k)}</kbd>
        </div>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.dataset.closeHelp !== undefined) wrap.remove(); });
}
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bindMobileNav() {
  const close = () => document.body.classList.remove('sidebar-open');
  const toggle = () => document.body.classList.toggle('sidebar-open');
  document.getElementById('mobile-menu')?.addEventListener('click', toggle);
  document.getElementById('sidebar-close')?.addEventListener('click', close);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', close);
  // Close on nav-item navigation
  document.getElementById('sidenav')?.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });
  // Close on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) close();
  });
  // Auto-close when viewport grows past lg breakpoint (e.g. rotate to landscape, resize)
  const mq = window.matchMedia('(min-width: 1024px)');
  const onChange = () => { if (mq.matches) close(); };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
}

// Run init now if DOM already parsed, else when it is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

return { render, afterStateChange, getState: () => state };
})();
