/* Screenshot capture for the README.
 *
 * Usage:
 *   python3 -m http.server 8000 &                 # in repo root
 *   node scripts/screenshots.mjs                  # writes docs/screenshots/*.png
 *
 * Output viewport: iPhone 17 Pro (402 × 874 @3x) since the user is on mobile
 * half the time and the README benefits from showing the actual day-to-day
 * shape. Minimalist hero set — Today, Curriculum, Flashcards, Company detail.
 * PNGs land in docs/screenshots/. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const URL = process.env.URL || 'http://localhost:8000/';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

/* Seeded demo state — gives every view something to render so empty-
 * dashboard screenshots don't make the README look unused. Values are
 * deterministic so re-runs produce identical PNGs (no flakey diffs in
 * the repo). */
const DEMO_STATE = {
  version: 1, onboarded: true,
  user: { name: 'Cody', track: 'both', goal: 180, when_cue: 'After morning coffee · 9am' },
  xp: 1146, level: 5,
  streak: { count: 13, lastDay: '2026-05-26', freezeAvailable: 1 },
  todayXP: 79, todayDate: '2026-05-26',
  appsRampAnchor: '2026-05-20',
  completedLessons: {
    'd-1':{ts:1778605651939,xp:12}, 'd-2':{ts:1778605673474,xp:15},
    'rag-1':{ts:1778605710797,xp:10}, 'rag-2':{ts:1778605731407,xp:10},
    'g-1':{ts:1779201577639,xp:18}, 'g-3':{ts:1779300062425,xp:23},
    'a-2':{ts:1779058200000,xp:18}, 'iv-1':{ts:1778967593545,xp:18},
    'ag-cod-3':{ts:1779053235549,xp:18}, 'sd-1':{ts:1779010000000,xp:15},
    'me-1':{ts:1778684445086,xp:10}, 'me-2':{ts:1779123901010,xp:15},
    'rag-3':{ts:1779246749926,xp:15}, 'rag-4':{ts:1778605765663,xp:12},
    'rag-5':{ts:1778605914204,xp:12}, 'st-3':{ts:1779164908426,xp:27},
    'sd-geo':{ts:1779061615348,xp:27}, 'in-1':{ts:1779001000000,xp:10},
  },
  flashcards: {
    'fc-rag-1':{ease:2.5,interval:3,due:Date.now()+86400000,reps:2,lapses:0,lastReviewed:Date.now()-3600000},
    'fc-rag-2':{ease:2.3,interval:1,due:Date.now()-3600000,reps:0,lapses:1,lastReviewed:Date.now()-86400000},
    'fc-cod-1':{ease:2.5,interval:4,due:Date.now()+86400000,reps:3,lapses:0,lastReviewed:Date.now()-7200000},
    'fc-cod-2':{ease:2.3,interval:1,due:Date.now(),reps:0,lapses:1,lastReviewed:Date.now()-86400000},
    'fc-sd-1':{ease:2.5,interval:2,due:Date.now()+86400000,reps:1,lapses:0,lastReviewed:Date.now()-3600000},
  },
  badges: { 'first-lesson':{ts:Date.now()-7*86400000}, 'streak-7':{ts:Date.now()-3*86400000},
            'streak-10':{ts:Date.now()-86400000}, 'apps-first-5':{ts:Date.now()-2*86400000},
            'flash-25':{ts:Date.now()-86400000} },
  history: [
    { date: '2026-05-20', xp: 95,  lessons: 2, events: { lesson:2, flashcard:8, app:1 } },
    { date: '2026-05-21', xp: 142, lessons: 3, events: { lesson:3, flashcard:12, app:5 } },
    { date: '2026-05-22', xp: 88,  lessons: 1, events: { lesson:1, flashcard:9, app:5 } },
    { date: '2026-05-23', xp: 219, lessons: 3, events: { lesson:3, flashcard:16, app:5, 'free-recall':3, bfs:1 } },
    { date: '2026-05-24', xp: 134, lessons: 2, events: { lesson:2, flashcard:11, app:4 } },
    { date: '2026-05-25', xp: 156, lessons: 2, events: { lesson:2, flashcard:14, app:3 } },
    { date: '2026-05-26', xp: 79,  lessons: 0, events: { flashcard:6, app:3, food:5 } },
  ],
  pet: {
    stage:'baby', ageDays:3, vitality:88, form:13, deathCount:1,
    name:'Cody Jr.', lastFedAt: Date.now()-3*3600*1000,
    lastFedDate:'2026-05-26', lastTickDate:'2026-05-26',
    eatenTodayXP:25, lastEatenDate:'2026-05-26', bodyHue: 9427382,
    consecutiveSkipDays:0,
  },
  jobApps: [
    { date:'2026-05-20', ts:Date.now()-6*86400000, xp:14, awardId:'demo:1:app:a', roleKey:'baseten|x', company:'Baseten', title:'Forward Deployed Engineer', url:'#' },
    { date:'2026-05-21', ts:Date.now()-5*86400000, xp:18, awardId:'demo:2:app:b', roleKey:'sola|x', company:'Sola', title:'Software Engineer, ML Platform', url:'#', morning:true },
    { date:'2026-05-22', ts:Date.now()-4*86400000, xp:18, awardId:'demo:3:app:c', roleKey:'hang|x', company:'Hang', title:'Machine Learning Engineer', url:'#', morning:true },
    { date:'2026-05-23', ts:Date.now()-3*86400000, xp:14, awardId:'demo:4:app:d', roleKey:'fireworks|x', company:'Fireworks AI', title:'Software Engineer, AI Infrastructure', url:'#' },
    { date:'2026-05-24', ts:Date.now()-2*86400000, xp:18, awardId:'demo:5:app:e', roleKey:'distyl|x', company:'Distyl', title:'AI Engineer', url:'#', morning:true },
    { date:'2026-05-25', ts:Date.now()-1*86400000, xp:14, awardId:'demo:6:app:f', roleKey:'glean|x', company:'Glean', title:'Founding Forward Deployed Engineer', url:'#' },
    { date:'2026-05-26', ts:Date.now()-30*60*1000, xp:18, awardId:'demo:7:app:g', roleKey:'baseten|y', company:'Baseten', title:'SWE — Training Infrastructure', url:'#', morning:true },
  ],
  jobAppsDeletedTs: {},
  freeRecallAttempts: {}, missedQuestions: {}, conceptReviews: {},
  dailyQuests: { date:'2026-05-26', quests:[] },
  flashcardFailEvents: [], flashcardFailStats:{ byCat:{}, byModule:{}, byLesson:{}, byCard:{} },
  cueShownDates: { '2026-05-26': true },
  companySeen: { 'baseten':true,'distyl':true,'sola':true,'glean':true,
                 'crosby':true,'sandbar':true,'tavily':true,'qloo':true,
                 'openai':true,'anthropic':true,'stripe':true,'ramp':true },
  visitedSources: true, mocks: [], stories: {}, applied: {},
};

/* Note: the company-detail hero is a scrolling GIF rather than a still —
 * see scripts/screenshot-gifs.mjs (04-company-detail.gif). It scans the
 * Stripe header through the interview-bank rounds, which a single viewport
 * can't show. */
const VIEWS = [
  { id:'01-dashboard',  route:'#dashboard',  waitFor:'[data-card="hero"]', label:'Dashboard (Today)' },
  { id:'02-curriculum', route:'#curriculum', waitFor:'.card',              label:'Curriculum' },
  { id:'03-flashcards', route:'#flashcards', waitFor:'.card',              label:'Flashcards (SM-2)' },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  // Inject the demo state + skip the login gate BEFORE any page script
  // runs, so we never see the login overlay.
  await context.addInitScript(({ state }) => {
    try {
      localStorage.setItem('fdeprep.v1', JSON.stringify(state));
      localStorage.setItem('fdeprep.syncSkip.v1', '1');
    } catch (_) {}
  }, { state: DEMO_STATE });

  const page = await context.newPage();
  console.log(`▶ ${URL}`);
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  // Settle: animations, font load, 3D scene mount, etc.
  await page.waitForTimeout(1200);

  for (const v of VIEWS) {
    try {
      console.log(`  capturing ${v.id} (${v.label})…`);
      await page.evaluate(r => { location.hash = r; }, v.route);
      // wait for the route's content to render
      try { await page.waitForSelector(v.waitFor, { timeout: 6000 }); } catch (_) {}
      // Settle entrance animations + lazy-load
      await page.waitForTimeout(900);
      if (v.scrollToText) {
        await page.evaluate(text => {
          const el = [...document.querySelectorAll('h1,h2,h3,h4')].find(n => n.textContent.includes(text));
          if (el) el.scrollIntoView({ block: 'start' });
        }, v.scrollToText);
        await page.waitForTimeout(400);
      }
      await page.screenshot({
        path: path.join(OUT, `${v.id}.png`),
        fullPage: false,                // viewport only — keeps file size sane
      });
    } catch (e) {
      console.error(`  ✗ ${v.id} failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\n✓ wrote ${VIEWS.length} screenshots to docs/screenshots/`);
}

main().catch(e => { console.error(e); process.exit(1); });
