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

/* Light-weight rich-text for flashcard Q/A. Lets card authors break a
 * wall of text into structured beats without opening the door to raw
 * HTML/XSS. Supported syntax:
 *   - line-leading "- " or "* " → bullet item (consecutive items become <ul>)
 *   - "**bold**"               → <b>bold</b>
 *   - "`code`"                 → <code>code</code>
 *   - blank line               → paragraph break
 *   - single newline           → soft break (<br>)
 * Everything else is HTML-escaped. */
function richText(s) {
  const raw = String(s ?? '');
  const escape = (t) => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = (t) => escape(t)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.92em;background:rgba(15,23,42,0.06);padding:1px 4px;border-radius:3px">$1</code>');
  const blocks = raw.split(/\n\n+/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const isList = lines.every(l => /^\s*[-*]\s+/.test(l));
    if (isList && lines.length > 1) {
      out.push('<ul style="margin:4px 0 4px 18px;padding:0;list-style:disc">' +
        lines.map(l => '<li style="margin:2px 0">' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>').join('') +
        '</ul>');
    } else {
      out.push('<p style="margin:6px 0">' + lines.map(inline).join('<br>') + '</p>');
    }
  }
  return out.join('');
}

/* iconHTML(name, opts) — inline a Lucide SVG icon via CSS mask so it
 * picks up the surrounding text color via currentColor. Files live in
 * assets/icons/ and were downloaded from the Lucide icon set
 * (ISC-licensed). The mask technique keeps the icons crisp at any size
 * and respects color theming without inlining the full SVG markup. */
function iconHTML(name, opts) {
  opts = opts || {};
  const size = opts.size || 18;
  const url = `assets/icons/${esc(name)}.svg`;
  // The mask declarations are duplicated so older WebKit picks up the
  // -webkit-mask path. background-color: currentColor is what makes the
  // icon adopt the parent text color.
  const style = [
    'display:inline-block',
    `width:${size}px`,
    `height:${size}px`,
    'background-color:currentColor',
    `-webkit-mask:url('${url}') no-repeat center/contain`,
    `mask:url('${url}') no-repeat center/contain`,
    'vertical-align:-3px',
    'flex-shrink:0',
  ].join(';');
  return `<span class="icon icon-${esc(name)}" style="${style}" aria-hidden="true"></span>`;
}

/* =========================================================================
 * 8-bit tamagotchi — life-sim companion fed by hitting the daily XP goal.
 *
 * Sprite: a 16-row grid of pixel rows where each char is a color index.
 *   '.' = transparent
 *   'B' = body (mood-tinted)
 *   'D' = body-dark (shading)
 *   'E' = eye (always dark)
 *   'H' = highlight (light spot on body)
 *   'M' = mouth (varies by mood)
 *   'X' = closed eye (sleep / death)
 *
 * Body variants share the same eye/mouth slots but vary outline geometry.
 * Each rect rendered as <rect width=8 height=8>; 16-row grid = 128px sprite.
 * ========================================================================= */

/* ============================================================================
 * PS2-era polygonal isometric pet + room renderer.
 *
 * Everything is flat-shaded polygons in one big SVG with shape-rendering:
 * crispEdges (no anti-aliasing — the PS2 / Dreamcast / Saturn aesthetic).
 * Three facets per cuboid: top (lightest), left (medium), right (darkest).
 * Vertices computed in isometric space with 2:1 axis ratio.
 *
 * Layout (viewBox 0 0 240 156):
 *   floor diamond  (20,90)..(220,90) horizontal, back (120,60), front (120,130)
 *   left wall      attached to left edge of floor
 *   right wall     attached to right edge of floor
 *   pet group      positioned + transformed for walk animation
 *   props          isometric props on floor
 * ========================================================================== */

const PET_PALETTE = {
  // mood → { top (light, sky-lit), left (medium), right (dark, in shadow), edge, eye, mouth }
  'thrilled': { top:'#B6EBCC', left:'#7CCDA8', right:'#3D8466', edge:'#1F4D38', eye:'#0F172A', mouth:'#0F172A' },
  'content':  { top:'#D7E7F4', left:'#9CC7E6', right:'#5A7E9C', edge:'#2C4660', eye:'#0F172A', mouth:'#0F172A' },
  'hungry':   { top:'#F4DDB0', left:'#E6C28D', right:'#A07B47', edge:'#634822', eye:'#0F172A', mouth:'#3D2606' },
  'sad':      { top:'#DAC7E8', left:'#B9A8C9', right:'#6F5C7F', edge:'#3D3148', eye:'#0F172A', mouth:'#28182E' },
  'sick':     { top:'#CFD1DA', left:'#A8AAB5', right:'#5C5E68', edge:'#33353C', eye:'#0F172A', mouth:'#2A2D33' },
};

// Isometric helpers — project (x, y, z) world coords to 2D screen coords.
// Using 2:1 isometric ratio: 1 world unit = 2 screen px horizontal, 1 screen px vertical.
function _iso(x, y, z) {
  return [
    (x - z) * 1.0,                  // screen X
    (x + z) * 0.5 - y * 1.0         // screen Y  (negative y = up)
  ];
}

// Build an isometric cuboid (3 visible facets: top, left, right) at world
// origin (ox, oz) sitting on the floor (y=0), with given width/depth/height.
// Returns SVG polygon strings.
function _isoCuboid(ox, oz, w, d, h, pal) {
  // 8 corners
  const bFL = _iso(ox,     0, oz + d);  // bottom front-left
  const bFR = _iso(ox + w, 0, oz + d);  // bottom front-right
  const bBR = _iso(ox + w, 0, oz);      // bottom back-right
  const bBL = _iso(ox,     0, oz);      // bottom back-left
  const tFL = _iso(ox,     h, oz + d);
  const tFR = _iso(ox + w, h, oz + d);
  const tBR = _iso(ox + w, h, oz);
  const tBL = _iso(ox,     h, oz);
  // Three visible faces (top diamond, left rhombus, right rhombus)
  const top   = [tFL, tFR, tBR, tBL];
  const left  = [bFL, tFL, tBL, bBL];   // facing left → wait, actually this is the LEFT side of the cuboid
  const right = [bFR, tFR, tFL, bFL];   // the right side facing front-right of viewer
  // Hmm — in isometric view of a cuboid, the two visible front faces are:
  //   the wall at z = oz+d (front face, facing camera and slightly left)
  //   the wall at x = ox+w (right face, facing camera and slightly right)
  const front = [bFL, bFR, tFR, tFL];   // x varying, z=oz+d
  const side  = [bFR, bBR, tBR, tFR];   // x=ox+w, z varying
  // Use front+side+top as the three visible facets
  const pts = (poly) => poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return [
    // Top — lightest
    `<polygon points="${pts(top)}"   fill="${pal.top}"   stroke="${pal.edge}" stroke-width="0.5"/>`,
    // Right (camera-right facet) — darkest
    `<polygon points="${pts(side)}"  fill="${pal.right}" stroke="${pal.edge}" stroke-width="0.5"/>`,
    // Front (camera-facing facet) — mid
    `<polygon points="${pts(front)}" fill="${pal.left}"  stroke="${pal.edge}" stroke-width="0.5"/>`,
  ].join('');
}

// Pet body — stacked cuboids (legs+body+head) sized by stage/body type.
// Coords in world units. Origin is room front-left corner; pet stands at
// the floor center (ox≈11, oz≈11 in a 22×22 floor).
function _isoPetBody(stage, body, pal, ox, oz) {
  let bw = 5, bd = 5, bh = 6;        // body block (width, depth, height)
  let hw = 4, hd = 4, hh = 4;        // head block
  if (stage === 'baby')              { bw = 4; bd = 4; bh = 4;  hw = 4.2; hd = 4.2; hh = 4.2; }
  else if (body === 'jacked')        { bw = 6; bd = 5; bh = 6;  hw = 3.6; hd = 3.6; hh = 3.6; }
  else if (body === 'fit')           { bw = 5; bd = 5; bh = 6.5; hw = 3.8; hd = 3.8; hh = 3.8; }
  else if (body === 'chubby')        { bw = 6; bd = 6; bh = 5;  hw = 4.2; hd = 4.2; hh = 4; }
  // Body block centered at (ox, oz)
  const bx = ox - bw / 2;
  const bz = oz - bd / 2;
  const bodyPolys = _isoCuboid(bx, bz, bw, bd, bh, pal);
  // Head block centered above body
  const hx = ox - hw / 2;
  const hz = oz - hd / 2;
  const headPolys = _isoCuboid(hx, hz, hw, hd, hh, { ...pal, top: pal.top, left: _shade(pal.left, 1.05), right: _shade(pal.right, 1.05) });
  return { bodyPolys, headPolys, hx, hz, hw, hd, hh, headTopY: bh + hh };
}

// Subtle lightening for the head (so it doesn't blend into body)
function _shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((n & 0xff) * factor));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Eyes + mouth — drawn flat on the head's front face (z = hz + hd plane).
function _isoFace(stage, body, mood, activity, ox, oz, headY, headW) {
  const pal = PET_PALETTE[mood];
  const sleeping = activity === 'sleep';
  const cy = headY * 0.55;   // eye height inside head
  // Front face of head sits at z = oz + (hd/2) approximately
  const eyeOffset = headW * 0.20;
  const e1 = _iso(ox - eyeOffset, cy, oz + 0.05);
  const e2 = _iso(ox + eyeOffset, cy, oz + 0.05);
  if (sleeping) {
    return `
      <line x1="${(e1[0]-1.4).toFixed(1)}" y1="${e1[1].toFixed(1)}" x2="${(e1[0]+1.4).toFixed(1)}" y2="${e1[1].toFixed(1)}" stroke="${pal.eye}" stroke-width="0.8" stroke-linecap="square"/>
      <line x1="${(e2[0]-1.4).toFixed(1)}" y1="${e2[1].toFixed(1)}" x2="${(e2[0]+1.4).toFixed(1)}" y2="${e2[1].toFixed(1)}" stroke="${pal.eye}" stroke-width="0.8" stroke-linecap="square"/>`;
  }
  if (activity === 'sick') {
    // X eyes
    return `
      <line x1="${(e1[0]-1).toFixed(1)}" y1="${(e1[1]-1).toFixed(1)}" x2="${(e1[0]+1).toFixed(1)}" y2="${(e1[1]+1).toFixed(1)}" stroke="${pal.eye}" stroke-width="0.7"/>
      <line x1="${(e1[0]-1).toFixed(1)}" y1="${(e1[1]+1).toFixed(1)}" x2="${(e1[0]+1).toFixed(1)}" y2="${(e1[1]-1).toFixed(1)}" stroke="${pal.eye}" stroke-width="0.7"/>
      <line x1="${(e2[0]-1).toFixed(1)}" y1="${(e2[1]-1).toFixed(1)}" x2="${(e2[0]+1).toFixed(1)}" y2="${(e2[1]+1).toFixed(1)}" stroke="${pal.eye}" stroke-width="0.7"/>
      <line x1="${(e2[0]-1).toFixed(1)}" y1="${(e2[1]+1).toFixed(1)}" x2="${(e2[0]+1).toFixed(1)}" y2="${(e2[1]-1).toFixed(1)}" stroke="${pal.eye}" stroke-width="0.7"/>`;
  }
  // Normal eyes — small diamond polygons
  const eye = (cx, cy) => `<polygon points="${cx},${cy-0.9} ${cx+0.7},${cy} ${cx},${cy+0.9} ${cx-0.7},${cy}" fill="${pal.eye}"/>`;
  // Mouth — a small line (smile for thrilled, flat otherwise)
  const m1 = _iso(ox - 1.2, cy * 0.45, oz + 0.05);
  const m2 = _iso(ox + 1.2, cy * 0.45, oz + 0.05);
  const happy = mood === 'thrilled' || activity === 'eat' || activity === 'play';
  const mouth = happy
    ? `<path d="M${m1[0].toFixed(1)},${m1[1].toFixed(1)} Q${ox.toFixed(1)},${(m1[1]+1.5).toFixed(1)} ${m2[0].toFixed(1)},${m2[1].toFixed(1)}" stroke="${pal.mouth}" stroke-width="0.7" fill="none"/>`
    : `<line x1="${m1[0].toFixed(1)}" y1="${m1[1].toFixed(1)}" x2="${m2[0].toFixed(1)}" y2="${m2[1].toFixed(1)}" stroke="${pal.mouth}" stroke-width="0.7"/>`;
  return eye(e1[0], e1[1]) + eye(e2[0], e2[1]) + mouth;
}

function _moodForActivity(activity, fedToday) {
  if (activity === 'eat')      return 'thrilled';
  if (activity === 'sick' || activity === 'sick')  return 'sick';
  if (activity === 'beg')      return 'hungry';
  if (activity === 'droop')    return 'sad';
  if (activity === 'workout')  return 'thrilled';
  if (activity === 'sleep')    return fedToday ? 'content' : 'sad';
  if (fedToday)                return 'thrilled';
  return 'content';
}

function _petSpriteSVG(stage, body, activity, fedToday) {
  // Closed eyes for sleep
  const sleeping = activity === 'sleep';
  // Open mouth for eat
  const eating = activity === 'eat';
  // Sick: cross eyes (X)
  const sick = activity === 'sick';
  // Mouth shape (draw separately via mood)
  const mood = _moodForActivity(activity, fedToday);
  const pal = PET_PALETTE[mood] || PET_PALETTE.content;
  const key = stage === 'egg' ? 'egg' : (stage === 'baby' ? 'baby' : body);
  const grid = PET_SPRITES[key] || PET_SPRITES['normal'];
  const PX = 7;  // px per pixel
  const rects = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c];
      if (ch === '.') continue;
      let fill = null;
      if (ch === 'B') fill = pal.body;
      else if (ch === 'D') fill = pal.dark;
      else if (ch === 'H') fill = pal.highlight;
      else if (ch === 'E') fill = sleeping ? pal.body : pal.eye;
      else if (ch === 'M') fill = pal.mouth;
      if (fill) rects.push(`<rect x="${c * PX}" y="${r * PX}" width="${PX}" height="${PX}" fill="${fill}"/>`);
    }
  }
  // Overlays: sleeping Zz, eating sparkle, sick wobble lines
  let overlay = '';
  if (sleeping) overlay = `<text x="80" y="14" font-family="monospace" font-size="11" fill="${pal.eye}" font-weight="bold">Zz</text>`;
  if (eating)   overlay = `<text x="78" y="40" font-family="monospace" font-size="14" fill="${pal.body}">✨</text>`;
  if (sick)     overlay = `<text x="78" y="20" font-family="monospace" font-size="12" fill="${pal.dark}">~</text>`;
  return `<svg viewBox="0 0 112 112" width="112" height="112" shape-rendering="crispEdges">${rects.join('')}${overlay}</svg>`;
}

/* Isometric props — drawn as small cuboids on the floor. Each returns
 * SVG <polygon> markup in world coordinates (pre-translated). */
function _isoBowl(ox, oz, full) {
  const w = 3, d = 3, h = 1.2;
  const wood  = { top:'#A06B3A', left:'#7A4E1A', right:'#4E3416', edge:'#2A1A0A' };
  const food  = { top:'#F4B23A', left:'#C7780E', right:'#8E5408', edge:'#3D2606' };
  const bowl = _isoCuboid(ox - w/2, oz - d/2, w, d, h, wood);
  if (!full) return bowl;
  // Food mound — small cube on top
  const fx = ox - 1.0, fz = oz - 1.0;
  const fy = h;
  const foodCube = _isoCuboid(fx, fz, 2, 2, 0.8, food);
  return bowl + `<g transform="translate(0,${-_iso(0,fy,0)[1].toFixed(1)})">${foodCube}</g>`;
}
function _isoBed(ox, oz) {
  const w = 6, d = 4, h = 1.5;
  const frame = { top:'#A87CE6', left:'#7849E0', right:'#4F2C9E', edge:'#2A1564' };
  const pillow= { top:'#F2EAFB', left:'#D6C9F0', right:'#A89BC6', edge:'#6F5C7F' };
  let svg = _isoCuboid(ox - w/2, oz - d/2, w, d, h, frame);
  // Pillow stacked on top, at the "head" of the bed
  const px = ox - w/2 + 0.3, pz = oz - d/2 + 0.3;
  svg += `<g>${_isoCuboidAt(px, pz, 1.8, 1.5, 0.7, pillow, h)}</g>`;
  return svg;
}
function _isoDumbbell(ox, oz) {
  const wood = { top:'#7C8694', left:'#475467', right:'#28323C', edge:'#1F2937' };
  const grip = { top:'#B0BAC6', left:'#94A3B8', right:'#586674', edge:'#28323C' };
  // Two end caps + a grip bar
  const end1 = _isoCuboid(ox - 2.0, oz - 1.0, 1.2, 2, 1.2, wood);
  const end2 = _isoCuboid(ox + 0.8, oz - 1.0, 1.2, 2, 1.2, wood);
  const bar  = _isoCuboid(ox - 0.8, oz - 0.3, 1.6, 0.6, 0.7, grip);
  return end1 + bar + end2;
}
function _isoBall(ox, oz) {
  const ball = { top:'#FF8898', left:'#D7384C', right:'#8A1F2E', edge:'#4A0F1A' };
  return _isoCuboid(ox - 0.9, oz - 0.9, 1.8, 1.8, 1.8, ball);
}
// Same as _isoCuboid but offsets Y so it sits at floor + offsetY
function _isoCuboidAt(ox, oz, w, d, h, pal, baseY) {
  const bFL = _iso(ox,     baseY,     oz + d);
  const bFR = _iso(ox + w, baseY,     oz + d);
  const bBR = _iso(ox + w, baseY,     oz);
  const bBL = _iso(ox,     baseY,     oz);
  const tFL = _iso(ox,     baseY + h, oz + d);
  const tFR = _iso(ox + w, baseY + h, oz + d);
  const tBR = _iso(ox + w, baseY + h, oz);
  const tBL = _iso(ox,     baseY + h, oz);
  const top   = [tFL, tFR, tBR, tBL];
  const front = [bFL, bFR, tFR, tFL];
  const side  = [bFR, bBR, tBR, tFR];
  const pts = (poly) => poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return [
    `<polygon points="${pts(top)}"   fill="${pal.top}"   stroke="${pal.edge}" stroke-width="0.5"/>`,
    `<polygon points="${pts(side)}"  fill="${pal.right}" stroke="${pal.edge}" stroke-width="0.5"/>`,
    `<polygon points="${pts(front)}" fill="${pal.left}"  stroke="${pal.edge}" stroke-width="0.5"/>`,
  ].join('');
}

/* Renders the whole isometric scene as one SVG. */
function _isoSceneSVG(p, wallDecor) {
  const mood = _moodForActivity(p.activity, p.fedToday);
  const pal = PET_PALETTE[mood];
  // World grid: floor is 22 wide × 22 deep. Walls 16 tall.
  const FW = 22, FD = 22, WH = 16;
  // Floor tile palette
  const floorA = { top:'#C49A6A', edge:'#7A5328' };
  const floorB = { top:'#A6814F', edge:'#7A5328' };
  // Wall palettes
  const wallBack  = { top:'#F5E9D8', left:'#EFDDC2', right:'#D8C29C', edge:'#A88456' };
  // Build floor as a grid of diamond tiles
  let floor = '';
  const TILE = 4;
  for (let x = 0; x < FW; x += TILE) {
    for (let z = 0; z < FD; z += TILE) {
      const pal2 = ((x + z) / TILE) % 2 === 0 ? floorA : floorB;
      const a = _iso(x, 0, z);
      const b = _iso(x + TILE, 0, z);
      const c = _iso(x + TILE, 0, z + TILE);
      const d = _iso(x, 0, z + TILE);
      floor += `<polygon points="${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)} ${d[0].toFixed(1)},${d[1].toFixed(1)}" fill="${pal2.top}" stroke="${pal2.edge}" stroke-width="0.3"/>`;
    }
  }
  // Left wall — z=0 plane, x from 0 to FW, y from 0 to WH
  const lwBL = _iso(0,   0,  0);
  const lwBR = _iso(FW,  0,  0);
  const lwTR = _iso(FW,  WH, 0);
  const lwTL = _iso(0,   WH, 0);
  // Right wall — x=FW plane, z from 0 to FD, y from 0 to WH
  const rwBL = _iso(FW,  0,  0);
  const rwBR = _iso(FW,  0,  FD);
  const rwTR = _iso(FW,  WH, FD);
  const rwTL = _iso(FW,  WH, 0);
  const wallPts = (a,b,c,d) => `${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)} ${d[0].toFixed(1)},${d[1].toFixed(1)}`;
  // Hmm — for isometric two-wall room, the visible walls are the BACK two
  // (z=0 wall facing camera-left, x=FW wall facing camera-right is BEHIND
  // the floor in this projection — let me reverse).
  //
  // Actually in standard isometric, the back walls (z=0, x=0) face the camera
  // and the floor is in front of them. Let me use those:
  const bwBL = _iso(0,   0,  0);   // bottom-left of back wall
  const bwBR = _iso(FW,  0,  0);   // bottom-right of back wall (corner)
  const bwTR = _iso(FW,  WH, 0);   // top-right of back wall
  const bwTL = _iso(0,   WH, 0);   // top-left of back wall
  // Side wall (z varying, x=0)
  const swBR = _iso(0,   0,  0);   // shared corner
  const swBF = _iso(0,   0,  FD);  // bottom-front
  const swTF = _iso(0,   WH, FD);  // top-front
  const swTR = _iso(0,   WH, 0);   // top-back

  const backWall = `<polygon points="${wallPts(bwBL, bwBR, bwTR, bwTL)}" fill="${wallBack.left}" stroke="${wallBack.edge}" stroke-width="0.5"/>`;
  const sideWall = `<polygon points="${wallPts(swBR, swBF, swTF, swTR)}" fill="${wallBack.right}" stroke="${wallBack.edge}" stroke-width="0.5"/>`;

  // Wall decor — small polygon on the back wall at world (8, 11, 0)
  let decor = '';
  if (wallDecor === 'window') {
    // Sky window (3×3 in wall-x × wall-y), centered on back wall
    const wx1 = 8, wx2 = 14, wy1 = 9, wy2 = 13;
    const a = _iso(wx1, wy2, 0), b = _iso(wx2, wy2, 0), c = _iso(wx2, wy1, 0), d = _iso(wx1, wy1, 0);
    const sky = `<polygon points="${wallPts(a,b,c,d)}" fill="#A8D8F0" stroke="#5A6373" stroke-width="0.4"/>`;
    // Window cross-bars
    const m1 = _iso((wx1+wx2)/2, wy2, 0), m2 = _iso((wx1+wx2)/2, wy1, 0);
    const m3 = _iso(wx1, (wy1+wy2)/2, 0), m4 = _iso(wx2, (wy1+wy2)/2, 0);
    const bars = `<line x1="${m1[0]}" y1="${m1[1]}" x2="${m2[0]}" y2="${m2[1]}" stroke="#5A6373" stroke-width="0.4"/><line x1="${m3[0]}" y1="${m3[1]}" x2="${m4[0]}" y2="${m4[1]}" stroke="#5A6373" stroke-width="0.4"/>`;
    decor = sky + bars;
  } else {
    // Framed picture on back wall
    const wx1 = 10, wx2 = 15, wy1 = 9, wy2 = 13;
    const a = _iso(wx1, wy2, 0), b = _iso(wx2, wy2, 0), c = _iso(wx2, wy1, 0), d = _iso(wx1, wy1, 0);
    const frame = `<polygon points="${wallPts(a,b,c,d)}" fill="#7A4E1A" stroke="#3D2606" stroke-width="0.5"/>`;
    const innerW = 0.4;
    const ai = _iso(wx1+innerW, wy2-innerW, 0), bi = _iso(wx2-innerW, wy2-innerW, 0);
    const ci = _iso(wx2-innerW, wy1+innerW, 0), di = _iso(wx1+innerW, wy1+innerW, 0);
    const pic = `<polygon points="${wallPts(ai,bi,ci,di)}" fill="#5BA585" stroke="#3D8466" stroke-width="0.3"/>`;
    decor = frame + pic;
  }

  // Props on floor — varies by activity
  let props = '';
  if (p.activity === 'eat')     props += _isoBowl(7, 16, true);
  if (p.activity === 'beg')     props += _isoBowl(7, 16, false);
  if (p.activity === 'sleep')   props += _isoBed(11, 14);
  if (p.activity === 'workout') props += _isoDumbbell(15, 16);
  if (p.activity === 'play')    props += _isoBall(7, 16);

  // Pet body — positioned at floor center (11, 0, 11)
  let petOx = 11, petOz = 11;
  // Adjust position based on activity
  if (p.activity === 'eat' || p.activity === 'beg') { petOx = 10; petOz = 14; }
  if (p.activity === 'workout') { petOx = 14; petOz = 14; }
  if (p.activity === 'play')    { petOx = 10; petOz = 14; }
  if (p.activity === 'sleep')   { petOx = 11; petOz = 14; }
  const petGeom = _isoPetBody(p.stage, p.body, pal, petOx, petOz);
  // Face on the front of head (head sits at y = bodyHeight, head front face)
  const headTopY = petGeom.headTopY;
  // Wrap pet in a group so we can transform (walk animation)
  const isWalk = p.activity === 'walk';
  const walkClass = isWalk ? 'pet-iso-walk' : '';
  // Shadow under pet — flat ellipse on floor
  const shadowC = _iso(petOx, 0, petOz);
  const shadow = `<ellipse cx="${shadowC[0].toFixed(1)}" cy="${shadowC[1].toFixed(1)}" rx="4" ry="1.6" fill="rgba(15,23,42,0.22)"/>`;

  // ---- Assemble ----
  const scale = 4;            // world unit → screen pixel
  const trX = 120;            // SVG translate-X
  const trY = 24;             // SVG translate-Y (top of room area)
  return `
    <svg viewBox="0 0 240 156" width="100%" height="100%" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" class="pet-iso-scene">
      <g transform="translate(${trX} ${trY}) scale(${scale})">
        ${backWall}
        ${sideWall}
        ${decor}
        ${floor}
        ${shadow}
        ${props}
        <g class="${walkClass}">
          ${petGeom.bodyPolys}
          <g transform="translate(0,${-_iso(0, /*body height*/ (p.stage === 'baby' ? 4 : p.body === 'chubby' ? 5 : p.body === 'jacked' ? 6 : 6), 0)[1].toFixed(2)})">
            ${petGeom.headPolys}
            ${_isoFace(p.stage, p.body, mood, p.activity, petOx, petOz, headTopY * 0.65, petGeom.hw)}
          </g>
        </g>
      </g>
    </svg>
  `;
}

// Activity props rendered into the room as their own SVG sprites. Each
// returns an SVG snippet positioned via CSS in the parent .pet-room.
// (Legacy — replaced by the isometric scene above. Kept for compat.)
const PET_PROPS = {
  // Food bowl — present during 'beg' (empty) and 'eat' (with food)
  bowl: (full) => `
    <svg viewBox="0 0 32 16" width="44" height="22" shape-rendering="crispEdges">
      ${full ? '<rect x="6" y="2" width="20" height="3" fill="#C7780E"/>' : ''}
      ${full ? '<rect x="8" y="0" width="16" height="2" fill="#E6A03B"/>' : ''}
      <rect x="4"  y="5"  width="24" height="2" fill="#8B6F47"/>
      <rect x="2"  y="7"  width="28" height="6" fill="#6B5436"/>
      <rect x="0"  y="13" width="32" height="2" fill="#4E3D26"/>
    </svg>`,
  // Bed — present during sleep
  bed: () => `
    <svg viewBox="0 0 48 18" width="64" height="24" shape-rendering="crispEdges">
      <rect x="0"  y="8"  width="48" height="8" fill="#7849E0"/>
      <rect x="0"  y="6"  width="48" height="2" fill="#9C75E8"/>
      <rect x="2"  y="2"  width="14" height="4" fill="#D6C9F0"/>
      <rect x="2"  y="0"  width="14" height="2" fill="#E5DEF7"/>
      <rect x="0"  y="16" width="48" height="2" fill="#5A36B0"/>
    </svg>`,
  // Dumbbell — present during workout
  dumbbell: () => `
    <svg viewBox="0 0 32 12" width="44" height="16" shape-rendering="crispEdges">
      <rect x="0"  y="2"  width="6"  height="8" fill="#475467"/>
      <rect x="6"  y="4"  width="20" height="4" fill="#94A3B8"/>
      <rect x="26" y="2"  width="6"  height="8" fill="#475467"/>
      <rect x="0"  y="0"  width="6"  height="2" fill="#1F2937"/>
      <rect x="26" y="0"  width="6"  height="2" fill="#1F2937"/>
    </svg>`,
  // Ball — present during play
  ball: () => `
    <svg viewBox="0 0 14 14" width="22" height="22" shape-rendering="crispEdges">
      <rect x="3" y="0" width="8"  height="2" fill="#D7384C"/>
      <rect x="1" y="2" width="12" height="2" fill="#D7384C"/>
      <rect x="0" y="4" width="14" height="6" fill="#D7384C"/>
      <rect x="1" y="10" width="12" height="2" fill="#D7384C"/>
      <rect x="3" y="12" width="8"  height="2" fill="#D7384C"/>
      <rect x="3" y="4" width="2"  height="2" fill="#FF8898"/>
      <rect x="5" y="3" width="2"  height="2" fill="#FF8898"/>
    </svg>`,
  // Wall pic — always present, decoration
  pic: () => `
    <svg viewBox="0 0 18 14" width="28" height="22" shape-rendering="crispEdges">
      <rect x="0"  y="0"  width="18" height="14" fill="#7A4E1A"/>
      <rect x="2"  y="2"  width="14" height="10" fill="#C8E2F0"/>
      <rect x="4"  y="4"  width="10" height="6" fill="#5BA585"/>
      <rect x="4"  y="9"  width="10" height="1" fill="#3A7A60"/>
      <rect x="13" y="3"  width="2"  height="2" fill="#F5DDB5"/>
    </svg>`,
  // Window — alt decoration
  window: () => `
    <svg viewBox="0 0 20 16" width="32" height="26" shape-rendering="crispEdges">
      <rect x="0" y="0" width="20" height="16" fill="#5A6373"/>
      <rect x="2" y="2" width="16" height="12" fill="#A8D8F0"/>
      <rect x="9" y="2" width="2"  height="12" fill="#5A6373"/>
      <rect x="2" y="7" width="16" height="2"  fill="#5A6373"/>
    </svg>`,
};

/* =========================================================================
 * mountPet3D — real WebGL room + pet via Three.js procedural primitives.
 *
 * Builds a scene with:
 *   • Orthographic camera at iso angle for that "PS2 / GameCube" look
 *   • Directional light + ambient (soft drop shadow under pet)
 *   • Floor (box), 2 back walls (box), per-mood-tinted pet (body + head + eyes)
 *   • Props per activity (bowl/bed/dumbbell/ball as primitives)
 *   • Animation loop driven by rAF — walk, bob, sleep wobble, workout pump
 *
 * Returns { dispose } so the caller can stop the rAF loop on re-render.
 * Falls back to a no-op + SVG scene if Three.js isn't available.
 * ========================================================================= */
const _PET_MOUNTS = new WeakMap();   // container → { dispose }

// Darken/lighten a 0xRRGGBB color by a factor (1.0 = no change).
function _darken(hex, factor) {
  const r = Math.max(0, ((hex >> 16) & 0xff) * factor);
  const g = Math.max(0, ((hex >> 8)  & 0xff) * factor);
  const b = Math.max(0,  (hex & 0xff) * factor);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
function _lighten(hex, factor) {
  const r = Math.min(255, ((hex >> 16) & 0xff) * factor);
  const g = Math.min(255, ((hex >> 8)  & 0xff) * factor);
  const b = Math.min(255,  (hex & 0xff) * factor);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

/* Animation easing toolkit (Penner-style curves).
 * Use these instead of linear lerps so motion always has a "feel." */
const Ease = {
  inOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
  outBack:    t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3*Math.pow(t-1, 3) + c1*Math.pow(t-1, 2); },
  outQuad:    t => 1 - (1-t) * (1-t),
  inQuad:     t => t * t,
  outQuint:   t => 1 - Math.pow(1-t, 5),
  // Parabolic arc 0..1..0 over [0,1] — for foot lifts during walk
  arc:        t => 4 * t * (1 - t),
  // Cycloid-ish bob (smoothed |sin|) for body during walk
  bob:        t => Math.pow(Math.abs(Math.sin(t * Math.PI)), 0.65),
};

/* Damped-spring step. Returns updated [value, velocity].
 * stiffness ~ 80 = snappy. damping ~ 10 = settles in ~0.5s. */
function _dampSpring(value, velocity, target, dt, stiffness = 80, damping = 12) {
  const force = (target - value) * stiffness;
  const friction = velocity * damping;
  velocity += (force - friction) * dt;
  value += velocity * dt;
  return [value, velocity];
}

/* Shortest-path angle delta — for facing rotations (avoid the long way around). */
function _shortAngle(from, to) {
  let d = to - from;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/* Real sun-arc physics for the pet room.
 *
 * The window sits on the back wall (z = -FLOOR_W/2). The sun is positioned
 * OUTSIDE the back wall (z < -FLOOR_W/2) and arcs across the sky from east
 * to west over a 12-hour day (6am sunrise → 6pm sunset). Below the horizon
 * at night, we fall back to moonlight (dim cool blue from the opposite arc).
 *
 * Returns:
 *   sunPos       — [x, y, z] for the directional light position
 *   sunColor     — directional light color
 *   sunIntensity — directional light intensity
 *   ambColor     — ambient light color
 *   ambIntensity — ambient light intensity
 *   skyColor     — used as window-pane emissive + scene canvas backdrop
 *   floorTint    — slight floor color multiplier (cooler at night)
 *   phase        — string label (dawn / day / sunset / evening / night / late)
 *
 * Sun position is calibrated so the window (at world (~1, 3, -4)) receives
 * direct light during the day and the sun visibly tracks east → west.
 */
function _sunPhysicsParams(forceHour) {
  const now = new Date();
  let h;
  if (forceHour != null) {
    // Explicit override (used by lifecycle preview to show different hours
    // per stage). Wins over both wall-clock AND URL param.
    h = forceHour;
  } else {
    h = now.getHours() + now.getMinutes() / 60;
    // URL test param ?petTime=23 only applies when no explicit forceHour.
    try {
      const params = new URLSearchParams(location.search);
      const o = params.get('petTime');
      if (o !== null && !isNaN(parseFloat(o))) h = parseFloat(o);
    } catch (_) {}
  }
  // ── Lerp helpers ────────────────────────────────────────────────────
  const lerpHex = (a, b, t) => {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    return (Math.round(ar + (br - ar) * t) << 16)
         | (Math.round(ag + (bg - ag) * t) << 8)
         |  Math.round(ab + (bb - ab) * t);
  };
  const smoothstep = (t) => t * t * (3 - 2 * t);

  // ── Keyframes: a continuous 24-hour color/light spectrum ────────────
  // Every palette field (sun color/intensity, ambient, sky, floor tint,
  // wall color, shadow ratio) is defined at a handful of anchor hours.
  // For any given h we find the bracketing pair, smoothstep, and lerp —
  // so there are NO step transitions anywhere in the day. Add an anchor
  // to refine a particular hour band (e.g. golden hour).
  const KEYFRAMES = [
    // h    | sunC    sunI | ambC    ambI | skyC    | floor   | wallC   | shK
    { h: 0,    sunC:0x8aa6cc, sunI:0.30, ambC:0x2e3b5e, ambI:0.36, skyC:0x1c2a48, floor:0x8090b8, wallC:0x4F5A77, shK:0.88 },
    { h: 4,    sunC:0x8aa6cc, sunI:0.30, ambC:0x2e3b5e, ambI:0.36, skyC:0x1c2a48, floor:0x8090b8, wallC:0x4F5A77, shK:0.88 },
    { h: 5.5,  sunC:0xa890b0, sunI:0.40, ambC:0x6a5878, ambI:0.45, skyC:0x6a4870, floor:0xb0a0c0, wallC:0x7a6880, shK:0.83 },
    { h: 6.5,  sunC:0xffb87a, sunI:0.65, ambC:0xffc8a0, ambI:0.55, skyC:0xffd0a0, floor:0xffeed8, wallC:0xF6DCC4, shK:0.76 },
    { h: 8,    sunC:0xfff0d2, sunI:0.85, ambC:0xfff8ec, ambI:0.55, skyC:0xb8dcf0, floor:0xfff4e0, wallC:0xF4E6CE, shK:0.74 },
    { h: 12,   sunC:0xfff4d8, sunI:1.05, ambC:0xffffff, ambI:0.55, skyC:0x9ed0f0, floor:0xffffff, wallC:0xF2E2C6, shK:0.72 },
    { h: 15,   sunC:0xfff0c8, sunI:0.95, ambC:0xfff8e0, ambI:0.55, skyC:0xa8d4ec, floor:0xfff8e8, wallC:0xEFD8B8, shK:0.74 },
    { h: 17,   sunC:0xff8048, sunI:0.85, ambC:0xff9c70, ambI:0.60, skyC:0xff8d54, floor:0xffd8b8, wallC:0xE8B894, shK:0.76 },
    { h: 18,   sunC:0xc06078, sunI:0.55, ambC:0x9a607a, ambI:0.52, skyC:0x8a4868, floor:0xc0a0b0, wallC:0xa07088, shK:0.80 },
    { h: 19,   sunC:0x5a6890, sunI:0.36, ambC:0x3a4870, ambI:0.42, skyC:0x2a3858, floor:0xa0a8c0, wallC:0x5a6680, shK:0.86 },
    { h: 20.5, sunC:0x8aa6cc, sunI:0.32, ambC:0x2e3b5e, ambI:0.38, skyC:0x1e2c4a, floor:0x90a0c0, wallC:0x4F5A77, shK:0.88 },
    { h: 24,   sunC:0x8aa6cc, sunI:0.30, ambC:0x2e3b5e, ambI:0.36, skyC:0x1c2a48, floor:0x8090b8, wallC:0x4F5A77, shK:0.88 },
  ];

  // Find the bracketing keyframe pair for the current hour.
  let i = 0;
  for (let k = 0; k < KEYFRAMES.length - 1; k++) {
    if (h >= KEYFRAMES[k].h && h < KEYFRAMES[k + 1].h) { i = k; break; }
  }
  const A = KEYFRAMES[i], B = KEYFRAMES[i + 1];
  const t = smoothstep((h - A.h) / (B.h - A.h));
  const lerp = (a, b) => a * (1 - t) + b * t;
  const sunColor     = lerpHex(A.sunC,  B.sunC,  t);
  const sunIntensity = lerp(A.sunI, B.sunI);
  const ambColor     = lerpHex(A.ambC,  B.ambC,  t);
  const ambIntensity = lerp(A.ambI, B.ambI);
  const skyColor     = lerpHex(A.skyC,  B.skyC,  t);
  const floorTint    = lerpHex(A.floor, B.floor, t);
  const wallColor    = lerpHex(A.wallC, B.wallC, t);
  const shadowK      = lerp(A.shK,  B.shK);

  // Sun/moon position: ONE continuous arc parameterized by h. The sin/cos
  // of (h-6)/12·π puts the light east at sunrise, zenith at noon, west at
  // sunset, and naturally below-horizon (negative sin) at night. We clamp
  // Y above the window so the ray always angles down into the room.
  const angle = ((h - 6) / 12) * Math.PI;
  const R = 5;
  const sunPos = [
    Math.cos(angle) * R,
    Math.max(Math.sin(angle) * 5 + 9, 5),    // clamp y >= 5 (above window)
    -10,
  ];

  // Coarse phase label kept for downstream code that branches on it
  // (ray color, isDay checks). Derived from the hour, not a step palette.
  let phase;
  if      (h < 5)     phase = 'night';
  else if (h < 7.5)   phase = 'dawn';
  else if (h < 16.5)  phase = 'day';
  else if (h < 17.75) phase = 'sunset';
  else if (h < 19)    phase = 'dusk';
  else if (h < 24)    phase = 'late';
  else                phase = 'night';

  return {
    phase, hour: h, sunPos,
    sunColor, sunIntensity, ambColor, ambIntensity, skyColor, floorTint,
    wallColor, shadowK,                                  // pre-lerped, ready
  };
}

function mountPet3D(container, p) {
  if (!container) return null;
  // Three.js is lazy-loaded (see index.html LAZY). If it's not ready yet,
  // kick off the load and re-enter once it resolves. Returning a pseudo-
  // handle keeps existing callers happy; the loading spinner already in
  // the container masks the brief delay.
  if (!window.THREE) {
    if (window.LAZY && window.LAZY.three) {
      window.LAZY.three().then(() => mountPet3D(container, p)).catch(() => {});
    }
    return { dispose: () => {} };
  }
  // Dispose any prior mount on this container
  if (_PET_MOUNTS.has(container)) {
    try { _PET_MOUNTS.get(container).dispose(); } catch(_) {}
    _PET_MOUNTS.delete(container);
  }
  container.innerHTML = '';

  const T = window.THREE;
  const w = container.clientWidth  || 240;
  const h = container.clientHeight || 156;

  // ---- Scene + camera ----
  const scene = new T.Scene();
  scene.background = null;   // transparent — card background shows through
  const aspect = w / h;
  const d = 5.5;
  const camera = new T.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
  // Classic iso angle
  camera.position.set(8, 7, 8);
  camera.lookAt(0, 1.5, 0);

  // ---- Lights with real time-of-day sun physics ----
  // p.forceHour (optional, 0..24) overrides wall-clock — used by the
  // lifecycle preview to show different stages at different times of day.
  const tod = _sunPhysicsParams(p.forceHour);
  scene.add(new T.AmbientLight(tod.ambColor, tod.ambIntensity));
  const sun = new T.DirectionalLight(tod.sunColor, tod.sunIntensity);
  sun.position.set(tod.sunPos[0], tod.sunPos[1], tod.sunPos[2]);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.left   = -8;
  sun.shadow.camera.right  =  8;
  sun.shadow.camera.top    =  8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near   =  0.1;
  sun.shadow.camera.far    =  35;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  // When Bit gets buff (body === 'jacked'), they move out of the room
  // into open pastures: grass underfoot, no walls, swaying grass blades,
  // sky-to-horizon gradient.
  const outdoor = (p.body === 'jacked');

  // Tint the container background to match the sky (visible around the edges
  // of the canvas if any, and through any transparent regions). Pastures
  // ground tint = grass green; indoor ground tint = wood floor.
  const groundTintHex = outdoor ? '#86bf5e' : '#c49a6a';
  container.style.background = `linear-gradient(180deg, #${tod.skyColor.toString(16).padStart(6,'0')} 0%, ${groundTintHex} 100%)`;

  // ---- Floor: wood (indoor) vs. grass (outdoor pastures) ----
  // Same footprint as the room so the iso camera framing stays put;
  // the difference is the floor material, the absence of walls, and the
  // grass field on top.
  const FLOOR_W = 8;
  const floorColor = outdoor ? 0x86BF5E : 0xC49A6A;
  const floorMat = new T.MeshStandardMaterial({ color: floorColor, roughness: outdoor ? 0.95 : 0.85 });
  const floor = new T.Mesh(new T.BoxGeometry(FLOOR_W, 0.2, FLOOR_W), floorMat);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  scene.add(floor);

  // Skirting around the floor — darker ring under wood; deeper green under grass
  const skirtColor = outdoor ? 0x5A8A3A : 0x7A5328;
  const skirtMat = new T.MeshStandardMaterial({ color: skirtColor, roughness: 0.8 });
  const skirt = new T.Mesh(new T.BoxGeometry(FLOOR_W + 0.05, 0.04, FLOOR_W + 0.05), skirtMat);
  skirt.position.y = 0.02;
  scene.add(skirt);

  // Walls + shadow ratio come pre-lerped from the time-of-day keyframes
  // (see _sunPhysicsParams). No per-phase branches — the values flow
  // continuously from dawn through dusk into night.
  const wallColor = tod.wallColor;
  const shadowK   = tod.shadowK;
  const _wallShade = (rgb, k) => {
    const r = Math.round(((rgb >> 16) & 0xff) * k);
    const g = Math.round(((rgb >> 8)  & 0xff) * k);
    const b = Math.round((rgb & 0xff) * k);
    return (r << 16) | (g << 8) | b;
  };
  const wallMatBack = new T.MeshStandardMaterial({ color: wallColor, roughness: 0.9 });
  const wallMatSide = new T.MeshStandardMaterial({ color: _wallShade(wallColor, shadowK), roughness: 0.9 });
  const wallMat = wallMatBack;                          // kept for any downstream reference
  const WALL_H = 5;
  // Outdoor pastures: no walls. Sky shows directly behind Bit; no window
  // because the sun IS the sky.
  if (!outdoor) {
    const wallBack = new T.Mesh(new T.BoxGeometry(FLOOR_W, WALL_H, 0.2), wallMatBack);
    wallBack.position.set(0, WALL_H/2, -FLOOR_W/2);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    const wallSide = new T.Mesh(new T.BoxGeometry(0.2, WALL_H, FLOOR_W), wallMatSide);
    wallSide.position.set(-FLOOR_W/2, WALL_H/2, 0);
    wallSide.receiveShadow = true;
    scene.add(wallSide);
  }

  // ---- Lush wind-swayed grass field (outdoor only) ----
  //
  // SOTA pattern (mirrors what Ghost of Tsushima / Horizon do):
  //   • One InstancedMesh, ~3500 blades — single draw call.
  //   • Each blade is a curved, tapered ribbon (7 verts, 5 tris) — looks
  //     like a real grass blade vs. a card.
  //   • Vertex-color gradient: dark at the base, bright at the tip
  //     (fake AO + sun-bleached tip read).
  //   • Per-instance color jitter via setColorAt (hue + brightness)
  //     so the field isn't a flat color slab.
  //   • Vertex shader injected via onBeforeCompile: 2 wind octaves +
  //     1 gust octave, phase derived from instance world position so
  //     ripples visibly sweep across the field. Bend factor = y³ so
  //     blades curve like a real wind catch.
  let _grassMat = null;          // exposed to the tick loop to bump uTime
  if (outdoor) {
    // Single-triangle tapered blade — 3 verts, 1 triangle. 7× cheaper
    // than the curved 7-vert ribbon, and for wheatgrass (straight stalks)
    // there's no visual loss. 3500 blades × 1 tri = 3500 tris total.
    const bladePositions = new Float32Array([
      -0.040, 0.00, 0.00,   // base L
       0.040, 0.00, 0.00,   // base R
       0.000, 1.00, 0.00,   // tip
    ]);
    // Wheatgrass gradient: warm olive at the base, sun-bleached gold tip
    const bladeColors = new Float32Array([
      0.40, 0.45, 0.18,
      0.40, 0.45, 0.18,
      0.85, 0.82, 0.42,
    ]);
    const bladeGeom = new T.BufferGeometry();
    bladeGeom.setAttribute('position', new T.BufferAttribute(bladePositions, 3));
    bladeGeom.setAttribute('color', new T.BufferAttribute(bladeColors, 3));
    bladeGeom.setIndex([0, 1, 2]);
    bladeGeom.computeVertexNormals();

    // MeshLambertMaterial — cheaper than MeshStandardMaterial (no PBR,
    // just diffuse) and still supports vertex colors + instance color +
    // shader injection. Big perf win at 3500 blades on mobile GPUs.
    const grassMat = new T.MeshLambertMaterial({
      vertexColors: true,
      side: T.DoubleSide,
    });
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime   = { value: 0 };
      // uPetPos = world (x,_,z) of Bit. The shader pushes blades whose
      // base is within uPetRadius AWAY from this position so Bit's path
      // visibly parts the grass. Uniform-only — no per-frame CPU cost.
      shader.uniforms.uPetPos = { value: new T.Vector3(999, 0, 999) };
      shader.vertexShader = 'uniform float uTime;\nuniform vec3 uPetPos;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Per-instance world position from the instanceMatrix.
        vec3 _gPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        // Cubic bend — base totally pinned, almost all motion in the
        // upper third (matches real grass that flexes at the tip).
        float _gBend = position.y * position.y * position.y;
        // Wind: slow base oscillator + fast gust, phase from world pos.
        float _ph = _gPos.x * 0.55 + _gPos.z * 0.40;
        float _wave = sin(uTime * 1.20 + _ph)       * 0.42;
        float _gust = sin(uTime * 3.10 + _ph * 1.7) * 0.18;
        float _sway = _wave + _gust;
        transformed.x += _sway       * _gBend;
        transformed.z += _sway * 0.4 * _gBend;
        // Pet interaction: push the blade's top AWAY from Bit's feet
        // within a small radius. Quadratic falloff so the parting is
        // localised — far blades aren't affected. Multiplied by _gBend
        // so only the upper portion of the blade flattens.
        vec2 _petDelta = _gPos.xz - uPetPos.xz;
        float _petDist = length(_petDelta);
        const float PET_R = 0.65;
        if (_petDist < PET_R) {
          float _falloff = 1.0 - _petDist / PET_R;
          float _push = _falloff * _falloff * 1.3;
          vec2 _pushDir = _petDelta / max(_petDist, 0.001);
          transformed.x += _pushDir.x * _push * _gBend;
          transformed.z += _pushDir.y * _push * _gBend;
        }
        `
      );
      grassMat.userData.shader = shader;
    };
    _grassMat = [grassMat];

    // High density — 7000 blades on the 8×8 pasture (~110 blades/m²,
    // matches real lawn density at a perceptual level). With single-tri
    // geometry + Lambert + a single draw call the cost is ~7k tris and
    // one set-uniform per frame — well inside mobile GPU budget.
    const COUNT = 7000;
    const inst = new T.InstancedMesh(bladeGeom, grassMat, COUNT);
    inst.frustumCulled = false;          // bounding sphere is too small (single blade); without this Three.js culls the whole field
    inst.castShadow    = false;
    inst.receiveShadow = false;
    const _BONSAI_X = 2.6, _BONSAI_Z = -2.4, _CLEAR_R2 = 1.25 * 1.25;
    // Pre-initialize the per-instance color attribute by calling
    // setColorAt once. After that we write directly to the underlying
    // Float32Array — skips the per-iteration .setColorAt() call which
    // does a Color.toArray copy.
    inst.setColorAt(0, new T.Color(1, 1, 1));
    const matArr = inst.instanceMatrix.array;
    const colArr = inst.instanceColor.array;
    const _tmpColor = new T.Color();
    let placedG = 0;
    // Direct matrix writes bypass Object3D.updateMatrix entirely —
    // about 2–3× faster per iteration than the rotation-via-Euler path.
    // For 7000 blades that's ~150ms shaved off pasture init time. Math:
    //   R = Ry(θy) · Rz(θz),  M = T(b) · R · diag(sx, sh, sx)
    // expanded with cy=cos(θy), sy=sin(θy), cz=cos(θz), sz=sin(θz).
    for (let i = 0; i < COUNT; i++) {
      let bx, bz, tries = 0;
      do {
        bx = (Math.random() * 2 - 1) * (FLOOR_W / 2 - 0.25);
        bz = (Math.random() * 2 - 1) * (FLOOR_W / 2 - 0.25);
        const dx = bx - _BONSAI_X, dz = bz - _BONSAI_Z;
        if (dx*dx + dz*dz > _CLEAR_R2) break;
        tries++;
      } while (tries < 3);
      const dxF = bx - _BONSAI_X, dzF = bz - _BONSAI_Z;
      if (dxF*dxF + dzF*dzF < _CLEAR_R2) continue;

      const angY = Math.random() * Math.PI * 2;
      const angZ = (Math.random() * 2 - 1) * 0.14;
      const cy = Math.cos(angY), sy = Math.sin(angY);
      const cz = Math.cos(angZ), sz = Math.sin(angZ);
      const sx = 0.85 + Math.random() * 0.30;
      const sh = 0.45 + Math.random() * 0.55;
      const mo = placedG * 16;
      matArr[mo+0]  =  cy * cz * sx;
      matArr[mo+1]  =       sz * sx;
      matArr[mo+2]  = -sy * cz * sx;
      matArr[mo+3]  =  0;
      matArr[mo+4]  = -cy * sz * sh;
      matArr[mo+5]  =       cz * sh;
      matArr[mo+6]  =  sy * sz * sh;
      matArr[mo+7]  =  0;
      matArr[mo+8]  =  sy * sx;
      matArr[mo+9]  =  0;
      matArr[mo+10] =  cy * sx;
      matArr[mo+11] =  0;
      matArr[mo+12] =  bx;
      matArr[mo+13] =  0;
      matArr[mo+14] =  bz;
      matArr[mo+15] =  1;

      const hue = 0.13 + Math.random() * 0.07;
      const sat = 0.45 + Math.random() * 0.22;
      const lig = 0.42 + Math.random() * 0.20;
      _tmpColor.setHSL(hue, sat, lig);
      const co = placedG * 3;
      colArr[co]   = _tmpColor.r;
      colArr[co+1] = _tmpColor.g;
      colArr[co+2] = _tmpColor.b;
      placedG++;
    }
    inst.count = placedG;
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    scene.add(inst);

    // Tint the floor warmer so it reads as soil under wheatgrass, not
    // a green astroturf slab.
    floorMat.color.setHex(0x9C8B53);
    skirtMat.color.setHex(0x5F4F2A);
  }

  // ---- Polygonal bonsai-shaped tree (outdoor only, life-size) ------
  //
  // Inspired by the Moyogi (informal upright) bonsai style — iconic
  // S-curve trunk + asymmetric tiered branches with dense canopy puffs.
  // Scaled up to a real tree's height (~3 units tall) rather than a
  // tabletop bonsai, so it reads as a mature shaped tree on the
  // pasture. All low-poly + flatShading for the polygonal aesthetic.
  //
  // Trunk: 8 stacked cylinder segments along an S-curve, each rotated
  //   and offset to give the gnarled "trained" silhouette.
  // Branches: 5 tiered branches at varying heights, sweeping outward
  //   then upward at the tips (classic bonsai "Branch upper-side"
  //   gesture). Each branch tip has a multi-puff foliage cluster.
  // Foliage: 5 main puffs + 5 satellite puffs, faceted icospheres,
  //   three-tone hue jitter.
  //
  // Collision: 1.0-radius cylinder at the trunk base — pet walks around.
  const _obstacles = [];          // [{ x, z, radius }] — pet steers around
  if (outdoor) {
    const bonsai = new T.Group();
    // Trunk BASE pulled further into the back-RIGHT CORNER. The S-curve
    // trunk sweeps LEFT + forward as it rises, so the canopy/apex still
    // arches inward and shadows a wide central area of the pasture.
    bonsai.position.set(2.6, 0, -2.4);
    bonsai.rotation.y = 0;

    const barkA = new T.MeshStandardMaterial({ color: 0x6B4225, roughness: 0.95, flatShading: true });
    const barkB = new T.MeshStandardMaterial({ color: 0x4E2E16, roughness: 0.95, flatShading: true });

    // Trunk: BIG bonsai-shape with an S-curve that lifts from the right
    // edge of the pasture and arcs back over the center. Overall the
    // trunk leans toward (-x, +z) (back toward origin from the offset
    // base), but the lean is NOT monotone — there's a clear "pull-back"
    // at i=3 where the trunk dips RIGHT before continuing left. That
    // kink is what reads as the S character.
    //
    // Cumulative (leanX, leanZ) per joint:
    //   i=0  ( 0.0,  0.0)  base
    //   i=1  (-0.5,  0.2)  first left lean
    //   i=2  (-0.6,  0.5)  small continuation
    //   i=3  (-0.3,  0.5)  ← PULL-BACK (S kink — trunk dips right)
    //   i=4  (-0.6,  0.6)  back to left
    //   i=5  (-1.1,  1.0)  upward + outward
    //   i=6  (-1.5,  1.3)  apex approach
    //   i=7  (-1.8,  1.5)  apex (≈ over origin)
    // Heights tuned so the LOWEST branch anchor (joints[2]) sits at
    // y ≈ 2.60, well above Bit's ~1.8-unit adult height. No branches
    // or foliage spawn from joints 0 or 1 — they're inside the "naked
    // trunk" zone (legs + body of the tree, but no leaves where Bit
    // walks).
    const trunkSegs = [
      { r0: 0.70, r1: 0.62, h: 1.35, leanX:  0.00, leanZ:  0.00 },   // base, straight (taller, "trunk only")
      { r0: 0.62, r1: 0.55, h: 1.25, leanX: -0.50, leanZ:  0.20 },   // left lean ← (still trunk-only, no branches)
      { r0: 0.55, r1: 0.48, h: 0.85, leanX: -0.10, leanZ:  0.30 },   // first branchable joint sits up here
      { r0: 0.48, r1: 0.42, h: 0.80, leanX:  0.30, leanZ:  0.00 },   // S kink: pull-back →
      { r0: 0.42, r1: 0.36, h: 0.75, leanX: -0.30, leanZ:  0.10 },   // resume left ←
      { r0: 0.36, r1: 0.30, h: 0.70, leanX: -0.50, leanZ:  0.40 },   // climbing
      { r0: 0.30, r1: 0.25, h: 0.62, leanX: -0.40, leanZ:  0.30 },   // approaching apex
      { r0: 0.25, r1: 0.20, h: 0.55, leanX: -0.30, leanZ:  0.20 },   // apex over origin
    ];
    // Collect all wood geometries by material so we can render them
    // as 3 merged meshes (~100 separate cylinder/dodec meshes → 3):
    //   _barkA_cast   — trunk even segments + knots
    //   _barkB_cast   — trunk odd segments + branch segments
    //   _barkB_noCast — twigs
    const _barkA_cast = [], _barkB_cast = [], _barkB_noCast = [];
    function _pushCylAB(list, a, c, r0, r1, segs) {
      const dx = c.x - a.x, dy = c.y - a.y, dz = c.z - a.z;
      const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const geom = new T.CylinderGeometry(r1, r0, len, segs || 6, 1);
      const dir2 = new T.Vector3(dx, dy, dz).normalize();
      const up2  = new T.Vector3(0, 1, 0);
      const axis2 = new T.Vector3().crossVectors(up2, dir2).normalize();
      const ang2 = Math.acos(Math.max(-1, Math.min(1, up2.dot(dir2))));
      const q = new T.Quaternion();
      if (axis2.lengthSq() > 1e-6) q.setFromAxisAngle(axis2, ang2);
      const pos = new T.Vector3((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
      list.push({ geom, matrix: new T.Matrix4().compose(pos, q, new T.Vector3(1, 1, 1)) });
    }
    function _pushKnot(list, p, r) {
      const geom = new T.DodecahedronGeometry(r, 0);
      const e = new T.Euler(Math.random(), Math.random(), Math.random());
      const q = new T.Quaternion().setFromEuler(e);
      list.push({ geom, matrix: new T.Matrix4().compose(new T.Vector3(p.x, p.y, p.z), q, new T.Vector3(1, 1, 1)) });
    }

    const trunkJoints = [{ x: 0, y: 0, z: 0 }];
    for (let i = 0; i < trunkSegs.length; i++) {
      const s = trunkSegs[i];
      const base = trunkJoints[i];
      const tip = { x: base.x + s.leanX, y: base.y + s.h, z: base.z + s.leanZ };
      _pushCylAB(i % 2 === 0 ? _barkA_cast : _barkB_cast, base, tip, s.r0, s.r1, 7);
      trunkJoints.push(tip);
    }

    // Branches: tiered TRIANGULAR silhouette — long horizontal pads
    // near the base, progressively shorter / smaller / more
    // upward-pointing toward the apex (the "tsui-eda" arrangement).
    //
    // The TOP of the tree is densely branched: 4 short upper branches
    // radiating in different directions from the upper-trunk joints
    // form a lush "crown" around the apex, the way mature bonsai
    // canopies do. Without this the top reads as a single lonely puff.
    //
    //   tier='low'  — lowest 2 branches, longest, big horizontal pads
    //   tier='mid'  — middle 2 branches, medium pads
    //   tier='high' — 4 short branches forming the crown
    const branches = [
      // Low: dramatic horizontal pads — the visual "shoulders".
      // Scaled up so the lower silhouette stays balanced with the
      // ~3× wider crown above.
      { anchorIdx: 2, dir: [-1.00,  0.08,  0.35], length: 2.80, padR: 1.20, tier: 'low'  }, // FRONT-LEFT
      { anchorIdx: 3, dir: [ 0.80,  0.10,  0.50], length: 2.30, padR: 1.00, tier: 'low'  }, // FRONT-RIGHT
      // Mid: alternating sides, very horizontal
      { anchorIdx: 4, dir: [-0.65,  0.15, -0.85], length: 3.80, padR: 1.05, tier: 'mid'  }, // BACK-LEFT
      { anchorIdx: 5, dir: [ 0.85,  0.20,  0.40], length: 3.50, padR: 1.00, tier: 'mid'  }, // RIGHT
      // High crown: 6 VERY LONG horizontal branches — ~3× the previous
      // length — so the upper canopy spread far overshoots the trunk's
      // centerline. Reaches across most of the pasture overhead.
      { anchorIdx: 6, dir: [-0.90,  0.18,  0.55], length: 3.50, padR: 0.95, tier: 'high' }, // FAR FRONT-LEFT
      { anchorIdx: 6, dir: [ 0.85,  0.16, -0.60], length: 3.30, padR: 0.92, tier: 'high' }, // FAR BACK-RIGHT
      { anchorIdx: 6, dir: [ 0.30,  0.18,  0.95], length: 3.10, padR: 0.88, tier: 'high' }, // FAR FRONT
      { anchorIdx: 7, dir: [-0.80,  0.22, -0.40], length: 2.90, padR: 0.85, tier: 'high' }, // BACK-LEFT
      { anchorIdx: 7, dir: [ 0.55,  0.22,  0.85], length: 2.80, padR: 0.82, tier: 'high' }, // FRONT-RIGHT
      { anchorIdx: 7, dir: [-0.45,  0.26, -0.85], length: 2.70, padR: 0.80, tier: 'high' }, // BACK
    ];

    // Foliage tones — three shades of trained-leaf green
    const leafTones = [0x4E8B3A, 0x6BAA52, 0x3A6E2A, 0x80B860];

    // All foliage puffs are collected into ONE list and rendered as a
    // SINGLE InstancedMesh at the very end of the bonsai construction.
    // This way doubling the per-pad stone count (was 8 + padR·6, now
    // 16 + padR·12) doesn't multiply draw calls.
    //
    // Each entry: { x, y, z, r, scaleY, color, rotY }
    //   x/y/z   — world position (note: positions are in bonsai-local
    //             space here; the bonsai's offset is applied at instance
    //             build time)
    //   r       — base radius (scale.x and .z)
    //   scaleY  — Y squish factor for the oblate pad shape
    //   color   — hex tint
    //   rotY    — random Y rotation for variety
    const foliagePuffs = [];

    function buildPad(centerX, centerY, centerZ, padR, tier) {
      const padThickness = padR * 0.32;
      // 2× denser pads — was 16 + padR·12, now 32 + padR·24.
      const stoneCount = Math.round(32 + padR * 24);
      // Central stone (large, oblate)
      foliagePuffs.push({
        x: centerX, y: centerY, z: centerZ,
        r: padR * 0.6, scaleY: 0.55,
        color: leafTones[Math.floor(Math.random() * leafTones.length)],
        rotY: Math.random() * Math.PI,
      });
      // Rim stones around the perimeter
      for (let s = 0; s < stoneCount; s++) {
        const ang = (s / stoneCount) * Math.PI * 2 + Math.random() * 0.4;
        const r   = padR * (0.55 + Math.random() * 0.40);
        foliagePuffs.push({
          x: centerX + Math.cos(ang) * r,
          y: centerY + (Math.random() - 0.5) * padThickness * 0.7,
          z: centerZ + Math.sin(ang) * r,
          r: padR * (0.28 + Math.random() * 0.18),
          scaleY: 0.50 + Math.random() * 0.20,
          color: leafTones[Math.floor(Math.random() * leafTones.length)],
          rotY: Math.random() * Math.PI,
        });
      }
      // Lower pads get an under-layer for thickness — also doubled
      if (tier === 'low') {
        const underCount = Math.round(stoneCount * 1.2);   // doubled
        for (let s = 0; s < underCount; s++) {
          const ang = Math.random() * Math.PI * 2;
          const r   = padR * (0.30 + Math.random() * 0.40);
          foliagePuffs.push({
            x: centerX + Math.cos(ang) * r,
            y: centerY - padThickness * (0.45 + Math.random() * 0.20),
            z: centerZ + Math.sin(ang) * r,
            r: padR * (0.22 + Math.random() * 0.14),
            scaleY: 0.5,
            color: leafTones[Math.floor(Math.random() * leafTones.length)],
            rotY: Math.random() * Math.PI,
          });
        }
      }
    }

    // Branch segments push to _barkB_cast list (merged at end).
    const renderSeg = (a, c, r0, r1) => _pushCylAB(_barkB_cast, a, c, r0, r1, 6);
    // Knots push to _barkA_cast list.
    const renderKnot = (p, r) => _pushKnot(_barkA_cast, p, r);

    for (const b of branches) {
      const base = trunkJoints[b.anchorIdx];
      const d = new T.Vector3(b.dir[0], b.dir[1], b.dir[2]).normalize();
      // Perpendicular axes for the zig-zag offsets — one horizontal,
      // one vertical relative to the branch direction. Used so each
      // segment offsets from the straight-line by a small amount in a
      // direction perpendicular to the branch axis.
      const perpH = new T.Vector3(-d.z, 0, d.x).normalize();
      const perpV = new T.Vector3().crossVectors(d, perpH).normalize();

      // 4 internal joints + base + tip = 5 segments along a zig-zag.
      // Offsets alternate signs so the silhouette visibly bends rather
      // than reading as a straight stick. Magnitude scales with branch
      // length so longer branches show more character.
      const L = b.length;
      const zigMag = Math.min(0.22, 0.07 + L * 0.04);   // horizontal sway
      const vMag   = Math.min(0.14, 0.04 + L * 0.025);  // vertical wobble
      const joints = [];
      // Joint at base
      joints.push({ x: base.x, y: base.y, z: base.z });
      // 3 interior joints with alternating horizontal + slight vertical kinks
      const ts = [0.28, 0.55, 0.80];
      const signs = [+1, -1, +0.4];
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i];
        const s = signs[i];
        const sx = base.x + d.x * L * t + perpH.x * zigMag * s;
        const sy = base.y + d.y * L * t + perpV.y * vMag * s - 0.04 * t * t;   // slight droop
        const sz = base.z + d.z * L * t + perpH.z * zigMag * s;
        joints.push({ x: sx, y: sy, z: sz });
      }
      // Final TIP — droops downward more pronounced for that "trained" feel
      joints.push({
        x: base.x + d.x * L,
        y: base.y + d.y * L - 0.10,
        z: base.z + d.z * L,
      });

      // Render each segment with progressive taper
      const radii = [
        { r0: 0.15, r1: 0.12 },
        { r0: 0.12, r1: 0.09 },
        { r0: 0.09, r1: 0.07 },
        { r0: 0.07, r1: 0.05 },
      ];
      for (let i = 0; i < joints.length - 1; i++) {
        renderSeg(joints[i], joints[i + 1], radii[i].r0, radii[i].r1);
        // Knot at the interior joint after segment i
        if (i < joints.length - 2) {
          renderKnot(joints[i + 1], radii[i].r1 * 1.4);
        }
      }

      // FLAT PAD at the branch tip — the bonsai-defining feature
      const tip = joints[joints.length - 1];
      buildPad(tip.x, tip.y + 0.05, tip.z, b.padR, b.tier);
    }

    // Apex crown — three overlapping pads at slightly different heights
    // pack the top of the silhouette so the canopy reads as continuous
    // foliage all the way up, not a stem with a tiny ball on top.
    const trunkTip = trunkJoints[trunkJoints.length - 1];
    buildPad(trunkTip.x,        trunkTip.y + 0.40, trunkTip.z,        0.75, 'mid');
    buildPad(trunkTip.x - 0.25, trunkTip.y + 0.20, trunkTip.z + 0.20, 0.55, 'high');
    buildPad(trunkTip.x + 0.20, trunkTip.y + 0.25, trunkTip.z - 0.18, 0.50, 'high');

    // ---- Dense upper-half ramification ("hosokawari") ----------------
    //
    // Real mature bonsai have THOUSANDS of small twigs forming a
    // continuous canopy surface. We can't afford that literally, so:
    //   • 36 thin twig branches randomly distributed across the upper
    //     trunk (joints 4-7) AND along the four main upper branches.
    //   • Each twig is a short low-poly cylinder (4-segment, cheap).
    //   • Each carries 1-2 small foliage puffs collected and batched
    //     into a SINGLE InstancedMesh at the end → ~80 leaf clusters
    //     for the cost of one draw call.
    // Far fewer VISIBLE twig branches (reads cleaner — was 72, now 24)
    // but each twig spawns more leaf puffs so the foliage volume stays
    // up. Net effect: same/larger foliage cloud, ⅓ the woody twigs.
    const twigCount = 24;
    // Cache the upper-branch anchor + dir lookups
    const upperBranches = branches.filter(b => b.anchorIdx >= 5);
    for (let i = 0; i < twigCount; i++) {
      // 60% sprout from along the upper trunk, 40% from along upper branches
      let baseX, baseY, baseZ;
      if (Math.random() < 0.6) {
        // Linearly interpolate between two random upper joints (4..7)
        const jA = 4 + Math.floor(Math.random() * 3);   // 4, 5, or 6
        const jB = jA + 1;
        const tlerp = Math.random();
        baseX = trunkJoints[jA].x + (trunkJoints[jB].x - trunkJoints[jA].x) * tlerp;
        baseY = trunkJoints[jA].y + (trunkJoints[jB].y - trunkJoints[jA].y) * tlerp;
        baseZ = trunkJoints[jA].z + (trunkJoints[jB].z - trunkJoints[jA].z) * tlerp;
      } else {
        const ub = upperBranches[Math.floor(Math.random() * upperBranches.length)];
        const ubBase = trunkJoints[ub.anchorIdx];
        const ubDir = new T.Vector3(ub.dir[0], ub.dir[1], ub.dir[2]).normalize();
        const tlerp = 0.35 + Math.random() * 0.55;
        baseX = ubBase.x + ubDir.x * ub.length * tlerp;
        baseY = ubBase.y + ubDir.y * ub.length * tlerp;
        baseZ = ubBase.z + ubDir.z * ub.length * tlerp;
      }
      // Random direction biased OUTWARD (horizontal) so the crown
      // spreads rather than pinching toward a point. Pitch mostly
      // shallow (-0.1 .. +0.3 rad) — twigs grow sideways like real
      // canopy ramification, not skyward.
      const yaw = Math.random() * Math.PI * 2;
      const pitch = -0.10 + Math.random() * 0.40;
      const dx = Math.cos(yaw) * Math.cos(pitch);
      const dy = Math.sin(pitch);
      const dz = Math.sin(yaw) * Math.cos(pitch);
      // Long horizontal twigs so the ramification visibly fills the
      // 3× wider crown rather than clumping near each branch tip.
      const twigLen = 0.80 + Math.random() * 0.90;
      const tipX = baseX + dx * twigLen;
      const tipY = baseY + dy * twigLen;
      const tipZ = baseZ + dz * twigLen;
      // Twig cylinder — 4-segment for cheap, thin radius
      // Twig goes to _barkB_noCast list (merged at end, no shadow).
      _pushCylAB(_barkB_noCast,
        { x: baseX, y: baseY, z: baseZ },
        { x: tipX,  y: tipY,  z: tipZ  },
        0.018, 0.030, 3);
      // Each twig now seeds a CLUSTER of ~6-9 puffs (was 1-3), so the
      // foliage volume stays high despite fewer twig stems. Cluster
      // covers a small spherical zone around the twig tip.
      const mainR = 0.26 + Math.random() * 0.18;
      foliagePuffs.push({
        x: tipX, y: tipY, z: tipZ,
        r: mainR, scaleY: 0.75,
        color: leafTones[Math.floor(Math.random() * leafTones.length)],
        rotY: Math.random() * Math.PI,
      });
      const satCount = 5 + Math.floor(Math.random() * 4);    // 5-8 satellites per twig
      for (let s = 0; s < satCount; s++) {
        const sang = Math.random() * Math.PI * 2;
        const off  = mainR * (0.55 + Math.random() * 0.85);
        const ydrop = (Math.random() - 0.35) * mainR * 0.8;
        foliagePuffs.push({
          x: tipX + Math.cos(sang) * off,
          y: tipY + ydrop,
          z: tipZ + Math.sin(sang) * off,
          r: mainR * (0.40 + Math.random() * 0.35),
          scaleY: 0.75,
          color: leafTones[Math.floor(Math.random() * leafTones.length)],
          rotY: Math.random() * Math.PI,
        });
      }
    }
    // ---- Batch ALL foliage (pad stones + twig puffs + apex pads)
    // into a single InstancedMesh. Saves hundreds of draw calls vs the
    // per-stone-per-mesh approach. With the doubled counts we're at
    // ~500-700 puffs; this stays at one draw call.
    if (foliagePuffs.length) {
      // OctahedronGeometry(1, 0) = 8 triangles (vs IcosahedronGeometry's
      // 20). At iso-camera scale + flat shading, the per-puff silhouette
      // reads identically — the cost saving is 60% fewer triangles
      // across the ~1100-instance canopy. Total foliage triangle count:
      // 1100 × 8 = 8800 (was 22000).
      const puffGeom = new T.OctahedronGeometry(1.0, 0);
      // MeshLambertMaterial — diffuse-only lighting, no PBR. At the iso
      // camera scale with flat shading the result is visually identical
      // to MeshStandardMaterial, but ~50% cheaper per fragment, which
      // matters for 1100 instances covering a large screen area.
      const puffMat  = new T.MeshLambertMaterial({ flatShading: true });
      // Same wind treatment as the grass — vertex-shader injection so
      // the sway is GPU-only. Per-puff phase derived from instance world
      // position so the entire canopy ripples in unison with the field
      // below. Higher puffs sway more (exposed to wind).
      puffMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vec3 _fPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          // Higher puffs catch more wind. Floor (lowest foliage y≈2.6)
          // still gets ~20% of the amplitude so the lower pads visibly
          // move; apex sways at full magnitude.
          float _fHeight = 0.2 + 0.8 * smoothstep(2.5, 6.5, _fPos.y);
          float _fPh = _fPos.x * 0.35 + _fPos.z * 0.25;
          // Dramatic sway — large amplitude wave + gust so the canopy
          // visibly heaves in the breeze instead of barely twitching.
          float _fWave = sin(uTime * 0.80 + _fPh)       * 0.45;
          float _fGust = sin(uTime * 1.90 + _fPh * 1.4) * 0.18;
          float _fSway = (_fWave + _fGust) * _fHeight;
          transformed.x += _fSway;
          transformed.z += _fSway * 0.5;
          `
        );
        puffMat.userData.shader = shader;
      };
      const puffInst = new T.InstancedMesh(puffGeom, puffMat, foliagePuffs.length);
      // Pre-init instanceColor by calling setColorAt(0,...) once.
      puffInst.setColorAt(0, new T.Color(1, 1, 1));
      const pufMatArr = puffInst.instanceMatrix.array;
      const pufColArr = puffInst.instanceColor.array;
      const pufCol = new T.Color();
      const bonsaiX = bonsai.position.x, bonsaiZ = bonsai.position.z;
      // Direct matrix writes — only Y rotation, no Z tilt → simpler than
      // the grass case. Same ~3× speedup over the Object3D path.
      // M = T(bonsaiX+px, py, bonsaiZ+pz) · Ry(rotY) · diag(r, r·scaleY, r)
      for (let i = 0; i < foliagePuffs.length; i++) {
        const p = foliagePuffs[i];
        const cy = Math.cos(p.rotY), sy = Math.sin(p.rotY);
        const r  = p.r, rh = p.r * p.scaleY;
        const mo = i * 16;
        pufMatArr[mo+0]  =  cy * r;
        pufMatArr[mo+1]  =  0;
        pufMatArr[mo+2]  = -sy * r;
        pufMatArr[mo+3]  =  0;
        pufMatArr[mo+4]  =  0;
        pufMatArr[mo+5]  =  rh;
        pufMatArr[mo+6]  =  0;
        pufMatArr[mo+7]  =  0;
        pufMatArr[mo+8]  =  sy * r;
        pufMatArr[mo+9]  =  0;
        pufMatArr[mo+10] =  cy * r;
        pufMatArr[mo+11] =  0;
        pufMatArr[mo+12] =  bonsaiX + p.x;
        pufMatArr[mo+13] =  p.y;
        pufMatArr[mo+14] =  bonsaiZ + p.z;
        pufMatArr[mo+15] =  1;
        pufCol.setHex(p.color);
        const co = i * 3;
        pufColArr[co]   = pufCol.r;
        pufColArr[co+1] = pufCol.g;
        pufColArr[co+2] = pufCol.b;
      }
      puffInst.instanceMatrix.needsUpdate = true;
      if (puffInst.instanceColor) puffInst.instanceColor.needsUpdate = true;
      // 1100-instance shadow-cast is one of the heaviest costs in the
      // pasture scene — disable. The pet still has its own shadow on
      // the ground, and the tree trunk segments still cast.
      puffInst.castShadow = false;
      puffInst.receiveShadow = false;
      puffInst.frustumCulled = false;        // bbox-vs-source-geom culling fix
      scene.add(puffInst);
      // Register the foliage material so the tick loop bumps its uTime
      // each frame (sway).
      _grassMat.push(puffMat);

      // ---- Apples ----------------------------------------------------
      // Pick ~50 positions from the upper foliage puffs (y > 3) and
      // hang a small red apple slightly below each. Share the same wind
      // shader so apples sway with their surrounding leaves.
      const upperPuffs = foliagePuffs.filter(p => p.y > 3.0);
      // Halved apple density — was one apple per ~10 puffs (cap 50),
      // now one per ~20 (cap 25). Apples feel like a deliberate accent
      // instead of an even spray across the canopy.
      const APPLE_COUNT = Math.min(25, Math.floor(upperPuffs.length / 20));
      if (APPLE_COUNT > 0) {
        // Octahedron (8 tris) instead of Icosahedron (20). At apple size
        // 0.22–0.35 the silhouette is identical from the iso camera.
        const appleGeom = new T.OctahedronGeometry(1.0, 0);
        // Lambert for apples too — apples are dark red diffuse spheres at
        // small screen size; the PBR metalness/roughness signal doesn't
        // show up vs. a Lambert diffuse.
        const appleMat  = new T.MeshLambertMaterial({ flatShading: true });
        // Same wind injection as the foliage, so apples sway in sync.
        appleMat.onBeforeCompile = (shader) => {
          shader.uniforms.uTime = { value: 0 };
          shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vec3 _aPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            float _aHeight = 0.2 + 0.8 * smoothstep(2.5, 6.5, _aPos.y);
            float _aPh = _aPos.x * 0.35 + _aPos.z * 0.25;
            // Same big-wave + gust as the foliage, so apples sway in sync
            // with their leaves (no parallax misalignment).
            float _aWave = sin(uTime * 0.80 + _aPh)       * 0.45;
            float _aGust = sin(uTime * 1.90 + _aPh * 1.4) * 0.18;
            float _aSway = (_aWave + _aGust) * _aHeight;
            transformed.x += _aSway;
            transformed.z += _aSway * 0.5;
            `
          );
          appleMat.userData.shader = shader;
        };
        const appleInst = new T.InstancedMesh(appleGeom, appleMat, APPLE_COUNT);
        const appleDum = new T.Object3D();
        const appleCol = new T.Color();
        // Two apple-red tones for variety: ripe (deep red) + half-ripe.
        const appleTones = [0xC0382B, 0x9F2A1F, 0xD05A3E];
        // ---- Spatially uniform apple placement (stratified XZ grid) ----
        // Picking random foliage puffs causes clumping wherever the puff
        // density is high (each twig spawns 6-8 puffs in a small space).
        // Instead, lay APPLE_COUNT positions on a jittered NxN grid that
        // spans the upper-canopy bounding box, then snap each grid cell
        // to its NEAREST upper puff. Result: apples are spread across
        // the whole crown's XZ footprint, not piled at branch tips.
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const p of upperPuffs) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z;
          if (p.z > maxZ) maxZ = p.z;
        }
        const N = Math.ceil(Math.sqrt(APPLE_COUNT));
        const cellW = (maxX - minX) / N;
        const cellH = (maxZ - minZ) / N;
        const cells = [];
        for (let cz = 0; cz < N; cz++) {
          for (let cx = 0; cx < N; cx++) {
            // Cell center + jitter (kept inside ±35% of cell so neighbour
            // cells can't swap places — preserves uniformity)
            const jx = (Math.random() - 0.5) * cellW * 0.7;
            const jz = (Math.random() - 0.5) * cellH * 0.7;
            cells.push({
              x: minX + (cx + 0.5) * cellW + jx,
              z: minZ + (cz + 0.5) * cellH + jz,
            });
          }
        }
        // Shuffle so when N²>APPLE_COUNT we don't deterministically drop
        // the same corner each time.
        for (let i = cells.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        const chosen = cells.slice(0, APPLE_COUNT);
        for (let i = 0; i < APPLE_COUNT; i++) {
          const c = chosen[i];
          // Find nearest upper puff to (c.x, c.z)
          let best = upperPuffs[0], bestD = Infinity;
          for (const p of upperPuffs) {
            const dx = p.x - c.x, dz = p.z - c.z;
            const d = dx*dx + dz*dz;
            if (d < bestD) { bestD = d; best = p; }
          }
          appleDum.position.set(
            bonsai.position.x + best.x + (Math.random() - 0.5) * 0.06,
            best.y - best.r * (0.85 + Math.random() * 0.30),
            bonsai.position.z + best.z + (Math.random() - 0.5) * 0.06,
          );
          appleDum.rotation.set(0, Math.random() * Math.PI * 2, 0);
          // Apple radius 0.22 – 0.35 — readable from the iso camera.
          const ar = 0.22 + Math.random() * 0.13;
          appleDum.scale.set(ar, ar * 0.93, ar);
          appleDum.updateMatrix();
          appleInst.setMatrixAt(i, appleDum.matrix);
          appleCol.setHex(appleTones[Math.floor(Math.random() * appleTones.length)]);
          appleInst.setColorAt(i, appleCol);
        }
        appleInst.instanceMatrix.needsUpdate = true;
        if (appleInst.instanceColor) appleInst.instanceColor.needsUpdate = true;
        appleInst.castShadow = false;                          // tiny meshes, shadow not noticeable
        appleInst.frustumCulled = false;                       // same culling fix as foliage
        scene.add(appleInst);
        _grassMat.push(appleMat);
      }
    }

    // JIN (deadwood) — one bleached-white branch stub jutting from the
    // mid-trunk. Iconic bonsai feature; signals age + survival.
    const jinMat = new T.MeshStandardMaterial({ color: 0xCDBFA8, roughness: 0.95, flatShading: true });
    const jinBase = trunkJoints[3];
    const jin = new T.Mesh(new T.CylinderGeometry(0.04, 0.10, 0.55, 5, 1), jinMat);
    // Position halfway out of the trunk, tilted slightly down
    jin.position.set(jinBase.x + 0.30, jinBase.y + 0.10, jinBase.z - 0.05);
    jin.rotation.z = -Math.PI / 2 + 0.5;
    jin.rotation.y = 0.6;
    jin.castShadow = true;
    bonsai.add(jin);

    // NEBARI — 8 small radial root knuckles at the trunk base.
    // Merged into one mesh.
    const rootItems = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.2;
      const r0 = 0.20 + Math.random() * 0.08;
      const r1 = 0.45 + Math.random() * 0.15;
      const cx = Math.cos(a) * (r0 + r1) / 2;
      const cz = Math.sin(a) * (r0 + r1) / 2;
      const geom = new T.CylinderGeometry(0.05 + Math.random() * 0.03, 0.10 + Math.random() * 0.04, r1 - r0, 5, 1);
      const e = new T.Euler(0, -a, Math.PI / 2, 'XYZ');
      const q = new T.Quaternion().setFromEuler(e);
      const m = new T.Matrix4().compose(new T.Vector3(cx, 0.08, cz), q, new T.Vector3(1, 1, 1));
      rootItems.push({ geom, matrix: m });
    }
    const rootMesh = new T.Mesh(mergeBakedGeoms(rootItems), barkA);
    rootMesh.castShadow = true;
    bonsai.add(rootMesh);

    // ---- Helper: merge a list of {geom, matrix} into a single
    // BufferGeometry with the matrices baked into the vertices. Lets us
    // drop ~40 single-purpose decoration meshes (moss, pebbles, roots)
    // into ~3 draw calls. Disposes the source geometries afterward.
    function mergeBakedGeoms(items) {
      let totalVerts = 0, totalIdx = 0;
      for (const it of items) {
        totalVerts += it.geom.attributes.position.count;
        totalIdx  += it.geom.index ? it.geom.index.count : it.geom.attributes.position.count;
      }
      const positions = new Float32Array(totalVerts * 3);
      const normals   = new Float32Array(totalVerts * 3);
      const indices   = new Uint32Array(totalIdx);
      const v = new T.Vector3(), nm = new T.Matrix3();
      let vOff = 0, iOff = 0;
      for (const it of items) {
        const g = it.geom, m = it.matrix;
        nm.getNormalMatrix(m);
        const posA = g.attributes.position.array;
        const nrmA = g.attributes.normal.array;
        const idxA = g.index ? g.index.array : null;
        const vCount = g.attributes.position.count;
        for (let i = 0; i < vCount; i++) {
          v.set(posA[i*3], posA[i*3+1], posA[i*3+2]).applyMatrix4(m);
          positions[(vOff+i)*3]   = v.x;
          positions[(vOff+i)*3+1] = v.y;
          positions[(vOff+i)*3+2] = v.z;
          v.set(nrmA[i*3], nrmA[i*3+1], nrmA[i*3+2]).applyMatrix3(nm).normalize();
          normals[(vOff+i)*3]   = v.x;
          normals[(vOff+i)*3+1] = v.y;
          normals[(vOff+i)*3+2] = v.z;
        }
        if (idxA) {
          for (let i = 0; i < idxA.length; i++) indices[iOff + i] = idxA[i] + vOff;
          iOff += idxA.length;
        } else {
          for (let i = 0; i < vCount; i++) indices[iOff + i] = i + vOff;
          iOff += vCount;
        }
        vOff += vCount;
        g.dispose();
      }
      const merged = new T.BufferGeometry();
      merged.setAttribute('position', new T.BufferAttribute(positions, 3));
      merged.setAttribute('normal',   new T.BufferAttribute(normals,   3));
      merged.setIndex(new T.BufferAttribute(indices, 1));
      return merged;
    }
    // Shared rotation helper for the helper above
    function _composeMat(px, py, pz, rotY) {
      const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotY || 0);
      return new T.Matrix4().compose(new T.Vector3(px, py, pz), q, new T.Vector3(1, 1, 1));
    }

    // ---- Moss tufts → merged into one draw call (was 18 meshes) ----
    const mossItems = [];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.30 + Math.random() * 0.50;
      const geom = new T.IcosahedronGeometry(0.10 + Math.random() * 0.06, 0);
      const mat = new T.Matrix4().compose(
        new T.Vector3(Math.cos(a) * r, 0.05, Math.sin(a) * r),
        new T.Quaternion(),
        new T.Vector3(1.2, 0.35, 1.2),
      );
      mossItems.push({ geom, matrix: mat });
    }
    const mossMesh = new T.Mesh(
      mergeBakedGeoms(mossItems),
      new T.MeshLambertMaterial({ color: 0x6F9B4D, flatShading: true }),
    );
    bonsai.add(mossMesh);

    // ---- Pebble ring → merged (was 14 meshes) ----
    const pebItems = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const r = 0.80 + Math.random() * 0.20;
      const geom = new T.DodecahedronGeometry(0.07 + Math.random() * 0.05, 0);
      pebItems.push({ geom, matrix: _composeMat(Math.cos(a) * r, 0.04, Math.sin(a) * r, Math.random() * Math.PI) });
    }
    const pebMesh = new T.Mesh(
      mergeBakedGeoms(pebItems),
      new T.MeshLambertMaterial({ color: 0x9A8771, flatShading: true }),
    );
    bonsai.add(pebMesh);

    // Build the 3 merged wood meshes from the collected items.
    // Was ~100 separate cylinder/dodec meshes → 3 draws after merge.
    if (_barkA_cast.length) {
      const m = new T.Mesh(mergeBakedGeoms(_barkA_cast), barkA);
      m.castShadow = true;
      bonsai.add(m);
    }
    if (_barkB_cast.length) {
      const m = new T.Mesh(mergeBakedGeoms(_barkB_cast), barkB);
      m.castShadow = true;
      bonsai.add(m);
    }
    if (_barkB_noCast.length) {
      const m = new T.Mesh(mergeBakedGeoms(_barkB_noCast), barkB);
      m.castShadow = false;
      bonsai.add(m);
    }

    scene.add(bonsai);

    // Collision: pet steers around a 1.0-unit cylinder at the trunk base.
    _obstacles.push({ x: bonsai.position.x, z: bonsai.position.z, radius: 1.0 });

    // ---- Wooden picket fence around the pasture border ----
    //
    // Two-rail picket fence: ~36 vertical pickets per side, each a
    // narrow chamfered box with a pointed tip. Connected by two
    // horizontal rails (top + bottom). The pickets are batched into
    // a single InstancedMesh per side, so the whole fence is 4 draws
    // (one per side) + 8 rail meshes — cheap.
    const fenceWood     = new T.MeshStandardMaterial({ color: 0xC5A37B, roughness: 0.85, flatShading: true });
    const fenceWoodDark = new T.MeshStandardMaterial({ color: 0x9D7E5A, roughness: 0.9,  flatShading: true });
    // Picket geometry: thin post with a softly-rounded top, pivoted
    // at its base. Sized to come up to Bit's waist (~0.95 of his ~1.5
    // height) so he can clearly see over but still reads as a fence.
    // The "pointy" peak is gentle, ~10% of total height, so it doesn't
    // come across as a spike row.
    const PICKET_H = 0.95;
    const PICKET_W = 0.09;
    const picketGeom = new T.BufferGeometry();
    const pw = PICKET_W / 2, ph = PICKET_H, pt = PICKET_W / 4;
    // Body: tall flat box up to 90% of height, then a gentle 4-face
    // hipped roof up to ph. The hipped tip is just a soft cap, not a
    // spike — so the fence reads as a cottage picket, not a palisade.
    const bodyTopY = ph * 0.90;
    const verts = new Float32Array([
      // bottom (0..3)
      -pw, 0, -pw,   pw, 0, -pw,   pw, 0,  pw,  -pw, 0,  pw,
      // body top (4..7)
      -pw, bodyTopY, -pw,   pw, bodyTopY, -pw,   pw, bodyTopY,  pw,  -pw, bodyTopY,  pw,
      // tip (8)
       0, ph, 0,
    ]);
    const idx = [
      // bottom (skip — buried)
      // sides
      0,1,5, 0,5,4,    // back
      1,2,6, 1,6,5,    // right
      2,3,7, 2,7,6,    // front
      3,0,4, 3,4,7,    // left
      // tip pyramid
      4,5,8,  5,6,8,  6,7,8,  7,4,8,
    ];
    picketGeom.setAttribute('position', new T.BufferAttribute(verts, 3));
    picketGeom.setIndex(idx);
    picketGeom.computeVertexNormals();

    const PICKETS_PER_SIDE = 18;
    const FENCE_INSET = 0.04;          // slightly inside the floor edge
    const halfFloor = FLOOR_W / 2 - FENCE_INSET;
    const sides = [
      { axis: 'x', sign:  1 },   // +z side (back)... wait — z direction
      { axis: 'x', sign: -1 },
      { axis: 'z', sign:  1 },
      { axis: 'z', sign: -1 },
    ];
    // Place pickets along each side. Skip a couple in the middle of the
    // FRONT side to suggest a gate gap (visual interest).
    // All 4 sides' pickets share one InstancedMesh + the rails are
    // merged into a single mesh — 5+ draws → 2 total.
    const totalPicketCapacity = sides.length * PICKETS_PER_SIDE;
    const allPicketsInst = new T.InstancedMesh(picketGeom, fenceWood, totalPicketCapacity);
    const dum = new T.Object3D();
    const railItems = [];
    let pIdx = 0;
    for (const side of sides) {
      const spacing = (FLOOR_W - 2 * FENCE_INSET) / (PICKETS_PER_SIDE - 1);
      const gateSide = (side.axis === 'z' && side.sign === 1);
      const gateA = Math.floor(PICKETS_PER_SIDE / 2);
      const gateB = gateA + 1;
      for (let i = 0; i < PICKETS_PER_SIDE; i++) {
        if (gateSide && (i === gateA || i === gateB)) continue;
        const t0 = -halfFloor + i * spacing;
        if (side.axis === 'x') {
          dum.position.set(side.sign * halfFloor, 0, t0);
          dum.rotation.set(0, Math.PI / 2, 0);
        } else {
          dum.position.set(t0, 0, side.sign * halfFloor);
          dum.rotation.set(0, 0, 0);
        }
        dum.rotation.z = (Math.random() * 2 - 1) * 0.02;
        dum.updateMatrix();
        allPicketsInst.setMatrixAt(pIdx++, dum.matrix);
      }
      // Rails collected for one merged mesh at the end
      const railLen = FLOOR_W - 2 * FENCE_INSET;
      const pushRail = (cx, len, axis, sign, isAxisX, railY) => {
        const geom = new T.BoxGeometry(len, 0.06, 0.06);
        let pos, q;
        if (isAxisX) {
          pos = new T.Vector3(sign * halfFloor, railY, cx);
          q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2);
        } else {
          pos = new T.Vector3(cx, railY, sign * halfFloor);
          q = new T.Quaternion();
        }
        const mat = new T.Matrix4().compose(pos, q, new T.Vector3(1, 1, 1));
        railItems.push({ geom, matrix: mat });
      };
      for (const railY of [0.22, 0.70]) {
        if (gateSide) {
          const gateMid = -halfFloor + (gateA + 0.5) * spacing;
          const gateHalf = spacing * 1.1;
          const leftLen = (gateMid - gateHalf) - (-halfFloor);
          const leftMid = (-halfFloor + (gateMid - gateHalf)) / 2;
          if (leftLen > 0.05) pushRail(leftMid, leftLen, side.axis, side.sign, side.axis === 'x', railY);
          const rightLen = halfFloor - (gateMid + gateHalf);
          const rightMid = (halfFloor + (gateMid + gateHalf)) / 2;
          if (rightLen > 0.05) pushRail(rightMid, rightLen, side.axis, side.sign, side.axis === 'x', railY);
        } else {
          pushRail(0, railLen, side.axis, side.sign, side.axis === 'x', railY);
        }
      }
    }
    allPicketsInst.count = pIdx;
    allPicketsInst.instanceMatrix.needsUpdate = true;
    allPicketsInst.castShadow = true;
    allPicketsInst.receiveShadow = true;
    scene.add(allPicketsInst);
    // Single merged-rail mesh — all the cross-pieces in one draw call
    if (railItems.length) {
      const railMesh = new T.Mesh(mergeBakedGeoms(railItems), fenceWoodDark);
      railMesh.castShadow = true;
      scene.add(railMesh);
    }

    // Register the fence as a perimeter wall — pet can't leave the floor.
    // Implemented as four invisible line obstacles via half-plane clamps
    // below in _newRandomTarget bounds (FLOOR_HALF already keeps it inside).
    // No need to push into _obstacles; the bounded random target + step
    // collision keep the pet inside the rails.
  }

  // Wall decor: the window is always rendered (it's the time-of-day light
  // source — without it there's no sun/moon beam). Picture-frame variant
  // dropped: it provided no signal and broke the beam every other day.
  // Outdoor pastures: no window (no walls to mount it on).
  const wallDecorIsWindow = !outdoor;
  if (wallDecorIsWindow) {
    // Window pane glows the current sky color — the pane itself reads as
    // a light source.
    const skyHex = tod.skyColor;
    // Day = anything above the horizon (sun arc). Dusk drops below the
    // horizon mid-window so it sits with night for the window-emissive
    // brightness pick.
    const isDay = tod.phase === 'day' || tod.phase === 'dawn' || tod.phase === 'sunset';
    const win = new T.Mesh(
      new T.BoxGeometry(1.6, 1.3, 0.05),
      new T.MeshStandardMaterial({
        color: skyHex,
        emissive: skyHex,
        emissiveIntensity: isDay ? 0.75 : 0.6,
        roughness: 0.3,
      })
    );
    win.position.set(1.0, 3.0, -FLOOR_W/2 + 0.12);
    scene.add(win);
    const frame = new T.Mesh(new T.BoxGeometry(1.75, 1.45, 0.04), new T.MeshStandardMaterial({ color: 0x5A6373 }));
    frame.position.set(1.0, 3.0, -FLOOR_W/2 + 0.10);
    scene.add(frame);
    // (No sun/moon disc inside the window — they're conceptually outside.
    // Light coming through the window is represented by the beam + floor
    // patch only.)
    // Sun/moon conceptually outside (background). Their light enters the
    // room AT the disc's position in the window and continues to the floor.
    //
    // Algorithm (single source of truth so disc + beam + landing all align):
    //   1. Compute disc position inside window from moon-arc coordinates
    //   2. Beam STARTS at the disc (slightly in front of window pane)
    //   3. Ray direction = (disc - moon), normalized. Continue past disc
    //      into the room until it hits the floor (y=0).
    //   4. Landing = where that ray hits the floor, clamped to floor bounds.
    const windowZ = -FLOOR_W/2 + 0.12;
    const windowX = 1, windowY = 3;
    const sunWorld = new T.Vector3(tod.sunPos[0], tod.sunPos[1], tod.sunPos[2]);
    // Disc position inside the window — same formula used to render moon mesh
    const discXOff = Math.max(-0.55, Math.min(0.55, tod.sunPos[0] / 6 * 0.55));
    const discYOff = Math.max(-0.45, Math.min(0.45, (tod.sunPos[1] - 5) / 6 * 0.4));
    const discPos = new T.Vector3(windowX + discXOff, windowY + discYOff, windowZ + 0.04);
    // Ray direction = from sun through the disc, continuing into the room
    const rayDir = discPos.clone().sub(sunWorld).normalize();
    let beamReaches = false;
    let landPos = new T.Vector3();
    if (rayDir.y < -0.04) {
      const distFromDiscToFloor = (0 - discPos.y) / rayDir.y;
      landPos.set(
        discPos.x + rayDir.x * distFromDiscToFloor,
        0,
        discPos.z + rayDir.z * distFromDiscToFloor,
      );
      const halfFloor = FLOOR_W/2 - 0.6;
      landPos.x = Math.max(-halfFloor, Math.min(halfFloor, landPos.x));
      landPos.z = Math.max(-halfFloor, Math.min(halfFloor, landPos.z));
      beamReaches = true;
    }
    if (beamReaches) {
      // Beam color = a brightened tint of the actual lerped sun/moon
      // color (tod.sunColor). The directional sunColor itself is tuned
      // for the light source, not the volumetric ray mesh — so we push
      // its luminance up so the beam reads cleanly against the floor at
      // all hours (including dusk + dawn where sunColor is dim).
      const _brighten = (c, amt) => {
        const r = Math.min(255, Math.round(((c >> 16) & 0xff) + 255 * amt));
        const g = Math.min(255, Math.round(((c >>  8) & 0xff) + 255 * amt));
        const b = Math.min(255, Math.round((c & 0xff)         + 255 * amt));
        return (r << 16) | (g << 8) | b;
      };
      const rayColor = _brighten(tod.sunColor, 0.18);

      // FRUSTUM BEAM — top face matches the window opening, bottom face
      // matches the floor patch. We START from a BoxGeometry (which is the
      // only geometry that's reliably rendered for this scene — custom
      // BufferGeometry frustums vanish even with bounding spheres set) and
      // then deform its 24 vertices so the top maps to the window opening
      // and the bottom maps to the floor landing rectangle.
      const winFront = -FLOOR_W/2 + 0.16;
      const wxL = 1 - 0.78, wxR = 1 + 0.78;
      const wyB = 3 - 0.62, wyT = 3 + 0.62;
      const patchW = 2.0, patchD = 1.8;
      const halfPW = patchW / 2, halfPD = patchD / 2;
      const fxL = landPos.x - halfPW, fxR = landPos.x + halfPW;
      const fzB = landPos.z - halfPD, fzT = landPos.z + halfPD;
      const beamFloorY = 0.06;
      const beamGeo = new T.BoxGeometry(1, 1, 1);
      const pos = beamGeo.attributes.position;
      // Box has 24 vertices (4 per face). Each starts at ±0.5 on each axis.
      // bx sign → which side of the trapezoid (left vs right).
      // by sign → which end (top = window, bottom = floor).
      // bz sign → secondary axis: at top it's window y, at bottom it's
      //           floor z.
      for (let i = 0; i < pos.count; i++) {
        const bx = pos.getX(i), by = pos.getY(i), bz = pos.getZ(i);
        let x, y, z;
        if (by > 0) {
          x = bx > 0 ? wxR : wxL;
          y = bz > 0 ? wyT : wyB;
          z = winFront;
        } else {
          x = bx > 0 ? fxR : fxL;
          y = beamFloorY;
          z = bz > 0 ? fzT : fzB;
        }
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      beamGeo.computeVertexNormals();
      beamGeo.computeBoundingSphere();
      beamGeo.computeBoundingBox();

      // Opacity tracks sun/moon intensity — bright at noon, dim near
      // sunrise/sunset, dimmer still at night when moonlight is the only
      // source. Clamped so dawn doesn't go all the way to zero and noon
      // doesn't blow out the room.
      const beamOpacity = Math.max(0.07, Math.min(0.24, tod.sunIntensity * 0.20));
      const beam = new T.Mesh(beamGeo, new T.MeshBasicMaterial({
        color: rayColor,
        transparent: true,
        opacity: beamOpacity,
        blending: T.NormalBlending,
        depthWrite: false,
        side: T.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }));
      beam.renderOrder = 1;
      beam.frustumCulled = false;
      scene.add(beam);
    }
  } else if (!outdoor) {
    // Indoor fallback (picture frame instead of window — currently
    // unreachable, kept for future expansion). Outdoor pastures get
    // nothing on a non-existent wall.
    const pic = new T.Mesh(new T.BoxGeometry(1.2, 1.4, 0.05), new T.MeshStandardMaterial({ color: 0x5BA585 }));
    pic.position.set(1.0, 3.0, -FLOOR_W/2 + 0.12);
    scene.add(pic);
    const frame = new T.Mesh(new T.BoxGeometry(1.45, 1.65, 0.04), new T.MeshStandardMaterial({ color: 0x7A4E1A }));
    frame.position.set(1.0, 3.0, -FLOOR_W/2 + 0.10);
    scene.add(frame);
  }

  // ---- Chessboard (teen stage only) — Bit's hobby ------------------
  // Teen Bit plays chess against himself. The wander loop alternates
  // between two phases:
  //   1. "Thinking" — walks somewhere random, pauses, looks down (sells
  //       the contemplation read).
  //   2. "Returning" — walks back to a fixed spot south of the board.
  //       On arrival a piece slides from one square to another, hopping
  //       slightly as if Bit lifted + placed it.
  // The board is registered as an obstacle so Bit routes around it.
  // ------------------------------------------------------------------
  let chessGroup = null;
  let chessPieces = [];                 // [{ mesh, file, rank, col, type }]
  let chessHomeX = 0, chessHomeZ = 0;   // pose-spot for Bit when "moving"
  let chessNextMoveAt = 0;
  let chessActiveMove = null;           // { piece, t0, dur, fx, fz, tx, tz, baseY }
  let lookAtChessUntil = 0;             // head pitches down at the board while > t
  const BOARD_HALF = 0.75;
  const SQ = (BOARD_HALF * 2) / 8;
  if (p.stage === 'teen') {
    chessGroup = new T.Group();
    chessGroup.position.set(2.0, 0, 1.8);

    // Wooden base — slightly larger than the playable area, dark walnut.
    const woodMat = new T.MeshStandardMaterial({ color: 0x3C2412, roughness: 0.75 });
    const base = new T.Mesh(new T.BoxGeometry(BOARD_HALF*2 + 0.06, 0.04, BOARD_HALF*2 + 0.06), woodMat);
    base.position.y = 0.02; base.castShadow = true; base.receiveShadow = true;
    chessGroup.add(base);

    // Light squares — cream — placed on top of the base. Dark squares
    // are just the base color showing through, so we only render the
    // 32 light squares (half the work).
    const lightMat = new T.MeshStandardMaterial({ color: 0xE8D8B0, roughness: 0.8 });
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 0) continue;
        const sq = new T.Mesh(new T.BoxGeometry(SQ * 0.96, 0.005, SQ * 0.96), lightMat);
        sq.position.set(-BOARD_HALF + (c + 0.5) * SQ, 0.045, -BOARD_HALF + (r + 0.5) * SQ);
        chessGroup.add(sq);
      }
    }

    // Build a single piece — a stylized polygonal silhouette per type.
    // Materials shared across pieces by color so we don't allocate 16 of them.
    const lightPieceMat = new T.MeshStandardMaterial({ color: 0xF4E5C8, roughness: 0.45, metalness: 0.05 });
    const darkPieceMat  = new T.MeshStandardMaterial({ color: 0x2B1B0D, roughness: 0.45, metalness: 0.05 });
    function buildPiece(type, mat) {
      const g = new T.Group();
      const base = new T.Mesh(new T.CylinderGeometry(SQ*0.32, SQ*0.38, 0.012, 8), mat);
      base.position.y = 0.063; g.add(base);
      if (type === 'pawn') {
        const body = new T.Mesh(new T.CylinderGeometry(SQ*0.18, SQ*0.28, 0.04, 8), mat);
        body.position.y = 0.09; g.add(body);
        const head = new T.Mesh(new T.SphereGeometry(SQ*0.22, 6, 4), mat);
        head.position.y = 0.125; g.add(head);
      } else if (type === 'king') {
        const body = new T.Mesh(new T.CylinderGeometry(SQ*0.20, SQ*0.30, 0.07, 8), mat);
        body.position.y = 0.105; g.add(body);
        const head = new T.Mesh(new T.SphereGeometry(SQ*0.24, 6, 4), mat);
        head.position.y = 0.16; g.add(head);
        // Crown cross
        const crossV = new T.Mesh(new T.BoxGeometry(SQ*0.06, 0.05, SQ*0.06), mat);
        crossV.position.y = 0.205; g.add(crossV);
        const crossH = new T.Mesh(new T.BoxGeometry(SQ*0.20, 0.012, SQ*0.06), mat);
        crossH.position.y = 0.215; g.add(crossH);
      } else if (type === 'knight') {
        const body = new T.Mesh(new T.CylinderGeometry(SQ*0.18, SQ*0.28, 0.04, 8), mat);
        body.position.y = 0.09; g.add(body);
        const head = new T.Mesh(new T.BoxGeometry(SQ*0.40, 0.07, SQ*0.22), mat);
        head.position.y = 0.14; head.rotation.z = 0.32; g.add(head);
      } else if (type === 'bishop') {
        const body = new T.Mesh(new T.ConeGeometry(SQ*0.22, 0.10, 6), mat);
        body.position.y = 0.12; g.add(body);
        const tip = new T.Mesh(new T.SphereGeometry(SQ*0.10, 5, 4), mat);
        tip.position.y = 0.185; g.add(tip);
      }
      g.children.forEach(m => { m.castShadow = true; });
      return g;
    }
    const piecePoses = [
      // Mid-game position
      { col: 'w', type: 'king',   f: 4, r: 0 },
      { col: 'w', type: 'pawn',   f: 3, r: 1 },
      { col: 'w', type: 'pawn',   f: 4, r: 3 },    // e4
      { col: 'w', type: 'knight', f: 5, r: 2 },    // f3
      { col: 'w', type: 'bishop', f: 2, r: 3 },    // c4
      { col: 'b', type: 'king',   f: 4, r: 7 },
      { col: 'b', type: 'pawn',   f: 4, r: 4 },    // e5
      { col: 'b', type: 'pawn',   f: 2, r: 5 },    // c6
      { col: 'b', type: 'knight', f: 5, r: 5 },    // f6
      { col: 'b', type: 'bishop', f: 5, r: 4 },    // f5
    ];
    for (const pos of piecePoses) {
      const mat = pos.col === 'w' ? lightPieceMat : darkPieceMat;
      const m = buildPiece(pos.type, mat);
      m.position.x = -BOARD_HALF + (pos.f + 0.5) * SQ;
      m.position.z = -BOARD_HALF + (pos.r + 0.5) * SQ;
      chessGroup.add(m);
      chessPieces.push({ mesh: m, file: pos.f, rank: pos.r, col: pos.col, type: pos.type, baseY: m.position.y });
    }

    scene.add(chessGroup);
    // Smaller obstacle radius — keeps Bit out of the board interior but
    // lets him stand right next to the south edge for the move animation.
    _obstacles.push({ x: 2.0, z: 1.8, radius: BOARD_HALF + 0.05 });
    // Where Bit stands while "moving" a piece — pressed up against the
    // south edge so the head pitch-down reads as actually looking at it.
    chessHomeX = 2.0;
    chessHomeZ = 1.8 - BOARD_HALF - 0.20;        // sits just outside obstacle safety zone
    chessNextMoveAt = 4 + Math.random() * 3;       // first move after 4-7s
  }

  function _triggerChessMove(now) {
    if (!chessPieces.length || chessActiveMove) return;
    // Random piece, random nearby square (1-2 squares away)
    const piece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
    let toF = piece.file, toR = piece.rank, tries = 8;
    while (tries-- > 0) {
      const df = Math.floor(Math.random() * 5) - 2;     // -2..2
      const dr = Math.floor(Math.random() * 5) - 2;
      if (df === 0 && dr === 0) continue;
      const nf = Math.max(0, Math.min(7, piece.file + df));
      const nr = Math.max(0, Math.min(7, piece.rank + dr));
      if (nf === piece.file && nr === piece.rank) continue;
      // Avoid stacking with another piece — pick again if occupied
      if (chessPieces.some(q => q !== piece && q.file === nf && q.rank === nr)) continue;
      toF = nf; toR = nr; break;
    }
    if (toF === piece.file && toR === piece.rank) return;
    const fx = -BOARD_HALF + (piece.file + 0.5) * SQ;
    const fz = -BOARD_HALF + (piece.rank + 0.5) * SQ;
    const tx = -BOARD_HALF + (toF   + 0.5) * SQ;
    const tz = -BOARD_HALF + (toR   + 0.5) * SQ;
    chessActiveMove = { piece: piece.mesh, t0: now, dur: 0.55, fx, fz, tx, tz, baseY: piece.baseY };
    piece.file = toF; piece.rank = toR;
  }

  // ---- Pet body ----
  // bodyHue is the persistent identity color picked at birth/respawn —
  // each life starts with a fresh hue from a curated palette. Mood + stage
  // gently modulate brightness/saturation around that signature.
  const baseColor = (typeof p.bodyHue === 'number') ? p.bodyHue : 0x9CC7E6;
  const moodShift = {
    thrilled: 1.10,   // brighter when happy
    content:  1.00,
    hungry:   0.92,
    sad:      0.85,
    sick:     0.70,   // markedly dimmer when ill
  };
  const mood = _moodForActivity(p.activity, p.fedToday);
  const moodMul = moodShift[mood] != null ? moodShift[mood] : 1.0;
  // Per-stage tint — life-stage signature kept on top of the bodyHue.
  const stageTints = {
    baby:   { r: 1.12, g: 1.08, b: 1.12 },
    teen:   { r: 1.04, g: 1.06, b: 1.02 },
    normal: { r: 1.00, g: 1.00, b: 1.00 },
    fit:    { r: 0.94, g: 1.00, b: 1.08 },
    jacked: { r: 1.08, g: 0.94, b: 0.86 },
    chubby: { r: 1.10, g: 1.00, b: 0.86 },
  };
  const tint = stageTints[p.stage === 'baby' ? 'baby'
                        : p.stage === 'teen' ? 'teen'
                        : (p.body || 'normal')] || stageTints.normal;
  const tintedR = Math.min(255, Math.round(((baseColor >> 16) & 0xff) * tint.r * moodMul));
  const tintedG = Math.min(255, Math.round(((baseColor >> 8)  & 0xff) * tint.g * moodMul));
  const tintedB = Math.min(255, Math.round((baseColor & 0xff) * tint.b * moodMul));
  const petColor = (tintedR << 16) | (tintedG << 8) | tintedB;
  const petMat = new T.MeshStandardMaterial({ color: petColor, flatShading: true, roughness: 0.65 });

  // ---- Death state (lifecycle preview only) — tombstone instead of pet ----
  if (p.stage === 'dead') {
    const tombMat = new T.MeshStandardMaterial({ color: 0x6b7280, flatShading: true, roughness: 0.85 });
    const tombDarkMat = new T.MeshStandardMaterial({ color: 0x4b5563, flatShading: true, roughness: 0.85 });
    // Main slab
    const slab = new T.Mesh(new T.BoxGeometry(1.4, 1.6, 0.22), tombMat);
    slab.position.set(0, 0.8, 0);
    slab.castShadow = true;
    scene.add(slab);
    // Rounded top (half-sphere flattened in z)
    const top = new T.Mesh(new T.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), tombMat);
    top.position.set(0, 1.6, 0);
    top.scale.set(1, 1, 0.31);
    top.castShadow = true;
    scene.add(top);
    // "RIP" engraving — two thin horizontal slabs in darker stone
    const ripMat = new T.MeshStandardMaterial({ color: 0x2a2e34, flatShading: true });
    const rip1 = new T.Mesh(new T.BoxGeometry(0.55, 0.16, 0.04), ripMat);
    rip1.position.set(0, 1.15, 0.13);
    scene.add(rip1);
    const rip2 = new T.Mesh(new T.BoxGeometry(0.6, 0.06, 0.04), ripMat);
    rip2.position.set(0, 0.45, 0.13);
    scene.add(rip2);
    // Base mound / earth
    const mound = new T.Mesh(new T.BoxGeometry(2.0, 0.18, 1.0), tombDarkMat);
    mound.position.set(0, 0.09, 0);
    mound.receiveShadow = true;
    scene.add(mound);
    // Small flower as a memorial — colorful note in a grim scene
    const flowerStemMat = new T.MeshStandardMaterial({ color: 0x3D8466 });
    const stem = new T.Mesh(new T.BoxGeometry(0.05, 0.45, 0.05), flowerStemMat);
    stem.position.set(0.65, 0.32, 0.35);
    scene.add(stem);
    const flowerHead = new T.Mesh(new T.IcosahedronGeometry(0.10, 0), new T.MeshStandardMaterial({ color: 0xD7384C, flatShading: true }));
    flowerHead.position.set(0.65, 0.6, 0.35);
    scene.add(flowerHead);

    // Render once. No animation loop needed (totally static scene); the
    // visibility / dispose plumbing below still runs.
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', precision: 'mediump' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.BasicShadowMap;
    const _ld = container.querySelector('[data-pet-loading]');
    if (_ld) _ld.remove();
    container.appendChild(renderer.domElement);
    renderer.render(scene, camera);
    const handle = {
      dispose: () => {
        try { renderer.dispose(); } catch(_) {}
        try { renderer.forceContextLoss && renderer.forceContextLoss(); } catch(_) {}
        try { if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement); } catch(_) {}
        scene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    };
    _PET_MOUNTS.set(container, handle);
    return handle;
  }

  /* ---- Bit's rig ----
   * Named sub-groups so each part can be animated independently
   * (breathing on bodyGroup, blinks on eyes, ear lag on each ear, etc.)
   *
   *   petGroup
   *     facing                    rotation.y = direction of motion
   *       bodyGroup               root for body block (scale → squash/stretch)
   *         body mesh
   *         feetGroup
   *           footL (own pivot for step lift)
   *           footR
   *       headGroup               nodding / forward-bob during walk
   *         head mesh
   *         earGroupL / earGroupR (rotation lag w/ damped spring)
   *         eyeL / eyeR  (scaleY for blinks)
   *         pupilL / pupilR (position offset for eye dart)
   *         cheeks, mouth, sparkles
   */

  // Stage / body geometry parameters — EXTREME silhouettes, each is a
  // genuinely distinct shape, not a tiny variation of the same blob.
  let bw, bh, bd, headR, hasFeet = true, eyeScale = 1;
  let hasShoulders = false;   // jacked-only — adds deltoid bumps
  let hasBelly = false;       // chubby-only — adds a forward belly bump
  if (p.stage === 'baby')         { bw = 0.55; bh = 0.42; bd = 0.55; headR = 1.0;  hasFeet = false; eyeScale = 1.45; }
  else if (p.stage === 'teen')    { bw = 0.75; bh = 1.10; bd = 0.75; headR = 0.62; eyeScale = 0.95; }
  else if (p.body === 'jacked')   { bw = 1.70; bh = 1.25; bd = 0.90; headR = 0.60; eyeScale = 0.85; hasShoulders = true; }
  else if (p.body === 'fit')      { bw = 0.80; bh = 1.50; bd = 0.75; headR = 0.60; eyeScale = 0.90; }
  else if (p.body === 'chubby')   { bw = 1.55; bh = 0.70; bd = 1.50; headR = 0.78; eyeScale = 1.05; hasBelly = true; }
  else                            { bw = 1.00; bh = 1.00; bd = 1.00; headR = 0.70; eyeScale = 1.00; }

  const petGroup = new T.Group();
  const facing = new T.Group();
  petGroup.add(facing);

  // BODY group — squashable, breathing
  const bodyGroup = new T.Group();
  facing.add(bodyGroup);
  const body = new T.Mesh(new T.IcosahedronGeometry(0.55, 1), petMat);
  body.scale.set(bw, bh, bd);
  body.position.y = bh * 0.55;
  body.castShadow = true;
  bodyGroup.add(body);
  bodyGroup.userData.baseScaleY = 1;     // for breath

  // === Body accessories — POSITIONS pushed outside the body sphere so
  //     they actually protrude (rather than being buried inside it).
  //     Body is an icosahedron of radius 0.55 scaled (bw, bh, bd), so its
  //     surface in bodyGroup-coords is at ±0.55·{bw,bd} on x/z, and the
  //     sphere extends y ∈ [0, bh·1.1]. ===

  // Jacked-only — clearly-visible deltoid bumps + chest plate
  if (hasShoulders) {
    const shoulderGeo = new T.IcosahedronGeometry(0.34, 1);
    const shoulderL = new T.Mesh(shoulderGeo, petMat);
    const shoulderR = new T.Mesh(shoulderGeo, petMat);
    // Out to body surface in X, near body top in Y, slightly forward
    shoulderL.position.set(-bw * 0.55, bh * 0.95, bd * 0.05);
    shoulderR.position.set( bw * 0.55, bh * 0.95, bd * 0.05);
    shoulderL.scale.set(1.1, 0.95, 1.1);
    shoulderR.scale.set(1.1, 0.95, 1.1);
    shoulderL.castShadow = true; shoulderR.castShadow = true;
    bodyGroup.add(shoulderL); bodyGroup.add(shoulderR);
    // Chest plate — sits on the front surface of the body
    const chest = new T.Mesh(new T.BoxGeometry(bw * 0.78, bh * 0.34, 0.18), petMat);
    chest.position.set(0, bh * 0.65, bd * 0.56);   // z just past body front
    chest.castShadow = true;
    bodyGroup.add(chest);
  }
  // Chubby-only — round belly bump clearly protruding forward
  if (hasBelly) {
    const belly = new T.Mesh(new T.IcosahedronGeometry(0.42, 1), petMat);
    belly.scale.set(1.0, 0.9, 0.85);
    belly.position.set(0, bh * 0.45, bd * 0.62);   // pushed forward of body
    belly.castShadow = true;
    bodyGroup.add(belly);
  }

  // Lighter belly patch — lighter contrasting tummy color sitting on the
  // FRONT surface of the body (hemisphere protrudes outward).
  if (p.stage !== 'baby' && !hasBelly) {
    const bellyColor = _lighten(petColor, 1.35);
    const bellyMat = new T.MeshStandardMaterial({ color: bellyColor, flatShading: true, roughness: 0.7 });
    const bellyPatch = new T.Mesh(new T.IcosahedronGeometry(0.26, 1), bellyMat);
    bellyPatch.scale.set(bw * 0.7, bh * 0.6, 0.5);
    bellyPatch.position.set(0, bh * 0.5, bd * 0.56);   // outside body front
    bodyGroup.add(bellyPatch);
  }

  // Tail — clearly behind the body
  if (p.stage === 'adult') {
    const tailMat = new T.MeshStandardMaterial({ color: _darken(petColor, 0.85), flatShading: true });
    const tail = new T.Mesh(new T.IcosahedronGeometry(0.15, 1), tailMat);
    tail.position.set(0, bh * 0.45, -bd * 0.62);   // outside body back
    tail.castShadow = true;
    bodyGroup.add(tail);
  }

  // Jacked-only — bicep bumps clearly outboard of the body
  if (hasShoulders) {
    const bicepGeo = new T.IcosahedronGeometry(0.22, 1);
    const bicepL = new T.Mesh(bicepGeo, petMat);
    const bicepR = new T.Mesh(bicepGeo, petMat);
    bicepL.position.set(-bw * 0.78, bh * 0.55, 0);
    bicepR.position.set( bw * 0.78, bh * 0.55, 0);
    bicepL.castShadow = true; bicepR.castShadow = true;
    bodyGroup.add(bicepL); bodyGroup.add(bicepR);
  }

  // HEAD group — nods + forward-bobs during walk; eyes/ears children of this
  const headGroup = new T.Group();
  headGroup.position.y = bh + headR * 0.05;
  facing.add(headGroup);

  const head = new T.Mesh(new T.IcosahedronGeometry(headR, 1), petMat);
  head.position.y = headR * 0.8;
  head.castShadow = true;
  headGroup.add(head);

  // Stage-specific head accessory — no hair tufts. Only the adult-body
  // variants get a visible piece of headwear (fit / jacked / chubby);
  // baby, teen, normal stay clean-headed and are distinguished by
  // proportions + color tints alone.
  const TOP_Y = headR * 1.8;
  if (p.body === 'fit') {
    // Athletic headband — RED torus around the forehead
    const bandMat = new T.MeshStandardMaterial({ color: 0xD7384C, flatShading: true, roughness: 0.5 });
    const band = new T.Mesh(new T.TorusGeometry(headR * 1.02, headR * 0.11, 6, 16), bandMat);
    band.position.y = headR * 1.15;
    band.rotation.x = Math.PI / 2;
    band.castShadow = true;
    headGroup.add(band);
  } else if (p.body === 'jacked') {
    // White sweatband — same shape, brighter, slightly thicker
    const bandMat = new T.MeshStandardMaterial({ color: 0xF8F4FF, flatShading: true, roughness: 0.6 });
    const band = new T.Mesh(new T.TorusGeometry(headR * 1.03, headR * 0.13, 6, 16), bandMat);
    band.position.y = headR * 1.10;
    band.rotation.x = Math.PI / 2;
    band.castShadow = true;
    headGroup.add(band);
  } else if (p.body === 'chubby') {
    // Cream dome hat with a small red button on top
    const hatMat = new T.MeshStandardMaterial({ color: 0xF8E8C4, flatShading: true });
    const hatH = headR * 0.45;
    const hat = new T.Mesh(new T.IcosahedronGeometry(headR * 0.42, 1), hatMat);
    hat.position.y = TOP_Y + (hatH / 2) - headR * 0.05;
    hat.scale.set(1, 0.55, 1);
    hat.castShadow = true;
    headGroup.add(hat);
    const button = new T.Mesh(new T.IcosahedronGeometry(headR * 0.08, 0), new T.MeshStandardMaterial({ color: 0xD7384C, flatShading: true }));
    button.position.y = hat.position.y + headR * 0.25;
    headGroup.add(button);
  }

  // (Ears removed entirely. No dummy groups, no animation channel.)

  // Eyes — white sclera with a black pupil that protrudes from its surface
  // (so the pupil reads clearly at the iso camera angle, not as a faint
  // shadow inside the white). The pupil is its own child so eye-dart can
  // offset it without moving the sclera.
  // MeshBasicMaterial for the pupil = pure black, no lighting falloff, no
  // confusion against the body colour at glancing angles.
  const eyeWhiteMat = new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25, metalness: 0 });
  const eyeDarkMat  = new T.MeshBasicMaterial({ color: 0x000000 });
  const scleraR = headR * 0.24 * eyeScale;
  const pupilR  = headR * 0.085 * eyeScale;   // ~35% of sclera — cute, not over-filled
  const eyeWhiteGeo = new T.SphereGeometry(scleraR, 14, 12);
  const eyePupilGeo = new T.SphereGeometry(pupilR,  10, 8);
  const eyeY = headR * 0.85;
  const eyeOff = headR * 0.32;
  const eyeFront = headR * 0.84;
  function makeEye(side) {
    const grp = new T.Group();
    grp.position.set(side * eyeOff, eyeY, eyeFront);
    grp.userData.baseScaleY = 1;
    const white = new T.Mesh(eyeWhiteGeo, eyeWhiteMat);
    grp.add(white);
    // Pupil center sits ALMOST on the sclera's front surface so the front
    // half of the pupil sphere is clearly visible as a black dot.
    const pupil = new T.Mesh(eyePupilGeo, eyeDarkMat);
    pupil.position.z = scleraR * 0.78;
    pupil.userData.basePos = pupil.position.clone();
    grp.userData.pupil = pupil;
    grp.add(pupil);
    // Sparkle — tiny white catchlight on the pupil for cuteness
    const spark = new T.Mesh(new T.SphereGeometry(pupilR * 0.32, 6, 4), new T.MeshBasicMaterial({ color: 0xFFFFFF }));
    spark.position.set(pupilR * 0.4, pupilR * 0.4, scleraR * 0.95);
    grp.add(spark);
    return grp;
  }
  const eyeGroupL = makeEye(-1);
  const eyeGroupR = makeEye( 1);
  headGroup.add(eyeGroupL); headGroup.add(eyeGroupR);

  // (Cheek spots removed.)

  // Mouth — two thin boxes meeting at center for a small smile
  const mouthMat = new T.MeshStandardMaterial({ color: 0x4A2E1C });
  const mouthGeo = new T.BoxGeometry(headR * 0.18, headR * 0.04, headR * 0.04);
  const mouthGroup = new T.Group();
  mouthGroup.position.set(0, headR * 0.52, eyeFront + headR * 0.02);
  const mL = new T.Mesh(mouthGeo, mouthMat);
  const mR = new T.Mesh(mouthGeo, mouthMat);
  mL.position.x = -headR * 0.09;
  mL.rotation.z =  Math.PI * 0.12;
  mR.position.x =  headR * 0.09;
  mR.rotation.z = -Math.PI * 0.12;
  mouthGroup.add(mL); mouthGroup.add(mR);
  headGroup.add(mouthGroup);

  // Feet — each pivoted so it can step (translate Y up + back during stride).
  // Babies don't have visible feet (chibi proportions).
  let footL = null, footR = null;
  if (hasFeet) {
    const footMat = new T.MeshStandardMaterial({ color: _darken(petColor, 0.7), flatShading: true });
    const footGeo = new T.BoxGeometry(bw * 0.28, 0.12, bd * 0.4);
    footL = new T.Mesh(footGeo, footMat);
    footR = new T.Mesh(footGeo, footMat);
    footL.castShadow = true; footR.castShadow = true;
    footL.position.set(-bw * 0.22, 0.06, bd * 0.18);
    footR.position.set( bw * 0.22, 0.06, bd * 0.18);
    footL.userData.baseY = footL.position.y;
    footR.userData.baseY = footR.position.y;
    facing.add(footL); facing.add(footR);
  }
  // Headgroup base position so we can ride on the body's breath/walk-bob
  headGroup.userData.baseY = headGroup.position.y;
  headGroup.userData.baseZ = 0;

  // Forward-lean tilt (anticipation/follow-through) — applied to facing.rotation.x
  facing.userData.baseRotX = 0;

  scene.add(petGroup);

  // ---- Props per activity ----
  if (p.activity === 'eat' || p.activity === 'beg') {
    const bowlMat = new T.MeshStandardMaterial({ color: 0x7A4E1A, roughness: 0.7 });
    const bowl = new T.Mesh(new T.CylinderGeometry(0.5, 0.4, 0.3, 12), bowlMat);
    bowl.position.set(-1.5, 0.15, 1.5);
    bowl.castShadow = true; bowl.receiveShadow = true;
    scene.add(bowl);
    if (p.activity === 'eat') {
      const foodMat = new T.MeshStandardMaterial({ color: 0xC7780E });
      const food = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), foodMat);
      food.position.set(-1.5, 0.4, 1.5);
      food.castShadow = true;
      scene.add(food);
    }
    petGroup.position.set(-0.7, 0, 1.5);
    petGroup.rotation.y = -Math.PI / 4;
  }
  if (p.activity === 'sleep') {
    const bedFrameMat = new T.MeshStandardMaterial({ color: 0x7849E0, roughness: 0.7 });
    const bedFrame = new T.Mesh(new T.BoxGeometry(2.4, 0.4, 1.4), bedFrameMat);
    bedFrame.position.set(0, 0.2, 1.2);
    bedFrame.castShadow = true; bedFrame.receiveShadow = true;
    scene.add(bedFrame);
    const pillow = new T.Mesh(new T.BoxGeometry(0.7, 0.18, 1.0), new T.MeshStandardMaterial({ color: 0xE5DEF7 }));
    pillow.position.set(-0.8, 0.49, 1.2);
    pillow.castShadow = true;
    scene.add(pillow);
    // Position Bit ON the bed surface; rotation is handled per-frame by
    // the animation tick via facing.rotation.z (do NOT also rotate petGroup
    // here — that would double-rotate Bit ~138° and bury him in the mattress).
    petGroup.position.set(0.2, 0.6, 1.2);
  }
  if (p.activity === 'workout') {
    const barMat = new T.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.6, roughness: 0.3 });
    const bar = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 1.6, 8), barMat);
    bar.rotation.z = Math.PI/2;
    bar.position.set(1.5, 0.7, 1.5);
    bar.castShadow = true;
    scene.add(bar);
    const weightMat = new T.MeshStandardMaterial({ color: 0x475467, roughness: 0.5 });
    const wL = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.25, 12), weightMat);
    wL.rotation.z = Math.PI/2;
    wL.position.set(0.8, 0.7, 1.5);
    wL.castShadow = true;
    scene.add(wL);
    const wR = wL.clone(); wR.position.set(2.2, 0.7, 1.5);
    scene.add(wR);
    petGroup.position.set(1.5, 0, 0);
  }
  // Ball + physics state — non-null only when activity === 'play'. The tick
  // loop integrates gravity, ground/wall collisions, rolling friction, and
  // an elastic kick when Bit's body sphere overlaps it.
  let playBall = null;
  let ballPhys = null;
  if (p.activity === 'play') {
    const ballMat = new T.MeshStandardMaterial({ color: 0xD7384C, roughness: 0.4 });
    playBall = new T.Mesh(new T.SphereGeometry(0.35, 20, 14), ballMat);
    playBall.position.set(-1.4, 0.35, 1.2);
    playBall.castShadow = true; playBall.receiveShadow = true;
    scene.add(playBall);
    ballPhys = {
      vx: 0, vy: 0, vz: 0,        // m/s
      radius: 0.35,
      // Material constants — rubber ball numbers from real physics tables
      restitutionY: 0.62,         // vertical bounce (energy retained on floor hit)
      restitutionXZ: 0.74,        // wall bounce (less loss to friction)
      gravity: 9.8,               // m/s²
      airDrag: 0.10,              // linear drag coefficient
      rollFriction: 1.4,          // ground-contact damping (1/s)
      kickAt: 0,                  // throttle: no kick within 250ms of last
    };
  }

  // ---- Renderer ----
  // Power-conscious config: low-power preference (let mobile GPUs stay cool),
  // capped pixel ratio (1.5 covers retina/HiDPI; 2+ on a 280px canvas is
  // wasted detail), basic shadow mapping not PCF-soft (cheaper, still good
  // at this scale).
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
    precision: 'mediump',
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.BasicShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace || T.sRGBEncoding;
  // Remove the Liquid Glass loading spinner now that the canvas is ready.
  const _loadingEl = container.querySelector('[data-pet-loading]');
  if (_loadingEl) _loadingEl.remove();
  container.appendChild(renderer.domElement);

  // ---- Food piles in the room ----
  // Each pile of XP-food is a small mound of 3 spheres. Bit walks to the
  // nearest pile, eats it on contact (pile vanishes; eatenTodayXP += pileXP).
  // Positions are deterministically scattered around the floor.
  const FLOOR_HALF = 2.8;
  const foodPiles = [];  // [{ mesh, x, z, eaten:false, dropping?:bool }]
  // Materials lifted so dropFood() can reuse them at runtime.
  const foodMat = new T.MeshStandardMaterial({ color: 0xC7780E, flatShading: true, roughness: 0.7 });
  const foodMatDark = new T.MeshStandardMaterial({ color: 0x8E5408, flatShading: true, roughness: 0.7 });
  function _makeFoodPile() {
    const g = new T.Group();
    const k0 = new T.Mesh(new T.IcosahedronGeometry(0.13, 0), foodMat);
    const k1 = new T.Mesh(new T.IcosahedronGeometry(0.11, 0), foodMatDark);
    const k2 = new T.Mesh(new T.IcosahedronGeometry(0.10, 0), foodMat);
    k0.position.set(0, 0.13, 0);
    k1.position.set(0.10, 0.11, 0.04);
    k2.position.set(-0.08, 0.11, -0.05);
    k0.castShadow = k1.castShadow = k2.castShadow = true;
    g.add(k0); g.add(k1); g.add(k2);
    return g;
  }
  // Bit's "I see food!" reaction window — set when dropFood is called.
  let bitReactionUntil = 0;

  if (p.foodPilesAvailable > 0 && p.autoSpawnFood !== false) {
    // Legacy auto-spawn (lifecycle preview only — dashboard uses the explicit
    // Drop-food button via handle.dropFood instead, so we suppress this by
    // default and let dashboard opt out via autoSpawnFood:false).
    const dateSeed = parseInt((p.lastTickDate || '20260101').replaceAll('-',''), 10);
    function rand(i) {
      const x = Math.sin(dateSeed + i * 9301) * 43758.5453;
      return x - Math.floor(x);
    }
    for (let i = 0; i < p.foodPilesAvailable; i++) {
      const px = (rand(i * 2) * 2 - 1) * FLOOR_HALF;
      const pz = (rand(i * 2 + 1) * 2 - 1) * FLOOR_HALF;
      const pileGroup = _makeFoodPile();
      pileGroup.position.set(px, 0, pz);
      pileGroup.userData.baseY = 0;
      scene.add(pileGroup);
      foodPiles.push({ group: pileGroup, x: px, z: pz, eaten: false });
    }
  }

  // ---- Animation loop (visibility-gated) ----
  // Optimization strategy:
  //   • IntersectionObserver pauses rAF when canvas is off-screen (scroll).
  //   • visibilitychange pauses when the tab is hidden.
  //   • Static activities (sleep / idle / cough / eat / beg) — where the
  //     scene barely changes — fall back to a 30fps cap instead of 60fps.
  //   • Walking / play / workout stay at full 60fps so motion is smooth.
  //   • When pet is fully at rest AND no piles to eat, render at 12fps
  //     (1 frame every ~80ms) — the canvas stays alive for any state
  //     change but doesn't spin the GPU.
  let mounted = true;
  let visible = true;     // toggled by IntersectionObserver + visibilitychange
  let t = 0;
  let lastFrame = performance.now();
  let lastRender = 0;

  // Wander state — Bit picks a target on the floor, walks toward it
  // at constant speed turning to face it, then picks a new target on arrival.
  // If food piles exist, the target IS the nearest food pile; on arrival
  // the pile is "eaten" (removed from scene) and state.pet.eatenTodayXP
  // is incremented + persisted.
  // Reject points that fall inside any registered obstacle (e.g. the
  // bonsai trunk in the outdoor pasture).
  function _pointInsideObstacle(x, z) {
    for (let i = 0; i < _obstacles.length; i++) {
      const o = _obstacles[i];
      const dx = x - o.x, dz = z - o.z;
      if (dx * dx + dz * dz < o.radius * o.radius) return true;
    }
    return false;
  }
  function _newRandomTarget() {
    for (let tries = 0; tries < 8; tries++) {
      const x = (Math.random() * 2 - 1) * FLOOR_HALF;
      const z = (Math.random() * 2 - 1) * FLOOR_HALF;
      if (!_pointInsideObstacle(x, z)) return { x, z, foodIdx: -1 };
    }
    // Fallback: take the last candidate even if inside; the walk-step
    // collision logic below will deflect.
    return { x: 0, z: 0, foodIdx: -1 };
  }
  function _nearestFoodTarget() {
    let bestIdx = -1, bestDist = Infinity;
    for (let i = 0; i < foodPiles.length; i++) {
      if (foodPiles[i].eaten) continue;
      const dx = foodPiles[i].x - petGroup.position.x;
      const dz = foodPiles[i].z - petGroup.position.z;
      const d  = Math.sqrt(dx*dx + dz*dz);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx < 0) return _newRandomTarget();
    return { x: foodPiles[bestIdx].x, z: foodPiles[bestIdx].z, foodIdx: bestIdx };
  }
  let target = foodPiles.length > 0 ? _nearestFoodTarget() : _newRandomTarget();
  let pauseUntil = 0;
  let currentFacing = 0;   // current rotation.y, lerp-smoothed each frame

  // ---- Ambient animation state (always running, independent of activity) ----
  let nextBlinkAt = 2 + Math.random() * 4;
  let blinkPhase = -1;
  let eyeDartTargetX = 0, eyeDartTargetY = 0, eyeDartCurX = 0, eyeDartCurY = 0;
  let nextEyeDartAt = 1.5 + Math.random() * 3;
  let facingVel = 0;
  let leanVel = 0;
  let gait = 0;
  const oneShot = { kind: null, start: 0, duration: 0 };
  // Schedule state for play-mode "trick" hops (flips + spins). v0/duration
  // derived from projectile motion when the trick fires.
  const playTrick = { active: false, kind: null, start: 0, v0: 0, duration: 0, next: 0 };

  // Tap interaction: Bit looks at the camera briefly (0.7s), then walks to
  // wherever the user tapped on the floor. Tap location is raycast to the
  // floor plane and clamped to FLOOR_HALF so Bit never walks past the room.
  let lookAtCameraUntil = 0;
  let lookAtCameraStart = 0;
  let queuedWalkTarget = null;
  const _tapRay = new T.Raycaster();
  const _tapNDC = new T.Vector2();
  const _floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const _tapHit = new T.Vector3();
  function onTap(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    _tapNDC.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    _tapNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _tapRay.setFromCamera(_tapNDC, camera);
    if (_tapRay.ray.intersectPlane(_floorPlane, _tapHit)) {
      // Clamp tap location to floor boundaries — never walk past the room
      const tx = Math.max(-FLOOR_HALF, Math.min(FLOOR_HALF, _tapHit.x));
      const tz = Math.max(-FLOOR_HALF, Math.min(FLOOR_HALF, _tapHit.z));
      lookAtCameraStart = t;
      lookAtCameraUntil = t + 1.4;             // look at camera for 1.4s
      pauseUntil = lookAtCameraUntil;          // hold position during look
      queuedWalkTarget = { x: tx, z: tz, foodIdx: -1 };
    }
  }
  renderer.domElement.style.cursor = 'pointer';
  renderer.domElement.addEventListener('pointerdown', onTap, { passive: true });

  function tick(now) {
    if (!mounted) return;
    if (!visible) {
      setTimeout(() => requestAnimationFrame(tick), 250);
      return;
    }
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    t += dt;

    // Adaptive frame budget (60fps active / 30fps ambient — perf gating)
    const highMotion = p.activity === 'walk' || p.activity === 'play' || p.activity === 'workout' || foodPiles.some(f => !f.eaten);
    const minFrameInterval = highMotion ? 16 : 33;
    if (now - lastRender < minFrameInterval) {
      requestAnimationFrame(tick);
      return;
    }
    lastRender = now;

    // Reset per-frame Z tilt at the top — baby's walk-waddle and the
    // sleep tip-over both write to it, so without a reset their values
    // bleed between activities (e.g. baby stays tilted when walk
    // transitions to idle). Note: `activity` (const) is declared later
    // in this tick, so reference p.activity directly here to avoid a
    // TDZ ReferenceError.
    if (p.activity !== 'sleep') facing.rotation.z = 0;

    // ===== AMBIENT (always-on) =====
    // Breathing — body Y scale oscillates 1.0..1.018 at 0.4 Hz, with a softer
    // wave (cycloid-ish, not sin²) so the rhythm feels organic.
    const breath = 1 + Math.sin(t * 0.4 * Math.PI * 2) * 0.018;
    bodyGroup.scale.y = breath;

    // Wind-driven materials (outdoor only): grass, bonsai foliage, apples.
    // All read a shared uTime; grass additionally consumes a uPetPos for
    // the grass-parting effect. CPU cost per frame: one float uniform
    // write per material + one vec3 copy for grass.
    if (_grassMat) {
      for (const m of _grassMat) {
        const sh = m.userData && m.userData.shader;
        if (!sh) continue;
        if (sh.uniforms.uTime)   sh.uniforms.uTime.value = t;
        if (sh.uniforms.uPetPos) sh.uniforms.uPetPos.value.set(
          petGroup.position.x, 0, petGroup.position.z,
        );
      }
    }

    // Head micro-bob — offset π/3 from breath, smaller amplitude
    const headBob = Math.sin(t * 0.62 * Math.PI * 2 + Math.PI/3) * 0.012;
    headGroup.position.y = (headGroup.userData.baseY + headBob);

    // Blink
    if (blinkPhase < 0) {
      if (t > nextBlinkAt) { blinkPhase = 0; nextBlinkAt = t + 3.5 + Math.random() * 5; }
    } else {
      blinkPhase += dt / 0.09;   // 90ms close, 90ms open
      // Use a 0..1..0 triangle for the close-then-open cycle
      const k = blinkPhase < 0.5 ? blinkPhase * 2 : (1 - blinkPhase) * 2;
      const eyeScaleY = 1 - Math.max(0, Math.min(1, k)) * 0.92;
      eyeGroupL.scale.y = eyeScaleY;
      eyeGroupR.scale.y = eyeScaleY;
      if (blinkPhase >= 1) {
        blinkPhase = -1;
        eyeGroupL.scale.y = 1;
        eyeGroupR.scale.y = 1;
      }
    }

    // Look-at-camera (tap): pupils nudge toward camera, eyes briefly widen.
    // SMALL offset — within normal eye range, not pinned to extreme corner.
    const lookingAtCam = t < lookAtCameraUntil;
    if (lookingAtCam) {
      eyeDartTargetX = headR * 0.03;
      eyeDartTargetY = headR * 0.035;
      nextEyeDartAt = lookAtCameraUntil + 0.4;
      const sinceTap = t - lookAtCameraStart;
      let widen = 0;
      if (sinceTap < 0.11)      widen = Ease.outQuad(sinceTap / 0.11) * 0.14;
      else if (sinceTap < 0.22) widen = 0.14 - Ease.outQuad((sinceTap - 0.11) / 0.11) * 0.14;
      if (blinkPhase < 0) {
        eyeGroupL.scale.y = 1 + widen;
        eyeGroupR.scale.y = 1 + widen;
      }
    }

    // Eye dart (skipped while lookAtCamera is overriding the target)
    if (t > nextEyeDartAt) {
      eyeDartTargetX = (Math.random() * 2 - 1) * headR * 0.07;
      eyeDartTargetY = (Math.random() * 2 - 1) * headR * 0.04;
      nextEyeDartAt = t + 2 + Math.random() * 4;
    }
    eyeDartCurX += (eyeDartTargetX - eyeDartCurX) * Math.min(1, dt * 6);
    eyeDartCurY += (eyeDartTargetY - eyeDartCurY) * Math.min(1, dt * 6);
    const pupL = eyeGroupL.userData.pupil;
    const pupR = eyeGroupR.userData.pupil;
    pupL.position.set(pupL.userData.basePos.x + eyeDartCurX, pupL.userData.basePos.y + eyeDartCurY, pupL.userData.basePos.z);
    pupR.position.set(pupR.userData.basePos.x + eyeDartCurX, pupR.userData.basePos.y + eyeDartCurY, pupR.userData.basePos.z);

    // ===== FOOD PILE BOB =====
    for (let i = 0; i < foodPiles.length; i++) {
      if (!foodPiles[i].eaten) {
        foodPiles[i].group.position.y = Math.sin(t * 2 + i * 1.7) * 0.025;
        foodPiles[i].group.rotation.y = (i * 0.4) + Math.sin(t * 0.6 + i) * 0.05;
      }
    }

    // ===== CHESS PIECE SLIDE (teen only) =====
    // Piece floats up, slides across to the new square, then settles.
    // Triggered by _triggerChessMove() when Bit arrives at the board.
    if (chessActiveMove) {
      const m = chessActiveMove;
      const k = Math.min(1, (t - m.t0) / m.dur);
      const eased = k < 0.5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;   // inOutQuad
      m.piece.position.x = m.fx + (m.tx - m.fx) * eased;
      m.piece.position.z = m.fz + (m.tz - m.fz) * eased;
      // Hop arc — Bit "lifts" the piece, slides, and sets it down
      m.piece.position.y = m.baseY + Math.sin(k * Math.PI) * 0.05;
      if (k >= 1) {
        m.piece.position.x = m.tx;
        m.piece.position.z = m.tz;
        m.piece.position.y = m.baseY;
        chessActiveMove = null;
      }
    }

    // ===== PER-STATE BEHAVIOR =====
    const activity = p.activity;
    // Bit moves under his own steam whenever he's walking, playing, or
    // eating (eating is just walking + a one-shot chomp at each food pile;
    // after the last pile he should keep wandering, not freeze). Also when
    // food is on the floor or the user tapped a spot.
    const walking = activity === 'walk' || activity === 'play' || activity === 'eat'
                  || foodPiles.some(f => !f.eaten) || queuedWalkTarget;

    // Look-at-camera: the HEAD swivels independently of the body. Body
    // stays put; only headGroup.rotation changes. Clamp to ±70° (natural
    // owl-ish neck) + a clear upward pitch so the eyes meet the camera.
    const lookingAtChess = chessGroup && t < lookAtChessUntil;
    if (lookingAtCam) {
      const dxc = camera.position.x - petGroup.position.x;
      const dzc = camera.position.z - petGroup.position.z;
      const camAngle = Math.atan2(dxc, dzc);
      let headRel = _shortAngle(currentFacing, camAngle);
      const NECK_LIMIT = Math.PI * (70/180);      // 70°
      if (headRel >  NECK_LIMIT) headRel =  NECK_LIMIT;
      if (headRel < -NECK_LIMIT) headRel = -NECK_LIMIT;
      // Pitch — clearly tilts up toward camera (camera is at y=7 vs Bit ≈0.5)
      const pitch = -0.38;
      // Faster lerp so the head lands inside the look window (1.4s)
      headGroup.rotation.y += (headRel - headGroup.rotation.y) * Math.min(1, dt * 14);
      headGroup.rotation.x += (pitch  - headGroup.rotation.x) * Math.min(1, dt * 14);
    } else if (lookingAtChess) {
      // Pitch the head DOWN at the chessboard AND rotate the body so
      // Bit visibly faces the board (he may have arrived from any
      // angle; without the body yaw the head pitch alone looks weird).
      const dxb = chessGroup.position.x - petGroup.position.x;
      const dzb = chessGroup.position.z - petGroup.position.z;
      const boardAngle = Math.atan2(dxb, dzb);
      // Body — damped spring rotation toward the board
      const angleDelta = _shortAngle(currentFacing, boardAngle);
      const [newFacing, newFacingVel] = _dampSpring(currentFacing, facingVel, currentFacing + angleDelta, dt, 140, 18);
      currentFacing = newFacing;
      facingVel = newFacingVel;
      facing.rotation.y = currentFacing;
      // Head — neck stays neutral (yaw 0) since body now faces the board
      const pitch = 0.55;                              // tilts head down
      headGroup.rotation.y += (0 - headGroup.rotation.y) * Math.min(1, dt * 14);
      headGroup.rotation.x += (pitch - headGroup.rotation.x) * Math.min(1, dt * 14);
    } else if (Math.abs(headGroup.rotation.y) > 0.002 || Math.abs(headGroup.rotation.x) > 0.002) {
      // Spring head back to neutral after the look
      headGroup.rotation.y += (0 - headGroup.rotation.y) * Math.min(1, dt * 10);
      headGroup.rotation.x += (0 - headGroup.rotation.x) * Math.min(1, dt * 10);
      if (Math.abs(headGroup.rotation.y) < 0.002) headGroup.rotation.y = 0;
      if (Math.abs(headGroup.rotation.x) < 0.002) headGroup.rotation.x = 0;
    }
    // Look phase ended → walk to tapped spot
    if (!lookingAtCam && queuedWalkTarget) {
      target = queuedWalkTarget;
      queuedWalkTarget = null;
      pauseUntil = 0;
    }

    // ===== BALL PHYSICS (play only) =====
    // Projectile motion with linear air drag, ground bounce w/ restitution,
    // wall bounces clamped to the SAME room boundaries Bit observes
    // (±FLOOR_HALF), rolling friction on the ground, and elastic kick when
    // Bit's body sphere collides with the ball.
    if (playBall && ballPhys) {
      const r = ballPhys.radius;
      // Gravity
      ballPhys.vy -= ballPhys.gravity * dt;
      // Air drag (linear) — proportional to velocity, opposite direction
      const dragK = Math.exp(-ballPhys.airDrag * dt);
      ballPhys.vx *= dragK; ballPhys.vy *= dragK; ballPhys.vz *= dragK;
      // Integrate position
      playBall.position.x += ballPhys.vx * dt;
      playBall.position.y += ballPhys.vy * dt;
      playBall.position.z += ballPhys.vz * dt;
      // Ground bounce — y = r is rest position
      if (playBall.position.y < r) {
        playBall.position.y = r;
        if (ballPhys.vy < 0) ballPhys.vy = -ballPhys.vy * ballPhys.restitutionY;
        if (Math.abs(ballPhys.vy) < 0.4) ballPhys.vy = 0;
        // Rolling friction kicks in on ground contact
        const fricK = Math.exp(-ballPhys.rollFriction * dt);
        ballPhys.vx *= fricK; ballPhys.vz *= fricK;
        if (Math.abs(ballPhys.vx) < 0.05) ballPhys.vx = 0;
        if (Math.abs(ballPhys.vz) < 0.05) ballPhys.vz = 0;
      }
      // Wall bounces — same boundary Bit uses, less ball radius for contact
      const WALL = FLOOR_HALF - 0.05;
      if (playBall.position.x >  WALL - r) { playBall.position.x =  WALL - r; if (ballPhys.vx > 0) ballPhys.vx = -ballPhys.vx * ballPhys.restitutionXZ; }
      if (playBall.position.x < -WALL + r) { playBall.position.x = -WALL + r; if (ballPhys.vx < 0) ballPhys.vx = -ballPhys.vx * ballPhys.restitutionXZ; }
      if (playBall.position.z >  WALL - r) { playBall.position.z =  WALL - r; if (ballPhys.vz > 0) ballPhys.vz = -ballPhys.vz * ballPhys.restitutionXZ; }
      if (playBall.position.z < -WALL + r) { playBall.position.z = -WALL + r; if (ballPhys.vz < 0) ballPhys.vz = -ballPhys.vz * ballPhys.restitutionXZ; }
      // Obstacle collisions (the bonsai trunk). Treat each obstacle as
      // a vertical cylinder of {x, z, radius}; if the ball overlaps,
      // push it back to the contact surface and reflect velocity along
      // the outward normal.
      for (let oi = 0; oi < _obstacles.length; oi++) {
        const o = _obstacles[oi];
        const odx = playBall.position.x - o.x;
        const odz = playBall.position.z - o.z;
        const od2 = odx * odx + odz * odz;
        const minD = o.radius + r;
        if (od2 < minD * minD && od2 > 1e-6) {
          const od = Math.sqrt(od2);
          const nx = odx / od, nz = odz / od;
          playBall.position.x = o.x + nx * minD;
          playBall.position.z = o.z + nz * minD;
          const vDotN = ballPhys.vx * nx + ballPhys.vz * nz;
          if (vDotN < 0) {
            ballPhys.vx -= (1 + ballPhys.restitutionXZ) * vDotN * nx;
            ballPhys.vz -= (1 + ballPhys.restitutionXZ) * vDotN * nz;
          }
        }
      }
      // Rolling rotation — angular velocity = v/r about axis perpendicular
      // to horizontal motion (rolling without slipping). axis = up × v.
      const horizSpeed = Math.sqrt(ballPhys.vx*ballPhys.vx + ballPhys.vz*ballPhys.vz);
      if (horizSpeed > 0.01) {
        const angSpeed = horizSpeed / r;
        const ax = -ballPhys.vz / horizSpeed;
        const az =  ballPhys.vx / horizSpeed;
        playBall.rotateOnWorldAxis(new T.Vector3(ax, 0, az), angSpeed * dt);
      }
      // Collision with Bit's body — sphere-sphere overlap test
      const BIT_R = 0.55;
      const cdx = playBall.position.x - petGroup.position.x;
      const cdz = playBall.position.z - petGroup.position.z;
      const cdist = Math.sqrt(cdx*cdx + cdz*cdz);
      const minDist = BIT_R + r;
      if (cdist < minDist && cdist > 0.001 && (t - ballPhys.kickAt) > 0.25) {
        // De-overlap — push ball out along the contact normal
        const overlap = minDist - cdist;
        const nx = cdx / cdist, nz = cdz / cdist;
        playBall.position.x += nx * overlap;
        playBall.position.z += nz * overlap;
        // Kick speed = base + scaled by Bit's current walk speed
        const baseKick = 3.6;
        const kickV = baseKick + (activity === 'play' ? 1.4 : 0.8);
        ballPhys.vx = nx * kickV;
        ballPhys.vz = nz * kickV;
        // Small upward pop on the kick (real soccer touch behavior)
        ballPhys.vy = 1.4 + Math.random() * 0.6;
        ballPhys.kickAt = t;
      }
      // During play, Bit always chases the ball — target tracks it.
      if (activity === 'play' && t > pauseUntil) {
        target = { x: playBall.position.x, z: playBall.position.z, foodIdx: -1 };
      }
    }

    if (walking) {
      // Slightly faster while playing — Bit is excited.
      const speed = activity === 'play' ? 1.35 : 1.05;
      if (t < pauseUntil) {
        // Standing between targets — fast breath echo (panting after walk)
        petGroup.position.y *= 0.85;
        // Decelerate lean back to 0
        const [v, vv] = _dampSpring(facing.rotation.x, facingVel /* abused for lean */, 0, dt, 90, 14);
        // Note: above abuse — use leanVel slot instead
        const [lx, nvl] = _dampSpring(facing.rotation.x, leanVel, 0, dt, 90, 14);
        facing.rotation.x = lx; leanVel = nvl;
      } else {
        const dx = target.x - petGroup.position.x;
        const dz = target.z - petGroup.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 0.22) {
          // ===== ARRIVE — eat if this is a food pile =====
          if (target.foodIdx >= 0 && !foodPiles[target.foodIdx].eaten) {
            const pile = foodPiles[target.foodIdx];
            pile.eaten = true;
            // Eat one-shot — body squashes + head dips + bounce back
            oneShot.kind = 'eat'; oneShot.start = t; oneShot.duration = 0.42;
            // Visual: pile collapses (scale.y → 0) over 320ms
            const pileGroup = pile.group;
            const eatStart = t;
            const eatAnim = () => {
              if (!mounted) return;
              const dur = 0.32;
              const k = Math.min(1, (t - eatStart) / dur);
              const eased = Ease.outQuint(k);
              pileGroup.scale.set(1 - eased, Math.max(0, 1 - eased * 1.5), 1 - eased);
              pileGroup.position.y -= eased * 0.04;
              if (k < 1) requestAnimationFrame(eatAnim);
              else {
                scene.remove(pileGroup);
                pileGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
              }
            };
            eatAnim();
            // Note: eatenTodayXP is debited at drop time (Drop-food button),
            // not at arrival, so Bit eating is purely visual here.
          }
          // ===== ARRIVE — chess "move" if this was the chess return =====
          if (target.chessHome) {
            // Bit just got back to the board — slide a piece to a new
            // square. Hold position while the move plays out + lock the
            // head looking down at the board so the move reads as his.
            _triggerChessMove(t);
            pauseUntil = t + 1.1;
            lookAtChessUntil = t + 1.0;
            chessNextMoveAt = t + 5 + Math.random() * 4;     // think next
          } else {
            pauseUntil = t + 0.35 + Math.random() * 0.55;
          }
          // Pick the next target — chess "return" takes priority over
          // wandering once it's been scheduled.
          const hasFood = foodPiles.some(f => !f.eaten);
          if (hasFood) {
            target = _nearestFoodTarget();
          } else if (chessGroup && p.activity === 'walk' && chessNextMoveAt > 0 && t >= chessNextMoveAt) {
            target = { x: chessHomeX, z: chessHomeZ, foodIdx: -1, chessHome: true };
          } else {
            target = _newRandomTarget();
          }
        } else {
          // ===== MOVING TOWARD TARGET =====
          const step = Math.min(dist, speed * dt);
          const nx = dx / dist;
          const nz = dz / dist;
          let nextX = petGroup.position.x + nx * step;
          let nextZ = petGroup.position.z + nz * step;
          // Obstacle deflection — if the next step would land inside
          // an obstacle's collision radius, push the step OUT along
          // the radius vector. Then pick a fresh target so the pet
          // routes around the obstacle instead of grinding into it.
          for (let oi = 0; oi < _obstacles.length; oi++) {
            const o = _obstacles[oi];
            const odx = nextX - o.x, odz = nextZ - o.z;
            const od2 = odx * odx + odz * odz;
            const safe = o.radius + 0.10;
            if (od2 < safe * safe) {
              const od = Math.sqrt(od2) || 1e-4;
              nextX = o.x + (odx / od) * safe;
              nextZ = o.z + (odz / od) * safe;
              // Re-target so we don't keep grinding along the rim
              target = _newRandomTarget();
              break;
            }
          }
          petGroup.position.x = nextX;
          petGroup.position.z = nextZ;

          // Facing — damped spring (no linear lerp). Stiffness picked for ~250ms settle.
          const targetAngle = Math.atan2(nx, nz);
          const angleDelta = _shortAngle(currentFacing, targetAngle);
          const [newFacing, newFacingVel] = _dampSpring(currentFacing, facingVel, currentFacing + angleDelta, dt, 120, 18);
          currentFacing = newFacing;
          facingVel = newFacingVel;
          facing.rotation.y = currentFacing;

          // Anticipation lean — body tilts forward while accelerating
          const [lx, nvl] = _dampSpring(facing.rotation.x, leanVel, -0.06, dt, 80, 11);
          facing.rotation.x = lx; leanVel = nvl;

          // GAIT — locked to distance traveled, not time, so feet never slide.
          // One full cycle (2 steps) covers STRIDE_LEN world units.
          const STRIDE_LEN = 0.85;
          gait += step / STRIDE_LEN;
          while (gait >= 1) gait -= 1;

          // Body bob — peaks at midstance of each step. One cycle of gait =
          // two body bumps (one per foot landing).
          petGroup.position.y = Ease.bob((gait * 2) % 1) * 0.085;
          // Baby waddle — no feet to telegraph motion, so a gentle
          // side-to-side roll (Z tilt) tracking the gait cadence makes
          // the walking direction visibly read. Higher amplitude than
          // the teen/adult lean because the body is otherwise static.
          if (!hasFeet) {
            facing.rotation.z = Math.sin(gait * Math.PI * 2) * 0.16;
          }

          // PLAY overlay — combines a continuous bouncy gait with occasional
          // "trick" hops. Tricks use real projectile motion:
          //   y(τ) = v0·τ − ½·g·τ²
          // so the apex/airtime/landing all follow the same physics rule as
          // the ball. During the airtime of a trick, Bit rotates a full
          // 2π either about the yaw axis (spin) or the pitch axis (front
          // flip). Triggered every ~2.4 s plus jitter so it stays surprising.
          if (activity === 'play') {
            const stageKey = p.stage === 'baby' ? 'baby'
                           : p.stage === 'teen' ? 'teen'
                           : (p.body || 'normal');
            const tune = ({
              baby:   { freq: 2.6, height: 0.09, wagAmp: 0.18, trickV0: 3.0 },
              teen:   { freq: 2.0, height: 0.13, wagAmp: 0.14, trickV0: 3.5 },
              normal: { freq: 1.9, height: 0.14, wagAmp: 0.14, trickV0: 3.8 },
              fit:    { freq: 2.1, height: 0.18, wagAmp: 0.16, trickV0: 4.4 },
              jacked: { freq: 1.5, height: 0.20, wagAmp: 0.10, trickV0: 4.6 },
              chubby: { freq: 1.4, height: 0.07, wagAmp: 0.08, trickV0: 2.6 },
            }[stageKey]) || { freq: 1.9, height: 0.14, wagAmp: 0.14, trickV0: 3.8 };

            // Schedule next trick on first entry to play.
            if (playTrick.next === 0) playTrick.next = t + 1.2 + Math.random() * 1.4;

            // Time since the active trick started (if any).
            const inTrick = playTrick.active && (t - playTrick.start) < playTrick.duration;
            if (!inTrick && t >= playTrick.next) {
              playTrick.active = true;
              playTrick.start = t;
              playTrick.kind = 'spin';                              // yaw only — flips dropped
              // Airtime from projectile motion: τ_total = 2·v0/g
              playTrick.v0 = tune.trickV0;
              playTrick.duration = (2 * playTrick.v0) / 9.8;
              playTrick.next = t + playTrick.duration + 1.4 + Math.random() * 1.4;
            }

            if (inTrick) {
              const τ = t - playTrick.start;                       // airtime so far
              // Projectile arc: real y = v0·τ − ½·g·τ²
              const projY = Math.max(0, playTrick.v0 * τ - 0.5 * 9.8 * τ * τ);
              const k = τ / playTrick.duration;                    // 0..1
              // Yaw spin only — full 2π rotation over the airtime, no ground-
              // clip risk since rotation is about the vertical axis.
              petGroup.position.y += projY;
              facing.rotation.y = currentFacing + k * Math.PI * 2;
              if (τ >= playTrick.duration) {
                playTrick.active = false;
                facing.rotation.y = currentFacing;
              }
            } else {
              // Continuous bouncy gait between tricks. sin^1.6 gives the
              // apex a slight "hang time" feel — reads as real jump physics.
              const phase = (t * tune.freq) % 1;
              const arc = Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 1.6);
              petGroup.position.y += arc * tune.height;
              // Excited side-to-side facing wag at 2× the hop rate.
              const wag = Math.sin(t * tune.freq * Math.PI * 2) * tune.wagAmp;
              facing.rotation.y = currentFacing + wag;
              // Secondary head lift at apex — adds life without lag glitches.
              headGroup.position.y = headGroup.userData.baseY + headBob + arc * 0.03;
            }
          }

          // Feet — proper walk cycle:
          //   Left  foot phase = gait           (0..1)
          //   Right foot phase = (gait + 0.5)   (0..1, offset half a cycle)
          // For each foot:
          //   phase 0..0.5  = SWING  — foot lifts in arc + moves FORWARD
          //   phase 0.5..1  = STANCE — foot on ground, moves BACKWARD relative
          //                            to body (because body is moving forward)
          if (footL && footR) {
            const STEP_LEN = 0.22;
            const LIFT_H   = 0.16;
            function footAt(phase, sideX) {
              const baseZ = bd * 0.18;
              if (phase < 0.5) {
                // Swing — lift in arc, translate forward
                const u = phase * 2;                // 0..1 inside swing
                return {
                  y: 0.06 + Ease.arc(u) * LIFT_H,
                  z: baseZ + (u - 0.5) * STEP_LEN,  // -½ → +½ stride
                };
              } else {
                // Stance — on ground, translate backward (body moves forward)
                const u = (phase - 0.5) * 2;        // 0..1 inside stance
                return {
                  y: 0.06,
                  z: baseZ + (0.5 - u) * STEP_LEN,  // +½ → -½
                };
              }
            }
            const lP = gait;
            const rP = (gait + 0.5) % 1;
            const lPos = footAt(lP, -1);
            const rPos = footAt(rP,  1);
            footL.position.y = lPos.y;  footL.position.z = lPos.z;
            footR.position.y = rPos.y;  footR.position.z = rPos.z;
          }

          // Head forward-bob — slight pitch matching the step cadence
          headGroup.rotation.x = Math.sin(gait * Math.PI * 4) * 0.04;
        }
      }
    } else if (activity === 'idle' || activity === 'beg') {
      // Just breathing + the already-running ambient. Tiny weight shift.
      petGroup.position.y = Math.sin(t * 1.2) * 0.015;
      // Decay lean to zero
      const [lx, nvl] = _dampSpring(facing.rotation.x, leanVel, 0, dt, 70, 14);
      facing.rotation.x = lx; leanVel = nvl;
    } else if (activity === 'sleep') {
      facing.rotation.z = Math.PI / 2.6;
      petGroup.position.y = 0.36 + Math.sin(t * 0.9) * 0.018;   // slower breath
    } else if (activity === 'workout') {
      // Squat — body Y dips with bend; head dips less; arms stay (no arms)
      const sqPhase = (t % 1.0) / 1.0;
      const squat = Ease.bob(sqPhase) * 0.22;
      petGroup.position.y = -squat;
      bodyGroup.scale.y = breath - squat * 0.4;
      // Slight forward lean during squat
      facing.rotation.x = -squat * 0.6;
    } else if (activity === 'sick' || activity === 'eat') {
      if (activity === 'sick') {
        const startX = petGroup.userData.startX || 0;
        petGroup.position.x = startX + Math.sin(t * 14) * 0.035;
        bodyGroup.scale.y = breath - Math.abs(Math.sin(t * 14)) * 0.06;
      }
    }

    // ===== ONE-SHOT eat chomp (overrides ambient for its duration) =====
    if (oneShot.kind === 'eat') {
      const k = (t - oneShot.start) / oneShot.duration;
      if (k >= 1) { oneShot.kind = null; }
      else {
        // Phases: 0..0.25 dip down (inQuad), 0.25..0.6 chomp+squash (outBack), 0.6..1 bounce up (outBack)
        if (k < 0.3) {
          const u = Ease.inQuad(k / 0.3);
          headGroup.rotation.x = u * 0.6;
          headGroup.position.y = headGroup.userData.baseY + headBob - u * 0.18;
          bodyGroup.scale.y = breath - u * 0.12;
        } else if (k < 0.65) {
          const u = (k - 0.3) / 0.35;
          headGroup.rotation.x = 0.6 - u * 0.55;
          headGroup.position.y = headGroup.userData.baseY + headBob - 0.18 + u * 0.20;
          bodyGroup.scale.y = breath - 0.12 + u * 0.15;
        } else {
          const u = Ease.outBack((k - 0.65) / 0.35);
          headGroup.rotation.x = 0.05 - u * 0.05;
          headGroup.position.y = headGroup.userData.baseY + headBob - 0 + (1 - u) * 0.02;
          bodyGroup.scale.y = breath + 0.03 * (1 - u);
          // Side wiggle = "yum" reaction
          facing.rotation.y = currentFacing + Math.sin(u * Math.PI * 2) * 0.12;
        }
      }
    }

    // ===== Drop-food animation (per-pile fall + landing squash) =====
    for (const pile of foodPiles) {
      if (!pile.dropping) continue;
      const k = Math.min(1, (t - pile.dropStart) / pile.dropDur);
      // Quadratic ease-in for gravity-like fall (slow at top, fast on landing)
      pile.group.position.y = 4 * (1 - k * k);
      if (k > 0.92) {
        const u = (k - 0.92) / 0.08;
        const sq = Math.sin(u * Math.PI);                 // 0→1→0 squish
        pile.group.scale.set(1 + sq * 0.22, 1 - sq * 0.26, 1 + sq * 0.22);
      } else {
        pile.group.scale.set(1, 1, 1);
      }
      if (k >= 1) {
        pile.dropping = false;
        pile.group.position.y = 0;
        pile.group.scale.set(1, 1, 1);
      }
    }

    // ===== Bit reaction hop (set when dropFood is called) =====
    if (t < bitReactionUntil) {
      const remaining = bitReactionUntil - t;
      const phase = 1 - remaining / 0.55;                 // 0→1 over the window
      const arc = Math.sin(phase * Math.PI);              // 0→1→0
      petGroup.position.y += arc * 0.24;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  petGroup.userData.startX = petGroup.position.x;

  // ---- Visibility gating (the big perf win) ----
  // Pause rAF when the canvas isn't actually on screen.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const wasVisible = visible;
      visible = e.isIntersecting && !document.hidden;
      if (!wasVisible && visible) {
        // Just became visible — reset frame timestamp so dt doesn't spike
        lastFrame = performance.now();
        requestAnimationFrame(tick);
      }
    }
  }, { threshold: 0.01 });
  io.observe(container);
  // Pause when the tab is hidden, resume when it comes back
  const onVisChange = () => {
    const wasVisible = visible;
    visible = !document.hidden && (container.offsetParent !== null);
    if (!wasVisible && visible) {
      lastFrame = performance.now();
      requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisChange);

  requestAnimationFrame(tick);

  // ---- Responsive: resize on container size changes ----
  const ro = new ResizeObserver(entries => {
    const cw = entries[0].contentRect.width;
    const ch = entries[0].contentRect.height;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch);
    const a = cw / ch;
    camera.left = -d * a; camera.right = d * a;
    camera.top = d; camera.bottom = -d;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  const handle = {
    // Drop a fresh food pile from above. Spawns at (x, 4, z), animates to
    // the floor with a landing squash, triggers Bit's excitement hop, and
    // forces Bit to target the new pile immediately.
    dropFood: (x, z) => {
      if (!mounted) return false;
      const FX = Math.max(-FLOOR_HALF + 0.3, Math.min(FLOOR_HALF - 0.3, x));
      const FZ = Math.max(-FLOOR_HALF + 0.3, Math.min(FLOOR_HALF - 0.3, z));
      const pileGroup = _makeFoodPile();
      pileGroup.position.set(FX, 4.0, FZ);
      scene.add(pileGroup);
      const pile = {
        group: pileGroup, x: FX, z: FZ, eaten: false,
        dropStart: t, dropDur: 0.50, dropping: true,
      };
      foodPiles.push(pile);
      bitReactionUntil = t + 0.55;                        // quick excitement hop
      target = { x: FX, z: FZ, foodIdx: foodPiles.length - 1 };
      pauseUntil = 0;
      return true;
    },
    dispose: () => {
      mounted = false;
      try { io.disconnect(); } catch(_) {}
      try { document.removeEventListener('visibilitychange', onVisChange); } catch(_) {}
      try { ro.disconnect(); } catch(_) {}
      try { renderer.domElement && renderer.domElement.removeEventListener('pointerdown', onTap); } catch(_) {}
      try { renderer.dispose(); } catch(_) {}
      try { renderer.forceContextLoss && renderer.forceContextLoss(); } catch(_) {}
      try { if (renderer.domElement && renderer.domElement.parentNode === container) container.removeChild(renderer.domElement); } catch(_) {}
      // Free GPU resources
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
  };
  _PET_MOUNTS.set(container, handle);
  return handle;
}

/* Lifecycle preview modal — cycle through all 6 stage/body variants in
 * a single 3D scene. Mount/dispose happens per stage change so we don't
 * keep 6 WebGL contexts alive. */
function openPetLifecyclePreview() {
  // Each stage is shown at a different hour so the user sees Bit across
  // the full continuous-spectrum day cycle (dawn → morning → midday →
  // golden hour → sunset → dusk → night). Hours are chosen to land in
  // visually distinct keyframe bands of the new 24-hour spectrum.
  const stages = [
    { stage: 'baby',  body: 'baby',   hour: 6.5,  label: 'Baby · dawn',             sub: 'Days 0–2 · big head, big eyes. Just waking up.' },
    { stage: 'teen',  body: 'teen',   hour: 10,   label: 'Teen · morning',          sub: 'Days 3–7 · stretched + gangly. Active morning.' },
    { stage: 'adult', body: 'normal', hour: 12,   label: 'Adult · midday',          sub: 'Days 8+ default. Sun directly overhead.' },
    { stage: 'adult', body: 'fit',    hour: 15,   label: 'Adult · Fit · afternoon', sub: 'Form > +15. Red athletic headband.' },
    { stage: 'adult', body: 'jacked', hour: 17,   label: 'Adult · Jacked · sunset', sub: 'Form > +25. Broad shoulders, sweatband.' },
    { stage: 'adult', body: 'chubby', hour: 18.3, label: 'Adult · Chubby · dusk',   sub: 'Form < −25. Round belly, chef hat. Twilight crossfade.' },
    { stage: 'dead',  body: 'dead',   hour: 22,   label: 'Death · night',           sub: 'Vitality hits 0. Tombstone under moonlight.' },
  ];
  let idx = 0;
  const wrap = el('div','fixed inset-0 z-50 grid place-items-center p-4');
  wrap.style.background = 'rgba(248,249,252,0.55)';
  wrap.style.backdropFilter = 'blur(24px) saturate(180%)';
  wrap.style.webkitBackdropFilter = 'blur(24px) saturate(180%)';
  const card = el('div','card elevated max-w-lg w-full');
  card.style.padding = '1.4rem 1.5rem';

  function paint() {
    const s = stages[idx];
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <div class="text-xs muted uppercase tracking-wider">Life stage preview</div>
          <h2 class="font-display text-2xl font-semibold mt-0.5">${esc(s.label)}</h2>
          <div class="text-[12.5px] muted mt-1">${esc(s.sub)}</div>
        </div>
        <button class="text-2xl muted hover:text-[color:var(--text)]" data-close-lc aria-label="Close">×</button>
      </div>
      <div id="lifecycle-room" class="pet-room-3d" style="height: 240px; width: 100%; margin: 12px auto 0">
        <div class="pet-loading" data-pet-loading aria-label="Loading stage"><div class="lg-spinner"></div></div>
      </div>
      <div class="flex items-center justify-between gap-2 mt-4 flex-wrap">
        <button class="btn !py-1.5 !px-3" data-lc-prev>← Previous</button>
        <div class="text-xs muted numeric">${idx + 1} of ${stages.length}</div>
        <button class="btn btn-primary !py-1.5 !px-3" data-lc-next>Next →</button>
      </div>
      <div class="text-[11px] muted mt-3 dim text-center">Each stage shows Bit doing a random activity — re-open to roll again.</div>
    `;
    const host = card.querySelector('#lifecycle-room');
    // Pick a random activity for variety in the preview — dead always shows
    // the tombstone, sleep is reserved for night phases, sick is only
    // surfaced for the "stale" preview hours. Most stages get walk/play.
    const _activityPool = (() => {
      if (s.stage === 'dead') return ['walk'];          // unused — tombstone shown
      if (s.hour >= 22 || s.hour < 6) return ['sleep'];
      return ['walk', 'walk', 'walk', 'play', 'eat'];   // 3:1:1 walk:play:eat
    })();
    const _activity = _activityPool[Math.floor(Math.random() * _activityPool.length)];
    // Double rAF so the Liquid Glass spinner gets one paint frame before
    // the synchronous mountPet3D blocks the main thread for ~200-500ms.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mountPet3D(host, {
        name: 'Bit', stage: s.stage, body: s.body,
        activity: _activity, fedToday: true,
        ageDays: s.stage === 'baby' ? 1 : s.stage === 'teen' ? 5 : 12,
        // Show 1 food pile when activity is "eat" so Bit has something to consume
        foodPilesAvailable: _activity === 'eat' ? 1 : 0, pileXP: 10,
        lastTickDate: new Date().toISOString().slice(0,10),
        forceHour: s.hour,
        bodyHue: 0x9CC7E6,                              // preview keeps a stable color
      });
    }));
    card.querySelector('[data-lc-prev]').addEventListener('click', () => {
      idx = (idx - 1 + stages.length) % stages.length; cleanup(); paint();
    });
    card.querySelector('[data-lc-next]').addEventListener('click', () => {
      idx = (idx + 1) % stages.length; cleanup(); paint();
    });
    card.querySelector('[data-close-lc]').addEventListener('click', close);
  }
  function cleanup() {
    const host = card.querySelector('#lifecycle-room');
    if (host && _PET_MOUNTS.has(host)) {
      try { _PET_MOUNTS.get(host).dispose(); } catch(_) {}
      _PET_MOUNTS.delete(host);
    }
  }
  function close() { cleanup(); wrap.remove(); }
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  paint();
  ANIM.viewIn && ANIM.viewIn(card);
}

function renderPetCard(state, p) {
  const card = el('div','card pet-card overflow-hidden');
  card.setAttribute('data-card', 'pet');
  // Status line — blunter when health is low.
  const statusLine = {
    'walk':    `${p.name} is wandering around`,
    'idle':    `${p.name} is hanging out`,
    'eat':     `${p.name} is eating! +1 day alive`,
    'sleep':   `${p.name} is napping`,
    'play':    `${p.name} is playing`,
    'workout': `${p.name} is at the gym`,
    'sick':    `${p.name} is wheezing and dying — feed NOW`,
    'beg':     `${p.name} is starving — hit your XP goal or watch it die`,
    'droop':   `${p.name} is sad — needs you`,
  }[p.activity] || `${p.name} is here`;

  const stageLabel = p.stage === 'baby' ? `Baby · day ${p.ageDays}`
                   : p.stage === 'teen' ? `Teen · day ${p.ageDays}`
                   : `Adult · day ${p.ageDays}`;
  const bodyLabel = p.stage === 'adult' ? ` · ${p.body}` : '';

  const bar = (val, color) => `<div class="bar h-1 rounded-full overflow-hidden" style="background:rgba(15,23,42,0.06)"><i style="width:${val}%;background:${color};display:block;height:100%"></i></div>`;

  // Wall decor alternates daily (window vs. picture frame)
  const wallDecor = (parseInt((state.pet.lastTickDate || '').replaceAll('-',''), 10) % 2 === 0) ? 'picture' : 'window';

  card.innerHTML = `
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div>
        <h3 class="font-display font-semibold text-lg">${esc(p.name)}'s room <span class="text-xs muted font-normal ml-1">${stageLabel}${bodyLabel}</span></h3>
        <div class="text-[12.5px] muted mt-0.5">${esc(statusLine)}</div>
      </div>
      ${p.deathCount > 0 ? `<div class="text-[10.5px] muted inline-flex items-center gap-1" title="Total times you let your pet die">${iconHTML('skull', {size: 13})} × ${p.deathCount}</div>` : ''}
    </div>

    <div class="pet-grid">
      <!-- LEFT: Three.js WebGL scene — Bit dominant. data-morph-skip
           so sync's surgical DOM updater doesn't wipe the canvas. -->
      <div class="pet-room-3d" id="pet-room-3d-host" data-morph-skip>
        <div class="pet-loading" data-pet-loading aria-label="Loading pet scene"><div class="lg-spinner"></div></div>
      </div>

      <!-- RIGHT panel: all stats + interactions stacked -->
      <div class="pet-panel pet-panel-right space-y-3 self-center">
        <div>
          <div class="flex justify-between text-[11px] muted mb-0.5">
            <span>Vitality</span>
            <span class="numeric">${p.vitality}/100${p.vitality < 30 ? ' · sick' : ''}</span>
          </div>
          ${bar(p.vitality, p.vitality >= 60 ? 'var(--accent)' : p.vitality >= 30 ? 'var(--warn)' : 'var(--bad)')}
        </div>
        <div>
          <div class="flex justify-between text-[11px] muted mb-0.5">
            <span>Today's XP</span>
            <span class="numeric">${p.todayXP}/${p.goal}</span>
          </div>
          <div class="bar"><i style="width:${p.xpProgress}%"></i></div>
        </div>
        <div class="text-[12px]" style="color:${p.todayXP >= p.goal ? 'var(--accent)' : 'inherit'}">
          ${p.todayXP >= p.goal
            ? `✓ Goal hit${p.todayXP >= p.goal * 1.5 ? ' · workout bonus' : ''}`
            : `<b>${p.xpToFeed} XP</b> to today's goal`}
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <button class="btn btn-primary !py-1.5 !px-3 text-[12.5px]"
                  data-pet-drop-food
                  ${p.foodPilesAvailable > 0 ? '' : 'disabled style="opacity:0.45;cursor:not-allowed"'}>
            <span class="inline-flex items-center gap-1.5">${iconHTML('carrot', {size: 14})} Drop food${p.foodPilesAvailable > 0 ? ` <span class="numeric ml-1">×${p.foodPilesAvailable}</span>` : ''}</span>
          </button>
          <a href="#curriculum" class="btn !py-1.5 !px-3 text-[12.5px]">Earn XP →</a>
          <button class="btn !py-1.5 !px-3 text-[12.5px]" data-pet-lifecycle><span class="inline-flex items-center gap-1.5">${iconHTML('eye', {size: 14})} Stages</span></button>
        </div>
      </div>
    </div>


    <details class="mt-3">
      <summary class="text-[11px] muted cursor-pointer hover:opacity-80">How feeding works ▾</summary>
      <ul class="list-muted mt-2 text-[11.5px]" style="font-size:11.5px">
        <li>Vitality decays <b>100 → 0</b> over 24 h since the last feed.</li>
        <li>Every 10 XP earned today = 1 food pile. Each drop consumes one pile: <b>+20 vitality</b> (cap 100).</li>
        <li><b>Hit ${Math.round(p.goal*1.5)} XP today</b> → body shifts toward <b>Jacked</b>; less than ${p.goal} → toward <b>Chubby</b>.</li>
        <li><b>24 h with no feed</b> → vitality 0. Cross a midnight at 0 → ${esc(p.name)} dies.</li>
        <li>Death resets all pet stats; a new baby hatches tomorrow. Skull counter sticks.</li>
      </ul>
    </details>
  `;
  return card;
}

// (Removed: flipMorphIn + .glass-morphing transitions — caused flicker.
// Modal now opens with a simple ANIM.viewIn entrance, no FLIP morph.)

// Auto-classify + Prism-highlight every <pre><code> block under `root`.
// Default = python. Heuristic upgrades to sql/bash/json when the code obviously
// is one of those. Idempotent — re-runs safely on already-classified blocks.
function highlightCodeIn(root) {
  if (!root) return;
  // Prism is lazy-loaded. If it's not on `window` yet, kick off the load
  // and re-enter once it lands. Code blocks read as plain monospace
  // until that moment (one extra frame in the warm-cache case, longer
  // on cold cache). The fallback monospace style in styles.css means
  // there's no visible layout shift, just a color change when tokens
  // come in.
  if (!window.Prism) {
    if (window.LAZY && window.LAZY.prism) {
      window.LAZY.prism().then(() => highlightCodeIn(root)).catch(() => {});
    }
    return;
  }
  root.querySelectorAll('pre > code').forEach(code => {
    const text = code.textContent || '';
    // Skip if already labelled
    const hasLang = [...code.classList].some(c => c.startsWith('language-'));
    if (!hasLang) {
      let lang = 'python';
      if (/^\s*(SELECT|WITH|CREATE TABLE|INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\b/im.test(text)) lang = 'sql';
      else if (/^\s*(#!\/bin\/|curl |gh |git |aws |gcloud |kubectl |docker )/m.test(text)) lang = 'bash';
      else if (/^\s*\{[\s\S]*\}\s*$/.test(text) && /"[^"]+"\s*:/.test(text)) lang = 'json';
      code.classList.add('language-' + lang);
    }
    try { window.Prism.highlightElement(code); } catch (_) { /* tolerate per-block failures */ }
  });
}

const verticalPill = {
  ai: 'pill-ai', hospitality: 'pill-hosp', marketplace: 'pill-mkt',
  devtools: 'pill-dev', fintech: 'pill-both',
  saas: 'pill-dev', infra: 'pill-dev', health: 'pill-hosp',
};
const verticalLabel = {
  ai:'AI', hospitality:'Hospitality', marketplace:'Marketplace',
  devtools:'Dev Tools', fintech:'Fintech',
  saas:'SaaS', infra:'Infra', health:'Health',
};

/* ====================== DASHBOARD ====================== */
/* Compact job-application counter for the dashboard.
 *
 * Each tap of "Log application" pushes an entry into state.jobApps AND
 * awards XP through the normal awardXP path — so logged applications
 * count toward today's total, vitality, and the streak.
 *
 * XP per app is calibrated so 10 apps = half the user's daily goal
 * (per-app = goal / 20, floor 1). No metadata captured — it's just
 * a count.
 */
function renderJobAppsCard(state) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const apps     = Array.isArray(state.jobApps) ? state.jobApps : [];
  const count    = apps.filter(j => j.date === todayKey).length;
  const goal     = (state.user && state.user.goal) || 60;
  const perApp   = Math.max(1, Math.round(goal / 20));
  const target   = 10;                      // 10 apps = half goal
  const pct      = Math.min(100, Math.round((count / target) * 100));

  const canRemove = count > 0;
  const card = el('div', 'card');
  card.setAttribute('data-card', 'jobapps');     // stable selector for sync-driven surgical updates
  card.innerHTML = `
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="min-w-0">
        <div class="text-xs muted uppercase tracking-wider">Job applications today</div>
        <div class="text-3xl font-bold mt-1 numeric">${count} <span class="text-sm muted font-normal">/ ${target}</span></div>
      </div>
      <!-- Single stepper control: one visual pill with a divider, − on
           the left, + on the right. Two click targets, one button. -->
      <div class="app-stepper" role="group" aria-label="Adjust job application count">
        <button type="button" class="app-stepper-half app-stepper-minus"
                data-app-remove
                aria-label="Undo last application"
                ${canRemove ? '' : 'disabled'}>−</button>
        <span class="app-stepper-divider" aria-hidden="true"></span>
        <button type="button" class="app-stepper-half app-stepper-plus"
                data-app-add
                aria-label="Log application">+</button>
      </div>
    </div>
    <div class="bar mt-3"><i style="width:${pct}%; transition: width 0.4s var(--spring-overshoot)"></i></div>
    <div class="text-xs muted mt-2">
      Each app = <span class="font-mono numeric" style="color:var(--accent)">+${perApp}</span> XP. <strong>10 = half daily goal (${goal}).</strong>
    </div>
  `;

  card.querySelector('[data-app-add]').addEventListener('click', () => {
    const st = (window.APP && window.APP.getState) ? window.APP.getState() : state;
    const { xpGained } = GAMI.logJobApp(st);
    GAMI.saveImmediate(st);
    card.replaceWith(renderJobAppsCard(st));
    // Refresh the header chips (Today XP / Level / streak) so the locally-
    // visible numbers track the new state without waiting for next render.
    if (window.APP && typeof window.APP.afterStateChange === 'function') {
      try { window.APP.afterStateChange(); } catch (_) {}
    }
    if (window.ANIM && window.ANIM.toast) {
      const remaining = target - (count + 1);
      window.ANIM.toast({
        title: 'Application logged',
        body:  `+${xpGained} XP — ${remaining > 0 ? `${remaining} more to half goal` : 'half goal reached'}.`,
      });
    }
  });

  const removeBtn = card.querySelector('[data-app-remove]');
  if (removeBtn && canRemove) {
    removeBtn.addEventListener('click', () => {
      const st = (window.APP && window.APP.getState) ? window.APP.getState() : state;
      const result = GAMI.removeLastJobApp(st);
      if (!result) return;
      GAMI.saveImmediate(st);
      card.replaceWith(renderJobAppsCard(st));
      if (window.APP && typeof window.APP.afterStateChange === 'function') {
        try { window.APP.afterStateChange(); } catch (_) {}
      }
      if (window.ANIM && window.ANIM.toast) {
        window.ANIM.toast({
          title: 'Application undone',
          body:  `-${result.xpRemoved} XP refunded.`,
        });
      }
    });
  }

  return card;
}

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
  hero.setAttribute('data-card', 'hero');
  hero.innerHTML = `
    ${showCueNudge ? `
      <div class="rounded-md p-3 mb-4 flex items-start gap-2" style="background:rgba(46,111,224,0.06); border:1px solid rgba(46,111,224,0.25)">
        <span style="color:var(--sde); display:inline-flex; align-items:center">${iconHTML('clock', {size: 14})}</span>
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
          ${next ? `<a class="btn btn-primary max-w-full" href="#category/${next.cat.id}/${next.mod.id}" id="primary-cta" style="overflow:hidden;padding:0.6rem 1.25rem"><span class="truncate inline-block max-w-[260px] sm:max-w-[400px] align-middle">Continue · ${esc(next.lesson.name)}</span><span class="ml-2">→</span><span class="ml-2 dim text-[10px] hidden sm:inline">J</span></a>` : `<a class="btn btn-primary" href="#flashcards">Review flashcards →</a>`}
          <a class="btn max-w-full" href="#games/${todaysGame.id}" id="todays-game" style="overflow:hidden;padding:0.6rem 1.25rem"><span class="truncate inline-block max-w-[200px] sm:max-w-[400px] align-middle">Today's game: ${esc(todaysGame.name)}</span><span class="ml-2 dim text-[10px] hidden sm:inline">G</span></a>
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

  // Polygonal isometric tamagotchi — sits directly under the hero. Fed
  // by hitting the daily XP goal. Rendered with Three.js (real WebGL).
  const pet = GAMI.petState(state);
  GAMI.saveImmediate(state);
  const petCard = renderPetCard(state, pet);
  container.appendChild(petCard);

  // Job-application logger — moved up here (above the daily quote) so
  // the daily-grind tracker is visible alongside Bit, not buried below
  // the stats grid.
  container.appendChild(renderJobAppsCard(state));

  // Daily manifesto — one curated quote from masterpiece novels / philosophy
  // / holy texts. Cycles per visit; user can shuffle or browse the full set.
  if (typeof QUOTES !== 'undefined' && QUOTES.length) {
    container.appendChild(renderQuotesCard());
  }
  // Mount the 3D scene now that the host div is attached + has dimensions.
  // Double rAF: frame N paints the Liquid Glass loading spinner so the
  // user actually sees it; frame N+1 starts the (synchronous, ~200-500ms)
  // scene construction that would otherwise block the spinner's first
  // paint. Without this, the spinner is removed before the browser
  // ever rasterizes it.
  // Falls back gracefully (empty container) if Three.js isn't available.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const host = petCard.querySelector('#pet-room-3d-host');
    // Skip mounting if the host is detached — happens when sync.js's
    // morph renders the dashboard into a buffer to diff against the
    // live DOM. Without this, every 2.5s sync poll would spin up a
    // wasted Three.js scene on a detached canvas.
    if (host && document.contains(host)) {
      // Pass the persisted lastTickDate up so window/picture rotation stays
      // stable. autoSpawnFood:false → the dashboard scene starts empty; piles
      // only appear when the user clicks "Drop food".
      const pp = { ...pet, lastTickDate: state.pet && state.pet.lastTickDate, autoSpawnFood: false };
      let petHandle;
      try { petHandle = mountPet3D(host, pp); }
      catch (err) { console.warn('[pet3d] mount failed, falling back:', err); }
      // Stash the handle on the host so sync's surgical update can
      // re-attach the drop-food click handler after a pet-panel swap
      // (where the old button — and its listener — gets discarded).
      if (petHandle) host._petHandle = petHandle;

      // The drop-food click handler is registered via event delegation
      // in app.js (bindEvents) so it survives sync-driven pet-panel
      // swaps. It reads host._petHandle to find the scene.
    }
  }));

  // Stats row
  const stats = el('div','grid grid-cols-2 sm:grid-cols-4 gap-4');
  stats.setAttribute('data-card', 'stats');
  stats.innerHTML = `
    <div class="card !p-4">
      <div class="text-xs text-slate-400 uppercase tracking-wide">Streak</div>
      <div class="text-3xl font-bold mt-1 flex items-center gap-2"><span style="color:var(--warn); display:inline-flex">${iconHTML('flame', {size: 28})}</span> <span class="float">${state.streak.count}</span></div>
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
    reviews.setAttribute('data-card', 'reviews');
    reviews.innerHTML = `
      <a class="card card-glow block" href="#review/missed">
        <div class="flex items-start justify-between">
          <div>
            <div class="eyebrow" style="color:var(--bad)">Wrong-answer queue</div>
            <div class="text-2xl font-display font-semibold mt-1 numeric">${missedDue}<span class="text-sm muted ml-1">due today</span></div>
            <div class="text-xs muted mt-1 mobile-hide">${missedTotal} total · SM-2 scheduled · retrieval practice</div>
          </div>
          <div style="color:var(--bad); display:inline-flex">${iconHTML('target', {size: 22})}</div>
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
          <div style="color:var(--sde); display:inline-flex">${iconHTML('refresh-cw', {size: 22})}</div>
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
      case 'mock':      return '#mock';
      default:          return '#curriculum';
    }
  };
  const questsCard = el('div','card lg:col-span-2');
  questsCard.setAttribute('data-card', 'quests');
  questsCard.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-semibold text-lg">Today's quests</h3>
      <span class="text-xs text-slate-400 mobile-hide">Resets at midnight · variable XP bonuses</span>
    </div>
    <div class="space-y-2">
      ${quests.map(q => {
        const pct = Math.round(q.progress/q.target*100);
        const inner = `
          <div style="color:${q.done ? 'var(--accent)' : 'var(--muted)'}; display:inline-flex">${q.done ? iconHTML('check', {size: 20}) : iconHTML('target', {size: 20})}</div>
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
  nextCard.setAttribute('data-card', 'nextup');
  if (next) {
    nextCard.innerHTML = `
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Next up</div>
      <div class="text-sm text-slate-500 mb-2 inline-flex items-center gap-1.5">${iconHTML(next.cat.icon, {size: 16})} ${esc(next.cat.name)}</div>
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
  heat.setAttribute('data-card', 'heatmap');
  heat.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-semibold text-lg">Last 90 days</h3>
      <span class="text-xs text-slate-400 mobile-hide">XP per day</span>
    </div>
    <div id="heatmap" class="grid grid-flow-col auto-cols-min gap-[3px]"></div>
  `;
  container.appendChild(heat);

  // Where you struggle most — derived from SRS wrong-queue + low-ease concepts
  const struggle = GAMI.struggleStats(state, CATEGORIES, MODULES);
  if (struggle.totals.totalWrong > 0 || struggle.totals.lowEaseLessons > 0) {
    const topCats = struggle.byCategory.slice(0, 3);
    const topLessons = struggle.byLesson.slice(0, 4);
    const maxSev = Math.max(1, ...topCats.map(c => c.severity));
    const struggleCard = el('div','card');
    struggleCard.innerHTML = `
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 class="font-display font-semibold text-lg">Where you struggle most</h3>
        <span class="text-xs muted mobile-hide">${struggle.totals.totalWrong} wrong · ${struggle.totals.stickyWrong} sticky · ${struggle.totals.lowEaseLessons} low-ease concepts</span>
      </div>
      ${topCats.length === 0 ? `<div class="text-sm muted">No struggle data yet — take a mock interview or quiz to see this fill in.</div>` : `
      <div class="space-y-3">
        ${topCats.map(c => {
          const w = Math.round(c.severity / maxSev * 100);
          const color = c.severity >= 6 ? 'var(--bad)' : c.severity >= 3 ? 'var(--warn)' : 'var(--sde)';
          return `
            <a href="#category/${c.catId}" class="block hover:opacity-90">
              <div class="flex items-center justify-between text-sm mb-1">
                <span>${c.catIcon} <b>${esc(c.catName)}</b></span>
                <span class="text-xs numeric" style="color:${color}">${c.wrongCount} wrong${c.stickyCount ? ` · ${c.stickyCount} sticky` : ''}${c.lowEaseCount ? ` · ${c.lowEaseCount} low-ease` : ''}</span>
              </div>
              <div class="bar"><i style="width:${w}%; background:${color}"></i></div>
            </a>`;
        }).join('')}
      </div>
      ${topLessons.length ? `
      <div class="mt-4 pt-3 border-t border-[color:var(--hairline)]">
        <div class="text-xs muted uppercase tracking-wider mb-2">Stickiest concepts</div>
        <div class="space-y-1.5">
          ${topLessons.map(l => `
            <div class="flex items-center justify-between text-[13px] gap-2">
              <a href="#" class="hover:text-accent-400 truncate" data-open-lesson="${l.lessonId}">${esc(l.lessonName)}</a>
              <span class="text-[11px] muted shrink-0">${l.ease != null ? `ease ${l.ease.toFixed(2)}` : `${l.severity.toFixed(0)} pts`}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      <div class="flex gap-2 mt-4 flex-wrap">
        <a class="btn btn-primary" href="#review/missed">Drill missed (SRS) →</a>
        <a class="btn" href="#mock/practice">Practice mock →</a>
      </div>
      `}
    `;
    container.appendChild(struggleCard);
    // Wire deep-link openers for the stickiest-concepts list
    struggleCard.querySelectorAll('[data-open-lesson]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const lid = a.dataset.openLesson;
        const wrap = renderLesson(state, lid);
        if (wrap) { /* lesson modal handles its own close */ }
      });
    });
  } else {
    // No struggle data yet — still show the practice-mock entry point
    const cta = el('div','card thin');
    cta.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-[13px] muted">Want extra reps? Run an unlimited practice mock over topics you haven't completed.</div>
        <a class="btn" href="#mock/practice">Practice mock →</a>
      </div>`;
    container.appendChild(cta);
  }

  // Category progress
  const catProg = el('div','card');
  catProg.innerHTML = `
    <h3 class="font-display font-semibold text-lg mb-3">Curriculum coverage by category</h3>
    <div class="space-y-3">
      ${cov.categories.map(c => `
        <div>
          <div class="flex items-center justify-between text-sm mb-1">
            <a href="#category/${c.id}" class="hover:text-accent-400 transition inline-flex items-center gap-1.5">${iconHTML(c.icon, {size: 16})} ${esc(c.name)} <span class="text-xs text-slate-500 mobile-hide">· weight ${c.weight}%</span></a>
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

/* Quote of the Day card — one motivating line anchoring the dashboard.
 *
 * Design intent: stone tablet / monolith — serif italic, generous space,
 * minimal chrome, big faded quotation mark in the background. The quote
 * is deterministic per calendar day so visitors get one quote each day. */
function renderQuotesCard() {
  const card = el('div', 'card relative overflow-hidden quotes-card');
  card.style.cssText = `padding: 36px 32px 28px;`;
  // Deterministic per-day selection — same quote all day, changes at midnight.
  const dayHash = parseInt(GAMI.todayKey().replaceAll('-',''), 10);
  const featured = QUOTES[dayHash % QUOTES.length];
  const renderFeatured = (q) => `
    <blockquote class="quote-text" style="
      font-family: Georgia, 'Times New Roman', 'Iowan Old Style', serif;
      font-style: italic;
      font-weight: 400;
      font-size: clamp(20px, 2.3vw, 28px);
      line-height: 1.35;
      letter-spacing: -0.005em;
      max-width: 38em;
      margin: 0;
      color: var(--text);
    ">${esc(q.text)}</blockquote>
    <div class="mt-6 flex items-baseline gap-3 flex-wrap">
      <span class="quote-author" style="
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      ">${esc(q.author)}</span>
      <span class="dim" style="font-size:11px">·</span>
      <a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer" class="quote-source hover:text-accent-400" style="
        font-size: 12px;
        font-style: italic;
        color: var(--muted);
        text-decoration: none;
      ">${esc(q.source)}${q.year ? `, ${esc(String(q.year))}` : ''} ↗</a>
    </div>
    ${q.context ? `
      <div class="quote-context-wrap mt-4">
        <button class="quote-context-toggle" style="
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--muted);
          background: transparent;
          border: none;
          padding: 6px 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        " aria-expanded="false">
          <span class="quote-context-caret" style="display:inline-block;transition:transform 0.2s ease">▸</span>
          <span>Context</span>
        </button>
        <div class="quote-context-body" style="
          display: none;
          margin-top: 8px;
          max-width: 38em;
          padding: 14px 16px;
          border-left: 2px solid var(--hairline);
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--muted);
        ">${esc(q.context)}</div>
      </div>
    ` : ''}
  `;
  card.innerHTML = `
    <!-- Decorative oversized opening quote glyph in the background -->
    <div aria-hidden="true" style="
      position: absolute;
      top: -36px;
      left: 10px;
      font-family: Georgia, serif;
      font-size: 220px;
      line-height: 1;
      color: rgba(255,255,255,0.045);
      pointer-events: none;
      user-select: none;
      font-weight: 700;
    ">“</div>

    <div class="relative">
      <div class="flex items-center justify-between mb-4">
        <div style="
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: var(--muted);
        ">Quote of the Day</div>
        <button id="quote-shuffle" title="New quote" aria-label="Show a different quote" style="
          width: 30px; height: 30px;
          border-radius: 999px;
          border: 1px solid var(--hairline);
          background: transparent;
          color: var(--muted);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.18s ease;
          cursor: pointer;
        ">↻</button>
      </div>

      <div id="quote-featured" style="transition: opacity 0.22s ease;">
        ${renderFeatured(featured)}
      </div>
    </div>
  `;

  // Wire the shuffle (cycles to a new random quote with a brief fade) and
  // the context toggle (expands the hyperspecific background blurb).
  const wireContext = (root) => {
    const toggle = root.querySelector('.quote-context-toggle');
    const body   = root.querySelector('.quote-context-body');
    const caret  = root.querySelector('.quote-context-caret');
    if (!toggle || !body) return;
    toggle.addEventListener('click', () => {
      const open = body.style.display === 'block';
      body.style.display = open ? 'none' : 'block';
      if (caret) caret.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  };
  requestAnimationFrame(() => {
    const shuffleBtn = card.querySelector('#quote-shuffle');
    const featuredEl = card.querySelector('#quote-featured');
    wireContext(featuredEl);
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
      featuredEl.style.opacity = '0';
      setTimeout(() => {
        // Truly random — uniform pull, no guards. Re-picks happen.
        const i = Math.floor(Math.random() * QUOTES.length);
        featuredEl.innerHTML = renderFeatured(QUOTES[i]);
        wireContext(featuredEl);
        featuredEl.style.opacity = '1';
      }, 200);
    });
  });
  return card;
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
            <div class="text-accent-400">${iconHTML(c.icon, {size: 28})}</div>
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
function renderCategory(state, hub, catId, openModuleId, openLessonId) {
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
          <h1 class="font-display text-2xl sm:text-3xl font-semibold inline-flex items-center gap-2">${iconHTML(cat.icon, {size: 26})} ${esc(cat.name)}</h1>
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

  if (openLessonId) {
    setTimeout(() => {
      const w = renderLesson(state, openLessonId);
      if (!w) return;
      // Tag the modal so the close handler navigates back to #flashcards
      // instead of leaving the user stranded on the category route.
      w.dataset.returnTo = 'flashcards';
      // Insert an explicit "← Flashcards" link above the lesson title so
      // the back affordance is visible (the "×" close button also works).
      const head = w.querySelector('h2');
      if (head && head.parentElement) {
        const back = document.createElement('a');
        back.href = '#flashcards';
        back.className = 'text-xs muted hover:text-accent-400 inline-flex items-center gap-1 mb-2';
        back.style.color = 'var(--accent)';
        back.innerHTML = '← Back to flashcards';
        head.parentElement.insertBefore(back, head.parentElement.firstChild);
      }
    }, 50);
  }
}

/* ====================== LESSON MODAL ====================== */
function renderLesson(state, lessonId, sourceEl) {
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
  // No max-h / overflow on the card itself -- the .fixed.inset-0 wrapper
  // owns scroll (overflow-y:auto on the wrapper, see styles.css). Capping
  // the card here would clip the body, which is the bug the user has been
  // hitting (text overflows past the card's rounded bottom edge).
  const card = el('div','card elevated max-w-2xl w-full');
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
    <div>
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
      <!-- Body FIRST so the reader gets the material before the practice -->
      <div class="mt-4 lesson-prose">
        ${lesson.body}
      </div>

      <!-- Activity (free-recall + interactive) BELOW the body -->
      <div id="engagement-status" class="mt-6 px-3 py-2 rounded-md text-[12.5px] flex items-center gap-2"
           style="background:rgba(199,120,14,0.08); border:1px solid rgba(199,120,14,0.25); color:var(--warn)">
        <span class="font-mono">○</span>
        <span>${esc(stepLabel)} to unlock Mark complete</span>
      </div>
      <div id="lesson-interaction" class="mt-4 min-h-[2rem]"></div>
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
  // Syntax-highlight every <pre><code> block that doesn't already specify a language.
  // Default to Python (~95% of curriculum code). SQL/Bash/JSON detected by content.
  highlightCodeIn(card);
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

/* Probability-of-offer heuristic.
 *
 * The signal flags below drive a relative ranking — they are NOT
 * outcome predictions, they're a relative ordering so applications
 * focus on companies whose hiring filters are friendliest to the
 * candidate profile they describe. Tune by editing the booleans
 * and the weights inside companyFitScore / roleFitScore.
 */
const USER_PROFILE = {
  hasAiExperience: true,
  hasLongGap: true,
  hadFire: true,
};

function companyFitScore(c) {
  // Brutally-honest baseline: a candidate with a 2-year recent gap +
  // a short fired stint is structurally screened out at most companies
  // before a human reads the resume. The scoring below is intentionally
  // harsh — most companies should land in 20–55. A score in the 70s
  // means "this is a place where the bar is forgiving of the gap and
  // your AI-engineering profile is actually a strong match."
  let s = 35;

  // Vertical: AI background plays best in AI / devtools / infra.
  if (c.vertical === 'ai') s += 14;
  else if (c.vertical === 'devtools' || c.vertical === 'infra') s += 7;
  else if (c.vertical === 'fintech') s += 2;
  else if (c.vertical === 'health' || c.vertical === 'saas') s += 0;
  else s -= 2;

  // Stage: earlier is more forgiving of a 2y gap + a short fired stint.
  // Late-stage process companies will gap-screen at the recruiter step.
  const stage = (c.stage || '').toLowerCase();
  if (/seed/.test(stage)) s += 22;
  else if (/series a\b/.test(stage)) s += 18;
  else if (/series b\b/.test(stage)) s += 11;
  else if (/series c\b/.test(stage)) s += 3;
  else if (/series d\b/.test(stage)) s -= 5;
  else if (/series e\b/.test(stage)) s -= 7;
  // Series F+ (F, G, H, …) treated as late-stage; same penalty bucket as
  // late / take-private. Without the explicit alternation we were missing
  // Series G companies like Hopper, Navan, Carta.
  else if (/series [fghij]\b|late|take-private/.test(stage)) s -= 10;
  else if (/public/.test(stage)) s -= 12;

  // Size of raise — bigger == more bureaucracy + pedigree filtering.
  const r = c.raised || '';
  const num = parseFloat(r.replace(/[^\d.]/g, '')) || 0;
  if (r.includes('B') && num >= 5) s -= 10;
  else if (r.includes('B') && num >= 1) s -= 7;
  else if (r.includes('B')) s -= 4;
  else if (num >= 500) s -= 3;
  else if (num >= 200) s -= 1;
  else if (num <= 30) s += 6;

  // Elite-bar penalty: where the 2y gap + a fire is essentially a
  // resume-screen reject. These bars don't bend for non-linear paths.
  const elite = new Set([
    'openai','anthropic','stripe','figma','notion','cognition',
    'cursor','perplexity','cohere','glean','sierra','jane-street',
    'scaleai','ramp','airtable',
  ]);
  if (elite.has(c.id)) s -= 16;

  // Mid-tier penalty: process-heavy but not frontier elite. Expanded
  // after the fifth refresh to cover the new late-stage SaaS / hospitality
  // / consumer-fintech entries whose recruiting funnels lean pedigree.
  const heavy = new Set([
    'plaid','brex','mercury','datadog','mongodb','vercel','attentive',
    'gusto','carta','hopper','patreon','seatgeek','navan','block',
    'metropolis','spotify','reddit','lyft','peloton','chime','robinhood',
    'sofi','asana','iterable','braze','squarespace','talkspace','oscar',
  ]);
  if (heavy.has(c.id)) s -= 8;

  // Founding-role bonus — builder-first hiring forgives gaps.
  if ((c.jobs || []).some(j => j.level === 'founding')) s += 12;

  // User-preference layer — bias the ranking toward sectors the
  // candidate actively wants and away from ones they avoid. These
  // are stacked on top of the offer-probability signal above.
  const blob = ((c.sub || '') + ' ' + (c.notes || '')).toLowerCase();
  if (/\b(crypto|web3|blockchain|nft|defi|on-?chain|cryptocurrency|tokeniz|stablecoin)\b/.test(blob)) {
    s -= 15;                                              // hard penalty
  }
  if (c.vertical === 'media' ||
      /\b(creative|design|video|image|music|audio|film|content creator|filmmaker|generative.*(video|image|audio|music)|3d|animation|publishing)\b/.test(blob)) {
    s += 10;                                              // creative tools / generative-media bias
  }
  if (c.vertical === 'hospitality' ||
      /\b(travel|hotel|restaurant|dining|hospitality|airline|trip|reservation)\b/.test(blob)) {
    s += 10;                                              // travel / hospitality / restaurants
  }

  return Math.max(15, Math.min(85, Math.round(s)));
}

function roleFitScore(c, j) {
  let s = companyFitScore(c);
  if (j.level === 'founding') s += 8;
  const t = (j.title || '').toLowerCase();
  if (/ai engineer|ml engineer|machine[\s-]learning|applied ai/.test(t)) s += 7;
  if (/forward[\s-]deployed|\bfde\b/.test(t)) s += 5;
  if (j.level === 'senior') s += 1;
  return Math.max(3, Math.min(88, Math.round(s)));
}

function fitTier(score) {
  // Brutally honest tier bands. Most companies should fall in long-shot
  // or tough-bar for a long-gap, post-fire candidate.
  if (score >= 65) return { label: 'Strong fit',   cls: 'fit-strong' };
  if (score >= 48) return { label: 'Worth trying', cls: 'fit-worth'  };
  if (score >= 30) return { label: 'Long shot',    cls: 'fit-long'   };
  return                   { label: 'Tough bar',    cls: 'fit-tough'  };
}

function fitBadgeHTML(score) {
  const tier = fitTier(score);
  // Tier label is exposed via title (tooltip) but not rendered inline —
  // the badge color already conveys tier, the number conveys precision.
  return `<span class="fit-badge ${tier.cls}" title="${esc(tier.label)} · ${score}/100">
    <span class="fit-num">${score}</span>
  </span>`;
}

// Stable identifier for a (company, role) pair — used as state.jobApps
// entry's `roleKey`. Same string on both devices for the same row so
// the checked state syncs cleanly.
function makeRoleKey(company, job) {
  const u = (job && job.url) || '';
  if (u) return company.id + '|' + u;            // URL is the most stable
  return company.id + '|' + (job && job.title || '');
}

// Wires the .applied-cb toggle behavior on a container. Click anywhere
// on the row's checkbox toggles applied-state via GAMI.applyRole /
// unapplyRole + propagates the change through afterStateChange (which
// re-renders the dashboard's jobApps card and pushes the change via
// sync.js's wrapped saveImmediate).
function bindApplyToggles(container) {
  container.addEventListener('click', (e) => {
    const cb = e.target.closest('[data-apply-toggle]');
    if (!cb) return;
    e.preventDefault();
    e.stopPropagation();
    const row = cb.closest('[data-role-row]');
    if (!row) return;
    const key = row.getAttribute('data-role-key');
    if (!key) return;
    const st = (window.APP && window.APP.getState) ? window.APP.getState() : null;
    if (!st) return;
    if (GAMI.isRoleApplied(st, key)) {
      const r = GAMI.unapplyRole(st, key);
      if (r && window.ANIM && window.ANIM.toast) {
        window.ANIM.toast({ title: 'Application removed', body: `-${r.xpRemoved} XP refunded.` });
      }
      cb.setAttribute('data-checked', '0');
      cb.setAttribute('aria-checked', 'false');
    } else {
      const meta = {
        company: row.getAttribute('data-co-name'),
        title:   row.getAttribute('data-role-title'),
        url:     row.getAttribute('data-role-url'),
      };
      const r = GAMI.applyRole(st, key, meta);
      if (r && window.ANIM && window.ANIM.toast) {
        window.ANIM.toast({ title: 'Application logged', body: `+${r.xpGained} XP` });
      }
      cb.setAttribute('data-checked', '1');
      cb.setAttribute('aria-checked', 'true');
    }
    GAMI.saveImmediate(st);     // wrapped → triggers sync push
    if (window.APP && window.APP.afterStateChange) window.APP.afterStateChange();
  });
}

/* Module-scoped cache that survives route changes. Companies grid has
 * 138 cards; rebuilding from scratch on every entry was costing 10-14
 * long tasks per nav. Cache hits make re-entry ~free. */
const _coCardCacheModule = new Map();

function renderCompanies(state, hub) {
  const container = el('div','fade-in space-y-4');
  const verifiedAt = window.DATA && window.DATA.COMPANIES_VERIFIED_AT;
  const totalJobs = COMPANIES.reduce((s, c) => s + (c.jobs ? c.jobs.length : 0), 0);
  // Build dynamic vertical filters from the data so we don't hard-code.
  const verticals = Array.from(new Set(COMPANIES.map(c => c.vertical)));
  const verticalTabs = ['all', ...verticals]
    .map(v => `<div class="tab${v==='all' ? ' active' : ''}" data-vfilter="${esc(v)}">${v === 'all' ? 'All' : esc(verticalLabel[v] || v)}</div>`)
    .join('');
  const levelTabs = `
    <div class="tab active" data-lfilter="all">All levels</div>
    <div class="tab" data-lfilter="founding">Founding</div>
    <div class="tab" data-lfilter="senior">Senior</div>
    <div class="tab" data-lfilter="mid">Mid</div>`;

  container.innerHTML = `
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-semibold">Companies</h1>
      <p class="muted text-sm mt-1">${COMPANIES.length} startups, ${totalJobs} live NYC engineering postings. Verified ${esc(verifiedAt || 'recently')}. Ranked by fit for your background — sorted highest first.</p>
    </div>

    <div class="flex justify-center">
      <div class="tabs tabs-primary" id="co-mode">
        <span class="tab-thumb" aria-hidden="true"></span>
        <button type="button" class="tab active" data-mode="companies">Companies <span class="ml-1 muted text-[10px] font-mono">${COMPANIES.length}</span></button>
        <button type="button" class="tab" data-mode="roles">Individual roles <span class="ml-1 muted text-[10px] font-mono">${totalJobs}</span></button>
      </div>
    </div>

    <div class="filter-bar">
      <input id="co-search" type="search" placeholder="Search companies, roles, or investors…" class="search-glass"/>
      <div class="tabs" id="co-filters">
        ${verticalTabs}
        <span class="filter-divider" data-level-only aria-hidden="true"></span>
        ${levelTabs}
      </div>
    </div>

    <div id="co-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    <div id="co-rolelist" class="hidden space-y-1.5"></div>
  `;
  hub.appendChild(container);

  const grid       = container.querySelector('#co-grid');
  const rolelist   = container.querySelector('#co-rolelist');
  const filterBar  = container.querySelector('#co-filters');
  // Hide the level-filter chips + divider in Companies mode by class
  // on the merged filter bar.
  function syncLevelVis() {
    filterBar.classList.toggle('hide-levels', curMode === 'companies');
  }
  let curMode    = 'companies';
  let curVFilter = 'all';
  let curLFilter = 'all';
  let curQuery   = '';

  // Pre-score every company and every role so sort is fast on repaints.
  const scoredCos = COMPANIES.map(c => ({ ...c, _fit: companyFitScore(c) }))
    .sort((a, b) => b._fit - a._fit);
  const scoredRoles = [];
  COMPANIES.forEach(c => (c.jobs || []).forEach(j => {
    scoredRoles.push({ ...j, _company: c, _fit: roleFitScore(c, j) });
  }));
  scoredRoles.sort((a, b) => b._fit - a._fit);

  // Build one company card. Pulled out of paintCompanies so the chunked
  // renderer below can call it incrementally without duplicating logic.
  function _buildCompanyCard(c) {
    const cardEl = el('a','card card-glow block');
    cardEl.href = `#company/${c.id}`;
    const domain = COMPANY_DOMAINS[c.id];
    // Clearbit's free logo API was deprecated by HubSpot; logo.clearbit.com
    // now returns ERR_NAME_NOT_RESOLVED for most domains. Switched to
    // Google's S2 favicon service — reliable, free, returns 64px PNG.
    const logo = domain
      ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="${esc(c.name)} logo" loading="lazy" decoding="async" width="32" height="32" onerror="this.style.display='none';this.parentElement.textContent='${esc(c.name[0])}'" />`
      : esc(c.name[0]);
    const badges = (c.badges || []).slice(0, 3)
      .map(b => `<span class="chip chip-funding">${esc(b)}</span>`).join('');
    const previewJobs = (c.jobs || []).slice(0, 3);
    const total = (c.jobs || []).length;
    const jobsHTML = previewJobs.map(j => {
      const lvl = j.level || 'mid';
      const lvlDot = lvl === 'founding'
        ? '<span class="role-dot" style="background:#7849E0"></span>'
        : (lvl === 'senior'
          ? '<span class="role-dot" style="background:#0EA371"></span>'
          : '<span class="role-dot" style="background:#94A3B8"></span>');
      return `
        <a href="${esc(j.url)}" target="_blank" rel="noopener noreferrer"
           onclick="event.stopPropagation()"
           class="role-pill flex items-center gap-2 text-[12px]" title="${esc(j.title)}">
          ${lvlDot}<span class="truncate flex-1 min-w-0">${esc(j.title)}</span>
          <span class="role-arrow muted">↗</span>
        </a>`;
    }).join('');
    const fullCount = c.totalRoles || total;
    const extras = Math.max(0, fullCount - previewJobs.length);
    const overflowLabel = extras > 0
      ? `<div class="text-[11px] mt-1.5 flex items-center justify-between"><span class="muted">+${extras} more open NYC role${extras === 1 ? '' : 's'}</span><span style="color:var(--accent)" class="font-medium">View all →</span></div>`
      : `<div class="text-[11px] mt-1.5 flex items-center justify-end"><span style="color:var(--accent)" class="font-medium">View →</span></div>`;
    cardEl.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="co-logo">${logo}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 justify-between flex-wrap">
            <div class="font-display font-semibold text-lg truncate">${esc(c.name)}</div>
            ${fitBadgeHTML(c._fit)}
          </div>
          <div class="text-xs muted mt-0.5 truncate">${esc(c.sub)}</div>
          <div class="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span class="pill ${verticalPill[c.vertical] || 'pill-dev'}" style="font-size:10px;padding:1px 6px">${esc(verticalLabel[c.vertical] || c.vertical)}</span>
            <span class="font-mono tabular-nums" style="color:var(--accent)">${esc(c.raised || '')}</span>
            <span class="dim">·</span>
            <span class="muted">${esc(c.stage || '')}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 mt-2.5">${badges}</div>
      <div class="mt-3 pt-3 border-t border-[color:var(--hairline)] space-y-1.5">${jobsHTML}</div>
      ${overflowLabel}
    `;
    return cardEl;
  }

  /* Card-node cache. Module-scoped so it survives route changes;
   * search/filter re-renders just toggle display:none on existing
   * nodes instead of rebuilding 138 cards from scratch. Re-entering
   * #companies after a detour is now ~free (DOM nodes attach back to
   * the new grid via appendChild + return to the same map entries). */
  const _coCardCache = _coCardCacheModule;
  function _getOrBuildCard(scored) {
    let entry = _coCardCache.get(scored.id);
    if (!entry) {
      entry = { el: _buildCompanyCard(scored), scored };
      _coCardCache.set(scored.id, entry);
    }
    return entry.el;
  }

  function _coHay(c) {
    return (c.name+' '+c.sub+' '+(c.notes||'')+' '+(c.badges||[]).join(' ')+' '+(c.lead||'')+' '+(c.jobs||[]).map(j=>j.title).join(' ')).toLowerCase();
  }

  /* paintCompanies is called on initial mount AND on every search/filter
   * change. First call: build the cards (chunked across rAFs for initial
   * paint). Subsequent calls: walk the existing nodes, toggle visibility,
   * and append any newly-needed cards (rare, since the corpus is stable).
   * No DOM teardown -> no long tasks on filter clicks / keystrokes. */
  function paintCompanies() {
    const q = curQuery.trim().toLowerCase();
    const matches = new Set();
    for (const c of scoredCos) {
      if (curVFilter !== 'all' && c.vertical !== curVFilter) continue;
      if (q && !_coHay(c).includes(q)) continue;
      matches.add(c.id);
    }

    // First mount: chunked render of just the matching set.
    if (grid.childElementCount === 0) {
      const visible = scoredCos.filter(c => matches.has(c.id));
      const INITIAL = 18, CHUNK = 8;
      const frag1 = document.createDocumentFragment();
      for (let i = 0; i < Math.min(INITIAL, visible.length); i++) {
        frag1.appendChild(_getOrBuildCard(visible[i]));
      }
      grid.appendChild(frag1);
      let cursor = INITIAL;
      const paintNext = () => {
        if (cursor >= visible.length) return;
        const end = Math.min(cursor + CHUNK, visible.length);
        const f = document.createDocumentFragment();
        for (let i = cursor; i < end; i++) f.appendChild(_getOrBuildCard(visible[i]));
        grid.appendChild(f);
        cursor = end;
        if (cursor < visible.length) requestAnimationFrame(paintNext);
      };
      if (visible.length > INITIAL) requestAnimationFrame(paintNext);
      return;
    }

    // Re-render path: toggle display on cached nodes. Add any missing
    // cards (e.g. first time a vertical-filter shows a previously-unseen
    // company) in chunks at the end.
    const toAdd = [];
    for (const c of scoredCos) {
      const entry = _coCardCache.get(c.id);
      if (matches.has(c.id)) {
        if (entry) entry.el.style.display = '';
        else toAdd.push(c);
      } else if (entry) {
        entry.el.style.display = 'none';
      }
    }
    if (toAdd.length) {
      const f = document.createDocumentFragment();
      for (const c of toAdd) f.appendChild(_getOrBuildCard(c));
      grid.appendChild(f);
    }
  }

  function paintRoles() {
    rolelist.innerHTML = '';
    const q = curQuery.trim().toLowerCase();
    const filtered = scoredRoles.filter(r => {
      if (curVFilter !== 'all' && r._company.vertical !== curVFilter) return false;
      if (curLFilter !== 'all' && r.level !== curLFilter) return false;
      if (!q) return true;
      const hay = (r.title + ' ' + r._company.name + ' ' + r._company.sub + ' ' + (r._company.badges||[]).join(' ')).toLowerCase();
      return hay.includes(q);
    });
    if (filtered.length === 0) {
      rolelist.innerHTML = '<div class="muted text-sm py-6 text-center">No roles match your filters.</div>';
      return;
    }
    // Cap render to 250 rows for performance; show how many are hidden.
    const cap = 250;
    const live = (window.APP && window.APP.getState) ? window.APP.getState() : state;
    const head = `<div class="text-[11px] muted">${filtered.length} role${filtered.length===1?'':'s'} matched, sorted by fit${filtered.length>cap?` (showing top ${cap})`:''}</div>`;
    const rows = filtered.slice(0, cap).map(r => {
      const c = r._company;
      const roleKey = makeRoleKey(c, r);
      const checked = GAMI.isRoleApplied(live, roleKey);
      const domain = COMPANY_DOMAINS[c.id];
      const logoMini = domain
        ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="${esc(c.name)}" loading="lazy" decoding="async" width="28" height="28" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;object-fit:cover" onerror="this.style.display='none'"/>`
        : `<div class="role-row-letter">${esc(c.name[0])}</div>`;
      const lvl = r.level || 'mid';
      const lvlClass = lvl === 'founding' ? 'pill-ai' : (lvl === 'senior' ? 'pill-both' : 'pill-dev');
      const lvlLabel = lvl === 'founding' ? 'Founding' : (lvl === 'senior' ? 'Senior' : 'Mid');
      return `
        <div class="role-row" data-role-row data-role-key="${esc(roleKey)}" data-role-url="${esc(r.url)}"
             data-co-id="${esc(c.id)}" data-co-name="${esc(c.name)}" data-role-title="${esc(r.title)}">
          <span class="applied-cb" data-apply-toggle data-checked="${checked ? '1' : '0'}"
                role="checkbox" aria-checked="${checked ? 'true' : 'false'}"
                aria-label="Mark as applied"></span>
          ${logoMini}
          <div class="role-row-text">
            <div class="role-row-title truncate">${esc(r.title)}</div>
            <div class="role-row-co truncate">
              <span class="font-medium">${esc(c.name)}</span>
              <span class="dim mx-1">·</span>
              <span class="muted">${esc(verticalLabel[c.vertical] || c.vertical)}</span>
              <span class="dim mx-1">·</span>
              <span class="muted">${esc(c.stage || '')}</span>
              <span class="dim mx-1">·</span>
              <span style="color:var(--accent)" class="font-mono">${esc(c.raised || '')}</span>
            </div>
          </div>
          <span class="pill ${lvlClass}" style="font-size:10px">${lvlLabel}</span>
          ${fitBadgeHTML(r._fit)}
          <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation()"
             style="color:var(--accent); text-decoration:none; padding:4px 6px;">↗</a>
        </div>`;
    }).join('');
    rolelist.innerHTML = head + '<div class="space-y-1.5 mt-2">' + rows + '</div>';
  }

  function paint() {
    syncLevelVis();
    if (curMode === 'companies') {
      grid.classList.remove('hidden');
      rolelist.classList.add('hidden');
      paintCompanies();
    } else {
      grid.classList.add('hidden');
      rolelist.classList.remove('hidden');
      paintRoles();
    }
  }
  paint();
  // One delegated click handler for ALL applied-checkbox toggles in the
  // roles list (also used by the company detail view; it binds its own).
  bindApplyToggles(rolelist);

  // Liquid-Glass animated thumb under the primary tab. Position is
  // tracked via CSS variables on the container so the thumb can slide
  // between segments with spring easing without a layout thrash.
  function syncThumb() {
    const modeEl = container.querySelector('#co-mode');
    if (!modeEl) return;
    const active = modeEl.querySelector('.tab.active');
    if (!active) return;
    const parentRect = modeEl.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    modeEl.style.setProperty('--thumb-x', (r.left - parentRect.left) + 'px');
    modeEl.style.setProperty('--thumb-w', r.width + 'px');
  }
  // Initial position after layout settles
  requestAnimationFrame(syncThumb);
  // Recompute on viewport changes
  window.addEventListener('resize', syncThumb, { passive: true });

  // Mode toggle
  container.querySelectorAll('#co-mode .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('#co-mode .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      curMode = tab.dataset.mode;
      syncThumb();
      paint();
    });
  });
  // Merged filter bar — vertical chips + level chips share one pill.
  // Click handler differentiates by data-vfilter vs data-lfilter.
  container.querySelectorAll('#co-filters .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.vfilter) {
        container.querySelectorAll('#co-filters .tab[data-vfilter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        curVFilter = tab.dataset.vfilter;
      } else if (tab.dataset.lfilter) {
        container.querySelectorAll('#co-filters .tab[data-lfilter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        curLFilter = tab.dataset.lfilter;
      }
      paint();
    });
  });
  const search = container.querySelector('#co-search');
  // Debounce search input so each keystroke doesn't trigger an immediate
  // repaint. 150ms is below the perceptual "instant" threshold (~200ms)
  // and coalesces runs of rapid typing. With the card-cache above, the
  // repaint itself is now cheap, but debouncing still saves N-1 calls
  // when the user types "react" (5 calls -> 1).
  let _searchDebounce = 0;
  search.addEventListener('input', e => {
    curQuery = e.target.value;
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(paint, 150);
  });
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      search.value = ''; curQuery = '';
      clearTimeout(_searchDebounce);
      paint();
      search.blur();
    }
  });
}

function renderCompany(state, hub, id) {
  const c = COMPANIES.find(x => x.id === id);
  if (!c) { hub.innerHTML = '<div class="muted">Unknown company.</div>'; return; }
  state.companySeen[id] = true;

  const container = el('div','fade-in space-y-5');
  const domain = COMPANY_DOMAINS[c.id];
  const logo = domain
    ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=128" alt="${esc(c.name)} logo" onerror="this.style.display='none';this.parentElement.textContent='${esc(c.name[0])}'" />`
    : esc(c.name[0]);

  const badges = (c.badges || []).map(b => `<span class="chip chip-funding">${esc(b)}</span>`).join('');
  const companyFit = companyFitScore(c);
  const jobsHTML = (c.jobs || []).map(j => {
    const lvl = j.level || 'mid';
    const lvlLabel = lvl === 'founding' ? 'Founding' : (lvl === 'senior' ? 'Senior' : 'Mid');
    const lvlClass = lvl === 'founding' ? 'pill-ai' : (lvl === 'senior' ? 'pill-both' : 'pill-dev');
    const roleKey = makeRoleKey(c, j);
    const checked = GAMI.isRoleApplied(state, roleKey);
    return `
      <div class="job-row flex items-center gap-3 p-3 rounded-xl border border-[color:var(--hairline)] transition"
           data-role-row data-role-key="${esc(roleKey)}" data-role-url="${esc(j.url)}"
           data-co-id="${esc(c.id)}" data-co-name="${esc(c.name)}" data-role-title="${esc(j.title)}">
        <span class="applied-cb" data-apply-toggle data-checked="${checked ? '1' : '0'}"
              role="checkbox" aria-checked="${checked ? 'true' : 'false'}"
              aria-label="Mark as applied"></span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${esc(j.title)}</div>
          <div class="text-[11px] muted mt-0.5">Direct posting · opens in new tab</div>
        </div>
        <span class="pill ${lvlClass}">${lvlLabel}</span>
        ${fitBadgeHTML(roleFitScore(c, j))}
        <a href="${esc(j.url)}" target="_blank" rel="noopener noreferrer"
           onclick="event.stopPropagation()"
           style="color:var(--accent); text-decoration:none; padding:4px 6px;">↗</a>
      </div>`;
  }).join('');

  container.innerHTML = `
    <a href="#companies" class="text-xs muted hover:text-[color:var(--text)]">← All companies</a>
    <div class="card elevated">
      <div class="flex items-start gap-4 flex-wrap">
        <div class="co-logo" style="width:56px;height:56px">${logo}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="font-display text-2xl font-semibold">${esc(c.name)}</h1>
            <span class="pill ${verticalPill[c.vertical] || 'pill-dev'}">${esc(verticalLabel[c.vertical] || c.vertical)}</span>
            ${fitBadgeHTML(companyFit)}
          </div>
          <div class="muted text-sm mt-0.5">${esc(c.sub)}</div>
          <div class="text-[12px] mt-2 flex items-center gap-2 flex-wrap">
            <span class="font-mono tabular-nums font-medium" style="color:var(--accent)">${esc(c.raised || '')}</span>
            <span class="dim">·</span>
            <span class="muted">${esc(c.stage || '')}</span>
            ${c.lead ? `<span class="dim">·</span><span class="muted">led by ${esc(c.lead)}</span>` : ''}
          </div>
          <div class="flex flex-wrap gap-1 mt-2.5">${badges}</div>
        </div>
      </div>
      <p class="mt-4 leading-relaxed text-[14.5px]">${esc(c.notes || '')}</p>
    </div>

    ${(c.jobs && c.jobs.length) ? `
      <div class="card">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 class="font-display font-semibold text-lg">Live NYC engineering postings</h3>
          <span class="text-[11px] muted">${c.jobs.length} verified · check to log as applied</span>
        </div>
        <div class="space-y-2" id="co-jobs-list">${jobsHTML}</div>
        <p class="text-[11px] muted mt-3">Postings verified live on ${esc((window.DATA && window.DATA.COMPANIES_VERIFIED_AT) || 'recently')}. If a link is dead, the role was filled or pulled since verification.</p>
      </div>` : ''}
  `;
  hub.appendChild(container);
  // Wire up the apply-toggle checkboxes on this view.
  const jobsList = container.querySelector('#co-jobs-list');
  if (jobsList) bindApplyToggles(jobsList);
}

/* ====================== FLASHCARDS ====================== */
function renderFlashcards(state, hub) {
  // Pull the resume id BEFORE building due[] so we can pin that card to
  // position 0 -- otherwise a 374-card library randomly slices to 50 and
  // the resumed card may not even survive the cut.
  let resumeId = null;
  try { resumeId = sessionStorage.getItem('fc.resumeId'); } catch (_) {}
  const due = GAMI.dueCards(state, FLASHCARDS, 50, resumeId);
  const fs = state.flashcardFailStats || {};
  const totalFails = Object.values(fs.byCard || {}).reduce((s,n) => s + n, 0);
  const top = (obj, n=3) => Object.entries(obj || {})
    .filter(([_, v]) => v > 0)
    .sort((a,b) => b[1] - a[1])
    .slice(0, n);
  const topCats = top(fs.byCat);
  const topMods = top(fs.byModule);
  const topLessons = top(fs.byLesson);
  const topCards = top(fs.byCard, 5);
  const catName = (id) => (CATEGORIES.find(c => c.id === id) || {}).name || id;
  const modName = (id) => {
    const m = MODULES.find(mm => mm.id === id);
    return m ? m.name : id;
  };
  const lessonInfo = (id) => {
    for (const m of MODULES) {
      const l = m.lessons.find(x => x.id === id);
      if (l) return { name: l.name, module: m.id, cat: m.cat };
    }
    return null;
  };
  const cardInfo = (id) => {
    const c = FLASHCARDS.find(x => x.id === id);
    if (!c) return null;
    return { q: c.q, cat: c.cat, module: c.module, lesson: c.lesson };
  };
  // Spaced-repetition progress across the full card library.
  const fcMeta = state.flashcards || {};
  const totalCards = FLASHCARDS.length;
  let reviewedCount = 0, masteredCount = 0, learningCount = 0, totalReps = 0, totalLapses = 0;
  for (const c of FLASHCARDS) {
    const m = fcMeta[c.id];
    if (!m) continue;
    reviewedCount++;
    totalReps += (m.reps || 0);
    totalLapses += (m.lapses || 0);
    if ((m.interval || 0) >= 21 && (m.reps || 0) >= 3) masteredCount++;
    else learningCount++;
  }
  const newCount = totalCards - reviewedCount;
  const pct = (n) => totalCards ? Math.round(n / totalCards * 100) : 0;
  const stat = (label, value, sub) => `
    <div>
      <div class="text-[10px] uppercase tracking-wider text-slate-500">${label}</div>
      <div class="text-2xl font-bold font-mono numeric mt-0.5">${value}</div>
      ${sub ? `<div class="text-[11px] text-slate-500 mt-0.5">${sub}</div>` : ''}
    </div>`;
  const troubleSection = (heading, rows) => {
    const body = rows.length
      ? rows.map(({ href, label, count }) => `
          <a href="${href}" class="flex items-center justify-between py-1 hover:text-accent-400 transition">
            <span class="truncate">${esc(label)}</span>
            <span class="numeric text-slate-400 ml-2 shrink-0">${count}×</span>
          </a>`).join('')
      : '<div class="text-slate-500 text-xs py-1">—</div>';
    return `
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">${heading}</div>
        ${body}
      </div>`;
  };
  const catRows = topCats.map(([id, n]) => ({
    href: `#category/${id}`, label: catName(id), count: n,
  }));
  const modRows = topMods.map(([id, n]) => {
    const m = MODULES.find(mm => mm.id === id);
    return { href: m ? `#category/${m.cat}/${id}` : '#flashcards', label: modName(id), count: n };
  });
  const lessonRows = topLessons.map(([id, n]) => {
    const info = lessonInfo(id);
    return {
      href: info ? `#category/${info.cat}/${info.module}/${id}` : '#flashcards',
      label: info ? info.name : id,
      count: n,
    };
  });
  const cardRows = topCards.map(([id, n]) => {
    const c = cardInfo(id);
    if (!c) return null;
    return {
      href: c.lesson && c.module
        ? `#category/${c.cat}/${c.module}/${c.lesson}`
        : c.module ? `#category/${c.cat}/${c.module}` : `#category/${c.cat}`,
      label: c.q,
      count: n,
    };
  }).filter(Boolean);

  const statsHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3" id="fc-stats">
      <div class="card thin">
        <div class="font-display font-semibold text-sm uppercase tracking-wide text-slate-300 mb-3">Progress</div>
        <div class="grid grid-cols-3 gap-3 mb-3">
          ${stat('Mastered', masteredCount, `${pct(masteredCount)}% of ${totalCards}`)}
          ${stat('Learning', learningCount, '&lt; 21 day interval')}
          ${stat('New', newCount, 'never seen')}
        </div>
        <div class="bar"><i style="width:${pct(masteredCount)}%"></i></div>
      </div>
      <div class="card thin">
        <div class="font-display font-semibold text-sm uppercase tracking-wide text-slate-300 mb-3">Activity</div>
        <div class="grid grid-cols-3 gap-3">
          ${stat('Reviews', totalReps, 'lifetime')}
          ${stat('Fails', totalFails, totalFails ? 'rated Again' : 'none yet')}
          ${stat('Lapses', totalLapses, totalLapses ? 'mastered → relearn' : 'none')}
        </div>
      </div>
      ${totalFails > 0 ? `
        <div class="card thin lg:col-span-2">
          <div class="font-display font-semibold text-sm uppercase tracking-wide text-slate-300 mb-3">Trouble spots</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            ${troubleSection('By category', catRows)}
            ${troubleSection('By module',   modRows)}
            ${troubleSection('By lesson',   lessonRows)}
          </div>
          ${cardRows.length ? `
            <div class="mt-3 pt-3 border-t border-ink-700/40">
              <div class="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Stickiest cards</div>
              <div class="space-y-0.5 text-xs">
                ${cardRows.map(r => `
                  <a href="${r.href}" class="flex items-center justify-between py-0.5 hover:text-accent-400 transition">
                    <span class="truncate flex-1 mr-2">${esc(r.label)}</span>
                    <span class="numeric text-slate-400 shrink-0">${r.count}×</span>
                  </a>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>`;
  const container = el('div','fade-in space-y-5');
  container.innerHTML = `
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold">Flashcards</h1>
        <p class="text-slate-400 mt-1 text-sm">Spaced repetition (SM-2). Rate honestly — bad ratings ≠ moral failure, they're scheduling input.</p>
      </div>
      <div class="text-right">
        <div class="text-xs uppercase tracking-wide text-slate-400">Due now</div>
        <div class="text-2xl font-bold" id="fc-due">${due.length}</div>
      </div>
    </div>
    <div id="fc-stage"></div>
    ${statsHTML}
  `;
  hub.appendChild(container);
  function refreshStats() {
    // Today XP + food piles still update in state via reviewCard → awardXP
    // and are visible on the dashboard. We just don't surface them on the
    // flashcards screen — only the due-now counter ticks down here.
    const dueEl = container.querySelector('#fc-due');
    if (dueEl) dueEl.textContent = Math.max(0, due.length - idx);
  }

  const stage = container.querySelector('#fc-stage');
  // resumeId was already used to pin the card to due[0] above. Clear the
  // session key now so a normal next-mount of /#flashcards shuffles freely.
  if (resumeId) {
    try { sessionStorage.removeItem('fc.resumeId'); } catch (_) {}
  }
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
    // Tear down resize listener on the prior card before swapping.
    const prior = stage.querySelector('.flashcard');
    if (prior && prior._sizeCard) window.removeEventListener('resize', prior._sizeCard);
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
    // Resolve lesson / module / category routing for the "Review" link.
    // Prefer card.lesson > card.module > card.cat (each is optional on the
    // card; for now most cards only have cat, so the link lands on the
    // category index).
    const stats = state.flashcardFailStats || {};
    const failCount = (stats.byCard && stats.byCard[card.id]) || 0;
    const reviewHref = card.lesson && card.module
      ? `#category/${card.cat}/${card.module}/${card.lesson}`
      : card.module
        ? `#category/${card.cat}/${card.module}`
        : `#category/${card.cat}`;
    fc.innerHTML = `
      <div class="flashcard-inner">
        <div class="flashcard-face">
          <div class="text-xs uppercase tracking-wide text-slate-400 mb-3 inline-flex items-center gap-1.5">${(() => { const _c = CATEGORIES.find(c => c.id === card.cat); return _c ? iconHTML(_c.icon, {size: 14}) : ''; })()} ${card.cat}${failCount > 0 ? ` · <span style="color:var(--bad)">✗ ${failCount} ${failCount === 1 ? 'fail' : 'fails'}</span>` : ''}</div>
          <div class="text-xl font-display font-semibold leading-snug">${richText(card.q)}</div>
          <div class="absolute bottom-5 right-6 text-xs text-slate-500">Click to reveal</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="text-xs uppercase tracking-wide text-slate-400 mb-3 flex items-center justify-between">
            <span>Answer</span>
            <a href="${reviewHref}" class="text-[11px] normal-case tracking-normal" style="color:var(--accent)" onclick="event.stopPropagation(); try { sessionStorage.setItem('fc.resumeId','${card.id}'); } catch(_){}">Review ${card.lesson ? 'lesson' : card.module ? 'module' : 'category'} →</a>
          </div>
          <div class="flashcard-answer leading-relaxed">${richText(card.a)}</div>
          <div class="absolute bottom-5 right-6 text-xs text-slate-500">Click to flip back</div>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2 mt-4" id="rate-row" style="display:none">
        <button class="btn btn-danger" data-rate="1">Again<span class="block text-[10px] mt-0.5">+1</span></button>
        <button class="btn btn-ghost" data-rate="2">Hard<span class="block text-[10px] mt-0.5">+2</span></button>
        <button class="btn btn-ghost" data-rate="3">Good<span class="block text-[10px] mt-0.5">+3</span></button>
        <button class="btn btn-primary" data-rate="4">Easy<span class="block text-[10px] mt-0.5">+4</span></button>
      </div>
    `;
    stage.appendChild(fc);
    const flashEl = fc;
    // iOS WebKit doesn't size grid rows correctly when the grid container
    // has transform-style:preserve-3d, so the card stays at min-height
    // even when the back-face answer overflows. Measure both faces after
    // mount and lock the inner to the taller one. rAF lets fonts settle
    // first so we don't undershoot.
    const sizeCard = () => {
      const inner = flashEl.querySelector('.flashcard-inner');
      const faces = flashEl.querySelectorAll('.flashcard-face');
      if (!inner || faces.length < 2) return;
      let max = 240;
      faces.forEach(f => { max = Math.max(max, f.scrollHeight); });
      inner.style.minHeight = max + 'px';
    };
    requestAnimationFrame(() => requestAnimationFrame(sizeCard));
    // Re-measure on viewport resize (mobile rotate, soft keyboard).
    flashEl._sizeCard = sizeCard;
    window.addEventListener('resize', sizeCard, { passive: true });
    flashEl.querySelector('.flashcard-inner').addEventListener('click', () => {
      // Toggle so the card flips back and forth on repeated clicks.
      // The rate row stays visible once shown — the user has already
      // seen the answer, no value in hiding it again.
      flashEl.classList.toggle('flipped');
      flashEl.querySelector('#rate-row').style.display = 'grid';
    });
    flashEl.querySelectorAll('[data-rate]').forEach(b => {
      b.addEventListener('click', () => {
        const q = parseInt(b.dataset.rate, 10);
        const r = GAMI.reviewCard(state, card.id, q);
        // Track failures by card / cat / module / lesson so the user can
        // see what's sticking. byCard is always populated; byModule and
        // byLesson are populated only for cards that explicitly carry
        // those fields. byCat is the always-available aggregate.
        if (q === 1) {
          if (!state.flashcardFailStats) {
            state.flashcardFailStats = { byCat: {}, byModule: {}, byLesson: {}, byCard: {} };
          }
          const s = state.flashcardFailStats;
          s.byCard[card.id]  = (s.byCard[card.id]  || 0) + 1;
          s.byCat[card.cat]  = (s.byCat[card.cat]  || 0) + 1;
          if (card.module) s.byModule[card.module] = (s.byModule[card.module] || 0) + 1;
          if (card.lesson) s.byLesson[card.lesson] = (s.byLesson[card.lesson] || 0) + 1;
        }
        APP.afterStateChange();
        ANIM.toast({ icon: q===1 ? iconHTML('refresh-cw',{size:18}) : q===4 ? iconHTML('zap',{size:18}) : iconHTML('check',{size:18}), title:`+${r.xpGained} XP${r.bonusLabel||''}`, body: q===1?'Rescheduled tomorrow.':'Logged.' });
        GAMI.bumpQuestProgress(state, 'flashcard');
        idx++;
        refreshStats();
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
            <span class="inline-flex items-center gap-1.5">${iconHTML(c.icon, {size: 16})} ${esc(c.name)} <span class="text-xs text-slate-500">· weight ${c.weight}%</span></span>
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
            <span class="inline-flex items-center gap-1.5">${iconHTML(c.icon, {size: 16})} ${esc(c.name)}</span>
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
            <span class="inline-flex items-center gap-1.5">${iconHTML(c.icon, {size: 16})} ${esc(c.name)}</span>
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

  setTimeout(async () => {
    const ctx = document.getElementById('cov-chart');
    if (!ctx) return;
    if (!window.Chart && window.LAZY) { try { await window.LAZY.chart(); } catch (_) { return; } }
    if (window.Chart) {
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
/* Sync-between-devices section for the Profile page. The actual sync
 * logic lives in js/sync.js — this is the UI surface that lets the
 * user pair / unpair and shows the current sync status.
 *
 * Three states:
 *   1. Sync endpoint not configured  → instructions (deploy + edit URL)
 *   2. Endpoint configured, not paired → "Generate code" + "Enter code"
 *   3. Endpoint configured, paired    → show code + status + Unpair
 */
function renderSyncSection(sync) {
  if (!sync) return '';
  if (!sync.configured) {
    return `
      <div class="card" style="border:1px dashed var(--hairline-2)">
        <h3 class="font-display font-semibold text-lg mb-1">Sync between devices</h3>
        <div class="text-[12.5px] muted">
          Not configured. Deploy the Cloudflare Worker
          (<code class="font-mono">cloudflare/README.md</code>),
          paste the URL into <code class="font-mono">js/sync.js</code>,
          re-push. Free tier, ~5 minutes one-time.
        </div>
      </div>`;
  }
  if (!sync.code) {
    return `
      <div class="card">
        <h3 class="font-display font-semibold text-lg mb-1">Sync between devices</h3>
        <p class="text-[12.5px] muted mb-3">
          Pair this browser with another device by a short code. Both
          devices then share progress + Bit in real time.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button class="btn btn-primary" data-sync-generate>Generate a code</button>
          <span class="muted text-[12px]">or</span>
          <input id="sync-code-input" placeholder="ENTER-CODE" maxlength="11"
                 autocapitalize="characters" autocorrect="off" autocomplete="off" spellcheck="false"
                 class="font-mono text-center" style="letter-spacing:0.18em; width:170px; text-transform:uppercase"/>
          <button class="btn" data-sync-pair>Pair</button>
        </div>
        <div id="sync-status" class="text-[11.5px] muted mt-3" style="min-height:1em"></div>
      </div>`;
  }
  return `
    <div class="card">
      <h3 class="font-display font-semibold text-lg mb-1">Sync between devices</h3>
      <p class="text-[12.5px] muted mb-3">
        Paired. Enter the code on another device to share progress.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <div class="font-mono text-2xl tracking-[0.18em]" style="user-select:all">${esc(sync.code).replace(/(.{4})/, '$1-').replace(/(.{4})-(.{4})/,'$1-$2')}</div>
        <button class="btn btn-ghost" data-sync-unpair>Unpair this device</button>
      </div>
      <div id="sync-status" class="text-[11.5px] muted mt-3" style="min-height:1em">${esc(sync.last || 'idle')}</div>
    </div>`;
}

/*
 * Apple Liquid Glass sign-in gate. Uses the project's established
 * Liquid Glass material tokens (--regular, --spring-overshoot,
 * --spring-settle) and the same recipe applied to the tab bar /
 * sidebar — no creative liberties, no decorative animations.
 *
 * Material recipe (mirrors #liquid-tabbar in styles.css):
 *   background:        color-mix(--regular with --card-tint)
 *   backdrop-filter:   blur(40px) saturate(220%) brightness(1.08) contrast(1.04)
 *   box-shadow:        inset rim highlights + soft drop
 *   transitions:       --spring-overshoot for entrance, --spring-settle for exit
 */
function renderLoginGate(onDismiss) {
  const prior = document.getElementById('login-gate');
  if (prior) prior.remove();

  if (!document.getElementById('login-gate-css')) {
    const css = document.createElement('style');
    css.id = 'login-gate-css';
    css.textContent = `
      /* (Lock rules live in index.html inline critical CSS so they
         apply before the first paint — see html.lg-locked / .lg-unlocking) */
      #login-gate {
        position: fixed; inset: 0; z-index: 100;
        display: grid; place-items: center; padding: 1.5rem;
        background: rgba(248,249,252,0.55);
        -webkit-backdrop-filter: blur(32px) saturate(180%);
        backdrop-filter:        blur(32px) saturate(180%);
        opacity: 0;
        transition: opacity 0.38s var(--spring-settle, cubic-bezier(0.16,1,0.3,1));
      }
      #login-gate.visible { opacity: 1; }
      #login-gate.dismiss { opacity: 0; }

      #login-gate .lg-card {
        position: relative;
        max-width: 360px; width: 100%;
        padding: 28px 24px 22px;
        border-radius: 28px;
        /* Identical to #liquid-tabbar's material recipe */
        background: color-mix(in srgb, var(--regular, rgba(255,255,255,0.58)) 80%, var(--card-tint, transparent) 20%);
        -webkit-backdrop-filter: blur(40px) saturate(220%) brightness(1.08) contrast(1.04);
        backdrop-filter:        blur(40px) saturate(220%) brightness(1.08) contrast(1.04);
        box-shadow:
          inset  0  1px 0 rgba(255,255,255,0.95),
          inset  0 -1px 0 rgba(15,23,42,0.06),
          inset  1px 0 0 rgba(255,255,255,0.55),
          inset -1px 0 0 rgba(255,255,255,0.30),
          0 22px 50px -18px rgba(15,23,42,0.28),
          0 6px 16px -8px rgba(15,23,42,0.14);
        opacity: 0;
        transform: translateY(8px) scale(0.96);
        transition:
          opacity 0.45s var(--spring-settle, cubic-bezier(0.16,1,0.3,1)),
          transform 0.55s var(--spring-overshoot, cubic-bezier(0.34,1.56,0.64,1));
      }
      #login-gate.visible .lg-card {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      #login-gate.dismiss .lg-card {
        opacity: 0;
        transform: scale(0.97);
        transition:
          opacity 0.28s var(--spring-settle, cubic-bezier(0.16,1,0.3,1)),
          transform 0.32s var(--spring-settle, cubic-bezier(0.16,1,0.3,1));
      }

      #login-gate .lg-input {
        width: 100%;
        background: rgba(255,255,255,0.55);
        border: 1px solid rgba(15,23,42,0.10);
        border-radius: 14px;
        padding: 12px 14px;
        font-family: 'Geist Mono', ui-monospace, monospace;
        font-size: 17px;
        font-weight: 500;
        letter-spacing: 0.28em;
        text-align: center;
        text-transform: uppercase;
        color: var(--text, #0F172A);
        transition:
          border-color 0.28s var(--spring-settle, cubic-bezier(0.16,1,0.3,1)),
          background   0.28s var(--spring-settle, cubic-bezier(0.16,1,0.3,1));
      }
      #login-gate .lg-input::placeholder {
        color: rgba(15,23,42,0.32);
        letter-spacing: 0.16em;
      }
      #login-gate .lg-input:focus {
        outline: none;
        border-color: rgba(15,23,42,0.32);
        background: rgba(255,255,255,0.78);
      }

      #login-gate .lg-btn {
        width: 100%;
        margin-top: 10px;
        padding: 12px 14px;
        border-radius: 14px;
        border: none;
        background: var(--accent, #0EA371);
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: transform 0.18s var(--spring-settle, cubic-bezier(0.16,1,0.3,1));
      }
      #login-gate .lg-btn:active { transform: scale(0.985); }

      #login-gate .lg-link {
        background: none; border: none; padding: 0;
        font-size: 13px;
        color: var(--accent, #0EA371);
        font-weight: 500;
        cursor: pointer;
      }
      #login-gate .lg-link.muted {
        color: var(--muted, #6B7785);
        font-weight: 400;
      }
    `;
    document.head.appendChild(css);
  }

  const gate = document.createElement('div');
  gate.id = 'login-gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.innerHTML = `
    <div class="lg-card">
      <div style="text-align:center; margin-bottom: 18px;">
        <div class="font-display font-semibold" style="font-size:12px; letter-spacing:0.10em; color:var(--muted, #6B7785); text-transform:uppercase;">FDE/SDE 2026</div>
      </div>
      <h2 class="font-display font-semibold" style="font-size:22px; text-align:center; letter-spacing:-0.01em; margin-bottom: 18px;">Sign in</h2>
      <input id="gate-code-input" class="lg-input" type="text" placeholder="code" maxlength="11"
        autocapitalize="characters" autocorrect="off" autocomplete="off" spellcheck="false"/>
      <button id="gate-pair-btn" class="lg-btn" type="button">Continue</button>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top: 14px;">
        <button id="gate-generate-btn" class="lg-link" type="button">Generate a code</button>
        <button id="gate-skip-btn" class="lg-link muted" type="button">Skip</button>
      </div>
      <div id="gate-status" style="font-size:12px; color:var(--muted, #6B7785); text-align:center; min-height:1em; margin-top:10px;"></div>
    </div>
  `;
  // Ensure the lock is applied (it usually already is, set by the
  // inline script in index.html — but if renderLoginGate is invoked
  // dynamically from Profile mid-session, set it here too).
  document.documentElement.classList.add('lg-locked');
  document.body.appendChild(gate);
  // Trigger the entrance on the next frame so the transition kicks in.
  requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add('visible')));

  const codeInput = gate.querySelector('#gate-code-input');
  const statusEl  = gate.querySelector('#gate-status');
  const setStatus = (s) => { if (statusEl) statusEl.textContent = s; };

  codeInput.addEventListener('input', (e) => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    try { e.target.setSelectionRange(pos, pos); } catch (_) {}
  });

  let dismissing = false;
  const dismiss = () => {
    if (dismissing) return;
    dismissing = true;
    gate.classList.remove('visible');
    gate.classList.add('dismiss');
    // Swap lock → unlocking so the app fades IN while the gate fades OUT.
    document.documentElement.classList.remove('lg-locked');
    document.documentElement.classList.add('lg-unlocking');
    setTimeout(() => {
      gate.remove();
      document.documentElement.classList.remove('lg-unlocking');
      if (typeof onDismiss === 'function') onDismiss();
    }, 420);
  };

  const doPair = async () => {
    if (!window.SYNC) { setStatus('Sync not loaded'); return; }
    const raw = codeInput.value.trim();
    if (!raw) { setStatus('Enter a code'); codeInput.focus(); return; }
    setStatus('Pairing…');
    try {
      await window.SYNC.pair(raw);
      dismiss();
    } catch (e) {
      setStatus(e.message || 'Pairing failed');
    }
  };

  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doPair(); }
  });
  gate.querySelector('#gate-pair-btn').addEventListener('click', doPair);
  gate.querySelector('#gate-generate-btn').addEventListener('click', () => {
    if (!window.SYNC) return;
    codeInput.value = window.SYNC.generateCode();
    setStatus('Save this code to sign in elsewhere.');
    codeInput.focus(); codeInput.select();
  });
  gate.querySelector('#gate-skip-btn').addEventListener('click', () => {
    try { localStorage.setItem('fdeprep.syncSkip.v1', '1'); } catch (_) {}
    dismiss();
  });

  // Autofocus once the entrance settles, so iOS doesn't pop the keyboard
  // before the card has fully landed.
  setTimeout(() => codeInput.focus(), 380);
}

function renderProfile(state, hub) {
  const container = el('div','fade-in space-y-5');
  const earned = Object.keys(state.badges || {});
  const sync = (window.SYNC && window.SYNC.status()) || null;
  container.innerHTML = `
    <h1 class="font-display text-3xl font-bold">Profile</h1>

    ${renderSyncSection(sync)}

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
        <label class="block">
          <span class="text-xs text-slate-400">Your pet's name</span>
          <input name="pet_name" maxlength="24" value="${esc(state.pet && state.pet.name || 'Bit')}" class="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 mt-1 focus:border-accent-500 focus:outline-none"/>
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
            <div style="color:${got ? 'var(--accent)' : 'var(--dim)'}; display:inline-flex; align-items:center; justify-content:center">${iconHTML(b.icon, {size: 30})}</div>
            <div class="text-xs mt-1 font-medium">${esc(b.name)}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${esc(b.desc)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  hub.appendChild(container);

  // ── Sync section bindings (if rendered) ──
  const statusEl = container.querySelector('#sync-status');
  const setStatusText = (s) => { if (statusEl) statusEl.textContent = s; };
  if (window.SYNC) {
    window.SYNC.onStatusChange((s) => setStatusText(s));
  }
  const genBtn = container.querySelector('[data-sync-generate]');
  if (genBtn) genBtn.addEventListener('click', async () => {
    if (!window.SYNC) return;
    setStatusText('generating…');
    const code = window.SYNC.generateCode();
    try {
      await window.SYNC.pair(code);
      // Re-render this view to flip into "paired" state
      VIEWS.renderProfile(APP.getState(), (function () {
        hub.innerHTML = ''; return hub;
      })());
    } catch (e) { setStatusText('error: ' + e.message); }
  });
  const codeInput = container.querySelector('#sync-code-input');
  if (codeInput) {
    codeInput.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      try { e.target.setSelectionRange(pos, pos); } catch (_) {}
    });
  }
  const doPair = async () => {
    if (!window.SYNC) return;
    const raw = codeInput ? codeInput.value.trim() : '';
    if (!raw) { setStatusText('enter a code first'); return; }
    setStatusText('pairing…');
    try {
      const result = await window.SYNC.pair(raw);
      setStatusText(result.adopted ? 'adopted other device\'s state' : 'this device seeded the code');
      hub.innerHTML = '';
      VIEWS.renderProfile(APP.getState(), hub);
    } catch (e) { setStatusText('error: ' + e.message); }
  };
  const pairBtn = container.querySelector('[data-sync-pair]');
  if (pairBtn) pairBtn.addEventListener('click', doPair);
  if (codeInput) codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doPair(); }
  });
  const unpairBtn = container.querySelector('[data-sync-unpair]');
  if (unpairBtn) unpairBtn.addEventListener('click', () => {
    if (!window.SYNC) return;
    window.SYNC.unpair();
    hub.innerHTML = '';
    VIEWS.renderProfile(APP.getState(), hub);
  });
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
  // Skeleton (header) lands sync so the route paints immediately;
  // tier cards build in one rAF so the synchronous innerHTML+parse cost
  // doesn't show up as a 500ms long task during the nav.
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Sources & methodology</h1>
      <p class="text-slate-400 mt-1 text-sm max-w-2xl">Every pattern in the curriculum is corroborated across ≥2 sources or is established CS canon. Primary sources are weighted heavier. Treat individual Glassdoor entries as signal-in-aggregate only.</p>
    </div>
    <div id="srcs-body"></div>
  `;
  hub.appendChild(container);
  requestAnimationFrame(() => {
    const body = container.querySelector('#srcs-body');
    if (!body) return;
    body.innerHTML = `
    ${tierCard('Primary — editorially reviewed or first-party', tier('primary'), '#7CF1C2')}
    ${tierCard('Aggregate — community signal, useful in triangulation', tier('aggregate'), '#FFB95C')}
    ${tierCard('Secondary — niche prep blogs, cross-check before relying', tier('secondary'), '#A78BFA')}
    ${tierCard('Verification tools', tier('verify'), '#60A5FA')}

    <div class="card border-rose-500/30">
      <h3 class="font-display font-semibold text-lg text-rose-400">What is NOT cited</h3>
      <p class="text-sm text-slate-300 mt-2 leading-relaxed">Specific verbatim questions attributed to individual companies are <i>illustrative</i> — pulled from public patterns and vertical norms. Always verify with the current JD, your recruiter, and recent candidate writeups before relying on specific phrasing. Smaller portfolio companies (e.g. Bikky, Airgoods, Nory, Hang, Mirage, Felicity, Coast) have sparse public 2026 interview reports; their sample prompts are pattern-matched to vertical, not sourced verbatim.</p>
    </div>
  `;
  });
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
          ANIM.toast({ icon: iconHTML('star', {size: 18}), title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:'First draft saved.' });
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
            <div style="display:inline-flex">${iconHTML('refresh-cw', {size: 18})}</div>
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

/* =========================================================================
 * MOCK INTERVIEW — daily quest
 * Pick 3 tier-1 topics deterministically by date, walk through review +
 * activity for each, then sit a 6-question medium-hard mock test.
 * The test pulls scenario-based questions (filtered for difficulty cues
 * like length, "best"/"why"/"when" framings, longer explanations).
 * ========================================================================= */

// Seeded shuffle so today's mock interview is deterministic
function _mockSeededShuffle(arr, seed) {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pick 3 lessons from 3 different tier-1 categories, deterministic per day
function _pickMockTopics(state) {
  const today = GAMI.todayKey();
  const seed = parseInt(today.replaceAll('-', ''), 10);
  // Tier-1 categories: technical core (ai, decomp, sysd, coding)
  const tier1 = CATEGORIES.filter(c => c.tier === 1).map(c => c.id);
  // Candidate lessons: concept-type with an `interactive` activity, in a tier-1 category
  const candidates = MODULES.flatMap(m =>
    m.lessons
      .filter(l => l.type === 'concept' && l.interactive)
      .map(l => ({ lesson: l, mod: m, cat: m.cat }))
  ).filter(x => tier1.includes(x.cat));
  const shuffled = _mockSeededShuffle(candidates, seed);
  // Greedy pick: one per distinct category, up to 3
  const picked = [];
  const usedCats = new Set();
  for (const c of shuffled) {
    if (usedCats.has(c.cat)) continue;
    picked.push(c);
    usedCats.add(c.cat);
    if (picked.length === 3) break;
  }
  return picked;
}

// Practice-mode topic picker — true random, prefers UNCOMPLETED tier-1 concepts.
// Used by #mock/practice for unlimited reps on topics the user hasn't reviewed.
function _pickPracticeTopics(state, excludeIds = []) {
  const tier1 = CATEGORIES.filter(c => c.tier === 1).map(c => c.id);
  const exclude = new Set(excludeIds);
  const allConcepts = MODULES.flatMap(m =>
    m.lessons
      .filter(l => l.type === 'concept' && l.interactive && !exclude.has(l.id))
      .map(l => ({ lesson: l, mod: m, cat: m.cat }))
  ).filter(x => tier1.includes(x.cat));
  const uncompleted = allConcepts.filter(x => !state.completedLessons[x.lesson.id]);
  // Prefer uncompleted; if fewer than 3 available, fall back to any tier-1 concept
  let pool = uncompleted.length >= 3 ? uncompleted : allConcepts;
  // True random (Math.random — fresh each call, no seeding)
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = [];
  const usedCats = new Set();
  for (const c of shuffled) {
    if (usedCats.has(c.cat)) continue;
    picked.push(c); usedCats.add(c.cat);
    if (picked.length === 3) break;
  }
  // If we couldn't satisfy one-per-distinct-category, allow repeats
  if (picked.length < 3) {
    for (const c of shuffled) {
      if (picked.find(p => p.lesson.id === c.lesson.id)) continue;
      picked.push(c);
      if (picked.length === 3) break;
    }
  }
  return picked;
}

// Hardness heuristic for category-quiz items: prefer scenario-framed
// questions with longer explanations and balanced option lengths
function _isMediumHard(q) {
  if (!q || !q.q || !q.options || !q.explain) return false;
  const explainLen = q.explain.length;
  const promptLen = q.q.length;
  const cuesHard = /\bbest\b|\bwhy\b|\bwhen\b|\bsenior\b|\bworst-case\b|\btradeoff\b|\bedge case\b|\bproduction\b|\bdebug\b|\bfail\b/i.test(q.q);
  // Reject obvious-correct length-bias (correct option way longer than wrong avg)
  const lens = q.options.map(o => o.length);
  const cl = lens[q.correct] || 0;
  const wl = lens.filter((_, i) => i !== q.correct);
  const avgWrong = wl.reduce((s, n) => s + n, 0) / Math.max(1, wl.length);
  const lengthBalanced = cl <= 1.6 * avgWrong;
  return (explainLen >= 90 || promptLen >= 80 || cuesHard) && lengthBalanced;
}

// Pull 2 medium-hard questions per topic from the category bank
function _pickTestQuestions(topics) {
  const out = [];
  const seed = parseInt(GAMI.todayKey().replaceAll('-', ''), 10);
  topics.forEach((t, ti) => {
    const bank = (DATA.CATEGORY_QUIZZES[t.cat] || []).filter(_isMediumHard);
    // Fallback to whole category bank if too few pass the filter
    const pool = bank.length >= 2 ? bank : (DATA.CATEGORY_QUIZZES[t.cat] || []);
    const shuffled = _mockSeededShuffle(pool, seed + ti * 31);
    const picked = shuffled.slice(0, 2).map(q => ({
      ...q,
      _topicIdx: ti,
      cat: t.cat,
    }));
    out.push(...picked);
  });
  return out;
}

function renderMockInterview(state, hub, mode) {
  const today = GAMI.todayKey();
  const isPractice = mode === 'practice';
  const sessionKey = isPractice ? 'activeMockPractice' : 'activeMockInterview';

  // Daily mode: reset stale state if it's a new day.
  // Practice mode: reset when completed (so each visit starts a fresh practice session),
  // but resume an in-progress one if the user reloaded mid-session.
  const existing = state[sessionKey];
  const stale = isPractice
    ? (!existing || existing.completed)
    : (!existing || existing.date !== today);
  if (stale) {
    state[sessionKey] = {
      date: today,
      mode: isPractice ? 'practice' : 'daily',
      sessionId: isPractice ? `prac-${Date.now()}` : `daily-${today}`,
      phase: 'briefing',
      currentTopic: 0,
      testAnswers: [],
      completed: false,
      // Practice mode locks in its randomly-picked topics in state so reload doesn't reshuffle
      topicIds: isPractice ? _pickPracticeTopics(state).map(x => x.lesson.id) : null,
    };
    GAMI.saveImmediate(state);
  }
  const session = state[sessionKey];

  // Resolve topic objects from ids (practice) or seeded picker (daily)
  let topics;
  if (isPractice && Array.isArray(session.topicIds)) {
    topics = session.topicIds
      .map(lid => {
        for (const m of MODULES) {
          const l = m.lessons.find(x => x.id === lid);
          if (l) return { lesson: l, mod: m, cat: m.cat };
        }
        return null;
      })
      .filter(Boolean);
    // If somehow we have fewer than 3 (e.g., a lesson was removed), re-roll
    if (topics.length < 3) {
      topics = _pickPracticeTopics(state);
      session.topicIds = topics.map(x => x.lesson.id);
      GAMI.saveImmediate(state);
    }
  } else {
    topics = _pickMockTopics(state);
  }
  if (topics.length < 3) {
    hub.innerHTML = `<div class="card"><div class="muted">Not enough tier-1 concept lessons to run a mock interview. Add more concepts first.</div></div>`;
    return;
  }

  const container = el('div', 'fade-in space-y-5');
  hub.appendChild(container);
  paint();

  function paint() {
    if (session.phase === 'briefing')    return paintBriefing();
    if (session.phase.startsWith('review-')) return paintReview(parseInt(session.phase.split('-')[1], 10));
    if (session.phase === 'test')        return paintTest();
    if (session.phase === 'results')     return paintResults();
  }

  // ── Phase 1: briefing ─────────────────────────────────────────────────
  function paintBriefing() {
    const totalMin = topics.reduce((s, t) => s + (t.lesson.time || 8), 0) + 12; // +12 for the test
    container.innerHTML = `
      <div>
        <a href="#dashboard" class="text-xs muted hover:text-accent-400">← Back to dashboard</a>
        <h1 class="font-display text-3xl font-semibold mt-2">Mock interview${isPractice ? ' · practice' : ''}</h1>
        <p class="muted text-sm mt-1 max-w-xl">${isPractice
          ? `Practice run — 3 topics from areas you haven't completed yet. Unlimited reps, no daily-quest progress (the daily mock counts separately). ≈ ${totalMin} min.`
          : `3 topics, picked deterministically for today. You'll review each topic + do its activity, then sit a 6-question medium-hard exam pulling from the same three areas. ≈ ${totalMin} min.`}</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-4">
        ${topics.map((t, i) => {
          const cat = CATEGORIES.find(c => c.id === t.cat);
          return `
          <div class="card">
            <div class="flex items-start justify-between">
              <div class="text-accent-400">${cat ? iconHTML(cat.icon, {size: 22}) : iconHTML('book-open', {size: 22})}</div>
              <span class="text-[10px] muted uppercase tracking-wider">Topic ${i+1}</span>
            </div>
            <div class="text-xs muted mt-2">${esc(cat ? cat.name : t.cat)}</div>
            <div class="font-semibold mt-1 text-[14.5px] leading-snug">${esc(t.lesson.name)}</div>
            <div class="text-xs muted mt-2">${t.lesson.time || 8} min</div>
          </div>`;
        }).join('')}
      </div>
      <div class="card thin">
        <div class="text-[12.5px] muted leading-relaxed">
          <b style="color:var(--text)">How it works.</b> For each topic you'll read the body and complete the embedded activity (free-recall → interactive → self-rate). After all three, the mock exam pulls scenario-framed questions from those areas, with subtle distractors and a tighter time budget than a normal quiz. The exam is intentionally medium-hard — no "definition recall" gimmes.
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-primary" id="mi-start">Start mock interview →</button>
        <a class="btn btn-ghost" href="#dashboard">Cancel</a>
      </div>
    `;
    container.querySelector('#mi-start').addEventListener('click', () => {
      session.phase = 'review-0';
      session.currentTopic = 0;
      GAMI.saveImmediate(state);
      paint();
    });
  }

  // ── Phase 2: review each topic (3 sub-phases) ────────────────────────
  function paintReview(idx) {
    const t = topics[idx];
    const cat = CATEGORIES.find(c => c.id === t.cat);
    container.innerHTML = `
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div class="text-xs muted uppercase tracking-wider">Topic ${idx+1} of 3 · ${esc(cat ? cat.name : t.cat)}</div>
          <h2 class="font-display text-2xl font-semibold mt-1 leading-tight">${esc(t.lesson.name)}</h2>
        </div>
        <div class="flex gap-1 items-center">
          ${[0,1,2].map(i => `<span class="w-8 h-1.5 rounded-full" style="background:${i<=idx?'var(--accent)':'var(--hairline)'}"></span>`).join('')}
        </div>
      </div>
      <div class="card elevated">
        <div id="mi-activity" class="min-h-[2rem]"></div>
        <div class="mt-5 pt-5 border-t border-[color:var(--hairline)] lesson-prose">
          <div class="eyebrow mb-2 mobile-hide">Reference · the full insight</div>
          ${t.lesson.body}
        </div>
        <div class="mt-6 flex items-center justify-between gap-2 flex-wrap">
          <div class="text-xs muted" id="mi-status">○ Complete the activity to advance to the next topic</div>
          <button class="btn btn-primary" id="mi-advance" disabled style="opacity:0.5;pointer-events:none">
            ${idx < 2 ? `Topic ${idx+2} →` : 'Start the mock exam →'}
          </button>
        </div>
      </div>
    `;
    const advanceBtn = container.querySelector('#mi-advance');
    const statusEl = container.querySelector('#mi-status');
    const stage = container.querySelector('#mi-activity');
    const unlock = () => {
      advanceBtn.disabled = false;
      advanceBtn.style.opacity = '';
      advanceBtn.style.pointerEvents = '';
      statusEl.innerHTML = '<span style="color:var(--accent)">✓ Engagement recorded — advance when ready</span>';
    };
    try {
      window.GAMES.mountLessonInteraction(stage, state, t.lesson, t.cat, { onEngaged: unlock });
    } catch (err) {
      console.error('mi activity mount failed:', err);
      stage.innerHTML = `<div style="color:var(--bad)">Activity failed to load — clicking the advance button will let you proceed.</div>`;
      unlock();
    }
    // Syntax-highlight the lesson body code blocks
    highlightCodeIn(container);
    advanceBtn.addEventListener('click', () => {
      if (idx < 2) session.phase = 'review-' + (idx + 1);
      else        session.phase = 'test';
      GAMI.saveImmediate(state);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      paint();
    });
  }

  // ── Phase 3: mock test — 6 medium-hard questions, sequential, 40s/q ──
  function paintTest() {
    if (!session.testQuestions) {
      session.testQuestions = _pickTestQuestions(topics);
      session.testAnswers = [];
      session.testStartTs = Date.now();
      GAMI.saveImmediate(state);
    }
    const questions = session.testQuestions;
    if (!questions || questions.length === 0) {
      // Fallback if banks are empty
      container.innerHTML = `<div class="card"><div class="muted">Couldn't assemble a test — too few category questions for these topics. Marking complete.</div></div>`;
      session.phase = 'results';
      paint();
      return;
    }

    const SECONDS_PER_Q = 40; // medium-hard cadence — more thinking room than Lightning Quiz
    const total = questions.length;
    let cur = session.testAnswers.length; // resume if user reloaded
    let timeLeft = SECONDS_PER_Q * (total - cur);
    let timerId = null;

    function renderQ() {
      if (cur >= total) { clearInterval(timerId); session.phase = 'results'; GAMI.saveImmediate(state); paint(); return; }
      const q = questions[cur];
      const timeLabel = timeLeft >= 60 ? Math.floor(timeLeft/60)+':'+String(timeLeft%60).padStart(2,'0') : timeLeft+'s';
      const score = session.testAnswers.filter(a => a.correct).length;
      container.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs muted uppercase tracking-wider">Mock exam</div>
            <div class="text-[13px] muted mt-0.5">Question ${cur+1} of ${total} · <span class="numeric" style="color:var(--warn)" id="mi-timer">${timeLabel}</span></div>
          </div>
          <div class="text-xs numeric">Score <span style="color:var(--accent)">${score}</span></div>
        </div>
        <div class="bar"><i style="width:${(cur/total*100).toFixed(0)}%"></i></div>
        <div class="card elevated">
          <div class="text-[10.5px] muted mb-2 uppercase tracking-wider">${esc(q.cat || 'general')} · Topic ${(q._topicIdx ?? 0) + 1}</div>
          <div class="font-medium text-[15.5px] leading-snug mb-4">${esc(q.q)}</div>
          <div class="grid gap-2" id="mi-opts">
            ${q.options.map((o, i) => `
              <button class="btn justify-start text-left !py-2.5 w-full" data-pick="${i}">
                <span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}
              </button>
            `).join('')}
          </div>
          <div id="mi-fb" class="hidden mt-4"></div>
        </div>
      `;
      container.querySelectorAll('[data-pick]').forEach(b => {
        b.addEventListener('click', () => pick(parseInt(b.dataset.pick, 10), b));
      });
    }

    function pick(i, btn) {
      const q = questions[cur];
      const isRight = i === q.correct;
      if (isRight) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';
      } else {
        btn.style.borderColor = 'var(--bad)';
        btn.style.color = 'var(--bad)';
        ANIM.shake && ANIM.shake(btn);
        const right = container.querySelector(`[data-pick="${q.correct}"]`);
        if (right) { right.style.borderColor = 'var(--accent)'; right.style.color = 'var(--accent)'; }
        // Mock exam wrong answers DO enter the SRS wrong-queue
        if (q.id) {
          GAMI.recordWrongAnswer(state, {
            id: q.id, q: q.q, options: q.options, correct: q.correct,
            explain: q.explain || '', cat: q.cat || 'general',
            source: (isPractice ? 'mock-practice-' : 'mock-daily-') + session.sessionId,
          });
        }
      }
      container.querySelectorAll('[data-pick]').forEach(b => b.disabled = true);
      session.testAnswers.push({ qIdx: cur, picked: i, correct: isRight, topicIdx: q._topicIdx ?? 0 });
      GAMI.saveImmediate(state);
      const fb = container.querySelector('#mi-fb');
      fb.classList.remove('hidden');
      fb.innerHTML = `
        <div class="text-[13px] leading-relaxed" style="color:${isRight?'var(--accent)':'var(--bad)'}">
          ${isRight ? '✓ Correct.' : '✗ ' + esc(q.options[q.correct]) + ' was the right answer.'}
        </div>
        <div class="text-[13px] muted mt-2 leading-relaxed">${esc(q.explain || '')}</div>
        <div class="mt-3 text-right">
          <button class="btn btn-primary" id="mi-next">${cur+1 < total ? 'Next →' : 'See results →'}</button>
        </div>
      `;
      fb.querySelector('#mi-next').addEventListener('click', () => {
        cur++;
        renderQ();
      });
    }

    renderQ();
    timerId = setInterval(() => {
      timeLeft--;
      const el = container.querySelector('#mi-timer');
      if (el) {
        const label = timeLeft >= 60 ? Math.floor(timeLeft/60)+':'+String(timeLeft%60).padStart(2,'0') : timeLeft+'s';
        el.textContent = label;
        if (timeLeft < 10) el.style.color = 'var(--bad)';
      }
      if (timeLeft <= 0) {
        clearInterval(timerId);
        // Auto-end: record any unanswered as wrong, advance to results
        while (session.testAnswers.length < total) {
          const q = questions[session.testAnswers.length];
          session.testAnswers.push({ qIdx: session.testAnswers.length, picked: -1, correct: false, topicIdx: q._topicIdx ?? 0 });
        }
        session.phase = 'results';
        GAMI.saveImmediate(state);
        paint();
      }
    }, 1000);
  }

  // ── Phase 4: results ─────────────────────────────────────────────────
  function paintResults() {
    const answers = session.testAnswers || [];
    const total = (session.testQuestions || []).length;
    const correct = answers.filter(a => a.correct).length;
    const pct = total ? Math.round(correct / total * 100) : 0;
    const verdict = pct >= 80 ? { tag:'Strong pass', color:'var(--accent)' }
                  : pct >= 60 ? { tag:'Pass — keep grinding', color:'var(--sde)' }
                  : pct >= 40 ? { tag:'Borderline — review weak topics', color:'var(--warn)' }
                              : { tag:'Below bar — rework basics', color:'var(--bad)' };

    // Per-topic breakdown
    const perTopic = topics.map((t, i) => {
      const ts = answers.filter(a => a.topicIdx === i);
      const tc = ts.filter(a => a.correct).length;
      return { topic: t, total: ts.length, correct: tc };
    });

    // Award XP. Daily mode bumps the daily quest; practice mode does not.
    if (!session.completed) {
      const baseXp = correct * (isPractice ? 8 : 15);   // practice XP is smaller to discourage farming
      const passBonus = pct >= 80 ? (isPractice ? 25 : 60) : pct >= 60 ? (isPractice ? 12 : 30) : 0;
      const totalXp = baseXp + passBonus;
      GAMI.awardXP(state, totalXp, isPractice ? 'mock-practice' : 'mock-interview');
      if (!isPractice) GAMI.bumpQuestProgress(state, 'mock');
      session.completed = true;
      session.finalScore = correct;
      session.finalPct = pct;
      session.xpAwarded = totalXp;
      GAMI.saveImmediate(state);
      APP.afterStateChange();
      ANIM.confettiBurst && ANIM.confettiBurst(pct >= 80 ? 'l' : 'm');
      ANIM.toast && ANIM.toast({ icon: iconHTML('target', {size: 18}), title:`+${totalXp} XP`, body:`${isPractice ? 'Practice ' : ''}Mock exam · ${correct}/${total}` });
    }

    container.innerHTML = `
      <div class="card elevated text-center">
        <div class="text-xs uppercase tracking-wider muted mb-2">Mock exam complete</div>
        <div class="text-6xl font-display font-bold" style="color:${verdict.color}">${correct}<span class="text-2xl muted">/${total}</span></div>
        <div class="text-sm mt-1" style="color:${verdict.color}">${pct}% · ${verdict.tag}</div>
        <div class="bar mt-4 max-w-xs mx-auto"><i style="width:${pct}%"></i></div>
        <div class="text-xs muted mt-3">+${session.xpAwarded || 0} XP earned · daily mock quest complete</div>
      </div>

      <div class="card">
        <h3 class="font-display font-semibold text-lg mb-3">Per-topic breakdown</h3>
        <div class="space-y-3">
          ${perTopic.map((p, i) => {
            const cat = CATEGORIES.find(c => c.id === p.topic.cat);
            const pPct = p.total ? Math.round(p.correct / p.total * 100) : 0;
            const color = pPct >= 75 ? 'var(--accent)' : pPct >= 50 ? 'var(--warn)' : 'var(--bad)';
            return `
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="inline-flex items-center gap-1.5">${cat ? iconHTML(cat.icon, {size: 14}) : ''} <b>${esc(p.topic.lesson.name)}</b></span>
                  <span class="numeric" style="color:${color}">${p.correct}/${p.total}</span>
                </div>
                <div class="bar"><i style="width:${pPct}%; background:${color}"></i></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card thin">
        <div class="text-[13px] leading-relaxed muted">
          <b style="color:var(--text)">What happens next.</b> Any question you got wrong is now in your SRS wrong-answer queue and will resurface on schedule. ${isPractice
            ? 'Run another practice mock below to drill different topics — unlimited.'
            : 'Tomorrow\'s daily mock will pick a different 3 topics. The daily quest refreshes at midnight.'}
        </div>
      </div>

      <div class="flex gap-2 flex-wrap">
        <a class="btn btn-primary" href="#dashboard">← Back to dashboard</a>
        ${session.testAnswers.some(a => !a.correct)
          ? `<a class="btn" href="#review/missed">Review missed →</a>`
          : ''}
        <a class="btn ${isPractice ? 'btn-primary' : ''}" id="mi-practice-again" href="#mock/practice">
          ${isPractice ? 'Run another practice mock →' : 'Run a practice mock (uncompleted topics) →'}
        </a>
      </div>
    `;
    // If we're already in practice mode and the user clicks "Run another," we
    // need to clear the current practice session so a new one starts.
    const again = container.querySelector('#mi-practice-again');
    if (again && isPractice) {
      again.addEventListener('click', (e) => {
        state.activeMockPractice = null;
        GAMI.saveImmediate(state);
        // Let the default navigation fire — app.js will re-init the session
      });
    }
  }
}

return {
  renderDashboard, renderCurriculum, renderCategory, renderLesson,
  renderCompanies, renderCompany, renderFlashcards, renderInfographics,
  renderCoverage, renderProfile, renderSources, renderMocks, renderStories,
  renderPrep, renderReview, renderMockInterview,
  renderLoginGate,
  renderJobAppsCard,              // exposed for sync's surgical per-card updates
  openPetLifecyclePreview,
  iconHTML,                       // exposed so app.js/animations.js toasts can use Lucide too
};
})();
