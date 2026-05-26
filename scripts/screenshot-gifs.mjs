/* GIF capture for interactive moments in the README.
 *
 * Usage:
 *   python3 -m http.server 8000 &
 *   node scripts/screenshot-gifs.mjs           # writes docs/screenshots/*.gif
 *
 * Three interactions are recorded:
 *   1. Drop-food on the pet card — pile falls, Bit eats, vitality bumps.
 *   2. Flashcard flip + rate — Click-to-reveal, flip, Easy, next card.
 *   3. Company detail scroll — Stripe header → interview-bank rounds → sources.
 *
 * Frames are captured via tight-loop page.screenshot() while the animation
 * plays. Each frame is decoded to RGBA via pngjs and pushed into a
 * gif-encoder-2 stream. No ffmpeg needed.
 *
 * Viewport: iPhone 17 Pro (402 × 874) at 1× DPR — keeps GIF size sane while
 * matching the still-screenshot framing. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GIFEncoder from 'gif-encoder-2';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const URL = process.env.URL || 'http://localhost:8000/';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

/* Demo state matches screenshots.mjs so both flows render identical chrome.
 * todayXP=79, eatenTodayXP=25 → uneaten=54 ⇒ multiple food piles available
 * regardless of whether PILE_XP is 5 or 10. */
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
  },
  flashcards: {
    'fc-rag-1':{ease:2.5,interval:3,due:Date.now()+86400000,reps:2,lapses:0,lastReviewed:Date.now()-3600000},
    'fc-rag-2':{ease:2.3,interval:1,due:Date.now()-3600000,reps:0,lapses:1,lastReviewed:Date.now()-86400000},
    'fc-cod-1':{ease:2.5,interval:4,due:Date.now()+86400000,reps:3,lapses:0,lastReviewed:Date.now()-7200000},
    'fc-cod-2':{ease:2.3,interval:1,due:Date.now(),reps:0,lapses:1,lastReviewed:Date.now()-86400000},
    'fc-sd-1':{ease:2.5,interval:2,due:Date.now()+86400000,reps:1,lapses:0,lastReviewed:Date.now()-3600000},
  },
  badges: { 'first-lesson':{ts:Date.now()-7*86400000}, 'streak-7':{ts:Date.now()-3*86400000} },
  history: [
    { date: '2026-05-24', xp: 134, lessons: 2, events: { lesson:2, flashcard:11, app:4 } },
    { date: '2026-05-25', xp: 156, lessons: 2, events: { lesson:2, flashcard:14, app:3 } },
    { date: '2026-05-26', xp: 79,  lessons: 0, events: { flashcard:6, app:3, food:5 } },
  ],
  pet: {
    stage:'baby', ageDays:3, vitality:62, form:13, deathCount:1,
    name:'Cody Jr.', lastFedAt: Date.now()-3*3600*1000,
    lastFedDate:'2026-05-26', lastTickDate:'2026-05-26',
    eatenTodayXP:25, lastEatenDate:'2026-05-26', bodyHue: 9427382,
    consecutiveSkipDays:0,
  },
  jobApps: [],
  jobAppsDeletedTs: {},
  freeRecallAttempts: {}, missedQuestions: {}, conceptReviews: {},
  dailyQuests: { date:'2026-05-26', quests:[] },
  flashcardFailEvents: [], flashcardFailStats:{ byCat:{}, byModule:{}, byLesson:{}, byCard:{} },
  cueShownDates: { '2026-05-26': true },
  companySeen: {}, visitedSources: true, mocks: [], stories: {}, applied: {},
};

/** Decode a PNG buffer (from playwright screenshot) into RGBA pixel data. */
function pngToRGBA(buf) {
  const png = PNG.sync.read(buf);
  return { data: png.data, width: png.width, height: png.height };
}

/** Capture n frames in a tight loop, each `intervalMs` apart in wall-clock. */
async function captureFrames(page, { count, intervalMs, clip }) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const start = Date.now();
    const buf = await page.screenshot({ type: 'png', clip });
    frames.push(buf);
    const elapsed = Date.now() - start;
    const wait = Math.max(0, intervalMs - elapsed);
    if (wait > 0) await page.waitForTimeout(wait);
  }
  return frames;
}

/** Encode an array of PNG buffers as an animated GIF on disk.
 *
 * Palette algorithm matters: scenes with a dominant warm color (the pet's
 * wooden floor) overwhelm neuquant's adaptive palette and small accent
 * colors (the red ball) snap to brown. Octree preserves accents better.
 * Override via env: GIF_ALGO=neuquant|octree GIF_QUALITY=1..30 (1=best). */
async function encodeGif(frames, outPath, { width, height, frameDelay }) {
  const algo = process.env.GIF_ALGO || 'octree';
  const quality = parseInt(process.env.GIF_QUALITY || '1', 10);
  const encoder = new GIFEncoder(width, height, algo, true);
  encoder.setDelay(frameDelay);
  encoder.setRepeat(0);                  // 0 = loop forever
  encoder.setQuality(quality);
  encoder.start();
  for (const buf of frames) {
    const { data } = pngToRGBA(buf);
    encoder.addFrame(data);
  }
  encoder.finish();
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(outPath);
    ws.on('finish', resolve);
    ws.on('error', reject);
    ws.write(encoder.out.getData());
    ws.end();
  });
}

/* ====== Drop-food: pile falls, Bit walks to it, eats, vitality bumps. ====== */
async function captureDropFood(page) {
  console.log('▶ drop-food');
  await page.evaluate(() => { location.hash = '#dashboard'; });
  await page.waitForSelector('[data-card="hero"]', { timeout: 6000 });
  // Settle the 3D scene + entrance animations.
  await page.waitForTimeout(1500);

  // Scroll the pet card to the top of the viewport so the room canvas +
  // vitality bar (and the Drop-food button at the bottom of the card) are
  // all visible in a single full-viewport frame.
  await page.evaluate(() => {
    const card = document.querySelector('[data-pet-drop-food]')?.closest('.card');
    if (card) card.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await page.waitForTimeout(400);

  // 3 frames of the "before" state so the GIF opens on a stable shot.
  const pre = await captureFrames(page, { count: 3, intervalMs: 200 });

  // Trigger the drop. The handler is delegated, so .click() is enough.
  await page.click('[data-pet-drop-food]');

  // Capture ~30 frames as the action plays out. Pile-fall + eat-walk +
  // vitality-bump are all in the first ~3-4 seconds.
  const action = await captureFrames(page, { count: 30, intervalMs: 130 });

  // Tail: hold final frame so the loop has a clear "rest" beat before restart.
  const tail = await captureFrames(page, { count: 4, intervalMs: 200 });

  const all = [...pre, ...action, ...tail];
  await encodeGif(all, path.join(OUT, '10-drop-food.gif'),
    { width: 402, height: 874, frameDelay: 130 });
  console.log(`  ✓ wrote 10-drop-food.gif (${all.length} frames, 402×874)`);
}

/* ====== Flashcard: tap to reveal → flip → Easy → next card. ====== */
async function captureFlashcardFlip(page) {
  console.log('▶ flashcard flip');
  await page.evaluate(() => { location.hash = '#flashcards'; });
  await page.waitForSelector('.flashcard', { timeout: 6000 });
  await page.waitForTimeout(800);
  // Make sure we're scrolled to the top of the flashcards route so the
  // viewport opens on the page header + card.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  const pre = await captureFrames(page, { count: 3, intervalMs: 200 });

  // Click the card to flip
  await page.click('.flashcard-inner');
  const flip = await captureFrames(page, { count: 10, intervalMs: 130 });

  // Hold answer briefly so a reader can read it
  await page.waitForTimeout(800);
  const hold = await captureFrames(page, { count: 5, intervalMs: 200 });

  // Tap Easy → next card slides in
  await page.click('[data-rate="4"]');
  const advance = await captureFrames(page, { count: 12, intervalMs: 130 });

  const all = [...pre, ...flip, ...hold, ...advance];
  await encodeGif(all, path.join(OUT, '11-flashcard-flip.gif'),
    { width: 402, height: 874, frameDelay: 130 });
  console.log(`  ✓ wrote 11-flashcard-flip.gif (${all.length} frames, 402×874)`);
}

/* ====== Company detail: scroll Stripe page from header → rounds → sources. ===== */
async function captureCompanyScroll(page) {
  console.log('▶ company-detail scroll');
  await page.evaluate(() => { location.hash = '#company/stripe'; });
  await page.waitForSelector('.card', { timeout: 6000 });
  await page.waitForTimeout(1000);

  // Reset scroll so we always start from the very top of the page.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const scrollMax = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
  // Cap how far we scroll — most companies have a long sources <details> at
  // the bottom that's not interesting visually. Stop around the role-notes /
  // bottom of the rounds list.
  const targetScroll = Math.min(scrollMax, 1900);
  const steps = 32;
  const stepPx = Math.floor(targetScroll / steps);

  const frames = [];
  // 3 frames of the top as a stable opener.
  for (let i = 0; i < 3; i++) {
    frames.push(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(120);
  }
  // Smooth-scroll capture: scroll a bit, screenshot, repeat.
  for (let i = 0; i < steps; i++) {
    await page.evaluate(y => window.scrollBy({ top: y, left: 0, behavior: 'instant' }), stepPx);
    frames.push(await page.screenshot({ type: 'png' }));
  }
  // Tail frames at the bottom so the loop has a beat before restart.
  for (let i = 0; i < 4; i++) {
    frames.push(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(200);
  }

  await encodeGif(frames, path.join(OUT, '04-company-detail.gif'),
    { width: 402, height: 874, frameDelay: 120 });
  console.log(`  ✓ wrote 04-company-detail.gif (${frames.length} frames, 402×874)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(({ state }) => {
    try {
      localStorage.setItem('fdeprep.v1', JSON.stringify(state));
      localStorage.setItem('fdeprep.syncSkip.v1', '1');
    } catch (_) {}
  }, { state: DEMO_STATE });

  const page = await context.newPage();
  console.log(`▶ ${URL}`);
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200);

  const only = process.env.GIF_ONLY;     // 'drop'|'flash'|'company' to limit
  if (!only || only === 'drop')    { try { await captureDropFood(page); }       catch (e) { console.error('  ✗ drop-food failed:', e.message); } }
  if (!only || only === 'flash')   { try { await captureFlashcardFlip(page); }  catch (e) { console.error('  ✗ flashcard-flip failed:', e.message); } }
  if (!only || only === 'company') { try { await captureCompanyScroll(page); }  catch (e) { console.error('  ✗ company-scroll failed:', e.message); } }

  await browser.close();
  console.log('\n✓ done');
}

main().catch(e => { console.error(e); process.exit(1); });
