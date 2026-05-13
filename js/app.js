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
  // Sync the floating mobile tab bar selection + animated pill.
  setActiveTabbar(routeId);
}

/* ─── Liquid Glass mobile tab bar ───────────────────────────────────────
 * Five primary routes surface as tabs; the rest live in the sidebar.
 * The active "pill" indicator is absolutely positioned and animated via
 * transform/width when the route changes (CSS transition with
 * --spring-overshoot easing). Minimize-on-scroll listens to window
 * scrollY: when the user scrolls down >12px, body.nav-minimized goes on;
 * scrolling up by 8px+ takes it off. */
const TABBAR_ROUTES = [
  { id: 'dashboard',  label: 'Today',      icon: 'layout-dashboard' },
  { id: 'curriculum', label: 'Curriculum', icon: 'book-open' },
  { id: 'flashcards', label: 'Cards',      icon: 'layers' },
  { id: 'games',      label: 'Games',      icon: 'target' },
  { id: 'companies',  label: 'Companies',  icon: 'building' },
];

function buildTabbar() {
  const bar = document.getElementById('liquid-tabbar');
  if (!bar) return;
  // Pill indicator first so it sits behind the tab buttons in z-order.
  bar.innerHTML = `<span class="tab-pill" aria-hidden="true"></span>` +
    TABBAR_ROUTES.map(r => `
      <a class="tab-item" href="#${r.id}" data-route="${r.id}" aria-label="${escapeHtml(r.label)}">
        ${(window.VIEWS && VIEWS.iconHTML) ? VIEWS.iconHTML(r.icon, { size: 20 }) : ''}
        <span class="tab-label">${escapeHtml(r.label)}</span>
      </a>
    `).join('');
}

function setActiveTabbar(routeId) {
  const bar = document.getElementById('liquid-tabbar');
  if (!bar) return;
  const items = bar.querySelectorAll('.tab-item');
  let activeEl = null;
  items.forEach(a => {
    const on = a.dataset.route === routeId;
    a.classList.toggle('active', on);
    if (on) activeEl = a;
  });
  // Animate the pill — measure the active tab's position relative to the
  // bar's content box (after padding) and move the pill there. CSS handles
  // the spring transition; we just write the new transform + width.
  const pill = bar.querySelector('.tab-pill');
  if (!pill) return;
  if (!activeEl) {                              // route isn't in the tab bar
    pill.style.opacity = '0';
    return;
  }
  pill.style.opacity = '1';
  // offsetLeft/Width are relative to the offsetParent (the bar itself).
  requestAnimationFrame(() => {
    pill.style.transform = `translateX(${activeEl.offsetLeft}px)`;
    pill.style.width = `${activeEl.offsetWidth}px`;
  });
}

/* Minimize-on-scroll — debounce via rAF, threshold-based hysteresis so
 * the bar doesn't flicker on small scroll movements. */
let lastScrollY = 0;
let scrollRafQueued = false;
function onScrollMinimize() {
  if (scrollRafQueued) return;
  scrollRafQueued = true;
  requestAnimationFrame(() => {
    scrollRafQueued = false;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const dy = y - lastScrollY;
    // Always show at the very top of the page
    if (y < 24) {
      document.body.classList.remove('nav-minimized');
    } else if (dy > 6) {                        // scrolled down a bit → hide
      document.body.classList.add('nav-minimized');
    } else if (dy < -6) {                       // scrolled up → reveal
      document.body.classList.remove('nav-minimized');
    }
    lastScrollY = y;
  });
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
  setActiveNav(route);

  // The actual DOM swap — wrapped so View Transitions can snapshot before/
  // after states for a smooth morph between routes.
  const swap = () => {
    hub.innerHTML = '';
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
  };

  // View Transitions API — Chrome 111+, Safari 18+. When supported, the
  // browser snapshots the old DOM, calls swap(), snapshots the new DOM,
  // and cross-fades them. With matching view-transition-name on elements
  // in old and new DOM, those elements morph (FLIP). Fallback: just swap.
  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(swap);
  } else {
    swap();
    ANIM.viewIn(hub.firstElementChild);                // legacy fade-in
  }
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
        ANIM.toast({ icon: VIEWS.iconHTML('coffee', {size: 18}), title:'Focus block done', body:`Take a ${breakMin}-min break — research-backed.` });
        const r = GAMI.awardXP(state, 25, 'focus');
        afterStateChange();
        phase = 'break'; secsLeft = breakMin * 60;
      } else {
        ANIM.toast({ icon: VIEWS.iconHTML('rocket', {size: 18}), title:'Break done', body:'Back to it. Next focus block started.' });
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
  document.addEventListener('click', e => {
    // Lesson open
    const openId = e.target?.dataset?.open;
    if (openId) {
      VIEWS.renderLesson(state, openId);
      return;
    }
    // Lesson row click also opens
    const row = e.target.closest('[data-lesson]');
    if (row && !e.target.closest('button')) {
      VIEWS.renderLesson(state, row.dataset.lesson);
      return;
    }
    // Close lesson modal
    if (e.target?.dataset?.close === 'lesson') {
      const modal = e.target.closest('.fixed');
      modal?.remove();
      return;
    }
    // Pet — preview all life stages
    if (e.target?.closest && e.target.closest('[data-pet-lifecycle]')) {
      VIEWS.openPetLifecyclePreview();
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
        ANIM.toast({ icon: VIEWS.iconHTML('check', {size: 18}), title:`+${r.xpGained} XP${r.bonusLabel || ''}`, body: 'Lesson saved.' });
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
      // Pet name — kept on state.pet so the rename survives respawns.
      const petName = (fd.get('pet_name') || '').toString().trim().slice(0, 24);
      if (petName) {
        if (!state.pet) state.pet = {};
        state.pet.name = petName;
      }
      afterStateChange();
      buildSidebar();
      ANIM.toast({ icon: VIEWS.iconHTML('save', {size: 18}), title:'Saved' });
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
      ANIM.toast({ icon: VIEWS.iconHTML('target', {size: 18}), title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'Mock logged.' });
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
        ANIM.toast({ icon: VIEWS.iconHTML('star', {size: 18}), title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'Story saved.' });
      } else {
        ANIM.toast({ icon: VIEWS.iconHTML('save', {size: 18}), title:'Updated' });
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
    buildTabbar();
    bindEvents();
    bindMobileNav();
    bindKeyboard();
    ensureOnboarded();
    render();
    // Auto-save safeguards
    window.addEventListener('visibilitychange', () => GAMI.saveImmediate(state));
    window.addEventListener('beforeunload', () => GAMI.saveImmediate(state));
    setInterval(() => GAMI.saveImmediate(state), 20000);

    // Liquid Glass tab bar — minimize-on-scroll. Passive listener for
    // jank-free scroll handling; the work is rAF-throttled.
    window.addEventListener('scroll', onScrollMinimize, { passive: true });
    // Recompute the active pill's position on viewport resize (the tab
    // widths can change when the bar is constrained by the viewport).
    window.addEventListener('resize', () => {
      const { route } = parseHash();
      setActiveTabbar(route);
    }, { passive: true });

    // (Removed: pointer-tracked --mx/--my CSS var updater. The glass
    // pointer-tracked specular highlight caused too much paint thrash
    // when many cards were on-screen.)
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
