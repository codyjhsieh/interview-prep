/* =========================================================================
 * infographics.js — Generates SVG infographics on the fly and provides
 * one-click download (SVG and PNG).
 * ========================================================================= */

window.INFOG = (function () {

const palette = {
  bg: '#0B0F1A',
  panel: '#11172A',
  border: '#252E4D',
  fg: '#E2E8F0',
  muted: '#94A3B8',
  green: '#34D399',
  greenLight: '#7CF1C2',
  violet: '#8B5CF6',
  warm: '#FF9D2E',
  rose: '#FB7185',
  sky: '#60A5FA',
};

function svgWrap(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Inter, system-ui, sans-serif">
  <defs>
    <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0F1A"/>
      <stop offset="100%" stop-color="#070912"/>
    </linearGradient>
    <linearGradient id="gv" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.greenLight}"/>
      <stop offset="100%" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.warm}"/>
      <stop offset="100%" stop-color="${palette.rose}"/>
    </linearGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bgg)"/>
  ${inner}
  <text x="${w-16}" y="${h-14}" text-anchor="end" font-size="11" fill="${palette.muted}">FDE/SDE 2026 · interview-prep platform</text>
</svg>`;
}

/* ---------- Individual generators ---------- */
function gen_roadmap() {
  const W=1100, H=760;
  const phases = [
    { name:'Phase 1 · Foundations', weeks:'Wk 1–3', items:['Coding (BFS, hash, DP)','SQL fluency','Behavioral story bank','1 system design / week'] },
    { name:'Phase 2 · FDE-Specific', weeks:'Wk 4–6', items:['Decomposition drills','Client simulation','RAG + evals','Cloud integration patterns'] },
    { name:'Phase 3 · Mock Loops', weeks:'Wk 7–9', items:['2 mocks / week','Record + review','Per-company deep-dive','Refine STAR stories'] },
    { name:'Phase 4 · Closing',    weeks:'Wk 10–12',items:['3 mocks / week','Negotiation prep','Pipeline cluster apply','Deload last 3 days'] },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">2026 FDE/SDE Prep Roadmap</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">12 weeks · phased focus · habit-first</text>`);
  // Timeline arc
  const top=170, h=90, gap=18, baseW=(W-80-gap*3)/4;
  phases.forEach((p,i) => {
    const x = 40 + i*(baseW+gap);
    inner.push(`<rect x="${x}" y="${top}" width="${baseW}" height="${440}" rx="20" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<text x="${x+22}" y="${top+34}" font-size="13" fill="${palette.greenLight}" font-weight="600">${p.weeks}</text>`);
    inner.push(`<text x="${x+22}" y="${top+62}" font-size="18" fill="${palette.fg}" font-weight="700">${p.name}</text>`);
    p.items.forEach((it,j) => {
      inner.push(`<circle cx="${x+30}" cy="${top+105+j*38}" r="5" fill="url(#gv)"/>`);
      inner.push(`<text x="${x+44}" y="${top+109+j*38}" font-size="13" fill="${palette.fg}">${escapeXml(it)}</text>`);
    });
  });
  // Connector
  inner.push(`<line x1="60" y1="${top+h/2}" x2="${W-60}" y2="${top+h/2}" stroke="url(#gv)" stroke-width="3" opacity="0.35"/>`);
  inner.push(`<text x="40" y="${H-60}" font-size="13" fill="${palette.muted}">Tip — schedule one anchor study block per day. Implementation intentions beat motivation.</text>`);
  return svgWrap(W,H,inner.join('\n'));
}

function gen_decomp5() {
  const W=1100, H=720;
  const steps = [
    { n:'1', t:'Clarify',      d:'Success metric? End user? Data shape? Constraints (budget, time, compliance)?' },
    { n:'2', t:'Stakeholders', d:'Map who buys, who uses, who blocks. Different incentives → different success metrics.' },
    { n:'3', t:'Data',         d:'What sources exist? Quality? Freshness? Where does data leave the customer?' },
    { n:'4', t:'Tradeoffs',    d:'Cost ↔ latency ↔ accuracy ↔ explainability. Name what you give up.' },
    { n:'5', t:'Failure modes',d:'What breaks first? How do you detect it? What\'s the rollback?' },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">Decomposition · 5-Step Framework</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">The Palantir-pioneered FDE case-study spine. Stay in Step 1 longer than feels comfortable.</text>`);
  steps.forEach((s,i) => {
    const y = 140 + i*108;
    inner.push(`<rect x="40" y="${y}" width="${W-80}" height="92" rx="16" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<circle cx="92" cy="${y+46}" r="28" fill="url(#gv)"/>`);
    inner.push(`<text x="92" y="${y+54}" text-anchor="middle" font-size="22" font-weight="700" fill="#07090F">${s.n}</text>`);
    inner.push(`<text x="140" y="${y+38}" font-size="20" font-weight="700" fill="${palette.fg}">${s.t}</text>`);
    inner.push(`<text x="140" y="${y+66}" font-size="14" fill="${palette.muted}">${escapeXml(s.d)}</text>`);
  });
  return svgWrap(W,H,inner.join('\n'));
}

function gen_rag() {
  const W=1100, H=580;
  const steps = ['Ingest','Chunk','Embed','Retrieve','Re-rank','Generate'];
  const defaults = ['PDF/MD/HTML','Recursive + overlap','BGE / OpenAI / Cohere','Hybrid (BM25+vector)','Cross-encoder','Temp 0 · cite'];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">RAG · Production Reference</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">Sources: Anthropic Engineering, DataCamp LLM Q&amp;A 2026, Sundeep Teki guides.</text>`);
  const boxW=(W-80-(steps.length-1)*16)/steps.length;
  steps.forEach((s,i) => {
    const x = 40 + i*(boxW+16);
    inner.push(`<rect x="${x}" y="160" width="${boxW}" height="120" rx="14" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<text x="${x+boxW/2}" y="200" text-anchor="middle" font-size="18" font-weight="700" fill="${palette.greenLight}">${s}</text>`);
    inner.push(`<text x="${x+boxW/2}" y="235" text-anchor="middle" font-size="12" fill="${palette.muted}">default:</text>`);
    inner.push(`<text x="${x+boxW/2}" y="255" text-anchor="middle" font-size="13" fill="${palette.fg}">${escapeXml(defaults[i])}</text>`);
    if (i < steps.length-1) {
      const ax = x + boxW + 2, ay = 220;
      inner.push(`<path d="M ${ax} ${ay} l 10 0 l -3 -4 m 3 4 l -3 4" stroke="${palette.greenLight}" stroke-width="2" fill="none"/>`);
    }
  });
  // Eval layer
  inner.push(`<rect x="40" y="320" width="${W-80}" height="120" rx="14" fill="${palette.panel}" stroke="${palette.border}"/>`);
  inner.push(`<text x="60" y="356" font-size="18" font-weight="700" fill="${palette.warm}">Evaluation (always on)</text>`);
  inner.push(`<text x="60" y="384" font-size="13" fill="${palette.fg}">Unit: schema/regex/length/refusal  ·  System: golden Q→A set with LLM-as-judge + human spot-check  ·  Production: thumbs / escalation / regret</text>`);
  inner.push(`<text x="60" y="410" font-size="13" fill="${palette.muted}">Tools: RAGAS · DeepEval · Braintrust · HoneyHive · LangSmith</text>`);
  inner.push(`<text x="40" y="500" font-size="13" fill="${palette.muted}">Decision tree — Default prompt → if facts change, RAG → only if a NEW skill/style is needed, fine-tune. Cost climbs each step.</text>`);
  return svgWrap(W,H,inner.join('\n'));
}

function gen_star() {
  const W=1000, H=560;
  const segs = [
    { t:'Situation', w:'2-3 sentences MAX', col:palette.sky,    pct:15 },
    { t:'Task',      w:'Clarify YOUR ownership', col:palette.warm, pct:15 },
    { t:'Action',    w:'~60% of the story — be specific (technical + interpersonal)', col:palette.greenLight, pct:55 },
    { t:'Result',    w:'Technical outcome AND quantified business impact', col:palette.violet, pct:15 },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">STAR for FDE — Action-Weighted</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">Sourced from corroborated 2026 FDE candidate reports.</text>`);
  let x=40;
  const totalW = W-80;
  segs.forEach(s => {
    const w = totalW * s.pct/100;
    inner.push(`<rect x="${x}" y="150" width="${w}" height="60" fill="${s.col}" opacity="0.85"/>`);
    inner.push(`<text x="${x+w/2}" y="186" text-anchor="middle" font-size="16" font-weight="700" fill="#07090F">${s.t} · ${s.pct}%</text>`);
    x += w;
  });
  // Detail blocks
  segs.forEach((s,i) => {
    const y = 250 + i*64;
    inner.push(`<rect x="40" y="${y}" width="${W-80}" height="52" rx="12" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<text x="60" y="${y+24}" font-size="15" font-weight="700" fill="${s.col}">${s.t}</text>`);
    inner.push(`<text x="60" y="${y+44}" font-size="13" fill="${palette.fg}">${escapeXml(s.w)}</text>`);
  });
  return svgWrap(W,H,inner.join('\n'));
}

function gen_ado() {
  const W=1000, H=620;
  const blocks = [
    { t:'Acknowledge', c:palette.sky,
      do:['"I hear you — this is blocking your team."','Name the customer\'s emotion + impact'],
      dont:['Defensiveness','Excuses','Blaming the customer\'s environment'] },
    { t:'Diagnose',    c:palette.warm,
      do:['Investigate visibly','Tell the customer what you\'re checking','Ask one targeted clarifying question'],
      dont:['Disappear into Slack','Stall in silence','Guess at root cause'] },
    { t:'Own',         c:palette.greenLight,
      do:['Commit to a status time','Name what you\'ll deliver','Document next steps in writing'],
      dont:['Vague timelines','"I\'ll get back to you sometime"','Pass to another team without intro'] },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">Client Simulation · ADO</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">Acknowledge → Diagnose → Own. The roleplay round expects this exact sequence.</text>`);
  const colW = (W-80-24)/3;
  blocks.forEach((b,i) => {
    const x = 40 + i*(colW+12);
    inner.push(`<rect x="${x}" y="140" width="${colW}" height="430" rx="16" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<rect x="${x}" y="140" width="${colW}" height="6" fill="${b.c}"/>`);
    inner.push(`<text x="${x+20}" y="180" font-size="20" font-weight="700" fill="${b.c}">${b.t}</text>`);
    inner.push(`<text x="${x+20}" y="218" font-size="13" font-weight="700" fill="${palette.greenLight}">DO</text>`);
    b.do.forEach((d,j) => {
      inner.push(`<text x="${x+20}" y="${244+j*22}" font-size="12" fill="${palette.fg}">• ${escapeXml(d)}</text>`);
    });
    const dontY = 244 + b.do.length*22 + 26;
    inner.push(`<text x="${x+20}" y="${dontY}" font-size="13" font-weight="700" fill="${palette.rose}">DON'T</text>`);
    b.dont.forEach((d,j) => {
      inner.push(`<text x="${x+20}" y="${dontY+26+j*22}" font-size="12" fill="${palette.fg}">• ${escapeXml(d)}</text>`);
    });
  });
  return svgWrap(W,H,inner.join('\n'));
}

function gen_systemd() {
  const W=1000, H=560;
  const steps = [
    { t:'1. Requirements',  d:'Functional (what it does) + non-functional (QPS, latency, durability, RPO/RTO).' },
    { t:'2. Estimate',       d:'Back-of-envelope: users × actions × bytes. Pick a unit & be consistent.' },
    { t:'3. Boxes',          d:'API → service → cache → DB → queue → worker. Start simple; add only what you need.' },
    { t:'4. Deep-dive',      d:'Pick the hardest subproblem (hot key? consistency? backpressure?). Show tradeoffs.' },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">System Design · 4-Step Frame</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">Universal across SDE rounds; FDE rounds wrap a customer constraint around step 1.</text>`);
  steps.forEach((s,i) => {
    const y = 150 + i*92;
    inner.push(`<rect x="40" y="${y}" width="${W-80}" height="76" rx="14" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<text x="60" y="${y+32}" font-size="18" font-weight="700" fill="${palette.greenLight}">${s.t}</text>`);
    inner.push(`<text x="60" y="${y+58}" font-size="14" fill="${palette.fg}">${escapeXml(s.d)}</text>`);
  });
  return svgWrap(W,H,inner.join('\n'));
}

function gen_verticals() {
  const W=1100, H=700;
  const verts = [
    { t:'AI-first',    c:palette.warm,       k:['RAG/evals/agents','Latency-aware','Production AI track record','Cost intuition','Non-determinism comfort'] },
    { t:'Hospitality', c:palette.rose,       k:['SQL fluency','Reservation/POS data','Customer-facing dashboards','Time-zone correctness','Operator empathy'] },
    { t:'Marketplace', c:palette.sky,        k:['Two-sided liquidity','Matching algorithms','Pricing/surge','Trust + disputes','Cold-start playbook'] },
    { t:'DevTools',    c:palette.greenLight, k:['Latency obsession','API/CLI DX','Enterprise security','Integration breadth','Doc-first culture'] },
    { t:'Fintech',     c:palette.violet,     k:['Double-entry ledger','PCI scope','KYC/KYB','Idempotent writes','Dispute lifecycle'] },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">What Each Vertical Actually Tests</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">Match your prep weight to the company\'s vertical — generic prep loses.</text>`);
  const colW = (W-80-(verts.length-1)*12)/verts.length;
  verts.forEach((v,i) => {
    const x = 40 + i*(colW+12);
    inner.push(`<rect x="${x}" y="140" width="${colW}" height="500" rx="14" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<rect x="${x}" y="140" width="${colW}" height="6" fill="${v.c}"/>`);
    inner.push(`<text x="${x+18}" y="180" font-size="18" font-weight="700" fill="${v.c}">${v.t}</text>`);
    v.k.forEach((k,j) => {
      inner.push(`<text x="${x+18}" y="${220+j*36}" font-size="13" fill="${palette.fg}">• ${escapeXml(k)}</text>`);
    });
  });
  return svgWrap(W,H,inner.join('\n'));
}

function gen_eval() {
  const W=1000, H=560;
  const layers = [
    { t:'Unit',       d:'Deterministic checks: JSON schema, regex, length bounds, refusal tags, profanity.', col:palette.sky },
    { t:'System',     d:'Task-specific golden sets (50–200 Q→A pairs). LLM-as-judge with rubric + human spot-check.', col:palette.warm },
    { t:'Production', d:'Online metrics: user thumbs, escalation rate, regret, latency, $/req. Auto-alerts on drift.', col:palette.greenLight },
  ];
  const inner = [];
  inner.push(`<text x="40" y="60" font-size="28" font-weight="700" fill="${palette.fg}">LLM Eval Stack — 3 Layers</text>`);
  inner.push(`<text x="40" y="92" font-size="14" fill="${palette.muted}">If you can\'t answer "how do you know your AI works?" you can\'t pass an AI-FDE interview.</text>`);
  layers.forEach((l,i) => {
    const y = 150 + i*130;
    inner.push(`<rect x="40" y="${y}" width="${W-80}" height="110" rx="16" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<circle cx="92" cy="${y+55}" r="26" fill="${l.col}" opacity="0.85"/>`);
    inner.push(`<text x="92" y="${y+62}" text-anchor="middle" font-size="20" font-weight="700" fill="#07090F">${i+1}</text>`);
    inner.push(`<text x="140" y="${y+40}" font-size="20" font-weight="700" fill="${l.col}">${l.t}</text>`);
    inner.push(`<text x="140" y="${y+72}" font-size="13" fill="${palette.fg}">${escapeXml(l.d)}</text>`);
  });
  return svgWrap(W,H,inner.join('\n'));
}

/* ----- Per-category cheatsheet generator ----- */
function gen_category(catId) {
  const cats = window.DATA.CATEGORIES;
  const mods = window.DATA.MODULES.filter(m => m.cat === catId);
  const cat  = cats.find(c => c.id === catId);
  if (!cat) return svgWrap(900, 500, `<text x="40" y="60" fill="${palette.fg}">Unknown category</text>`);
  // Top 8 lessons by XP (approximation of "most central")
  const lessons = mods.flatMap(m => m.lessons.map(l => ({ ...l, modName: m.name })))
    .sort((a,b) => b.xp - a.xp)
    .slice(0, 10);
  const W = 1100, H = 80 + 60 + lessons.length * 56 + 70;
  const inner = [];
  inner.push(`<text x="40" y="56" font-size="28" font-weight="700" fill="${palette.fg}">${escapeXml(cat.name)} · cheatsheet</text>`);
  inner.push(`<text x="40" y="86" font-size="14" fill="${palette.muted}">${escapeXml(cat.blurb)}</text>`);
  inner.push(`<text x="40" y="112" font-size="12" fill="${palette.greenLight}">Weight in 2026 FDE/SDE rounds: ${cat.weight}%  ·  ${mods.length} modules  ·  ${mods.flatMap(m => m.lessons).length} lessons</text>`);
  let y = 150;
  lessons.forEach((l, i) => {
    inner.push(`<rect x="40" y="${y}" width="${W-80}" height="46" rx="10" fill="${palette.panel}" stroke="${palette.border}"/>`);
    inner.push(`<text x="60" y="${y+22}" font-size="13" fill="${palette.greenLight}" font-weight="600">${i+1}. ${escapeXml(l.name)}</text>`);
    inner.push(`<text x="60" y="${y+40}" font-size="11" fill="${palette.muted}">${escapeXml(l.modName)} · ${l.time} min · +${l.xp} XP · ${l.type}</text>`);
    y += 56;
  });
  inner.push(`<text x="40" y="${H-30}" font-size="11" fill="${palette.muted}">FDE/SDE 2026 prep platform · category cheatsheet for ${escapeXml(cat.name)}</text>`);
  return svgWrap(W, H, inner.join('\n'));
}

const GENERATORS = {
  roadmap:   gen_roadmap,
  decomp5:   gen_decomp5,
  rag:       gen_rag,
  star:      gen_star,
  ado:       gen_ado,
  systemd:   gen_systemd,
  verticals: gen_verticals,
  eval:      gen_eval,
};
// Register per-category cheatsheets dynamically
(function(){
  const cats = window.DATA?.CATEGORIES || [];
  cats.forEach(c => {
    GENERATORS['cat-' + c.id] = () => gen_category(c.id);
  });
})();

function escapeXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------- Downloads ---------- */
function downloadSVG(id, filename) {
  const gen = GENERATORS[id];
  if (!gen) return;
  const svg = gen();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (filename || id) + '.svg'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadPNG(id, filename, scale=2) {
  const gen = GENERATORS[id];
  if (!gen) return;
  const svg = gen();
  // Parse W/H from viewBox
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = m ? parseInt(m[1],10) : 1000;
  const h = m ? parseInt(m[2],10) : 600;
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = (filename || id) + '.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
    }, 'image/png');
  };
  img.src = url;
}

function previewHTML(id) {
  const gen = GENERATORS[id];
  if (!gen) return '<div class="text-slate-500">No preview.</div>';
  return gen();
}

return { GENERATORS, downloadSVG, downloadPNG, previewHTML };
})();
