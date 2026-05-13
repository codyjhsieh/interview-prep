/* Window-beam math module — pure functions, fully testable.
 *
 * Exports the formulas used by mountPet3D() in views.js to compute:
 *   • Sun/moon position over the daily arc
 *   • Where its ray, passing through the window, lands on the floor
 *   • The frustum corners that wrap window opening → floor landing
 *
 * Keeping these in their own file so they can be required by a Node test
 * suite without needing browser/THREE/DOM. The views.js renderer copies
 * the same formulas inline (so this file is a SOURCE-OF-TRUTH reference;
 * regression tests catch drift). */

// Room geometry constants (must mirror views.js)
const FLOOR_W = 8;                             // floor extent ±FLOOR_W/2
const WINDOW_X = 1, WINDOW_Y = 3;
const WINDOW_HALF_W = 0.78, WINDOW_HALF_H = 0.62;
const WINDOW_Z = -FLOOR_W / 2 + 0.12;          // -3.88

/* Compute sun/moon physics parameters for a given wall-clock hour.
 * Mirrors _sunPhysicsParams() inside views.js. */
function sunPhysicsParams(hour) {
  const h = hour;
  let phase, sunPos, sunColor, sunIntensity, ambColor, ambIntensity, skyColor, floorTint;
  if (h >= 6 && h < 18) {
    const tNorm = (h - 6) / 12;
    const angle = tNorm * Math.PI;
    const R = 5;
    sunPos = [
      Math.cos(angle) * R,
      Math.sin(angle) * 5 + 9,
      -10,
    ];
    const elev = Math.sin(angle);
    if (h < 7.5) {
      phase = 'dawn';
      sunColor = 0xffb87a;
      sunIntensity = 0.5 + elev * 0.5;
      ambColor = 0xffc8a0; ambIntensity = 0.55;
      skyColor = 0xffd0a0; floorTint = 0xffeed8;
    } else if (h >= 16.5) {
      phase = 'sunset';
      sunColor = 0xff8048;
      sunIntensity = 0.55 + elev * 0.5;
      ambColor = 0xff9c70; ambIntensity = 0.6;
      skyColor = 0xff8d54; floorTint = 0xffd8b8;
    } else {
      phase = 'day';
      sunColor = 0xfff4d8;
      sunIntensity = 0.85 + elev * 0.3;
      ambColor = 0xffffff; ambIntensity = 0.55;
      skyColor = 0x9ed0f0; floorTint = 0xffffff;
    }
  } else {
    phase = (h < 6) ? 'night' : 'late';
    const nightT = (h < 6) ? (h + 6) / 12 : (h - 18) / 12;
    const angle = nightT * Math.PI;
    const R = 5;
    sunPos = [
      -Math.cos(angle) * R,
       Math.sin(angle) * 5 + 5,
      -10,
    ];
    sunColor = 0x8aa6cc;
    sunIntensity = 0.32;
    ambColor = 0x2e3b5e; ambIntensity = 0.38;
    skyColor = 0x1e2c4a; floorTint = 0x90a0c0;
  }
  return { phase, hour: h, sunPos, sunColor, sunIntensity, ambColor, ambIntensity, skyColor, floorTint };
}

/* Compute the position of the sun/moon disc INSIDE the window pane.
 * Clamped to within ±0.55 of WINDOW_X and ±0.45 of WINDOW_Y. */
function discPosForSun(sunPos) {
  const discXOff = Math.max(-0.55, Math.min(0.55, sunPos[0] / 6 * 0.55));
  const discYOff = Math.max(-0.45, Math.min(0.45, (sunPos[1] - 5) / 6 * 0.4));
  return [WINDOW_X + discXOff, WINDOW_Y + discYOff, WINDOW_Z + 0.04];
}

/* Ray-trace from sun through disc-on-window onto the floor (y = 0).
 * Returns null when the ray angles upward (sun below window).
 * Otherwise: { landPos, rayDir, unclamped, clamped }. */
function rayLanding(sunPos, discPos, halfFloor = FLOOR_W / 2 - 0.6) {
  const dx = discPos[0] - sunPos[0];
  const dy = discPos[1] - sunPos[1];
  const dz = discPos[2] - sunPos[2];
  const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
  if (mag === 0) return null;
  const rayDir = [dx/mag, dy/mag, dz/mag];
  if (rayDir[1] >= -0.04) return null;     // ray angles upward → no landing
  const t = (0 - discPos[1]) / rayDir[1];
  const unclampedX = discPos[0] + rayDir[0] * t;
  const unclampedZ = discPos[2] + rayDir[2] * t;
  const landX = Math.max(-halfFloor, Math.min(halfFloor, unclampedX));
  const landZ = Math.max(-halfFloor, Math.min(halfFloor, unclampedZ));
  return {
    landPos: [landX, 0, landZ],
    rayDir,
    unclamped: [unclampedX, 0, unclampedZ],
    clamped: (unclampedX !== landX || unclampedZ !== landZ),
  };
}

/* Beam render parameters — color/opacity/blending for a given tod result.
 *
 * Sunbeam colors are overridden per-phase (warmer gold than the raw sun
 * light color, which is tuned for the directional light not the ray mesh).
 * Moonbeam uses a brighter cool blue than the moon light color (which is
 * dim to keep night ambience). Mirrors views.js inline logic. */
function beamRender(tod) {
  const isNight = tod.phase === 'night' || tod.phase === 'late';
  let color;
  if (isNight) {
    color = 0xa8c0ee;                       // bright cool moonbeam
  } else if (tod.phase === 'dawn') {
    color = 0xffd8a0;                       // peachy gold
  } else if (tod.phase === 'sunset') {
    color = 0xffa860;                       // deep amber gold
  } else {
    color = 0xfff0b8;                       // bright golden daylight
  }
  const opacity      = isNight ? 0.42 : Math.min(0.45, tod.sunIntensity * 0.40);
  const patchOpacity = isNight ? 0.40 : Math.min(0.55, tod.sunIntensity * 0.50);
  return { color, opacity, patchOpacity, isNight };
}

/* Frustum corners — 4 at the window opening, 4 at a floor rectangle. */
function frustumCorners(landPos) {
  const winFront = WINDOW_Z + 0.04;
  const wxL = WINDOW_X - WINDOW_HALF_W, wxR = WINDOW_X + WINDOW_HALF_W;
  const wyB = WINDOW_Y - WINDOW_HALF_H, wyT = WINDOW_Y + WINDOW_HALF_H;
  const floorW = 1.2, floorD = 1.0;
  const fxL = landPos[0] - floorW, fxR = landPos[0] + floorW;
  const fzB = landPos[2] - floorD, fzT = landPos[2] + floorD;
  return {
    window: [
      [wxL, wyT, winFront],
      [wxR, wyT, winFront],
      [wxR, wyB, winFront],
      [wxL, wyB, winFront],
    ],
    floor: [
      [fxL, 0.02, fzB],
      [fxR, 0.02, fzB],
      [fxR, 0.02, fzT],
      [fxL, 0.02, fzT],
    ],
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sunPhysicsParams, discPosForSun, rayLanding, frustumCorners, beamRender,
    FLOOR_W, WINDOW_X, WINDOW_Y, WINDOW_Z, WINDOW_HALF_W, WINDOW_HALF_H,
  };
}
