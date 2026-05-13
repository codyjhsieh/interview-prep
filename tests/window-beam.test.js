/* Extensive tests for window light beam.
 *
 * Run with:  node tests/window-beam.test.js
 *
 * No mocha / jest dep — uses node:assert + a tiny test runner. */

const assert = require('assert');
const {
  sunPhysicsParams, discPosForSun, rayLanding, frustumCorners, beamRender,
  FLOOR_W, WINDOW_X, WINDOW_Y, WINDOW_Z, WINDOW_HALF_W, WINDOW_HALF_H,
} = require('../js/window-beam.js');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.log(`  ✗ ${name}\n     ${e.message}`); failed++; failures.push([name, e]); }
}
function section(label) { console.log(`\n${label}`); }

// ──────────────────────────────────────────────────────────────────────────
section('Phase detection — every hour of the day lands in the right phase');
// ──────────────────────────────────────────────────────────────────────────

test('hour 0 (midnight) → night',         () => assert.strictEqual(sunPhysicsParams(0).phase, 'night'));
test('hour 3 (early AM) → night',         () => assert.strictEqual(sunPhysicsParams(3).phase, 'night'));
test('hour 5.99 (just before dawn) → night',
                                          () => assert.strictEqual(sunPhysicsParams(5.99).phase, 'night'));
test('hour 6 (dawn boundary) → dawn',     () => assert.strictEqual(sunPhysicsParams(6).phase, 'dawn'));
test('hour 7.49 (still dawn) → dawn',     () => assert.strictEqual(sunPhysicsParams(7.49).phase, 'dawn'));
test('hour 7.5 (dawn → day boundary) → day',
                                          () => assert.strictEqual(sunPhysicsParams(7.5).phase, 'day'));
test('hour 10 (midday) → day',            () => assert.strictEqual(sunPhysicsParams(10).phase, 'day'));
test('hour 12 (noon) → day',              () => assert.strictEqual(sunPhysicsParams(12).phase, 'day'));
test('hour 16.49 (still day) → day',      () => assert.strictEqual(sunPhysicsParams(16.49).phase, 'day'));
test('hour 16.5 (day → sunset) → sunset', () => assert.strictEqual(sunPhysicsParams(16.5).phase, 'sunset'));
test('hour 17.99 (just before night) → sunset',
                                          () => assert.strictEqual(sunPhysicsParams(17.99).phase, 'sunset'));
test('hour 18 (sunset → late) → late',    () => assert.strictEqual(sunPhysicsParams(18).phase, 'late'));
test('hour 21 (evening) → late',          () => assert.strictEqual(sunPhysicsParams(21).phase, 'late'));
test('hour 23.99 (last second) → late',   () => assert.strictEqual(sunPhysicsParams(23.99).phase, 'late'));

// ──────────────────────────────────────────────────────────────────────────
section('Sun arc — physically reasonable positions across the day');
// ──────────────────────────────────────────────────────────────────────────

test('sun is BEHIND the wall (z < window_z) at all hours', () => {
  for (let h = 0; h < 24; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    assert(sunPos[2] < WINDOW_Z, `hour ${h}: sun z=${sunPos[2]} should be < ${WINDOW_Z}`);
  }
});

test('sun is ABOVE the window (y > WINDOW_Y) for every daytime hour', () => {
  for (let h = 6; h < 18; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    assert(sunPos[1] > WINDOW_Y, `hour ${h}: sun y=${sunPos[1]} should be > ${WINDOW_Y}`);
  }
});

test('moon is ABOVE the window (y > WINDOW_Y) for every nighttime hour', () => {
  for (let h = 18; h < 24; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    assert(sunPos[1] > WINDOW_Y, `hour ${h}: moon y=${sunPos[1]} should be > ${WINDOW_Y}`);
  }
  for (let h = 0; h < 6; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    assert(sunPos[1] > WINDOW_Y, `hour ${h}: moon y=${sunPos[1]} should be > ${WINDOW_Y}`);
  }
});

test('sun rises in the east (+x) at 6am', () => {
  const { sunPos } = sunPhysicsParams(6);
  assert(sunPos[0] > 4, `sun x=${sunPos[0]} at 6am should be > 4 (east)`);
});

test('sun is centered (x ≈ 0) at noon', () => {
  const { sunPos } = sunPhysicsParams(12);
  assert(Math.abs(sunPos[0]) < 0.01, `sun x=${sunPos[0]} at noon should be ≈ 0`);
});

test('sun sets in the west (-x) at 6pm-ε', () => {
  const { sunPos } = sunPhysicsParams(17.99);
  assert(sunPos[0] < -4, `sun x=${sunPos[0]} at sunset should be < -4 (west)`);
});

test('sun is at highest point near noon', () => {
  const noon  = sunPhysicsParams(12).sunPos[1];
  const dawn  = sunPhysicsParams(6).sunPos[1];
  const after = sunPhysicsParams(17.99).sunPos[1];
  assert(noon > dawn,  `noon y=${noon} should exceed dawn y=${dawn}`);
  assert(noon > after, `noon y=${noon} should exceed sunset y=${after}`);
});

// ──────────────────────────────────────────────────────────────────────────
section('Window-disc position — moon/sun apparent position in the window');
// ──────────────────────────────────────────────────────────────────────────

test('disc is INSIDE window x-bounds for all hours', () => {
  for (let h = 0; h < 24; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    assert(disc[0] >= WINDOW_X - WINDOW_HALF_W && disc[0] <= WINDOW_X + WINDOW_HALF_W,
      `hour ${h}: disc x=${disc[0]} outside window [${WINDOW_X - WINDOW_HALF_W}, ${WINDOW_X + WINDOW_HALF_W}]`);
  }
});

test('disc is INSIDE window y-bounds for all hours', () => {
  for (let h = 0; h < 24; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    assert(disc[1] >= WINDOW_Y - WINDOW_HALF_H && disc[1] <= WINDOW_Y + WINDOW_HALF_H,
      `hour ${h}: disc y=${disc[1]} outside window [${WINDOW_Y - WINDOW_HALF_H}, ${WINDOW_Y + WINDOW_HALF_H}]`);
  }
});

test('disc sits in FRONT of window pane (z > WINDOW_Z)', () => {
  for (let h = 0; h < 24; h += 4) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    assert(disc[2] > WINDOW_Z, `hour ${h}: disc z=${disc[2]} should be > ${WINDOW_Z}`);
  }
});

test('disc moves east → west across the day (mirrors sun arc)', () => {
  const morn = discPosForSun(sunPhysicsParams(8).sunPos);
  const noon = discPosForSun(sunPhysicsParams(12).sunPos);
  const aft  = discPosForSun(sunPhysicsParams(16).sunPos);
  assert(morn[0] > noon[0], `disc x at 8am (${morn[0]}) should be > 12pm (${noon[0]})`);
  assert(noon[0] > aft[0],  `disc x at noon (${noon[0]}) should be > 4pm (${aft[0]})`);
});

test('disc Y rises and falls (peaks near noon)', () => {
  const dawn = discPosForSun(sunPhysicsParams(6).sunPos)[1];
  const noon = discPosForSun(sunPhysicsParams(12).sunPos)[1];
  const set  = discPosForSun(sunPhysicsParams(17.99).sunPos)[1];
  assert(noon > dawn, `disc y at noon (${noon}) should peak above dawn (${dawn})`);
  assert(noon > set,  `disc y at noon (${noon}) should peak above sunset (${set})`);
});

// ──────────────────────────────────────────────────────────────────────────
section('Ray landing — light always hits the floor inside the room');
// ──────────────────────────────────────────────────────────────────────────

test('ray angles downward (y < 0) at every daytime hour', () => {
  for (let h = 8; h < 16; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    assert(r !== null, `hour ${h}: ray should reach floor`);
    assert(r.rayDir[1] < 0, `hour ${h}: rayDir.y=${r.rayDir[1]} should be negative`);
  }
});

test('ray angles downward at every nighttime hour', () => {
  for (let h = 18.5; h < 24; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    assert(r !== null, `hour ${h}: moon ray should reach floor`);
    assert(r.rayDir[1] < 0, `hour ${h}: rayDir.y=${r.rayDir[1]} should be negative`);
  }
  for (let h = 0; h < 5.5; h += 0.5) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    assert(r !== null, `hour ${h}: moon ray should reach floor`);
    assert(r.rayDir[1] < 0, `hour ${h}: rayDir.y=${r.rayDir[1]} should be negative`);
  }
});

test('landing point is ALWAYS inside floor bounds (after clamp)', () => {
  const halfFloor = FLOOR_W / 2 - 0.6;
  for (let h = 0; h < 24; h += 0.25) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    if (!r) continue;
    assert(Math.abs(r.landPos[0]) <= halfFloor + 1e-9,
      `hour ${h}: landPos.x=${r.landPos[0]} outside [-${halfFloor}, ${halfFloor}]`);
    assert(Math.abs(r.landPos[2]) <= halfFloor + 1e-9,
      `hour ${h}: landPos.z=${r.landPos[2]} outside [-${halfFloor}, ${halfFloor}]`);
  }
});

test('landing.y is exactly 0 (on the floor)', () => {
  for (let h = 6; h < 18; h += 1) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    if (r) assert.strictEqual(r.landPos[1], 0, `hour ${h}: landPos.y should be 0`);
  }
});

test('clamping reports correctly when ray would land outside floor', () => {
  // Construct a far-off sun whose ray lands far past floor edge
  const farSun = [40, 5, -10];
  const disc = [WINDOW_X, WINDOW_Y, WINDOW_Z + 0.04];
  const r = rayLanding(farSun, disc);
  assert(r !== null);
  assert(r.clamped, 'clamped flag should be true for ray landing outside floor');
});

test('ray landing covers a sensible range across the day (not always same spot)', () => {
  const landings = [];
  for (let h = 6.5; h < 17.5; h += 1) {
    const { sunPos } = sunPhysicsParams(h);
    const disc = discPosForSun(sunPos);
    const r = rayLanding(sunPos, disc);
    if (r) landings.push(r.landPos);
  }
  // Compute spread of x positions
  const xs = landings.map(p => p[0]);
  const spread = Math.max(...xs) - Math.min(...xs);
  assert(spread > 0.5, `landing x spread = ${spread} should be > 0.5 (sun should track across)`);
});

// ──────────────────────────────────────────────────────────────────────────
section('Frustum corners — beam top exactly matches window opening');
// ──────────────────────────────────────────────────────────────────────────

test('window face corners are at the window pane plane', () => {
  const corners = frustumCorners([0, 0, 0]);
  for (const c of corners.window) {
    assert.strictEqual(c[2], WINDOW_Z + 0.04, `window corner z=${c[2]} should be at window plane`);
  }
});

test('window face x-extent matches WINDOW_HALF_W', () => {
  const corners = frustumCorners([0, 0, 0]);
  const xs = corners.window.map(c => c[0]);
  assert.strictEqual(Math.min(...xs), WINDOW_X - WINDOW_HALF_W);
  assert.strictEqual(Math.max(...xs), WINDOW_X + WINDOW_HALF_W);
});

test('window face y-extent matches WINDOW_HALF_H', () => {
  const corners = frustumCorners([0, 0, 0]);
  const ys = corners.window.map(c => c[1]);
  assert.strictEqual(Math.min(...ys), WINDOW_Y - WINDOW_HALF_H);
  assert.strictEqual(Math.max(...ys), WINDOW_Y + WINDOW_HALF_H);
});

test('floor face is on the floor (y = 0.02, just above floor)', () => {
  const corners = frustumCorners([2, 0, -1]);
  for (const c of corners.floor) {
    assert.strictEqual(c[1], 0.02, `floor corner y=${c[1]} should be 0.02`);
  }
});

test('floor face is centered on the landing point', () => {
  const land = [2.5, 0, -0.8];
  const corners = frustumCorners(land);
  const xs = corners.floor.map(c => c[0]);
  const zs = corners.floor.map(c => c[2]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  assert(Math.abs(cx - land[0]) < 1e-9, `floor center x=${cx} should be ${land[0]}`);
  assert(Math.abs(cz - land[2]) < 1e-9, `floor center z=${cz} should be ${land[2]}`);
});

test('floor face is wider than window face (beam spreads as it descends)', () => {
  const corners = frustumCorners([0, 0, 0]);
  const winW = (corners.window[1][0] - corners.window[0][0]);
  const floorW = (corners.floor[1][0] - corners.floor[0][0]);
  assert(floorW > winW, `floor width ${floorW} should exceed window width ${winW}`);
});

// ──────────────────────────────────────────────────────────────────────────
section('Color palette — dawn/day/sunset/night each have distinct profiles');
// ──────────────────────────────────────────────────────────────────────────

test('every phase has a defined skyColor', () => {
  for (const h of [3, 6.5, 12, 17, 19, 23]) {
    const p = sunPhysicsParams(h);
    assert(typeof p.skyColor === 'number', `hour ${h}: skyColor should be a number, got ${p.skyColor}`);
  }
});

test('night sky is darker than day sky', () => {
  const day = sunPhysicsParams(12).skyColor;
  const night = sunPhysicsParams(0).skyColor;
  // Brightness ≈ sum of RGB channels
  const bright = (c) => ((c >> 16) & 0xff) + ((c >> 8) & 0xff) + (c & 0xff);
  assert(bright(day) > bright(night),
    `day brightness ${bright(day)} should exceed night ${bright(night)}`);
});

test('night sun intensity is dimmer than day sun intensity', () => {
  assert(sunPhysicsParams(0).sunIntensity < sunPhysicsParams(12).sunIntensity);
});

test('dawn and sunset have warm sun color (high R, low B)', () => {
  for (const h of [6.5, 17]) {
    const c = sunPhysicsParams(h).sunColor;
    const r = (c >> 16) & 0xff, b = c & 0xff;
    assert(r > b, `hour ${h}: warm color expected — R=${r} should exceed B=${b}`);
  }
});

test('night sun color is cool (B > R for moonlight)', () => {
  const c = sunPhysicsParams(0).sunColor;
  const r = (c >> 16) & 0xff, b = c & 0xff;
  assert(b > r, `night color should be cool — B=${b} should exceed R=${r}`);
});

// ──────────────────────────────────────────────────────────────────────────
section('Beam render — every phase produces a visible beam with sensible color');
// ──────────────────────────────────────────────────────────────────────────

test('beamRender returns a beam for every hour of the day (no dark hours)', () => {
  for (let h = 0; h < 24; h += 0.5) {
    const tod = sunPhysicsParams(h);
    const r = beamRender(tod);
    assert(typeof r.color === 'number', `hour ${h}: beam color should be a number`);
    assert(r.opacity > 0,                `hour ${h}: beam opacity ${r.opacity} should be > 0`);
    assert(r.patchOpacity > 0,           `hour ${h}: patchOpacity ${r.patchOpacity} should be > 0`);
  }
});

test('moonbeam is bright cool blue (not the dim raw moon color)', () => {
  const tod = sunPhysicsParams(0);
  const r = beamRender(tod);
  assert.strictEqual(r.color, 0xa8c0ee, 'moonbeam should use bright override color');
  assert.notStrictEqual(r.color, tod.sunColor, 'moonbeam should NOT equal raw moon directional color');
  const cR = (r.color >> 16) & 0xff, cB = r.color & 0xff;
  assert(cB > cR, `moonbeam should read cool — B=${cB} should exceed R=${cR}`);
});

test('dawn sunbeam is peachy gold (warm, brighter than raw sun)', () => {
  const tod = sunPhysicsParams(7);
  const r = beamRender(tod);
  assert.strictEqual(r.color, 0xffd8a0);
  const cR = (r.color >> 16) & 0xff, cB = r.color & 0xff;
  assert(cR > cB, `dawn beam should be warm — R=${cR} should exceed B=${cB}`);
});

test('day sunbeam is bright golden white (not pale beige)', () => {
  const tod = sunPhysicsParams(12);
  const r = beamRender(tod);
  assert.strictEqual(r.color, 0xfff0b8);
  const cR = (r.color >> 16) & 0xff, cG = (r.color >> 8) & 0xff, cB = r.color & 0xff;
  assert(cR >= cG && cG > cB, `day beam should read as warm gold — got R=${cR} G=${cG} B=${cB}`);
});

test('sunset sunbeam is deep amber gold (most saturated of day phases)', () => {
  const tod = sunPhysicsParams(17);
  const r = beamRender(tod);
  assert.strictEqual(r.color, 0xffa860);
  const cR = (r.color >> 16) & 0xff, cB = r.color & 0xff;
  assert(cR - cB > 100, `sunset beam should be strongly warm — R-B = ${cR - cB} should exceed 100`);
});

test('sunbeam color varies across the day (dawn ≠ day ≠ sunset)', () => {
  const dawn   = beamRender(sunPhysicsParams(7)).color;
  const day    = beamRender(sunPhysicsParams(12)).color;
  const sunset = beamRender(sunPhysicsParams(17)).color;
  assert(dawn !== day,    `dawn (${dawn.toString(16)}) should differ from day (${day.toString(16)})`);
  assert(day !== sunset,  `day (${day.toString(16)}) should differ from sunset (${sunset.toString(16)})`);
  assert(dawn !== sunset, `dawn (${dawn.toString(16)}) should differ from sunset (${sunset.toString(16)})`);
});

test('moonbeam color is identical at any nighttime hour (no per-phase shift)', () => {
  const early = beamRender(sunPhysicsParams(0)).color;
  const late  = beamRender(sunPhysicsParams(23)).color;
  assert.strictEqual(early, late, 'night and late both use the same moonbeam color');
});

test('beam opacity is bounded so it never fully blocks the scene', () => {
  for (let h = 0; h < 24; h += 0.5) {
    const r = beamRender(sunPhysicsParams(h));
    assert(r.opacity <= 0.5,      `hour ${h}: beam opacity ${r.opacity} should stay ≤ 0.5`);
    assert(r.patchOpacity <= 0.6, `hour ${h}: patchOpacity ${r.patchOpacity} should stay ≤ 0.6`);
  }
});

test('isNight flag matches phase classification', () => {
  assert.strictEqual(beamRender(sunPhysicsParams(12)).isNight, false);
  assert.strictEqual(beamRender(sunPhysicsParams(7)).isNight,  false);
  assert.strictEqual(beamRender(sunPhysicsParams(17)).isNight, false);
  assert.strictEqual(beamRender(sunPhysicsParams(0)).isNight,  true);
  assert.strictEqual(beamRender(sunPhysicsParams(22)).isNight, true);
});

// ──────────────────────────────────────────────────────────────────────────
section('Beam reaches floor at every hour — never goes dark');
// ──────────────────────────────────────────────────────────────────────────

test('a complete beam (sun, disc, landing, render) is producible at every hour', () => {
  for (let h = 0; h < 24; h += 0.25) {
    const tod = sunPhysicsParams(h);
    const disc = discPosForSun(tod.sunPos);
    const r = rayLanding(tod.sunPos, disc);
    assert(r !== null, `hour ${h}: ray should reach the floor`);
    const render = beamRender(tod);
    assert(render.opacity > 0, `hour ${h}: beam opacity > 0 required`);
  }
});

// ──────────────────────────────────────────────────────────────────────────
section('Edge cases & regressions');
// ──────────────────────────────────────────────────────────────────────────

test('fractional hour (12.5) produces day phase, valid sun', () => {
  const p = sunPhysicsParams(12.5);
  assert.strictEqual(p.phase, 'day');
  assert(p.sunPos.every(v => !isNaN(v)), 'sun position should not contain NaN');
});

test('rayLanding returns null if disc above sun (no downward angle)', () => {
  // Sun BELOW disc → ray angles upward
  const sun = [0, 1, -10];      // y=1, below disc y=3
  const disc = [WINDOW_X, WINDOW_Y, WINDOW_Z + 0.04];
  const r = rayLanding(sun, disc);
  assert.strictEqual(r, null, 'should return null when ray would angle upward');
});

test('zero-magnitude (sun === disc) returns null', () => {
  const same = [1, 3, -3.84];
  const r = rayLanding(same, same);
  assert.strictEqual(r, null);
});

test('disc clamping engages when sun is at extreme x', () => {
  const farRight = [100, 9, -10];     // way off to +x
  const disc = discPosForSun(farRight);
  assert.strictEqual(disc[0], WINDOW_X + 0.55, 'disc should clamp to right edge');
});

test('disc clamping engages when sun is at extreme y', () => {
  const veryHigh = [0, 100, -10];
  const disc = discPosForSun(veryHigh);
  assert.strictEqual(disc[1], WINDOW_Y + 0.45, 'disc should clamp to top edge');
});

// ──────────────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) {
  console.log('\nFailures:');
  for (const [name, e] of failures) console.log(`  ${name}\n    ${e.stack || e.message}`);
  process.exit(1);
}
