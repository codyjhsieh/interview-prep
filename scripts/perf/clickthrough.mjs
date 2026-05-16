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
const JOURNEY = [
  {
    label: 'cold-load',
    go: async (page) => {},        // driver does the initial goto
    dwell: 4000,
  },
  {
    label: 'curriculum',
    go: (page) => page.evaluate(() => { location.hash = '#curriculum'; }),
    wait: 'h1:has-text("Curriculum")',
  },
  {
    label: 'category/coding',
    go: (page) => page.evaluate(() => { location.hash = '#category/coding'; }),
    wait: 'h1:has-text("Coding & Algorithms")',
  },
  {
    label: 'lesson-open',
    go: async (page) => {
      // Open the first available lesson via the data-open handler.
      await page.evaluate(() => {
        const btn = document.querySelector('[data-open]');
        if (btn) btn.click();
      });
    },
    wait: '.fixed.inset-0 h2',
    dwell: 4000,
  },
  {
    label: 'lesson-close',
    go: (page) => page.evaluate(() => {
      const x = document.querySelector('[data-close="lesson"]');
      if (x) x.click();
    }),
  },
  {
    label: 'flashcards',
    go: (page) => page.evaluate(() => { location.hash = '#flashcards'; }),
    wait: '.flashcard',
  },
  {
    label: 'flashcard-flip',
    go: async (page) => {
      // Flip the visible card, then flip back to record two flips.
      await page.evaluate(() => {
        const inner = document.querySelector('.flashcard-inner');
        if (inner) inner.click();
      });
      await new Promise(r => setTimeout(r, 800));
      await page.evaluate(() => {
        const inner = document.querySelector('.flashcard-inner');
        if (inner) inner.click();
      });
    },
    dwell: 2500,
  },
  {
    label: 'companies',
    go: (page) => page.evaluate(() => { location.hash = '#companies'; }),
    wait: 'text=startups',
    dwell: 4000,
  },
  {
    label: 'dashboard',
    go: (page) => page.evaluate(() => { location.hash = '#dashboard'; }),
    wait: '#view',
    dwell: 5000,                   // pet 3D + heatmap take time to settle
  },
  {
    label: 'review',
    go: (page) => page.evaluate(() => { location.hash = '#review'; }),
    wait: '#view',
  },
  {
    label: 'prep',
    go: (page) => page.evaluate(() => { location.hash = '#prep'; }),
    wait: '#view',
  },
];

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
  console.log(`  FCP ${Math.round(navTiming.firstContentfulPaint)}ms · DOMContentLoaded ${Math.round(navTiming.domContentLoaded)}ms · load ${Math.round(navTiming.loadEvent)}ms`);

  const rows = [];
  for (const step of JOURNEY) {
    process.stdout.write(`  ${step.label.padEnd(22)} `);
    try {
      await step.go(page);
      if (step.wait) {
        if (typeof step.wait === 'string') {
          await page.waitForSelector(step.wait, { timeout: 6000 });
        } else {
          await new Promise(r => setTimeout(r, step.wait));
        }
      }
      // Settle for one frame after the wait.
      await page.waitForTimeout(150);
      await page.evaluate((label) => window.__perf.startRoute(label), step.label);
      await page.waitForTimeout(step.dwell || DWELL_MS);
      const m = await page.evaluate(() => window.__perf.endRoute());
      if (m) {
        rows.push(m);
        const status = m.fps < 30 ? '✗' : m.fps < 50 ? '~' : '✓';
        const heapStr = m.heapDelta != null
          ? `${m.heapDelta >= 0 ? '+' : ''}${(m.heapDelta / 1e6).toFixed(2)}MB`
          : '-';
        console.log(`${status} fps=${m.fps.toFixed(1)}  p95frame=${m.p95Ms.toFixed(1)}ms  longTasks=${m.longTaskCount}  heapΔ=${heapStr}`);
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
    rows,
  };
  await writeFile(JSON_PATH, JSON.stringify(report, null, 2));
  await writeFile(REPORT_PATH, renderMarkdown(report));
  console.log(`\n📄 ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`📄 ${path.relative(ROOT, JSON_PATH)}`);
}

function renderMarkdown(r) {
  const fmt = (n, digits = 1) => n == null ? '—' : Number(n).toFixed(digits);
  const fpsBadge = (f) => f == null ? '—' : f < 30 ? `**${fmt(f)}** ✗` : f < 50 ? `${fmt(f)} ~` : `${fmt(f)} ✓`;
  const heap = (b) => b == null ? '—' : (b / 1e6).toFixed(1) + ' MB';

  const lines = [];
  lines.push(`# Clickthrough perf report`);
  lines.push('');
  lines.push(`- Captured: ${r.capturedAt}`);
  lines.push(`- URL: ${r.url}`);
  lines.push(`- CPU throttle: ${r.cpuThrottle}× (Lighthouse Moto G Power ≈ 4×)`);
  lines.push(`- Viewport: ${r.viewport}`);
  lines.push(`- Wall time: ${r.walltimeSec}s`);
  lines.push('');
  lines.push(`## Initial paint`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| First Contentful Paint | ${fmt(r.navTiming.firstContentfulPaint)} ms |`);
  lines.push(`| DOMContentLoaded | ${fmt(r.navTiming.domContentLoaded)} ms |`);
  lines.push(`| load event | ${fmt(r.navTiming.loadEvent)} ms |`);
  lines.push('');
  lines.push(`## Per-route`);
  lines.push('');
  lines.push(`Status: ✓ = ≥50 fps · ~ = 30–50 · ✗ = <30. p95 frame = 95th-percentile frame duration in ms (60 fps target ≈ 16.7 ms).`);
  lines.push('');
  lines.push(`| Route | FPS | p95 frame | max frame | Long tasks | Long-task ms | Heap Δ |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  for (const m of r.rows) {
    if (m.error) {
      lines.push(`| \`${m.label}\` | ERROR | | | | | ${m.error} |`);
      continue;
    }
    lines.push(`| \`${m.label}\` | ${fpsBadge(m.fps)} | ${fmt(m.p95Ms)} ms | ${fmt(m.maxMs)} ms | ${m.longTaskCount} | ${fmt(m.longTaskMs, 0)} | ${m.heapDelta != null ? (m.heapDelta >= 0 ? '+' : '') + (m.heapDelta / 1e6).toFixed(1) + ' MB' : '—'} |`);
  }
  lines.push('');

  /* Headline diagnostics */
  const worst = [...r.rows].filter(m => !m.error).sort((a, b) => a.fps - b.fps)[0];
  const longest = [...r.rows].filter(m => !m.error).sort((a, b) => b.maxLongTaskMs - a.maxLongTaskMs)[0];
  const biggestHeap = [...r.rows].filter(m => !m.error && m.heapDelta != null).sort((a, b) => b.heapDelta - a.heapDelta)[0];

  lines.push(`## Diagnostics`);
  lines.push('');
  if (worst) lines.push(`- Worst sustained FPS: \`${worst.label}\` at **${fmt(worst.fps)} fps** (p95 frame ${fmt(worst.p95Ms)} ms).`);
  if (longest && longest.maxLongTaskMs > 0) lines.push(`- Worst single long task: \`${longest.label}\` blocking the main thread for **${fmt(longest.maxLongTaskMs)} ms**.`);
  if (biggestHeap && biggestHeap.heapDelta > 1e6) lines.push(`- Biggest heap growth: \`${biggestHeap.label}\` +**${(biggestHeap.heapDelta / 1e6).toFixed(1)} MB**.`);
  const totalLong = r.rows.reduce((s, m) => s + (m.longTaskCount || 0), 0);
  lines.push(`- Total long tasks across journey: **${totalLong}**.`);
  return lines.join('\n') + '\n';
}

main().catch(err => { console.error(err); process.exit(1); });
