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

// Map sidebar route IDs to Lucide icon names so the desktop sidebar
// matches the icon language of the bottom tab bar + categories.
const SIDEBAR_ICONS = {
  dashboard:  'layout-dashboard',
  curriculum: 'book-open',
  games:      'target',
  flashcards: 'layers',
  companies:  'building',
  prep:       'scroll-text',
};

function buildSidebar() {
  const nav = document.getElementById('sidenav');
  if (!nav) return;
  nav.innerHTML = '';
  ROUTES.forEach(r => {
    const a = document.createElement('a');
    a.href = '#' + r.id;
    a.className = 'nav-item';
    a.dataset.route = r.id;
    const iconName = SIDEBAR_ICONS[r.id] || 'layers';
    const iconMarkup = (window.VIEWS && VIEWS.iconHTML) ? VIEWS.iconHTML(iconName, { size: 16 }) : '';
    a.innerHTML = `${iconMarkup}<span class="flex-1">${r.label}</span>`;
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
/* Five primary routes on the bar + a "More" affordance for secondary
 * routes (Profile, Stories, Mocks, Infographics, Sources, Review). The
 * More tab opens a Liquid Glass sheet listing the overflow. */
const TABBAR_ROUTES = [
  { id: 'dashboard',  label: 'Today',      icon: 'layout-dashboard' },
  { id: 'curriculum', label: 'Curriculum', icon: 'book-open' },
  { id: 'flashcards', label: 'Cards',      icon: 'layers' },
  { id: 'companies',  label: 'Companies',  icon: 'building' },
  { id: 'more',       label: 'More',       icon: 'sparkles', isMore: true },
];
/* Secondary routes that live in the "More" sheet. Games moves here —
 * Companies (live NYC postings) is higher-frequency for active prep. */
const TABBAR_MORE_ROUTES = [
  { id: 'games',       label: 'Games',        icon: 'target' },
  { id: 'stories',     label: 'STAR Bank',    icon: 'scroll-text' },
  { id: 'mocks',       label: 'Mock log',     icon: 'clock' },
  { id: 'coverage',    label: 'Coverage',     icon: 'list-checks' },
  { id: 'infographics',label: 'Infographics', icon: 'sparkles' },
  { id: 'sources',     label: 'Sources',      icon: 'book-marked' },
  { id: 'profile',     label: 'Profile',      icon: 'users-round' },
];

function buildTabbar() {
  const bar = document.getElementById('liquid-tabbar');
  if (!bar) return;
  // Apple's iOS 26 tab bar uses color-only for active state — no separate
  // pill / capsule behind the active icon. Active = accent text; inactive
  // = muted text. The bar contracts in place when minimized; no morphing
  // indicator needed since only the active tab remains visible.
  bar.innerHTML = TABBAR_ROUTES.map(r => {
    const isMore = !!r.isMore;
    const tag    = isMore ? 'button' : 'a';
    const attrs  = isMore
      ? `type="button" data-more-toggle aria-label="${escapeHtml(r.label)}"`
      : `href="#${r.id}" data-route="${r.id}" aria-label="${escapeHtml(r.label)}"`;
    return `<${tag} class="tab-item" ${attrs}>
      ${(window.VIEWS && VIEWS.iconHTML) ? VIEWS.iconHTML(r.icon, { size: 22 }) : ''}
      <span class="tab-label">${escapeHtml(r.label)}</span>
    </${tag}>`;
  }).join('');

  // Wire the More tab — opens a Liquid Glass sheet listing secondary routes.
  const moreBtn = bar.querySelector('[data-more-toggle]');
  if (moreBtn) moreBtn.addEventListener('click', openMoreSheet);

  // Tap-to-expand (Apple's iOS 26 spec): tapping any tab — including the
  // selected/collapsed pill — restores the bar to its full size. The
  // scroll listener will re-minimize on the next scroll-down delta, so
  // user intent is preserved without permanently locking the bar open.
  bar.addEventListener('click', () => {
    if (document.body.classList.contains('nav-minimized')) {
      document.body.classList.remove('nav-minimized');
      // Reset the scroll baseline so the next minimize cycle starts fresh
      // from wherever we are now (without spuriously interpreting the
      // expand as a "scroll up" delta).
      lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    }
  }, { capture: true });                          // fire before <a> navigates
}

/* "More" sheet — Liquid Glass overlay sliding up from the bottom. Lists
 * secondary routes as large tappable rows. Closes on outside-tap, on
 * route-select, or on Esc. */
function _appVersion() {
  // Derive from the cache-buster query on any same-origin script tag.
  // All app scripts share the same ?v=<version> so any one works.
  const s = document.querySelector('script[src*="?v="]');
  const m = s && s.src.match(/[?&]v=([\w.\-]+)/);
  return m ? m[1] : '';
}

function openMoreSheet() {
  if (document.getElementById('more-sheet')) return;             // already open
  const wrap = document.createElement('div');
  wrap.id = 'more-sheet';
  // Note: NOT `fixed inset-0 z-50` — that would match the body's
  // `:has(> .fixed.inset-0[class*="z-5"])` rule which globally bumps
  // --glass-blur to 84px and re-invalidates every dashboard card's
  // backdrop-filter the same frame the entrance animates. We position
  // via a dedicated class instead and opt into the freeze behaviors
  // explicitly via `body.more-sheet-open`.
  wrap.className = 'more-sheet-wrap';
  const ver = _appVersion();
  // Panel intentionally does NOT carry `.card` — that class brings a
  // large multi-layer box-shadow that has to rasterize over the panel's
  // ~95vw × up-to-72vh area every frame of the slide-in, and on iOS
  // Safari the shadow recomposite is the dominant cost for the chop.
  // We re-add a single cheap drop-shadow on .more-sheet-panel below.
  wrap.innerHTML = `
    <div class="more-sheet-scrim" data-close></div>
    <div class="more-sheet-panel" role="dialog" aria-label="More routes">
      <div class="more-sheet-handle" aria-hidden="true"></div>
      <div class="text-[11px] uppercase tracking-wider muted mb-3" style="letter-spacing:0.22em">More</div>
      <div class="more-sheet-list">
        ${TABBAR_MORE_ROUTES.map(r => `
          <a class="more-sheet-row" href="#${r.id}" data-route="${r.id}">
            <span class="more-sheet-icon">${(window.VIEWS && VIEWS.iconHTML) ? VIEWS.iconHTML(r.icon, { size: 18 }) : ''}</span>
            <span class="more-sheet-label">${escapeHtml(r.label)}</span>
            <span class="more-sheet-chevron">${(window.VIEWS && VIEWS.iconHTML) ? VIEWS.iconHTML('arrow-right', { size: 14 }) : '›'}</span>
          </a>
        `).join('')}
      </div>
      ${ver ? `<button type="button" class="more-sheet-version" data-check-update aria-label="App version — tap to check for updates">v${escapeHtml(ver)} <span class="dim">· tap to update</span></button>` : ''}
    </div>
  `;
  document.body.appendChild(wrap);
  // Double-rAF pre-warm: the first frame lets the browser lay out the
  // panel, rasterize its drop-shadow, and decode the row SVGs while
  // it's still at translateY(110%) (offscreen). Only on the second
  // frame do we flip `.open` and start the transform transition, so
  // the entrance animates against an already-warm compositor layer.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('more-sheet-open');
    wrap.classList.add('open');
  }));
  const close = () => {
    wrap.classList.remove('open');
    document.body.classList.remove('more-sheet-open');
    setTimeout(() => wrap.remove(), 320);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { close(); return; }
    const row = e.target.closest('.more-sheet-row');
    if (row) {
      // The <a href> default already changed the hash → app router is
      // rendering the new view. Close immediately so the sheet glides
      // away in parallel with the view appearing beneath it. The 120ms
      // pre-close delay we used to have made the interaction feel sticky.
      close();
      return;
    }
    // Tap-to-update — for iOS standalone bookmark apps where pull-to-
    // refresh isn't available. Force-navigates to a cache-busted URL
    // which guarantees a fresh HTML fetch (location.reload() can hit
    // the 10-min GH Pages HTTP cache).
    const upd = e.target.closest('[data-check-update]');
    if (upd) {
      upd.textContent = 'Updating…';
      upd.style.pointerEvents = 'none';
      location.href = location.pathname + '?_av=' + Date.now() + location.hash;
    }
  });
}

function setActiveTabbar(routeId) {
  const bar = document.getElementById('liquid-tabbar');
  if (!bar) return;
  // The More button doesn't carry data-route -- it's a <button> with
  // data-more-toggle. Treat it as "active" whenever the current route
  // is one of its secondary destinations, so the pill nav always
  // shows where the user is in the IA hierarchy. Without this, every
  // route inside the More sheet (Games, STAR Bank, Mocks, Coverage,
  // Infographics, Sources, Profile) left every pill un-highlighted.
  const moreOwnsRoute = TABBAR_MORE_ROUTES.some(r => r.id === routeId);
  bar.querySelectorAll('.tab-item').forEach(a => {
    const isMore = a.hasAttribute('data-more-toggle');
    const matches = isMore ? moreOwnsRoute : a.dataset.route === routeId;
    a.classList.toggle('active', matches);
  });
}

/* Imperative icon-pop animation for tab + sidebar active item. We do
 * this from JS (Web Animations API) rather than a CSS transition
 * because the view-transition pseudo hides the live element mid-
 * transition — a CSS transition would freeze the icon at its in-
 * progress scale, then snap to the final state when the live element
 * returns, which reads as a flicker. By running this AFTER the
 * transition's `.finished` promise resolves, the pop plays on the
 * fully-visible live element. */
let _lastActiveRoute = null;
function popActiveIcons() {
  const sel = '#liquid-tabbar .tab-item.active .icon, .sidebar-nav .nav-item.active .icon';
  document.querySelectorAll(sel).forEach(icon => {
    if (typeof icon.animate !== 'function') return;
    icon.animate(
      [
        { transform: 'translateZ(0) scale(1)',    offset: 0    },
        { transform: 'translateZ(0) scale(1.18)', offset: 0.42 },
        { transform: 'translateZ(0) scale(0.96)', offset: 0.72 },
        { transform: 'translateZ(0) scale(1)',    offset: 1    },
      ],
      { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'none' }
    );
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
  return { route: parts[0] || 'dashboard', a: parts[1], b: parts[2], c: parts[3] };
}

function render() {
  GAMI.tickDay(state);
  GAMI.ensureDailyQuests(state, DATA.DAILY_QUESTS);
  GAMI.checkBadges(state, DATA.BADGES);
  GAMI.save(state);

  const { route, a, b, c } = parseHash();
  const hub = document.getElementById('view');
  setActiveNav(route);

  // The actual DOM swap — wrapped so View Transitions can snapshot before/
  // after states for a smooth morph between routes.
  const swap = () => {
    // Tear down the pet 3D scene before clearing innerHTML when leaving
    // dashboard. The renderer holds a live WebGL context + scene graph
    // (wheatgrass, bonsai, pet model); without dispose() the rAF tick
    // keeps polling via setTimeout(250) and GPU resources leak until GC.
    if (_lastActiveRoute === 'dashboard' && route !== 'dashboard') {
      const oldHost = hub.querySelector('#pet-room-3d-host');
      if (oldHost && oldHost._petHandle && typeof oldHost._petHandle.dispose === 'function') {
        try { oldHost._petHandle.dispose(); } catch (_) {}
        oldHost._petHandle = null;
      }
    }
    hub.innerHTML = '';
    switch (route) {
      case 'dashboard':    VIEWS.renderDashboard(state, hub); break;
      case 'curriculum':   VIEWS.renderCurriculum(state, hub); break;
      case 'category':     VIEWS.renderCategory(state, hub, a, b, c); break;
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

  // Did the active route actually change? Pop the icon only when it did,
  // so re-renders for the SAME route (e.g., state updates) don't fire
  // a spurious bounce.
  const routeChanged = (_lastActiveRoute !== route);
  _lastActiveRoute = route;

  // Plain swap — no View Transitions API. We tried wrapping the swap
  // in document.startViewTransition for the crossfade morph, but the
  // API hides the live tab bar and sidebar during the snapshot phase
  // (~180ms), and any in-flight CSS transition (color, opacity, scale)
  // ends up captured at different progress points in OLD vs NEW, which
  // reads as a rectangular flicker on the pill. Doing a direct swap is
  // crisp, instant, and lets the icon-pop fire immediately without the
  // ~180ms delay of `tx.finished`. The #view content itself fades in
  // via ANIM.viewIn so route changes still feel intentional.
  swap();
  ANIM.viewIn(hub.firstElementChild);
  if (routeChanged) requestAnimationFrame(popActiveIcons);
}

function afterStateChange() {
  GAMI.checkBadges(state, DATA.BADGES);
  GAMI.save(state);
  updateHeader();
  // Refresh data-bearing cards in the current view (Today XP, Streak,
  // Level, Lessons-done, Quests, NextUp, Heatmap) without a full
  // re-render. Same surgical update used by the sync poll.
  try { syncSurgicalUpdates(state); } catch (_) {}
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
        // Pomodoros used to award +25 XP per block (silently -- no event
        // record, just bumped state.xp + history.xp). Removed because
        // running 3 Pomodoros while reading was the easiest path to the
        // daily goal, which devalued the curriculum/flashcards/jobApps
        // calibrated effort costs. Focus blocks now stand on their own
        // ergonomic value (timer + break enforcement).
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
    // Close lesson modal. If the modal was opened from a flashcard deep-link
    // (data-return-to="flashcards" stamped by renderCategory), navigate back
    // to #flashcards so the user doesn't get stranded on the category route.
    if (e.target?.dataset?.close === 'lesson') {
      const modal = e.target.closest('.fixed');
      const returnTo = modal?.dataset?.returnTo;
      modal?.remove();
      if (returnTo === 'flashcards') location.hash = '#flashcards';
      return;
    }
    // Pet — preview all life stages
    if (e.target?.closest && e.target.closest('[data-pet-lifecycle]')) {
      VIEWS.openPetLifecyclePreview();
      return;
    }
    // Pet — respawn after death. Opens the Liquid Glass confirmation
    // modal rather than respawning directly so the user sees one
    // consistent UI path for a meaningful (non-reversible) action.
    if (e.target?.closest && e.target.closest('[data-pet-respawn]')) {
      if (VIEWS && typeof VIEWS.renderPetDeathGate === 'function') {
        VIEWS.renderPetDeathGate(APP.getState());
      }
      return;
    }
    // Pet — drop food. Delegated here (rather than inline in renderDashboard)
    // so the handler survives sync-driven pet-panel swaps.
    const dropFoodBtn = e.target?.closest && e.target.closest('[data-pet-drop-food]');
    if (dropFoodBtn && !dropFoodBtn.disabled) {
      const host = document.getElementById('pet-room-3d-host');
      const petHandle = host && host._petHandle;
      if (petHandle && typeof petHandle.dropFood === 'function') {
        const st = APP.getState();
        // Keep in sync with PILE_XP in gamification.js petState(). Local
        // shadow because app.js doesn't import from gamification.js -- it
        // talks to the GAMI namespace only.
        const PILE_XP = 5;
        const todayXP = st.todayXP || 0;
        const eaten = (st.pet && st.pet.eatenTodayXP) || 0;
        const carry = (st.pet && st.pet.carryoverXP) || 0;
        const todayUnspent = Math.max(0, todayXP - eaten);
        const avail = Math.floor((todayUnspent + carry) / PILE_XP);
        if (avail > 0) {
          const fx = (Math.random() * 2 - 1) * 2.0;
          const fz = (Math.random() * 2 - 1) * 2.0;
          petHandle.dropFood(fx, fz);
          // Spend the pile against carryover XP first, then today's
          // bucket. Keeps "fresh" XP from today visible in the today
          // bar for as long as possible, and the rollover counter
          // doesn't compound forever.
          if (carry >= PILE_XP) {
            st.pet.carryoverXP = carry - PILE_XP;
          } else {
            st.pet.carryoverXP = 0;
            st.pet.eatenTodayXP = eaten + (PILE_XP - carry);
          }
          if (typeof GAMI !== 'undefined' && GAMI.feedPetWithPile) GAMI.feedPetWithPile(st);
          if (typeof GAMI !== 'undefined' && GAMI.saveImmediate) GAMI.saveImmediate(st);
          afterStateChange();          // updates header + surgical refresh of cards (incl. pet)
        }
      }
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

  /* Coalesce hashchange events: if multiple fire in rapid succession
   * (user mashes tabs, browser back/forward, programmatic redirects),
   * skip the intermediates and only render the final state. Without
   * this, the perf clickthrough showed 6 hashchanges in 180ms = 6 full
   * innerHTML swaps stacking up and blocking the main thread for 1s+.
   * The rAF batch means we render at most once per frame on rapid
   * navigation. */
  let _renderQueued = false;
  function renderCoalesced() {
    if (_renderQueued) return;
    _renderQueued = true;
    requestAnimationFrame(() => { _renderQueued = false; render(); });
  }
  window.addEventListener('hashchange', renderCoalesced);
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
    // If sync is configured but this device isn't paired (and hasn't
    // opted out), show the Liquid Glass login gate. The dashboard
    // still renders underneath so once paired, the merged state is
    // already in the DOM and the gate fades to reveal a live app.
    render();
    maybeShowLoginGate();
    // Auto-save safeguards. CRITICAL: these write to localStorage only
    // (GAMI.save), NOT GAMI.saveImmediate. sync.js wraps saveImmediate
    // to set pushPending=true, which gates pollOnce. If the periodic
    // 20s save fires saveImmediate, the app perpetually has
    // pushPending=true → poll is blocked → pulls only succeed in tiny
    // windows between max-wait expiry and the next periodic save. Real
    // state-changing actions (logJobApp, feed, lesson complete, etc.)
    // already call saveImmediate explicitly; this is just a safety net
    // against losing the in-memory state on a crash/reload.
    window.addEventListener('visibilitychange', () => { try { GAMI.save(state); } catch(_) {} });
    window.addEventListener('beforeunload',    () => { try { GAMI.save(state); } catch(_) {} });
    setInterval(() => { try { GAMI.save(state); } catch(_) {} }, 20000);

    // Liquid Glass tab bar — minimize-on-scroll. Passive listener for
    // jank-free scroll handling; the work is rAF-throttled.
    window.addEventListener('scroll', onScrollMinimize, { passive: true });

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

/*
 * Surgical updates triggered by sync poll. Renders the current route's
 * view into a detached buffer, then for every [data-card="…"] in the
 * live DOM finds the matching buffer card and swaps it. Cards without
 * a matching buffer card are left alone; non-card content (headers,
 * spacing) is untouched. Result: each syncable card updates one-for-
 * one with no full-view flash and no fragile node-by-node morph.
 *
 * Special-case: the pet card. Its drop-food button has a listener
 * attached inside renderDashboard's rAF that closes over the petHandle
 * returned by mountPet3D, and the 3D canvas needs to survive the swap.
 * So instead of swapping the whole pet card, we move the existing
 * canvas to the fresh card's host, swap, then re-attach the canvas.
 * The drop-food handler is re-bound by the rAF only if the host is
 * re-mounted; for simplicity here we update pet text/bars in place
 * rather than swap.
 */
function syncSurgicalUpdates(currentState) {
  const view = document.getElementById('view');
  if (!view || !window.VIEWS) return;
  // Tick the day BEFORE rendering into the buffer. render() does this at
  // the top of every paint; this path (driven by sync poll, focus, and
  // visibilitychange on iOS PWA resume) is what fires first after local
  // midnight when the app was suspended overnight. Without ticking here,
  // the dashboard would render with stale todayXP / fresh eatenTodayXP
  // and show phantom food piles until the user navigated.
  try { GAMI.tickDay(currentState); } catch (_) {}
  const route = parseHash().route;

  // Render the matching view into a detached buffer so we can pull
  // freshly-rendered cards out of it. The renderXxx side-effect rAFs
  // (3D mounts, charts) are guarded by document.contains(host) checks,
  // so they no-op for buffer DOM.
  const buf = document.createElement('section');
  buf.className = view.className;
  switch (route) {
    case 'dashboard':    VIEWS.renderDashboard(currentState, buf); break;
    case 'curriculum':   VIEWS.renderCurriculum(currentState, buf); break;
    case 'profile':      VIEWS.renderProfile(currentState, buf); break;
    case 'companies':    VIEWS.renderCompanies(currentState, buf); break;
    case 'mocks':        VIEWS.renderMocks(currentState, buf); break;
    case 'sources':      VIEWS.renderSources(currentState, buf); break;
    case 'prep':         VIEWS.renderPrep(currentState, buf); break;
    case 'review':       VIEWS.renderReview(currentState, buf); break;
    // Routes we don't sync-refresh live: flashcards (swipe in flight),
    // lesson / mock / games (interactive), coverage / infographics (Chart.js).
    default: return;
  }

  // Walk every tagged card in the live DOM. For each, find the matching
  // buffer card by data-card key and swap it in. Cards in live but not
  // buffer (e.g., reviews tile that has now hidden because counts hit 0)
  // are removed; cards in buffer but not live (newly appeared) are
  // skipped — they'll show on next navigation. The pet card is special.
  const liveCards = Array.from(view.querySelectorAll('[data-card]'));
  for (const liveCard of liveCards) {
    const key = liveCard.getAttribute('data-card');
    const bufCard = buf.querySelector(`[data-card="${key}"]`);
    if (!bufCard) continue;                  // no fresh version → leave alone

    if (key === 'pet') {
      // Refresh the right-side stats panel from the buffer's freshly-
      // rendered version (header line + panel innerHTML). The 3D canvas
      // is in the left-side host and stays untouched — animation loop
      // and drop-food (now delegated) survive the swap.
      updatePetCardInPlace(liveCard, bufCard);
      continue;
    }

    // Generic swap. The buffer card has its own freshly-attached event
    // listeners (e.g., +/− on jobapps); discarded along with the old card.
    liveCard.replaceWith(bufCard);
  }
}

// Pet update — replace the right-panel innerHTML with the freshly-rendered
// version from the buffer. The left (3D canvas) host is preserved while
// the pet's identity (stage / body / bodyHue) is unchanged. If sync
// brought in a new lifecycle state (e.g. respawn flipped teen -> baby),
// the data-pet-key stamps differ and we tear down + remount the 3D scene
// so the visual matches. Drop-food button on the swapped panel inherits
// the delegated handler in bindEvents, so it keeps working.
function updatePetCardInPlace(liveCard, bufCard) {
  if (!liveCard || !bufCard) return;
  // Update header line (status text changes with activity)
  const liveHeader = liveCard.querySelector(':scope > div:first-child');
  const bufHeader  = bufCard.querySelector(':scope > div:first-child');
  if (liveHeader && bufHeader) liveHeader.innerHTML = bufHeader.innerHTML;
  // Swap panel content
  const livePanel = liveCard.querySelector('.pet-panel');
  const bufPanel  = bufCard.querySelector('.pet-panel');
  if (livePanel && bufPanel) livePanel.innerHTML = bufPanel.innerHTML;

  // 3D rebuild on identity change. Compare data-pet-key stamps; if they
  // disagree, dispose the old canvas and mount fresh from current state.
  // Without this, sync-merged respawns leave the user looking at the
  // pre-respawn stage until they navigate away and back -- exactly the
  // bug observed on FOIEGRAS after the (deathCount, stage) merge fix.
  const liveKey = liveCard.getAttribute('data-pet-key');
  const bufKey  = bufCard.getAttribute('data-pet-key');
  // Mid-session death: if the buffer's key is the first to surface the
  // dead state, fire the modal here. Without this, vitality decaying
  // to 0 while the user sits on the dashboard would only show the
  // tombstone (after rebuild below) but never the popup, since
  // syncSurgicalUpdates skips renderDashboard's rAF mount path.
  const wasDead = /\|dead$/.test(liveKey || '');
  const isDead  = /\|dead$/.test(bufKey || '');
  if (!wasDead && isDead) {
    try {
      const st = (window.APP && window.APP.getState) ? window.APP.getState() : null;
      if (st && window.VIEWS && window.VIEWS.renderPetDeathGate) {
        window.VIEWS.renderPetDeathGate(st);
      }
    } catch (_) {}
  }
  if (liveKey !== bufKey) {
    liveCard.setAttribute('data-pet-key', bufKey || '');
    const liveHost = liveCard.querySelector('#pet-room-3d-host');
    if (liveHost) {
      if (liveHost._petHandle && typeof liveHost._petHandle.dispose === 'function') {
        try { liveHost._petHandle.dispose(); } catch (_) {}
      }
      liveHost._petHandle = null;
      liveHost.innerHTML = '';
      const st = (window.APP && window.APP.getState) ? window.APP.getState() : null;
      if (st && window.VIEWS && window.VIEWS.mountPet3D) {
        try {
          // Carry the derived `dead` predicate here too. mountPet3D
          // branches on it to render the tombstone; without it, this
          // rebuild path would always show the alive Bit even when the
          // pet card was supposed to flip to grave state.
          const newPet = { ...(st.pet || {}), lastTickDate: st.pet && st.pet.lastTickDate, autoSpawnFood: false,
                           dead: !!(window.GAMI && window.GAMI.isPetDead && window.GAMI.isPetDead(st.pet)) };
          const newHandle = window.VIEWS.mountPet3D(liveHost, newPet);
          if (newHandle) liveHost._petHandle = newHandle;
        } catch (e) { console.warn('[sync] pet rebuild after key change failed:', e); }
      }
    }
  }
}

/*
 * Minimal DOM morph. Mutates `target` so its children match `source`,
 * preserving node identity where structure matches.
 *
 * Strategy per child slot (i = 0..max):
 *   - source has more children: insert clones of the extra source children
 *   - target has more children: remove the extra target children
 *   - both present, different node types: replace
 *   - both present, text node: update nodeValue if differs
 *   - both present, element of same tag: diff attrs, recurse on children
 *
 * No keyed lists, so reordering is treated as a series of in-place edits
 * (fine for our use — sync updates are append-only for lists like
 * jobApps/history; existing rows stay in place). Inputs are skipped so
 * the user's in-flight typing isn't clobbered.
 */
function morphTree(target, source) {
  // Match attributes on root containers (e.g., className changes)
  if (target.nodeType === 1 && source.nodeType === 1) {
    syncAttrs(target, source);
  }
  const targetKids = Array.from(target.childNodes);
  const sourceKids = Array.from(source.childNodes);
  const max = Math.max(targetKids.length, sourceKids.length);
  for (let i = 0; i < max; i++) {
    const t = targetKids[i];
    const s = sourceKids[i];
    if (!s) { if (t) t.remove(); continue; }
    if (!t) { target.appendChild(s.cloneNode(true)); continue; }
    if (t.nodeType !== s.nodeType || t.nodeName !== s.nodeName) {
      target.replaceChild(s.cloneNode(true), t);
      continue;
    }
    if (t.nodeType === 3) {                       // text node
      if (t.nodeValue !== s.nodeValue) t.nodeValue = s.nodeValue;
      continue;
    }
    if (t.nodeType !== 1) continue;
    // Don't reach into form fields the user might be holding
    const tag = t.nodeName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      syncAttrs(t, s);
      continue;
    }
    // Skip subtrees we explicitly don't want morphed (e.g., 3D canvases
    // managed externally), marked with data-morph-skip.
    if (t.hasAttribute && t.hasAttribute('data-morph-skip')) continue;
    morphTree(t, s);
  }
}
function syncAttrs(t, s) {
  // Remove attrs that aren't on source
  const tAttrs = Array.from(t.attributes);
  for (const a of tAttrs) {
    if (!s.hasAttribute(a.name)) t.removeAttribute(a.name);
  }
  // Add / update from source
  const sAttrs = Array.from(s.attributes);
  for (const a of sAttrs) {
    if (t.getAttribute(a.name) !== a.value) t.setAttribute(a.name, a.value);
  }
}

// Liquid Glass sign-in gate. Shown on boot when:
//   - the Cloudflare Worker URL is configured (window.SYNC.status().configured)
//   - the device hasn't paired (no code in localStorage)
//   - the user hasn't explicitly opted out via "Use locally only"
// Once paired or skipped, sync.js owns the rest (poll/push loop).
function maybeShowLoginGate() {
  const unlock = () => {
    // No gate needed (or sync misconfigured) — make sure the UI shows.
    document.documentElement.classList.remove('lg-locked');
  };
  try {
    if (!window.SYNC || !window.VIEWS || !window.VIEWS.renderLoginGate) {
      unlock(); return;
    }
    const s = window.SYNC.status();
    if (!s || !s.configured) { unlock(); return; }
    if (s.code) { unlock(); return; }
    if (localStorage.getItem('fdeprep.syncSkip.v1')) { unlock(); return; }
    VIEWS.renderLoginGate(() => {
      // After pair/skip — re-render so merged remote state shows.
      try { render(); } catch (_) {}
    });
  } catch (_) { unlock(); }
}

// Mobile nav is now the floating Liquid Glass tab bar (built by
// buildTabbar). The legacy hamburger / slide-over sidebar has been
// removed from the layout. This function is kept as a no-op so older
// init paths still resolve; safe to delete later.
function bindMobileNav() { /* no-op — see buildTabbar() */ }

// Run init now if DOM already parsed, else when it is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

return {
  render, afterStateChange,
  getState: () => state,
  // Hard-replace + full re-render. Used by the login gate after a pair
  // (one-time event where a route refresh is appropriate).
  setState: (next) => {
    state = next;
    GAMI.saveImmediate(state);
    render();
  },
  // Soft-replace from sync poll: swap state in place, persist locally,
  // refresh header chips, AND re-render the current view through a
  // brief opacity crossfade so list content (jobApps, completed
  // lessons, history) updates in real time without the harsh blank
  // flash a naive innerHTML swap produces.
  setStateFromSync: (next) => {
    state = next;
    // CRITICAL: write to localStorage directly, NOT via GAMI.saveImmediate.
    // sync.js wraps saveImmediate to debounce-push to remote. Calling
    // the wrapped version here triggers a fresh push every poll → infinite
    // ping-pong that burns the 1000 KV-writes/day free tier.
    try { localStorage.setItem('fdeprep.v1', JSON.stringify(state)); } catch (_) {}
    try { updateHeader(); } catch (_) {}
    // Surgical per-card updates: find each card that depends on synced
    // state and swap just its DOM. Avoids the brittle generic morph and
    // doesn't disturb the rest of the view (scroll position, focus, 3D
    // canvases). Each updater is a no-op if its card isn't on screen.
    try { syncSurgicalUpdates(state); } catch (e) { console.warn('[sync] surgical update failed:', e); }
  },
};
})();
