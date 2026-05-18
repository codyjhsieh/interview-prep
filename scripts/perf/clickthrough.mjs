/* Clickthrough perf driver.
 *
 * Walks a scripted journey through the app, measuring FPS + long tasks +
 * layout shifts + heap on each route, then writes a markdown report.
 *
 * Run with:
 *   npm run perf            # default: localhost, 4x CPU throttle, headless
 *   npm run perf -- --headed
 *   npm run perf -- --throttle 1
 *
 * The driver injects scripts/perf/agent.js before any site script. The
 * agent exposes window.__perf.{startRoute, endRoute, navTiming}.
 *
 * The journey is intentionally explicit (not auto-crawled): we want
 * stable, reproducible results, not whatever links happened to appear
 * on screen. Add new routes by appending to JOURNEY below.
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const argv = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
};
const has = (flag) => argv.includes(flag);

const URL = arg('--url', 'http://localhost:5500/');
const CPU_THROTTLE = Number(arg('--throttle', '4'));
const HEADED = has('--headed');
const DWELL_MS = Number(arg('--dwell', '3000'));
const REPORT_PATH = path.join(ROOT, 'scripts/perf/perf-report.md');
const JSON_PATH   = path.join(ROOT, 'scripts/perf/perf-report.json');

/* Journey definition. Each step:
 *   - label: report row label
 *   - go: function(page) — performs the navigation/interaction
 *   - wait: optional wait-for selector or ms after go()
 *   - dwell: optional override of DWELL_MS during which FPS samples are
 *     collected (longer for routes with ongoing animations like the pet)
 */
/* Helpers used inside steps. Each runs in the Playwright Node context;
 * use page.evaluate() to drive the page. */

/* Smooth-scrolls the viewport from current Y to targetY over durMs.
 * Frames are driven by rAF inside the page so we measure real paint
 * cost, not the discrete jumps that page.mouse.wheel() produces. */
/* Click a CSS selector inside the page. Quietly no-ops if not found,
 * so journey steps that depend on data-driven elements (e.g. a card
 * that only appears after some setup) don't break the whole run. */
async function clickSel(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.click();
  }, sel);
}

/* Click the Nth matching element (0-indexed). */
async function clickNth(page, sel, n) {
  await page.evaluate(({ s, i }) => {
    const all = document.querySelectorAll(s);
    if (all[i]) all[i].click();
  }, { s: sel, i: n });
}

/* Type into an input/textarea, dispatching real events so listeners fire. */
async function typeInto(page, sel, text) {
  await page.evaluate(({ s, t }) => {
    const el = document.querySelector(s);
    if (!el) return;
    el.focus();
    el.value = t;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { s: sel, t: text });
}

async function pageScroll(page, targetYFrac, durMs = 1500) {
  await page.evaluate(({ frac, dur }) => {
    return new Promise((resolve) => {
      const start = window.scrollY;
      const endY = (document.documentElement.scrollHeight - window.innerHeight) * frac;
      const t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const eased = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
        window.scrollTo(0, start + (endY - start) * eased);
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { frac: targetYFrac, dur: durMs });
}

/* JOURNEY — an extensive e2e sequence covering every real user flow.
 *
 * Step shape:
 *   { label, go(page), wait?, dwell?, timeout?, kind }
 *
 * Kinds:
 *   load          initial page load
 *   nav           hash navigation (no continuous motion)
 *   scroll        rAF-driven scroll tween (continuous motion -> tightest FPS test)
 *   interaction   any click / type / drag (single-event reaction)
 *   stress        rapid bursts (multiple events back-to-back)
 *
 * Steps quietly no-op if a selector isn't found, so the journey doesn't
 * abort when a card / button isn't yet rendered. */
const JOURNEY = [
  {
    label: 'cold-load',
    go: async () => {},               // driver does the initial goto
    dwell: 4000,
    kind: 'load',
  },

  /* ------------------------- Curriculum ------------------------- */
  {
    label: 'curriculum:nav',
    go: (page) => page.evaluate(() => { location.hash = '#curriculum'; }),
    wait: 'h1:has-text("Curriculum")',
    kind: 'nav',
  },
  {
    label: 'curriculum:scroll-down',
    go: (page) => pageScroll(page, 1.0, 1500),
    dwell: 1700,
    kind: 'scroll',
  },
  {
    label: 'curriculum:scroll-up',
    go: (page) => pageScroll(page, 0.0, 1500),
    dwell: 1700,
    kind: 'scroll',
  },

  /* ----------------------- Category page ------------------------ */
  {
    label: 'category/coding:nav',
    go: (page) => page.evaluate(() => { location.hash = '#category/coding'; }),
    wait: 'h1:has-text("Coding & Algorithms")',
    kind: 'nav',
  },
  {
    label: 'category/coding:scroll',
    go: (page) => pageScroll(page, 1.0, 2000),
    dwell: 2200,
    kind: 'scroll',
  },

  /* --------------- Lesson modal: open / scroll / close ---------- */
  {
    label: 'lesson:open',
    go: (page) => page.evaluate(() => {
      const btn = document.querySelector('[data-open]');
      if (btn) btn.click();
    }),
    wait: '.fixed.inset-0 h2',
    dwell: 3500,
    kind: 'interaction',
  },
  {
    label: 'lesson:scroll-down',
    go: (page) => page.evaluate(() => {
      return new Promise((resolve) => {
        // Modal wrapper is the scroll container post-fix.
        const wrap = document.querySelector('.fixed.inset-0[class*="z-4"]') || document.querySelector('.fixed.inset-0');
        if (!wrap) return resolve();
        const start = wrap.scrollTop;
        const end = wrap.scrollHeight - wrap.clientHeight;
        const t0 = performance.now(), dur = 1800;
        function step(t) {
          const k = Math.min(1, (t - t0) / dur);
          wrap.scrollTop = start + (end - start) * k;
          if (k < 1) requestAnimationFrame(step);
          else resolve();
        }
        requestAnimationFrame(step);
      });
    }),
    dwell: 2000,
    kind: 'scroll',
  },
  {
    label: 'lesson:close',
    go: (page) => page.evaluate(() => {
      const x = document.querySelector('[data-close="lesson"]');
      if (x) x.click();
    }),
    kind: 'interaction',
  },

  /* ----------------------- Flashcards --------------------------- */
  {
    label: 'flashcards:nav',
    go: (page) => page.evaluate(() => { location.hash = '#flashcards'; }),
    wait: '.flashcard',
    kind: 'nav',
  },
  {
    label: 'flashcards:flip-x2',
    go: async (page) => {
      await page.evaluate(() => document.querySelector('.flashcard-inner')?.click());
      await new Promise(r => setTimeout(r, 900));
      await page.evaluate(() => document.querySelector('.flashcard-inner')?.click());
    },
    dwell: 2200,
    kind: 'interaction',
  },
  {
    label: 'flashcards:rate-easy',
    go: (page) => page.evaluate(() => {
      // Flip first, then rate
      const inner = document.querySelector('.flashcard-inner');
      if (inner) inner.click();
      setTimeout(() => {
        document.querySelector('[data-rate="4"]')?.click();
      }, 200);
    }),
    wait: '.flashcard',
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'flashcards:scroll',
    go: (page) => pageScroll(page, 1.0, 1500),
    dwell: 1700,
    kind: 'scroll',
  },

  /* ------------------------ Companies --------------------------- */
  {
    label: 'companies:nav',
    go: (page) => page.evaluate(() => { location.hash = '#companies'; }),
    wait: 'h1:has-text("Companies")',
    timeout: 20000,                 // 138-card grid is genuinely slow under 4×
    dwell: 3500,
    kind: 'nav',
  },
  {
    label: 'companies:scroll-half',
    go: (page) => pageScroll(page, 0.5, 1800),
    dwell: 2000,
    kind: 'scroll',
  },
  {
    label: 'companies:scroll-bottom',
    go: (page) => pageScroll(page, 1.0, 2000),
    dwell: 2200,
    kind: 'scroll',
  },
  {
    label: 'companies:scroll-top',
    go: (page) => pageScroll(page, 0.0, 1500),
    dwell: 1700,
    kind: 'scroll',
  },

  /* ------------------------ Dashboard --------------------------- */
  {
    label: 'dashboard:nav',
    go: (page) => page.evaluate(() => { location.hash = '#dashboard'; }),
    wait: '#view',
    dwell: 5000,                    // pet 3D + heatmap settle
    kind: 'nav',
  },
  {
    label: 'dashboard:scroll',
    go: (page) => pageScroll(page, 1.0, 2000),
    dwell: 2200,
    kind: 'scroll',
  },

  /* ----------------------- Other routes ------------------------- */
  {
    label: 'review:nav',
    go: (page) => page.evaluate(() => { location.hash = '#review'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'prep:nav',
    go: (page) => page.evaluate(() => { location.hash = '#prep'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'mocks:nav',
    go: (page) => page.evaluate(() => { location.hash = '#mocks'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'infographics:nav',
    go: (page) => page.evaluate(() => { location.hash = '#infographics'; }),
    wait: '#view',
    dwell: 3500,
    kind: 'nav',
  },

  /* ---- Pill nav tour ----
   * Tap the actual tab-bar items (mobile pill nav at <900px viewport).
   * This is the user's real navigation path on mobile -- captures any
   * cost the plain `location.hash =` jumps don't, like the click handler,
   * scroll-to-top, nav-minimized class toggle, and pill-morph state.
   * Five taps in ~2.5s simulates someone bouncing between sections. */
  {
    label: 'pillnav:tour',
    go: async (page) => {
      const tabs = ['dashboard', 'curriculum', 'flashcards', 'companies', 'dashboard'];
      for (const route of tabs) {
        await page.evaluate((r) => {
          const tab = document.querySelector(`#liquid-tabbar .tab-item[data-route="${r}"]`);
          if (tab) tab.click();
        }, route);
        await new Promise(res => setTimeout(res, 450));
      }
    },
    dwell: 1500,
    kind: 'interaction',
  },

  /* ------------------ Additional category drill-down ----------------- */
  {
    label: 'category/ai:nav',
    go: (page) => page.evaluate(() => { location.hash = '#category/ai'; }),
    wait: 'h1:has-text("AI / LLM Production")',
    kind: 'nav',
  },
  {
    label: 'category/ai:scroll',
    go: (page) => pageScroll(page, 1.0, 1800),
    dwell: 2000,
    kind: 'scroll',
  },
  {
    label: 'category/ai:expand-module',
    go: (page) => clickNth(page, '#mod-list details > summary', 2),
    dwell: 1000,
    kind: 'interaction',
  },
  {
    label: 'category/sysd:nav',
    go: (page) => page.evaluate(() => { location.hash = '#category/sysd'; }),
    wait: 'h1:has-text("System Design")',
    kind: 'nav',
  },
  {
    label: 'category/behav:nav',
    go: (page) => page.evaluate(() => { location.hash = '#category/behav'; }),
    wait: 'h1:has-text("Behavioral")',
    kind: 'nav',
  },

  /* -------------------- Multiple lesson types ------------------------ */
  {
    label: 'lesson-2:open-concept',
    go: async (page) => {
      // Navigate to AI category and open the 2nd lesson (different lesson body).
      await page.evaluate(() => { location.hash = '#category/ai'; });
      await new Promise(r => setTimeout(r, 600));
      await clickNth_inPage(page, '[data-open]', 1);
    },
    wait: '.fixed.inset-0 h2',
    dwell: 2500,
    kind: 'interaction',
  },
  {
    label: 'lesson-2:click-mcq',
    go: async (page) => {
      // Click an answer option if it's an MCQ-style activity.
      await clickSel(page, '[data-opt="0"]');
    },
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'lesson-2:close',
    go: (page) => clickSel(page, '[data-close="lesson"]'),
    kind: 'interaction',
  },

  /* ----------------- Full flashcard review session ------------------- */
  {
    label: 'flashcards:back',
    go: (page) => page.evaluate(() => { location.hash = '#flashcards'; }),
    wait: '.flashcard',
    kind: 'nav',
  },
  {
    label: 'flashcards:rate-good-x2',
    go: async (page) => {
      // Flip then rate, twice, like a real review session.
      for (let i = 0; i < 2; i++) {
        await clickSel(page, '.flashcard-inner');
        await new Promise(r => setTimeout(r, 450));
        await clickSel(page, '[data-rate="3"]');
        await new Promise(r => setTimeout(r, 600));
      }
    },
    wait: '.flashcard',
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'flashcards:rate-again',
    go: async (page) => {
      await clickSel(page, '.flashcard-inner');
      await new Promise(r => setTimeout(r, 350));
      await clickSel(page, '[data-rate="1"]');
    },
    wait: '.flashcard',
    dwell: 1500,
    kind: 'interaction',
  },

  /* ----------------- Companies search + filter + drill --------------- */
  {
    label: 'companies:back',
    go: (page) => page.evaluate(() => { location.hash = '#companies'; }),
    wait: 'h1:has-text("Companies")',
    timeout: 20000,
    dwell: 2500,
    kind: 'nav',
  },
  {
    label: 'companies:search-type',
    go: async (page) => {
      const sel = '#companies-search, input[placeholder*="Search"], input[type="search"]';
      await typeInto(page, sel, 'ai');
    },
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'companies:clear-search',
    go: (page) => typeInto(page, '#companies-search, input[placeholder*="Search"], input[type="search"]', ''),
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'companies:filter-ai',
    go: (page) => clickSel(page, '[data-vfilter="ai"], [data-filter="ai"]'),
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'companies:filter-all',
    go: (page) => clickSel(page, '[data-vfilter="all"], [data-filter="all"]'),
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'companies:open-first',
    go: (page) => clickSel(page, '#co-grid > a.card'),
    wait: '#view',
    dwell: 2000,
    kind: 'interaction',
  },
  {
    label: 'company-detail:scroll',
    go: (page) => pageScroll(page, 1.0, 1500),
    dwell: 1700,
    kind: 'scroll',
  },
  {
    label: 'companies:back-from-detail',
    go: (page) => page.evaluate(() => { location.hash = '#companies'; }),
    wait: 'h1:has-text("Companies")',
    timeout: 20000,
    dwell: 2000,
    kind: 'nav',
  },

  /* --------------------- Dashboard interactions ---------------------- */
  {
    label: 'dashboard:back',
    go: (page) => page.evaluate(() => { location.hash = '#dashboard'; }),
    wait: '#view',
    dwell: 3500,
    kind: 'nav',
  },
  {
    label: 'dashboard:drop-food',
    go: (page) => clickSel(page, '[data-pet-drop-food]:not([disabled])'),
    dwell: 2000,
    kind: 'interaction',
  },
  {
    label: 'dashboard:scroll-down-up',
    go: async (page) => {
      await pageScroll(page, 1.0, 1500);
      await new Promise(r => setTimeout(r, 250));
      await pageScroll(page, 0.0, 1500);
    },
    dwell: 1800,
    kind: 'scroll',
  },

  /* ----------------------- Sheet + nav stress ------------------------ */
  {
    label: 'more-sheet:open',
    go: (page) => clickSel(page, '[data-more-toggle]'),
    wait: '#more-sheet',
    dwell: 1500,
    kind: 'interaction',
  },
  {
    label: 'more-sheet:close',
    go: (page) => page.evaluate(() => {
      const scrim = document.querySelector('#more-sheet [data-close], #more-sheet .more-sheet-scrim');
      if (scrim) scrim.click();
    }),
    dwell: 1200,
    kind: 'interaction',
  },
  {
    label: 'pillnav:rapid',
    go: async (page) => {
      // 8 rapid taps — stress test for view-swap cost.
      const seq = ['curriculum','flashcards','companies','dashboard','curriculum','flashcards','companies','dashboard'];
      for (const r of seq) {
        await page.evaluate((route) => {
          const t = document.querySelector(`#liquid-tabbar .tab-item[data-route="${route}"]`);
          if (t) t.click();
        }, r);
        await new Promise(res => setTimeout(res, 220));
      }
    },
    dwell: 1500,
    kind: 'stress',
  },
  {
    label: 'hash-burst',
    go: async (page) => {
      // 6 hash changes back-to-back without click handlers (pure router cost).
      const routes = ['#curriculum','#flashcards','#companies','#review','#prep','#dashboard'];
      for (const h of routes) {
        await page.evaluate((hh) => { location.hash = hh; }, h);
        await new Promise(res => setTimeout(res, 180));
      }
    },
    dwell: 1500,
    kind: 'stress',
  },

  /* ------------------------ Long-list scrolls ------------------------ */
  {
    label: 'curriculum:scroll-stress',
    go: async (page) => {
      await page.evaluate(() => { location.hash = '#curriculum'; });
      await new Promise(r => setTimeout(r, 600));
      // Bottom, top, bottom -- three full scrolls in succession.
      await pageScroll(page, 1.0, 1200);
      await new Promise(r => setTimeout(r, 200));
      await pageScroll(page, 0.0, 1200);
      await new Promise(r => setTimeout(r, 200));
      await pageScroll(page, 1.0, 1200);
    },
    dwell: 1500,
    kind: 'scroll',
  },

  /* ----------------- Fade-in window measurements --------------------- */
  /* Tight 600ms dwells -- just the fade animation, no idle tail. Captures
   * FPS during the visual entrance specifically. If the GPU layer is set
   * up correctly via will-change, every frame here should be ~16ms. */
  {
    label: 'fade:curriculum',
    go: async (page) => {
      // Force a hash change to dashboard first so curriculum is a "new" route
      // and fade-in fires (rather than no-op if we were already there).
      await page.evaluate(() => { location.hash = '#dashboard'; });
      await new Promise(r => setTimeout(r, 200));
      await page.evaluate(() => { location.hash = '#curriculum'; });
    },
    wait: 'h1:has-text("Curriculum")',
    dwell: 600,
    kind: 'interaction',
  },
  {
    label: 'fade:companies',
    go: async (page) => {
      await page.evaluate(() => { location.hash = '#dashboard'; });
      await new Promise(r => setTimeout(r, 200));
      await page.evaluate(() => { location.hash = '#companies'; });
    },
    wait: 'h1:has-text("Companies")',
    timeout: 20000,
    dwell: 600,
    kind: 'interaction',
  },
  {
    label: 'fade:flashcards',
    go: async (page) => {
      await page.evaluate(() => { location.hash = '#dashboard'; });
      await new Promise(r => setTimeout(r, 200));
      await page.evaluate(() => { location.hash = '#flashcards'; });
    },
    wait: '.flashcard',
    dwell: 600,
    kind: 'interaction',
  },
  {
    label: 'fade:lesson-modal',
    go: async (page) => {
      // Open lesson modal (uses ANIM.viewIn fade-in-up).
      await page.evaluate(() => { location.hash = '#category/coding'; });
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => document.querySelector('[data-open]')?.click());
    },
    wait: '.fixed.inset-0 h2',
    dwell: 700,
    kind: 'interaction',
  },

  /* ------------------ Other secondary routes ------------------------- */
  {
    label: 'sources:nav',
    go: (page) => page.evaluate(() => { location.hash = '#sources'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'coverage:nav',
    go: (page) => page.evaluate(() => { location.hash = '#coverage'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'profile:nav',
    go: (page) => page.evaluate(() => { location.hash = '#profile'; }),
    wait: '#view',
    kind: 'nav',
  },
  {
    label: 'stories:nav',
    go: (page) => page.evaluate(() => { location.hash = '#stories'; }),
    wait: '#view',
    kind: 'nav',
  },
];

/* Helper used by lesson-2:open-concept above. Defined down here so we
 * don't have to forward-reference clickNth in the JOURNEY array. */
function clickNth_inPage(page, sel, n) {
  return clickNth(page, sel, n);
}

async function main() {
  const agentSrc = await readFile(path.join(__dirname, 'agent.js'), 'utf8');
  const browser = await chromium.launch({
    headless: !HEADED,
    // performance.memory is gated behind the precise-memory-info flag in
    // Chromium. Without this we get null heap deltas in the report.
    args: ['--enable-precise-memory-info'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },     // iPhone 14 portrait
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  // Inject agent BEFORE any site script.
  await context.addInitScript({ content: agentSrc });
  const page = await context.newPage();

  // CPU throttle via CDP — matches the Lighthouse Moto G Power profile.
  if (CPU_THROTTLE > 1) {
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });
  }

  console.log(`▶ ${URL}  CPU=${CPU_THROTTLE}x  headed=${HEADED}`);
  const startWall = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  // Paint timing entries aren't queryable until at least one rAF after
  // load. Wait a beat before reading.
  await page.waitForTimeout(500);
  const navTiming = await page.evaluate(() => window.__perf.navTiming());
  const resources = await page.evaluate(() => window.__perf.resourceBreakdown());
  console.log(`  FCP ${Math.round(navTiming.firstContentfulPaint)}ms · DOMContentLoaded ${Math.round(navTiming.domContentLoaded)}ms · load ${Math.round(navTiming.loadEvent)}ms · resources ${resources.totalCount} (${(resources.totalBytes/1024).toFixed(0)}KB)`);

  const rows = [];
  for (const step of JOURNEY) {
    process.stdout.write(`  ${step.label.padEnd(22)} `);
    try {
      // Capture nav-to-paint: time from when go() starts to when the
      // wait selector first resolves. This is the user-perceived load
      // latency for each route (click -> content visible).
      const tGo = Date.now();
      await step.go(page);
      let navToPaintMs = null;
      if (step.wait) {
        if (typeof step.wait === 'string') {
          await page.waitForSelector(step.wait, { timeout: step.timeout || 15000 });
          navToPaintMs = Date.now() - tGo;
        } else {
          await new Promise(r => setTimeout(r, step.wait));
        }
      } else {
        // No wait selector -- treat nav-to-paint as time-to-go-complete
        navToPaintMs = Date.now() - tGo;
      }
      // Settle for one frame after the wait.
      await page.waitForTimeout(150);
      await page.evaluate((label) => window.__perf.startRoute(label), step.label);
      await page.waitForTimeout(step.dwell || DWELL_MS);
      const m = await page.evaluate(() => window.__perf.endRoute());
      if (m) {
        m.kind = step.kind;
        m.navToPaintMs = navToPaintMs;
        rows.push(m);
        const status = m.fps < 30 ? '✗' : m.fps < 50 ? '~' : '✓';
        const heapStr = m.heapDelta != null
          ? `${m.heapDelta >= 0 ? '+' : ''}${(m.heapDelta / 1e6).toFixed(2)}MB`
          : '-';
        const navStr = navToPaintMs != null ? `${navToPaintMs}ms` : '-';
        console.log(`${status} fps=${m.fps.toFixed(1)}  p95frame=${m.p95Ms.toFixed(1)}ms  paint=${navStr.padStart(6)}  longTasks=${m.longTaskCount}  heapΔ=${heapStr}`);
      } else {
        console.log('— no metrics');
      }
    } catch (err) {
      console.log(`✗ failed: ${err.message}`);
      rows.push({ label: step.label, error: err.message });
    }
  }

  await browser.close();

  /* Write reports */
  const report = {
    capturedAt: new Date().toISOString(),
    url: URL,
    cpuThrottle: CPU_THROTTLE,
    viewport: '390x844 @2x',
    walltimeSec: ((Date.now() - startWall) / 1000).toFixed(1),
    navTiming,
    resources,
    rows,
  };
  await writeFile(JSON_PATH, JSON.stringify(report, null, 2));
  await writeFile(REPORT_PATH, renderMarkdown(report));
  console.log(`\n📄 ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`📄 ${path.relative(ROOT, JSON_PATH)}`);
}

/* ASCII bar (10 cells wide) showing what % of frames landed in each
 * duration bucket. Quick visual: lots of █ on the left = smooth, lots
 * on the right = janky. */
function frameBar(buckets) {
  if (!buckets) return '';
  const order = ['<17', '17-33', '33-50', '50-100', '>=100'];
  const glyphs = { '<17': '█', '17-33': '▓', '33-50': '▒', '50-100': '░', '>=100': '·' };
  const total = order.reduce((s, k) => s + buckets[k], 0);
  if (!total) return '';
  let out = '';
  for (const k of order) {
    const cells = Math.round((buckets[k] / total) * 10);
    out += glyphs[k].repeat(cells);
  }
  return out.padEnd(10).slice(0, 10);
}

function renderMarkdown(r) {
  const fmt = (n, digits = 1) => n == null ? '—' : Number(n).toFixed(digits);
  const fpsBadge = (f) => f == null ? '—' : f < 30 ? `**${fmt(f)}** ✗` : f < 50 ? `${fmt(f)} ~` : `${fmt(f)} ✓`;
  const heapStr = (b) => b == null ? '—' : ((b >= 0 ? '+' : '') + (b / 1e6).toFixed(1) + ' MB');

  const ok = (m) => m && !m.error;
  const rows = r.rows.filter(ok);

  /* Aggregates by kind */
  const byKind = {};
  for (const m of rows) {
    const k = m.kind || 'other';
    (byKind[k] ||= []).push(m);
  }
  const avgFps = (arr) => arr.reduce((s, m) => s + m.fps, 0) / Math.max(1, arr.length);
  const avgP95 = (arr) => arr.reduce((s, m) => s + m.p95Ms, 0) / Math.max(1, arr.length);

  /* Worst-of lists */
  const worstFps = [...rows].sort((a, b) => a.fps - b.fps).slice(0, 3);
  const worstLongTask = [...rows].sort((a, b) => b.maxLongTaskMs - a.maxLongTaskMs).slice(0, 3).filter(m => m.maxLongTaskMs > 0);
  const heapWinners = [...rows].filter(m => m.heapDelta != null && m.heapDelta > 0).sort((a, b) => b.heapDelta - a.heapDelta).slice(0, 3);
  const totalLong = rows.reduce((s, m) => s + (m.longTaskCount || 0), 0);
  const totalLongMs = rows.reduce((s, m) => s + (m.longTaskMs || 0), 0);
  const totalHeapDelta = rows.reduce((s, m) => s + (m.heapDelta || 0), 0);

  const lines = [];
  lines.push(`# Clickthrough perf report`);
  lines.push('');
  lines.push(`> Automated journey through every major route — nav, scroll, and interaction — with frame-by-frame sampling under ${r.cpuThrottle}× CPU throttling. Generated by [scripts/perf/clickthrough.mjs](clickthrough.mjs).`);
  lines.push('');
  lines.push(`- **Captured:** ${r.capturedAt}`);
  lines.push(`- **URL:** ${r.url}`);
  lines.push(`- **CPU throttle:** ${r.cpuThrottle}× (Lighthouse Moto G Power ≈ 4×)`);
  lines.push(`- **Viewport:** ${r.viewport}`);
  lines.push(`- **Wall time:** ${r.walltimeSec}s`);
  lines.push(`- **Steps:** ${r.rows.length} (${rows.length} captured, ${r.rows.length - rows.length} errored)`);
  lines.push('');

  /* ---- TL;DR ---- */
  lines.push(`## TL;DR`);
  lines.push('');
  const headline = [];
  if (worstFps[0]) headline.push(`worst route \`${worstFps[0].label}\` at **${fmt(worstFps[0].fps)} fps**`);
  if (worstLongTask[0]) headline.push(`longest single task **${fmt(worstLongTask[0].maxLongTaskMs)} ms** during \`${worstLongTask[0].label}\``);
  if (heapWinners[0]) headline.push(`biggest heap growth +**${(heapWinners[0].heapDelta / 1e6).toFixed(1)} MB** on \`${heapWinners[0].label}\``);
  if (headline.length) lines.push('Across the journey: ' + headline.join('; ') + '.');
  lines.push('');
  lines.push(`Total long tasks: **${totalLong}** (cumulative blocking **${fmt(totalLongMs, 0)} ms**). Net heap growth: **${heapStr(totalHeapDelta)}**.`);
  lines.push('');

  /* ====================== LOADING SECTION ====================== */
  lines.push(`# 📥 Loading`);
  lines.push('');
  lines.push(`*How fast the page becomes usable — initial paint, request waterfall, per-route nav latency, and what's hitting the network.*`);
  lines.push('');

  // ---- Initial paint ----
  lines.push(`## Initial paint timings`);
  lines.push('');
  lines.push(`| Metric | Value | Verdict |`);
  lines.push(`|---|---|---|`);
  const fcp = r.navTiming.firstContentfulPaint || 0;
  const fcpVerdict = fcp < 1800 ? '✓ good' : fcp < 3000 ? '~ needs work' : '✗ poor';
  lines.push(`| First Contentful Paint | ${fmt(fcp)} ms | ${fcpVerdict} |`);
  lines.push(`| DOM Interactive | ${fmt(r.navTiming.domInteractive)} ms | — |`);
  lines.push(`| DOMContentLoaded | ${fmt(r.navTiming.domContentLoaded)} ms | — |`);
  lines.push(`| load event | ${fmt(r.navTiming.loadEvent)} ms | — |`);
  lines.push('');

  // ---- Network waterfall slices (cold load) ----
  lines.push(`## Cold-load network slices`);
  lines.push('');
  lines.push(`Time spent in each phase of the very first navigation.`);
  lines.push('');
  lines.push(`| Phase | ms |`);
  lines.push(`|---|---|`);
  lines.push(`| DNS lookup | ${fmt(r.navTiming.dnsMs)} |`);
  lines.push(`| Connect (TCP + TLS) | ${fmt(r.navTiming.connectMs)} |`);
  lines.push(`| TTFB (time to first byte) | ${fmt(r.navTiming.ttfbMs)} |`);
  lines.push(`| Response download | ${fmt(r.navTiming.responseMs)} |`);
  lines.push('');

  // ---- Resource breakdown by type ----
  if (r.resources) {
    lines.push(`## Resources by type`);
    lines.push('');
    lines.push(`Everything fetched during this run, grouped by initiator. Big totals here are the easiest targets for code-splitting / deferring.`);
    lines.push('');
    lines.push(`| Type | Count | Bytes | Cumulative load ms |`);
    lines.push(`|---|---|---|---|`);
    for (const [k, v] of Object.entries(r.resources.byType)) {
      if (!v.count) continue;
      lines.push(`| ${k} | ${v.count} | ${(v.bytes / 1024).toFixed(1)} KB | ${fmt(v.ms, 0)} |`);
    }
    lines.push(`| **Total** | **${r.resources.totalCount}** | **${(r.resources.totalBytes / 1024).toFixed(1)} KB** | — |`);
    lines.push('');

    // ---- Slowest individual resources ----
    if (r.resources.slowest && r.resources.slowest.length) {
      lines.push(`## Slowest individual resources`);
      lines.push('');
      lines.push(`| # | Resource | Type | ms | Bytes | Cached |`);
      lines.push(`|---|---|---|---|---|---|`);
      r.resources.slowest.forEach((s, i) => {
        const shortName = s.name.length > 60 ? s.name.slice(0, 57) + '...' : s.name;
        lines.push(`| ${i + 1} | \`${shortName}\` | ${s.type} | ${fmt(s.ms, 0)} | ${(s.bytes / 1024).toFixed(1)} KB | ${s.cached ? '✓' : ''} |`);
      });
      lines.push('');
    }
  }

  // ---- Per-route nav-to-paint latency ----
  const navRows = rows.filter(m => m.navToPaintMs != null && m.kind !== 'load');
  if (navRows.length) {
    lines.push(`## Per-route nav-to-paint`);
    lines.push('');
    lines.push(`Time from \`go()\` (click / hash-change) to when the route's expected content selector first resolves. This is the user-perceived "click → content visible" latency, NOT FPS.`);
    lines.push('');
    lines.push(`| Step | Kind | Nav-to-paint | Verdict |`);
    lines.push(`|---|---|---|---|`);
    const sorted = [...navRows].sort((a, b) => b.navToPaintMs - a.navToPaintMs);
    for (const m of sorted) {
      const v = m.navToPaintMs < 200 ? '✓' : m.navToPaintMs < 600 ? '~' : '✗';
      lines.push(`| \`${m.label}\` | ${m.kind} | ${m.navToPaintMs} ms | ${v} |`);
    }
    lines.push('');
    lines.push(`Verdict bands: ✓ <200ms (snappy) · ~ 200-600ms (perceptible) · ✗ ≥600ms (visible lag).`);
    lines.push('');
  }

  /* ====================== FPS / SMOOTHNESS SECTION ====================== */
  lines.push(`# 🎞 FPS / Smoothness`);
  lines.push('');
  lines.push(`*Frame-budget pressure once a route is rendered — sustained FPS, p95 frame duration, frame-distribution shape.*`);
  lines.push('');

  /* ---- By kind ---- */
  lines.push(`## Averages by interaction kind`);
  lines.push('');
  lines.push(`| Kind | Routes sampled | Avg FPS | Avg p95 frame | Total long tasks |`);
  lines.push(`|---|---|---|---|---|`);
  const kindOrder = ['load', 'nav', 'scroll', 'interaction'];
  for (const k of kindOrder) {
    const arr = byKind[k] || [];
    if (!arr.length) continue;
    const fpsAvg = avgFps(arr);
    const p95Avg = avgP95(arr);
    const lt = arr.reduce((s, m) => s + (m.longTaskCount || 0), 0);
    lines.push(`| \`${k}\` | ${arr.length} | ${fpsBadge(fpsAvg)} | ${fmt(p95Avg)} ms | ${lt} |`);
  }
  lines.push('');
  lines.push(`Interpretation: the kind with the worst FPS is what's blocking real user-perceived smoothness most often. *scroll* worse than *nav* points at paint / IO observer cost; *interaction* worse than *nav* points at handler / re-render cost.`);
  lines.push('');

  /* ---- Per-step table with frame distribution ---- */
  lines.push(`## Per-step detail`);
  lines.push('');
  lines.push(`Frame distribution glyphs: █ <17ms (60fps) · ▓ 17–33ms · ▒ 33–50ms · ░ 50–100ms · · ≥100ms (drops). 10-cell bar represents 100% of sampled frames.`);
  lines.push('');
  lines.push(`| Step | Kind | FPS | p95 / max frame | Long tasks (ms) | Heap Δ | Frame dist |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  for (const m of r.rows) {
    if (m.error) {
      lines.push(`| \`${m.label}\` | ${m.kind || '—'} | ERROR | | | | ${m.error} |`);
      continue;
    }
    const lt = m.longTaskCount > 0 ? `${m.longTaskCount} (${fmt(m.longTaskMs, 0)} ms)` : '0';
    lines.push(`| \`${m.label}\` | ${m.kind || '—'} | ${fpsBadge(m.fps)} | ${fmt(m.p95Ms)} / ${fmt(m.maxMs)} ms | ${lt} | ${heapStr(m.heapDelta)} | \`${frameBar(m.buckets)}\` |`);
  }
  lines.push('');

  /* ---- FPS Worst-of ---- */
  lines.push(`## Lowest sustained FPS`);
  lines.push('');
  for (let i = 0; i < worstFps.length; i++) {
    const m = worstFps[i];
    lines.push(`${i + 1}. \`${m.label}\` — **${fmt(m.fps)} fps** · p95 frame ${fmt(m.p95Ms)} ms · ${m.longTaskCount} long tasks`);
  }
  lines.push('');

  /* ====================== MEMORY + LONG TASKS SECTION ====================== */
  lines.push(`# 🧠 Memory + Long tasks`);
  lines.push('');
  lines.push(`*JS heap growth and main-thread blockers. Long tasks (≥50ms) are what kill TBT and interaction latency.*`);
  lines.push('');

  if (worstLongTask.length) {
    lines.push(`## Worst single main-thread block`);
    lines.push('');
    lines.push(`| # | Step | Max single task | Total long tasks |`);
    lines.push(`|---|---|---|---|`);
    for (let i = 0; i < worstLongTask.length; i++) {
      const m = worstLongTask[i];
      lines.push(`| ${i + 1} | \`${m.label}\` | **${fmt(m.maxLongTaskMs)} ms** | ${m.longTaskCount} |`);
    }
    lines.push('');
  }

  // ---- Long-task hotspots (any route with > 0) ----
  const ltHotspots = rows.filter(m => m.longTaskCount > 0).sort((a, b) => b.longTaskMs - a.longTaskMs).slice(0, 8);
  if (ltHotspots.length) {
    lines.push(`## Long-task hotspots`);
    lines.push('');
    lines.push(`| Step | Count | Total ms | Max single | Avg single |`);
    lines.push(`|---|---|---|---|---|`);
    for (const m of ltHotspots) {
      const avg = m.longTaskCount ? (m.longTaskMs / m.longTaskCount) : 0;
      lines.push(`| \`${m.label}\` | ${m.longTaskCount} | ${fmt(m.longTaskMs, 0)} | ${fmt(m.maxLongTaskMs, 0)} ms | ${fmt(avg, 0)} ms |`);
    }
    lines.push('');
  }

  if (heapWinners.length) {
    lines.push(`## Largest heap growth (potential leaks)`);
    lines.push('');
    lines.push(`| # | Step | Heap Δ | Heap after |`);
    lines.push(`|---|---|---|---|`);
    for (let i = 0; i < heapWinners.length; i++) {
      const m = heapWinners[i];
      const after = m.heapAfter != null ? `${(m.heapAfter / 1e6).toFixed(1)} MB` : '—';
      lines.push(`| ${i + 1} | \`${m.label}\` | **+${(m.heapDelta / 1e6).toFixed(1)} MB** | ${after} |`);
    }
    lines.push('');
  }

  /* ---- Narrative recommendations ---- */
  lines.push(`# 🎯 Recommendations`);
  lines.push('');
  const recs = [];
  const scrollArr = byKind.scroll || [];
  const navArr = byKind.nav || [];
  const interArr = byKind.interaction || [];
  if (scrollArr.length && avgFps(scrollArr) < 50) {
    recs.push(`Scroll averaged **${fmt(avgFps(scrollArr))} fps** across ${scrollArr.length} samples. Top suspects under throttle: \`glass-adaptive.js\` IntersectionObserver re-sampling each \`.card\` and the per-card backdrop-filter blur. Try gating IntersectionObserver to one-shot (already done) and adding \`content-visibility: auto\` to long card lists (companies grid, lesson list).`);
  }
  if (navArr.length && avgFps(navArr) < 50) {
    recs.push(`Nav averaged **${fmt(avgFps(navArr))} fps**. Most cost is the synchronous \`render()\` re-paint of the route's view (full \`innerHTML\` swap). Splitting heavy renders (companies, dashboard) into a sync skeleton + async chunked fill would smooth the transition.`);
  }
  if (interArr.length && avgFps(interArr) < 50) {
    recs.push(`Interactions averaged **${fmt(avgFps(interArr))} fps**. Suspects: lesson modal mount (Prism highlight + activity mount in one pass) and flashcard flip transform with preserve-3d. Consider deferring Prism highlighting until after the modal animates in.`);
  }
  if (heapWinners[0] && heapWinners[0].heapDelta > 5e6) {
    recs.push(`\`${heapWinners[0].label}\` grew heap by **+${(heapWinners[0].heapDelta / 1e6).toFixed(1)} MB**. Worth checking what's retained — common culprits are uncleared \`setInterval\`/\`setTimeout\`, listeners on removed elements, or Three.js geometry not disposed on route change.`);
  }
  if (worstLongTask[0] && worstLongTask[0].maxLongTaskMs > 200) {
    recs.push(`Single ${fmt(worstLongTask[0].maxLongTaskMs)} ms task during \`${worstLongTask[0].label}\` blocks all input. Slice it (\`requestIdleCallback\` chunks, or yield via \`await 0\`).`);
  }
  if (fcp > 3000) {
    recs.push(`FCP at ${fmt(fcp)} ms is poor. Boot is dominated by synchronous CDN \`<script>\`s (GSAP, Chart.js, Three.js ~600KB, Prism + 4 langs). Defer Three.js until \`#dashboard\`, Chart.js until Today's heatmap renders, Prism until a lesson opens.`);
  }
  if (!recs.length) recs.push(`No headline regressions in this run. (Numbers are still below 60 fps under 4× throttle; that's expected for the Moto G Power profile — run \`npm run perf -- --throttle 1\` for laptop-grade results.)`);
  for (const rec of recs) lines.push(`- ${rec}`);
  lines.push('');

  lines.push(`---`);
  lines.push(`*Re-run: \`nvm use 22 && npm run perf\`. Customize the journey in [\`scripts/perf/clickthrough.mjs\`](clickthrough.mjs) → \`JOURNEY\`.*`);
  return lines.join('\n') + '\n';
}

main().catch(err => { console.error(err); process.exit(1); });
