/* =========================================================================
 * games.js — Interactive mini-games and per-lesson interactions.
 *
 * Each game exports a `mount(container, state, opts)` that takes over
 * the container and returns a `dispose()` for cleanup.
 *
 * Games:
 *  - quiz:     timed 10-Q multiple choice with explanation reveals
 *  - bfs:      grid BFS visualizer (click to place walls, animate frontier)
 *  - lru:      LRU cache step-through simulator
 *  - decomp:   60-min decomposition timer with milestone hints
 *  - roleplay: branching client-simulation chat
 *
 * Per-lesson interactivity also lives here in `mountLessonInteraction`.
 * ========================================================================= */

window.GAMES = (function () {

const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ====================================================================== */
/* QUIZ                                                                   */
/* ====================================================================== */
function mountQuiz(container, state, opts={}) {
  // opts.questions overrides the bank (category-quiz mode); otherwise use the global bank
  const all = opts.questions || DATA.QUIZ_QUESTIONS;
  const N = Math.min(opts.size || 10, all.length);
  const order = shuffle([...all]).slice(0, N).map((q, i) => ({ ...q, _picked: null, _idx: i }));
  let cur = 0;
  let score = 0;
  // 20 seconds per question — enough to read + think, tight enough to be a quiz.
  // For 10 questions = 200s = 3.3 min total budget. Untimed mode if opts.untimed.
  const SECONDS_PER_Q = opts.untimed ? Infinity : (opts.secondsPerQ || 20);
  let timeLeft = SECONDS_PER_Q === Infinity ? Infinity : SECONDS_PER_Q * N;
  let timerId = null;
  let disposed = false;

  function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr;
  }

  function render() {
    if (disposed) return;
    const q = order[cur];
    const timeLabel = timeLeft === Infinity ? '∞' :
      (timeLeft >= 60 ? Math.floor(timeLeft/60) + ':' + String(timeLeft%60).padStart(2,'0') : timeLeft + 's');
    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <div class="text-xs muted">Question ${cur+1} / ${N} · <span style="color:var(--warn)" class="numeric">${timeLabel}</span></div>
          <div class="text-xs numeric">Score <span style="color:var(--accent)">${score}</span></div>
        </div>
        <div class="bar"><i style="width:${((cur)/N*100).toFixed(0)}%"></i></div>
        <div class="card elevated">
          <div class="text-xs muted mb-2 uppercase tracking-wider">${esc(q.cat)}</div>
          <div class="font-medium text-[17px] leading-snug mb-4">${esc(q.q)}</div>
          <div class="grid gap-2" id="qopts">
            ${q.options.map((o,i) => `
              <button class="btn justify-start text-left !py-2.5 w-full" data-pick="${i}">
                <span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}
              </button>
            `).join('')}
          </div>
          <div id="qfeedback" class="mt-4 hidden"></div>
        </div>
      </div>
    `;
    container.querySelectorAll('[data-pick]').forEach(b => {
      b.addEventListener('click', () => pick(parseInt(b.dataset.pick, 10), b));
    });
  }
  function pick(i, btn) {
    const q = order[cur];
    if (q._picked !== null) return;
    q._picked = i;
    const isRight = i === q.correct;
    if (isRight) {
      score += 10;
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
      ANIM.confettiBurst('s');
    } else {
      btn.style.borderColor = 'var(--bad)';
      btn.style.color = 'var(--bad)';
      ANIM.shake(btn);
      const rightBtn = container.querySelector(`[data-pick="${q.correct}"]`);
      if (rightBtn) { rightBtn.style.borderColor = 'var(--accent)'; rightBtn.style.color = 'var(--accent)'; }
    }
    container.querySelectorAll('[data-pick]').forEach(b => b.disabled = true);
    const fb = container.querySelector('#qfeedback');
    fb.classList.remove('hidden');
    fb.innerHTML = `
      <div class="text-[13px] leading-relaxed" style="color:${isRight?'var(--accent)':'var(--bad)'}">${isRight?'✓ Correct.':'✗ '+esc(q.options[q.correct])+' was the right answer.'}</div>
      <div class="text-[13px] muted mt-2 leading-relaxed">${esc(q.explain)}</div>
      <div class="mt-3 text-right">
        <button class="btn btn-primary" id="qnext">${cur+1<N?'Next →':'See results →'}</button>
      </div>
    `;
    fb.querySelector('#qnext').addEventListener('click', () => {
      cur++;
      if (cur >= N) finish();
      else render();
    });
  }
  function finish() {
    clearInterval(timerId);
    container.innerHTML = `
      <div class="card elevated text-center py-10">
        <div class="text-xs uppercase tracking-wider muted mb-2">Quiz complete</div>
        <div class="text-5xl font-display font-bold mb-1" style="color:var(--accent)">${score}</div>
        <div class="muted text-sm mb-4">${N*10} possible</div>
        <div class="bar mb-6 max-w-xs mx-auto"><i style="width:${score/(N*10)*100}%"></i></div>
        <button class="btn btn-primary" id="again">Run another</button>
      </div>
    `;
    container.querySelector('#again').addEventListener('click', () => mountQuiz(container, state, opts));
    const xpEarned = Math.round(score * 0.6 + (timeLeft > 0 ? 20 : 0));
    const r = GAMI.awardXP(state, xpEarned, 'quiz');
    GAMI.bumpQuestProgress(state, 'coding');
    APP.afterStateChange();
    ANIM.confettiBurst('m');
    ANIM.toast({ icon: VIEWS.iconHTML('zap', {size: 18}), title:`+${r.xpGained} XP${r.bonusLabel||''}`, body:`${score}/${N*10} on Lightning Quiz` });
  }

  if (timeLeft !== Infinity) {
    timerId = setInterval(() => {
      if (disposed) { clearInterval(timerId); return; }
      timeLeft--;
      const q = order[cur];
      if (q && q._picked === null) {
        const headWrap = container.querySelector('.text-xs.muted');
        const label = timeLeft >= 60 ? Math.floor(timeLeft/60) + ':' + String(timeLeft%60).padStart(2,'0') : timeLeft + 's';
        if (headWrap) headWrap.innerHTML = `Question ${cur+1} / ${N} · <span style="color:${timeLeft<10?'var(--bad)':'var(--warn)'}" class="numeric">${label}</span>`;
      }
      if (timeLeft <= 0) { clearInterval(timerId); finish(); }
    }, 1000);
  }

  render();
  return { dispose: () => { disposed = true; clearInterval(timerId); } };
}

/* ====================================================================== */
/* BFS VISUALIZER                                                          */
/* ====================================================================== */
function mountBFS(container, state) {
  const ROWS = 14, COLS = 24;
  let grid = Array.from({length:ROWS}, () => Array(COLS).fill(0)); // 0=empty 1=wall
  let start = [1,1], end = [ROWS-2, COLS-2];
  let mode = 'wall'; // 'wall'|'start'|'end'
  let running = false;
  let raf = null;

  function render() {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div class="font-display font-semibold text-lg">BFS visualizer</div>
            <div class="text-xs muted">Click cells to place walls. Drag to draw fast. Then run.</div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn ${mode==='wall'?'btn-primary':''}" data-mode="wall">Walls</button>
            <button class="btn ${mode==='start'?'btn-primary':''}" data-mode="start">Set start</button>
            <button class="btn ${mode==='end'?'btn-primary':''}" data-mode="end">Set end</button>
            <button class="btn" id="clear">Clear</button>
            <button class="btn btn-primary" id="run">Run BFS</button>
          </div>
        </div>
        <div class="overflow-x-auto -mx-3 sm:mx-0 pb-2">
          <div id="grid" class="inline-grid border border-[color:var(--border)] rounded-md p-1 mx-3 sm:mx-0" style="grid-template-columns: repeat(${COLS}, 22px); gap:1px;"></div>
        </div>
        <div id="bfs-status" class="text-xs muted">Ready.</div>
        <div class="text-[12.5px] muted leading-relaxed">
          BFS expands the frontier one level at a time. Path length = level count.
          <a href="https://en.wikipedia.org/wiki/Breadth-first_search" target="_blank" rel="noopener" class="underline">Canonical reference on Wikipedia ↗</a>
        </div>
      </div>
    `;
    const g = container.querySelector('#grid');
    let mouseDown = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.r = r; cell.dataset.c = c;
        applyState(cell, r, c);
        cell.addEventListener('mousedown', e => { mouseDown = true; toggle(r,c); });
        cell.addEventListener('mouseenter', e => { if (mouseDown) toggle(r,c); });
        cell.addEventListener('mouseup', () => mouseDown = false);
        g.appendChild(cell);
      }
    }
    document.addEventListener('mouseup', () => mouseDown = false, { once: true });
    container.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
    container.querySelector('#clear').addEventListener('click', () => {
      grid = Array.from({length:ROWS}, () => Array(COLS).fill(0));
      render();
    });
    container.querySelector('#run').addEventListener('click', () => {
      if (running) return;
      runBFS();
    });
  }
  function applyState(cell, r, c) {
    cell.className = 'grid-cell';
    if (grid[r][c] === 1) cell.classList.add('wall');
    if (r===start[0] && c===start[1]) cell.classList.add('start');
    if (r===end[0] && c===end[1]) cell.classList.add('end');
  }
  function toggle(r,c) {
    if (running) return;
    if (mode === 'wall')  {
      if (r===start[0] && c===start[1]) return;
      if (r===end[0] && c===end[1]) return;
      grid[r][c] = grid[r][c]?0:1;
    } else if (mode === 'start') { start = [r,c]; if (grid[r][c]===1) grid[r][c]=0; }
    else if (mode === 'end')     { end   = [r,c]; if (grid[r][c]===1) grid[r][c]=0; }
    const cell = container.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    container.querySelectorAll('.grid-cell').forEach(c2 => {
      applyState(c2, parseInt(c2.dataset.r,10), parseInt(c2.dataset.c,10));
    });
  }
  async function runBFS() {
    running = true;
    const status = container.querySelector('#bfs-status');
    const visited = Array.from({length:ROWS}, () => Array(COLS).fill(false));
    const parent = Array.from({length:ROWS}, () => Array(COLS).fill(null));
    const q = [[...start]];
    visited[start[0]][start[1]] = true;
    let levels = 0, expanded = 0;
    const startTs = Date.now();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (q.length) {
      const size = q.length;
      levels++;
      for (let i = 0; i < size; i++) {
        const [r,c] = q.shift();
        expanded++;
        if (r===end[0] && c===end[1]) {
          // reconstruct
          let cur = [r,c], path = [cur];
          while (parent[cur[0]][cur[1]]) { cur = parent[cur[0]][cur[1]]; path.push(cur); }
          path.reverse();
          path.forEach(([pr,pc]) => {
            const cell = container.querySelector(`[data-r="${pr}"][data-c="${pc}"]`);
            if (cell) {
              cell.classList.remove('visited','frontier'); cell.classList.add('path');
              if (pr===start[0]&&pc===start[1]) cell.classList.add('start');
              if (pr===end[0]&&pc===end[1]) cell.classList.add('end');
            }
          });
          status.innerHTML = `<span style="color:var(--accent)">Found path</span> · length ${path.length-1} · ${expanded} expanded · ${Math.round((Date.now()-startTs))}ms`;
          const r2 = GAMI.awardXP(state, 35, 'bfs');
          GAMI.bumpQuestProgress(state, 'coding');
          APP.afterStateChange();
          ANIM.confettiBurst('s');
          ANIM.toast({ icon:'🛣️', title:`+${r2.xpGained} XP`, body:'Path found via BFS' });
          running = false;
          return;
        }
        if (!(r===start[0]&&c===start[1])) {
          const cell = container.querySelector(`[data-r="${r}"][data-c="${c}"]`);
          cell?.classList.add('visited');
        }
        for (const [dr,dc] of dirs) {
          const nr=r+dr, nc=c+dc;
          if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
          if (visited[nr][nc] || grid[nr][nc]===1) continue;
          visited[nr][nc] = true; parent[nr][nc] = [r,c];
          q.push([nr,nc]);
          const cell = container.querySelector(`[data-r="${nr}"][data-c="${nc}"]`);
          cell?.classList.add('frontier');
        }
      }
      status.innerHTML = `Level <span style="color:var(--warn)" class="numeric">${levels}</span> · ${expanded} expanded`;
      await new Promise(r => setTimeout(r, 28));
    }
    status.innerHTML = `<span style="color:var(--bad)">No path.</span> Walls fully enclose the end node.`;
    running = false;
  }

  render();
  return { dispose: () => { cancelAnimationFrame(raf); } };
}

/* ====================================================================== */
/* LRU CACHE SIMULATOR                                                     */
/* ====================================================================== */
function mountLRU(container, state) {
  let cap = 4;
  let cache = []; // [[key, val], ...] head=most recent
  let history = [];
  const defaultOps = 'put 1 A; put 2 B; put 3 C; get 1; put 4 D; put 5 E; get 2; get 3; put 6 F';
  let opsInput = defaultOps;

  function render() {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div class="font-display font-semibold text-lg">LRU cache simulator</div>
            <div class="text-xs muted">Run ops on a fixed-capacity LRU. Most recent on left; tail gets evicted.</div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <label class="muted">Capacity</label>
            <input type="number" min="1" max="10" value="${cap}" id="cap" class="!w-16 numeric"/>
            <button class="btn btn-primary" id="run">Step run</button>
            <button class="btn" id="reset">Reset</button>
          </div>
        </div>
        <textarea id="ops" rows="2" class="w-full" placeholder="put key value; get key; ...">${opsInput}</textarea>
        <div>
          <div class="text-xs muted mb-2">Cache (head ← tail)</div>
          <div id="cache" class="flex gap-2 flex-wrap min-h-[60px]"></div>
        </div>
        <div>
          <div class="text-xs muted mb-2">History</div>
          <div id="history" class="font-mono text-[12.5px] muted space-y-1 max-h-44 overflow-y-auto"></div>
        </div>
        <div class="text-[12.5px] muted leading-relaxed">
          Production LRU = hash map (key→node) + doubly-linked list. O(1) get/put.
          <a href="https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)" target="_blank" rel="noopener" class="underline">Reference ↗</a>
        </div>
      </div>
    `;
    paintCache();
    container.querySelector('#cap').addEventListener('change', e => { cap = Math.max(1, parseInt(e.target.value,10) || 4); cache=[]; history=[]; paintCache(); paintHistory(); });
    container.querySelector('#ops').addEventListener('input', e => { opsInput = e.target.value; });
    container.querySelector('#reset').addEventListener('click', () => { cache=[]; history=[]; paintCache(); paintHistory(); });
    container.querySelector('#run').addEventListener('click', stepRun);
  }
  function paintCache() {
    const wrap = container.querySelector('#cache');
    if (!wrap) return;
    wrap.innerHTML = cache.map(([k,v]) => `<div class="cache-slot"><div class="text-xs muted">k=${esc(k)}</div><div class="text-base">${esc(v)}</div></div>`).join('') || '<div class="text-xs dim">(empty)</div>';
  }
  function paintHistory() {
    const wrap = container.querySelector('#history');
    if (!wrap) return;
    wrap.innerHTML = history.map(h => `<div>${h}</div>`).reverse().join('');
  }
  async function stepRun() {
    const ops = opsInput.split(';').map(s => s.trim()).filter(Boolean);
    for (const op of ops) {
      const parts = op.split(/\s+/);
      const cmd = parts[0]?.toLowerCase();
      const k = parts[1];
      const v = parts[2];
      if (cmd === 'get') {
        const idx = cache.findIndex(([kk]) => kk === k);
        if (idx === -1) {
          history.push(`get ${k} → <span style="color:var(--bad)">MISS</span>`);
          flash('miss');
        } else {
          const item = cache.splice(idx,1)[0];
          cache.unshift(item);
          history.push(`get ${k} → <span style="color:var(--accent)">HIT (${esc(item[1])})</span>`);
          flash('hit');
        }
      } else if (cmd === 'put') {
        const idx = cache.findIndex(([kk]) => kk === k);
        if (idx !== -1) cache.splice(idx, 1);
        cache.unshift([k, v ?? '']);
        let evicted = null;
        if (cache.length > cap) evicted = cache.pop();
        history.push(`put ${k}=${esc(v ?? '')}${evicted ? ` · <span style="color:var(--bad)">evict ${esc(evicted[0])}</span>`:''}`);
        flash(evicted ? 'miss' : 'hit');
      } else {
        history.push(`<span style="color:var(--bad)">skip:</span> ${esc(op)}`);
      }
      paintCache(); paintHistory();
      await new Promise(r => setTimeout(r, 350));
    }
    const r = GAMI.awardXP(state, 35, 'lru');
    GAMI.bumpQuestProgress(state, 'coding');
    APP.afterStateChange();
    ANIM.toast({ icon:'🧮', title:`+${r.xpGained} XP`, body:'LRU simulator complete' });
  }
  function flash(kind) {
    const c = container.querySelector('#cache .cache-slot');
    if (!c) return;
    c.classList.add(kind);
    setTimeout(() => c.classList.remove(kind), 400);
  }

  render();
  return { dispose: () => {} };
}

/* ====================================================================== */
/* DECOMPOSITION TIMER                                                     */
/* ====================================================================== */
function mountDecomp(container, state) {
  const prompts = [
    'A city wants to reduce 911 response times. They have 911 call data, traffic data, and ambulance GPS. 60 minutes. Go.',
    'A logistics firm wants an AI agent for shipment rerouting. SAP data, weather APIs, 500 warehouse managers. Build the eval suite.',
    'A 15-year-old on-prem ERP has no API. Customer needs daily reconciliation with a modern OLAP warehouse. Scope this.',
    'A hospital deploys our platform; 90 days in, adoption is 12%. Client blames the product. Diagnose.',
    'A B2B customer-support bot leaks PII into chat history sometimes. Production fix this week.',
  ];
  let prompt = prompts[Math.floor(Math.random()*prompts.length)];
  let total = 60 * 60; // 60 minutes
  let elapsed = 0;
  let running = false;
  let timerId = null;
  let checks = {
    success:false, users:false, data:false, constraints:false, mvp:false, tradeoffs:false, failures:false
  };
  const hints = [
    { at: 60*5,  text:'5 min in. Have you stated the success metric out loud?' },
    { at: 60*12, text:'12 min in. Have you mapped stakeholders (buyer/user/blocker)?' },
    { at: 60*20, text:'20 min in. Name your data sources and their quality.' },
    { at: 60*35, text:'35 min in. Propose your MVP. Resist the urge to add complexity.' },
    { at: 60*48, text:'48 min in. What\'s your top failure mode + rollback plan?' },
  ];
  let firedHints = new Set();

  function fmt(s) { const m = Math.floor(s/60), x = s%60; return `${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`; }

  function render() {
    const pctRemaining = Math.max(0, 1 - elapsed/total);
    const C = 2 * Math.PI * 80;
    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex-1 min-w-0">
            <div class="font-display font-semibold text-lg">Decomposition timer</div>
            <div class="text-xs muted">A 60-min Palantir-style case study. The platform fires reminders if you skip core questions.</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="timer-ring">
              <svg viewBox="0 0 180 180" width="160" height="160">
                <circle cx="90" cy="90" r="80" stroke="var(--border)" stroke-width="6" fill="none"/>
                <circle class="ring-fg" cx="90" cy="90" r="80" stroke="var(--accent)" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(-90 90 90)"
                  stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pctRemaining)}"/>
              </svg>
              <div class="absolute inset-0 grid place-items-center pointer-events-none">
                <div class="text-center">
                  <div class="text-3xl font-display font-bold numeric">${fmt(total-elapsed)}</div>
                  <div class="text-[10px] uppercase tracking-wider muted">remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card elevated">
          <div class="text-xs muted uppercase tracking-wider mb-2">Prompt</div>
          <div class="font-medium leading-relaxed">${esc(prompt)}</div>
          <div class="flex gap-2 mt-4">
            ${running ? '<button class="btn" id="pause">Pause</button>' : '<button class="btn btn-primary" id="start">Start 60-min timer</button>'}
            <button class="btn" id="newprompt">New prompt</button>
            <button class="btn btn-danger" id="end">End now</button>
          </div>
        </div>

        <div class="card">
          <div class="text-xs muted uppercase tracking-wider mb-3">Self-check (tick as you cover)</div>
          <div class="grid sm:grid-cols-2 gap-2 text-sm">
            ${[
              ['success','Stated the success metric'],
              ['users','Identified the end user'],
              ['data','Asked about data shape & quality'],
              ['constraints','Named budget / timeline / compliance'],
              ['mvp','Proposed a phase-1 MVP first'],
              ['tradeoffs','Said "tradeoff" at least twice'],
              ['failures','Named a top failure mode'],
            ].map(([k,label]) => `
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-[color:var(--bg-2)]">
                <input type="checkbox" data-check="${k}" ${checks[k]?'checked':''}/>
                <span class="${checks[k]?'line-through dim':''}">${esc(label)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div id="dh-feed" class="space-y-2"></div>
      </div>
    `;
    container.querySelector('#start')?.addEventListener('click', start);
    container.querySelector('#pause')?.addEventListener('click', pause);
    container.querySelector('#newprompt').addEventListener('click', () => {
      prompt = prompts[Math.floor(Math.random()*prompts.length)];
      render();
    });
    container.querySelector('#end').addEventListener('click', endNow);
    container.querySelectorAll('[data-check]').forEach(cb => {
      cb.addEventListener('change', () => { checks[cb.dataset.check] = cb.checked; render(); });
    });
  }
  function start() {
    running = true;
    timerId = setInterval(() => {
      elapsed++;
      hints.forEach(h => {
        if (!firedHints.has(h.at) && elapsed >= h.at) {
          firedHints.add(h.at);
          fireHint(h.text);
        }
      });
      if (elapsed >= total) endNow();
      else render();
    }, 1000);
    render();
  }
  function pause() {
    running = false;
    clearInterval(timerId);
    render();
  }
  function fireHint(text) {
    ANIM.toast({ icon: VIEWS.iconHTML('lightbulb', {size: 18}), title:'Decomposition cue', body:text });
    const feed = container.querySelector('#dh-feed');
    const node = document.createElement('div');
    node.className = 'card card-warn fade-in-up';
    node.style.borderColor = 'rgba(255,195,107,0.3)';
    node.innerHTML = `<div class="text-xs" style="color:var(--warn)">${esc(text)}</div>`;
    feed?.prepend(node);
  }
  function endNow() {
    running = false; clearInterval(timerId);
    const checked = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const r = GAMI.awardXP(state, 80 + checked * 5, 'decomp');
    GAMI.bumpQuestProgress(state, 'decomp');
    GAMI.bumpQuestProgress(state, 'drill');
    APP.afterStateChange();
    container.innerHTML = `
      <div class="card elevated text-center py-10">
        <div class="text-xs muted uppercase tracking-wider mb-2">Session complete</div>
        <div class="text-3xl font-display font-bold mb-2">${checked}/${total} <span class="muted text-base font-normal">checks</span></div>
        <div class="muted text-sm">+${r.xpGained} XP${r.bonusLabel||''}</div>
        <button class="btn btn-primary mt-5" onclick="location.hash='#games/decomp'; APP.render();">Run again</button>
      </div>
    `;
    ANIM.confettiBurst(checked >= 5 ? 'l' : 'm');
  }

  render();
  return { dispose: () => clearInterval(timerId) };
}

/* ====================================================================== */
/* CLIENT ROLEPLAY                                                         */
/* ====================================================================== */
function mountRoleplay(container, state) {
  const scenario = DATA.ROLEPLAY;
  let nodeId = scenario.start;
  let score = 0;
  let log = [];

  function render() {
    const node = scenario.nodes[nodeId];
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-display font-semibold text-lg">Client roleplay</div>
            <div class="text-xs muted">Pick the best ADO response. Score reflects your framework discipline.</div>
          </div>
          <div class="text-sm">Score <span class="numeric" style="color:var(--accent)">${score}</span></div>
        </div>
        ${log.map(l => `
          <div class="card ${l.score>0?'card-glow':''}">
            <div class="text-xs muted mb-1">${esc(l.label)}</div>
            <div class="text-[13px] mb-2">${esc(l.text)}</div>
            <div class="text-xs" style="color:${l.score>0?'var(--accent)':l.score<0?'var(--bad)':'var(--warn)'}">${l.score>0?'✓':l.score<0?'✗':'~'} ${esc(l.fb)} <span class="muted">(${l.score>0?'+':''}${l.score})</span></div>
          </div>
        `).join('')}
        <div class="card elevated">
          <div class="text-[14px] leading-relaxed">${node.prompt}</div>
          <div class="grid gap-2 mt-4">
            ${node.options.map((o,i) => `<button class="btn justify-start text-left w-full" data-opt="${i}">${esc(o.text)}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    container.querySelectorAll('[data-opt]').forEach(b => {
      b.addEventListener('click', () => pick(parseInt(b.dataset.opt,10)));
    });
  }
  function pick(i) {
    const node = scenario.nodes[nodeId];
    const opt = node.options[i];
    score += opt.score;
    log.push({ label:`You answered:`, text: opt.text, fb: opt.fb, score: opt.score });
    if (opt.next) {
      nodeId = opt.next;
      render();
    } else {
      finish();
    }
  }
  function finish() {
    const r = GAMI.awardXP(state, 50 + Math.max(0,score)*8, 'roleplay');
    GAMI.bumpQuestProgress(state, 'drill');
    APP.afterStateChange();
    container.innerHTML = `
      <div class="card elevated text-center py-10">
        <div class="text-xs muted uppercase tracking-wider mb-2">Roleplay complete</div>
        <div class="text-4xl font-display font-bold mb-2 numeric" style="color:${score>=4?'var(--accent)':score>=2?'var(--warn)':'var(--bad)'}">${score}</div>
        <div class="muted text-sm mb-4">+${r.xpGained} XP${r.bonusLabel||''}</div>
        <div class="text-xs muted">Higher score = tighter ADO discipline.</div>
        <button class="btn btn-primary mt-5" id="redo">Run again</button>
      </div>
    `;
    ANIM.confettiBurst(score>=4?'l':'s');
    container.querySelector('#redo').addEventListener('click', () => { nodeId = scenario.start; score=0; log=[]; render(); });
  }
  render();
  return { dispose: () => {} };
}

/* ====================================================================== */
/* PER-LESSON INTERACTION                                                  */
/* Every lesson gets a structured "Try it" interactive after the body.     */
/* ====================================================================== */
function mountLessonInteraction(container, state, lesson, modContext, opts = {}) {
  const onEngaged = opts.onEngaged || (() => {});
  let alreadyEngaged = false;
  const signalEngagement = () => {
    if (alreadyEngaged) return;
    alreadyEngaged = true;
    onEngaged();
  };

  // Determine interactive widget based on lesson type + content.
  // For drill lessons the body (drill prompt) is shown ABOVE the activity,
  // so we want a separator. For other types the activity comes FIRST and
  // the body is collapsed below, so no separator is needed.
  const wrap = document.createElement('div');
  wrap.className = lesson.type === 'drill'
    ? 'mt-5 pt-5 border-t border-[color:var(--hairline)]'
    : 'mt-5';
  let inner = '';

  // Auto-link to a relevant mini-game
  const linkFor = (() => {
    if (lesson.id?.startsWith('g-') || lesson.id === 'h-3') return 'bfs';
    if (lesson.id === 'h-3') return 'lru';
    if (modContext === 'decomp')   return 'decomp';
    if (modContext === 'client')   return 'roleplay';
    if (lesson.id?.startsWith('rag-') || lesson.id?.startsWith('ev-') || lesson.id?.startsWith('pr-') || lesson.id?.startsWith('ag-')) return 'quiz';
    return null;
  })();

  if (lesson.type === 'concept') {
    // If the lesson defines an `interactive` activity, use it.
    // Otherwise fall back to the self-rate widget.
    if (lesson.interactive) {
      inner = ''; // mountConceptActivity will fill the container
    } else {
      inner = `
        <div class="text-xs muted uppercase tracking-wider mb-2">Self-rate</div>
        <div class="text-[13px] mb-3">How confident are you you could explain this aloud right now?</div>
        <div class="grid grid-cols-4 gap-2">
          <button class="btn" data-rate="1">Shaky</button>
          <button class="btn" data-rate="2">OK</button>
          <button class="btn" data-rate="3">Solid</button>
          <button class="btn btn-primary" data-rate="4">Could teach it</button>
        </div>
        <div id="rate-fb" class="text-xs muted mt-3"></div>
      `;
    }
  } else if (lesson.type === 'question') {
    inner = `
      <div class="text-xs muted uppercase tracking-wider mb-2">Try it first</div>
      <div class="text-[13px] mb-3">Type or speak your answer out loud, then reveal.</div>
      <textarea rows="3" class="w-full" id="answer" placeholder="Your answer (no one sees this — for self-practice)…"></textarea>
      <div class="flex gap-2 mt-3">
        <button class="btn btn-primary" id="reveal">Reveal model answer</button>
        <button class="btn" id="hint">Hint</button>
      </div>
      <div id="reveal-area" class="hidden mt-4 p-3 rounded-md border border-[color:var(--border-2)] bg-[color:var(--bg-2)] text-[13px] leading-relaxed"></div>
    `;
  } else if (lesson.type === 'drill') {
    inner = `
      <div class="text-xs muted uppercase tracking-wider mb-2">Drill (${lesson.time} min)</div>
      <div class="text-[13px] mb-3">${lesson.prompt ? esc(lesson.prompt) : 'Run this drill out loud or in a notebook. Mark complete when done.'}</div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn" id="t-start">Start ${lesson.time}-min timer</button>
        ${linkFor ? `<a class="btn" href="#games/${linkFor}">→ Use full game</a>`:''}
      </div>
      <div id="t-display" class="font-mono text-2xl mt-3 hidden"></div>
    `;
  } else if (lesson.type === 'checklist') {
    inner = `
      <div class="text-xs muted uppercase tracking-wider mb-2">Tick as you confirm</div>
      <div id="cl-items" class="space-y-1 text-[13px]"></div>
    `;
  }

  wrap.innerHTML = inner;
  container.appendChild(wrap);

  // Interactive concept activity (replaces passive paragraph)
  if (lesson.type === 'concept' && lesson.interactive) {
    mountConceptActivity(wrap, lesson, state, { onEngaged: signalEngagement });
    return wrap;
  }

  // Wire up interactions
  if (lesson.type === 'concept') {
    wrap.querySelectorAll('[data-rate]').forEach(b => {
      b.addEventListener('click', () => {
        const v = parseInt(b.dataset.rate,10);
        const fb = wrap.querySelector('#rate-fb');
        const map = {
          1:'Re-read once, then move on — come back tomorrow.',
          2:'Add this to your flashcard rotation.',
          3:'Solid. Move forward; revisit in 1 week.',
          4:'Teach someone the concept this week to lock it in.'
        };
        fb.textContent = map[v];
        signalEngagement();
      });
    });
  } else if (lesson.type === 'question') {
    wrap.querySelector('#reveal').addEventListener('click', () => {
      const r = wrap.querySelector('#reveal-area');
      r.classList.remove('hidden');
      r.innerHTML = `<div class="text-xs muted uppercase tracking-wider mb-2">Model answer</div>${lesson.body}`;
      signalEngagement();
    });
    wrap.querySelector('#hint').addEventListener('click', () => {
      ANIM.toast({ icon: VIEWS.iconHTML('lightbulb', {size: 18}), title:'Hint', body:'Re-read the question. Restate it in your own words before answering.' });
    });
  } else if (lesson.type === 'drill') {
    wrap.querySelector('#t-start')?.addEventListener('click', () => {
      const dEl = wrap.querySelector('#t-display');
      dEl.classList.remove('hidden');
      signalEngagement();  // starting the timer counts as engagement
      let s = lesson.time * 60;
      const t = setInterval(() => {
        s--;
        dEl.textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
        if (s <= 0) {
          clearInterval(t);
          dEl.textContent = '00:00 ✓';
          ANIM.confettiBurst('s');
          ANIM.toast({ icon:'⏱️', title:'Time!', body:'Mark the lesson complete to log XP.' });
        }
      }, 1000);
    });
    // Also allow an "I did the drill (no timer)" explicit gate for users practicing offline
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-ghost text-[12.5px] mt-2';
    skipBtn.textContent = 'I did the drill (offline) ✓';
    skipBtn.addEventListener('click', () => {
      signalEngagement();
      skipBtn.disabled = true;
      skipBtn.textContent = '✓ Engagement recorded';
      skipBtn.style.opacity = '0.6';
    });
    wrap.appendChild(skipBtn);
  } else if (lesson.type === 'checklist') {
    // Auto-parse checklist items from body (look for ☐ markers)
    const items = (lesson.body.match(/☐[^<]+/g) || []).map(s => s.replace(/^☐\s*/,'').trim());
    const c = wrap.querySelector('#cl-items');
    if (items.length) {
      c.innerHTML = items.map((it,i) => `
        <label class="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[color:var(--bg-2)]">
          <input type="checkbox" data-cli="${i}"/>
          <span>${esc(it)}</span>
        </label>
      `).join('');
      // Engagement fires on the first checkbox tick
      c.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => { if (cb.checked) signalEngagement(); });
      });
    } else {
      c.innerHTML = '<div class="text-xs muted">Mark complete below when you\'ve internalized this.</div>';
      // No parsable items — auto-engage so the user isn't stuck
      signalEngagement();
    }
  }
  return wrap;
}

/* ====================================================================== */
/* INTERACTIVE CONCEPT ACTIVITIES                                          */
/* Replaces a passive paragraph with active retrieval practice.            */
/* Types: steps · mcq · truefalse · sort · match · fillblank · decision    */
/* ====================================================================== */
function mountConceptActivity(container, lesson, state, opts = {}) {
  const onEngaged = opts.onEngaged || (() => {});
  const it = lesson.interactive || autoGenerateActivity(lesson);
  const typeLabel = {
    mcq:       'Multiple-choice question',
    truefalse: 'True/false bank',
    sort:      'Sort into order',
    match:     'Match pairs',
    fillblank: 'Fill in the blank',
    decision:  'Decision tree',
    steps:     'Step-by-step walkthrough',
    predict:   'Predict then reveal',
  }[it.type] || 'Activity';

  /* Two-phase layout — generation effect first, then the structured activity.
     Phase A: optional free-recall prompt ("type your answer in your own words")
              — implements the generation effect (Slamecka & Graf), highest-retention
              learning move. User types or skips.
     Phase B: the bespoke interactive (mcq, sort, match, etc.)
     After both: key-insight reveal + optional final-quiz + concept-review self-rate
              (drives SM-2 scheduling for later re-encounter).
  */
  container.innerHTML = `
    <div class="rounded-md p-3 mb-3 flex items-start gap-2" style="background:rgba(14,163,113,0.06); border:1px solid rgba(14,163,113,0.25)">
      <span style="color:var(--accent); display:inline-flex; align-items:center">${VIEWS.iconHTML('target', {size: 14})}</span>
      <div class="flex-1">
        <div class="text-[11px] uppercase tracking-wider" style="color:var(--accent); font-weight:600; letter-spacing:0.08em">Activity · ${esc(typeLabel)}</div>
        <div class="text-[12.5px] muted">Generation effect: try producing the answer in your own words BEFORE the structured activity.</div>
      </div>
    </div>

    <!-- Phase A: free-recall (generation effect) -->
    <details id="ca-recall" class="mb-3 rounded-md p-3" style="background:rgba(46,111,224,0.04); border:1px solid rgba(46,111,224,0.18)" open>
      <summary class="cursor-pointer text-[12.5px] font-medium flex items-center gap-2" style="color:var(--sde)">
        <span>✏️</span><span>Free-recall: write what you remember (optional, +5 XP)</span>
      </summary>
      <div class="mt-3">
        <textarea id="ca-recall-text" rows="3" class="w-full text-[13px]" placeholder="In 1-2 sentences: what does this concept say? Don't peek at the body — even a wrong attempt boosts retention."></textarea>
        <div class="flex items-center justify-end gap-2 mt-2">
          <button class="btn btn-ghost text-[12.5px]" id="ca-recall-skip">Skip recall</button>
          <button class="btn btn-primary text-[12.5px]" id="ca-recall-submit">Submit + see activity →</button>
        </div>
      </div>
    </details>

    <div id="ca-stage" class="hidden"></div>
    <div id="ca-quiz" class="hidden mt-4 pt-4 border-t border-[color:var(--hairline)]"></div>
    <!-- Self-rate widget — drives concept-review SRS scheduling -->
    <div id="ca-selfrate" class="hidden mt-4 pt-4 border-t border-[color:var(--hairline)]">
      <div class="text-xs muted uppercase tracking-wider mb-2" style="letter-spacing:0.08em">Self-rate · schedules your review</div>
      <div class="text-[13px] mb-2">How confident are you with this concept right now?</div>
      <div class="grid grid-cols-4 gap-2">
        <button class="btn btn-ghost text-[12.5px]" data-cr-rate="1">Shaky<div class="text-[10px] dim mt-0.5">review tomorrow</div></button>
        <button class="btn btn-ghost text-[12.5px]" data-cr-rate="2">OK<div class="text-[10px] dim mt-0.5">review in 3d</div></button>
        <button class="btn btn-ghost text-[12.5px]" data-cr-rate="3">Solid<div class="text-[10px] dim mt-0.5">review in 1w</div></button>
        <button class="btn btn-primary text-[12.5px]" data-cr-rate="4">Could teach it<div class="text-[10px] mt-0.5">review in 3w</div></button>
      </div>
      <div id="ca-rate-fb" class="text-[12px] muted mt-3"></div>
    </div>
  `;
  const stage = container.querySelector('#ca-stage');
  const quizSlot = container.querySelector('#ca-quiz');
  const selfRateBox = container.querySelector('#ca-selfrate');
  const recallBlock = container.querySelector('#ca-recall');

  const mountFinalQuiz = () => {
    if (!lesson.quiz) return;
    quizSlot.classList.remove('hidden');
    quizSlot.innerHTML = `
      <div class="text-xs muted uppercase tracking-wider mb-2">Final check — quiz</div>
      <div id="ca-quiz-stage"></div>
    `;
    const qStage = quizSlot.querySelector('#ca-quiz-stage');
    const taggedQuiz = { ...lesson.quiz, _source: 'concept-quiz-' + lesson.id };
    renderMCQ(qStage, taggedQuiz, () => {
      quizSlot.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  };

  const reveal = () => {
    // Lesson body is already shown at the top of the modal -- no need to
    // re-render it under a "Key insight" header. Just surface the self-rate
    // widget (and any final quiz) and fire engagement.
    selfRateBox.classList.remove('hidden');
    selfRateBox.classList.add('fade-in-up');
    mountFinalQuiz();
    selfRateBox.scrollIntoView({ behavior:'smooth', block:'nearest' });
    onEngaged();
  };

  // Self-rate handlers — drive concept-review SRS scheduling
  selfRateBox.querySelectorAll('[data-cr-rate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.dataset.crRate, 10);
      const st = APP.getState();
      GAMI.scheduleConceptReview(st, lesson.id, rating);
      APP.afterStateChange();
      const map = {
        1: 'Scheduled for tomorrow. Re-read once now; we\'ll surface it again.',
        2: 'Scheduled for 3 days from now. Solid first encounter.',
        3: 'Scheduled for 1 week. Move forward with confidence.',
        4: 'Scheduled for 3 weeks. Try teaching it aloud this week to lock in.',
      };
      selfRateBox.querySelector('#ca-rate-fb').innerHTML = `<span style="color:var(--accent)">✓</span> ${map[rating]}`;
      selfRateBox.querySelectorAll('[data-cr-rate]').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
      btn.style.opacity = '1';
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = rating >= 4 ? '#04140E' : 'var(--accent)';
    });
  });

  const renderers = {
    steps:     renderSteps, mcq: renderMCQ, truefalse: renderTF,
    sort:      renderSort, match: renderMatch,
    fillblank: renderFillBlank, decision: renderDecision, predict: renderPredict,
    // SOTA learning-psychology widget types — generative over recognition
    codepredict: renderCodePredict, findbug: renderFindBug,
    cloze:       renderCloze,       whyexplain: renderWhyExplain,
  };
  const fn = renderers[it.type] || renderPredict;

  // Tag the question with its source so wrong-answer queue knows where it came from
  const taggedIt = { ...it, _source: 'concept-' + lesson.id };

  // Phase A: free-recall (generation effect). After submit/skip, run the activity.
  const startActivity = () => {
    recallBlock.removeAttribute('open');
    recallBlock.style.opacity = '0.6';
    recallBlock.querySelector('summary').style.pointerEvents = 'none';
    stage.classList.remove('hidden');
    stage.scrollIntoView({ behavior:'smooth', block:'nearest' });
    fn(stage, taggedIt, reveal);
  };
  recallBlock.querySelector('#ca-recall-submit').addEventListener('click', () => {
    const text = recallBlock.querySelector('#ca-recall-text').value.trim();
    if (text) {
      const st = APP.getState();
      GAMI.logFreeRecall(st, lesson.id, text, null);
      GAMI.awardXP(st, 5, 'free-recall');
      APP.afterStateChange();
      ANIM.toast({ icon:'✏️', title:'+5 XP', body:'Free-recall logged — generation effect active' });
    }
    startActivity();
  });
  recallBlock.querySelector('#ca-recall-skip').addEventListener('click', startActivity);
}

/* Auto-generated activity for concepts that don't define one.
   Two phases: (1) predict before reading, (2) self-rate after comparing.
   This pattern is the testing effect — Roediger & Karpicke, 2006. */
function autoGenerateActivity(lesson) {
  return { type: 'predict', lessonName: lesson.name };
}

function renderPredict(stage, it, onDone) {
  let phase = 1;
  let chosenRating = null;
  function paint() {
    if (phase === 1) {
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs muted uppercase tracking-wider mb-2">Phase 1 · Predict</div>
          <div class="text-[14px] leading-relaxed mb-3">In your head (or out loud), try to state in your own words what <b>"${esc(it.lessonName)}"</b> covers — <i>before</i> you read anything below.</div>
          <div class="muted text-[12.5px] mb-4">Retrieval practice — even when partial — beats passive re-reading <span class="dim">(Roediger &amp; Karpicke, 2006).</span></div>
          <div class="text-right">
            <button class="btn btn-primary" id="predict-done">I tried — reveal the answer ↓</button>
          </div>
        </div>
      `;
      stage.querySelector('#predict-done').addEventListener('click', () => {
        phase = 2;
        // Reveal the body first, THEN show the self-rate (so user compares before rating)
        onDone();
        paint();
      });
    } else {
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs muted uppercase tracking-wider mb-2">Phase 2 · Self-rate</div>
          <div class="text-[14px] mb-3">Now that you've read the key insight, how close was your prediction?</div>
          <div class="grid grid-cols-4 gap-2">
            <button class="btn" data-rate-auto="1">Shaky</button>
            <button class="btn" data-rate-auto="2">OK</button>
            <button class="btn" data-rate-auto="3">Solid</button>
            <button class="btn btn-primary" data-rate-auto="4">Could teach it</button>
          </div>
          <div id="rate-auto-fb" class="text-[12.5px] muted mt-3"></div>
        </div>
      `;
      stage.querySelectorAll('[data-rate-auto]').forEach(b => {
        b.addEventListener('click', () => {
          chosenRating = parseInt(b.dataset.rateAuto, 10);
          const fbMsg = {
            1: 'Re-read once now. Add to your flashcard rotation for tomorrow.',
            2: 'Schedule a review in 2 days. Re-explain to yourself first.',
            3: 'Solid. Spaced repetition will lock it in — see you in a week.',
            4: 'Teach this aloud to someone this week — the strongest retention move there is.'
          };
          stage.querySelector('#rate-auto-fb').textContent = fbMsg[chosenRating];
          stage.querySelectorAll('[data-rate-auto]').forEach(x => { x.disabled = true; x.style.opacity = '0.5'; });
          b.style.opacity = '1';
          b.style.borderColor = 'var(--accent)';
          b.style.color = chosenRating >= 4 ? '#04140E' : 'var(--accent)';
        });
      });
    }
  }
  paint();
}

/* ----- Steps walkthrough ----- */
function renderSteps(stage, it, onDone) {
  let idx = 0;
  const total = it.steps.length;
  function paint() {
    const s = it.steps[idx];
    stage.innerHTML = `
      <div class="card thin">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs muted">Step ${idx+1} / ${total}${s.title?` · ${esc(s.title)}`:''}</div>
          <div class="flex gap-1">${it.steps.map((_,i) => `<span class="w-6 h-1 rounded-full" style="background:${i<=idx?'var(--accent)':'var(--hairline)'}"></span>`).join('')}</div>
        </div>
        <div class="text-[14px] leading-relaxed">${s.body || ''}</div>
        ${s.predict ? `<div class="mt-3 p-2 rounded-md" style="background:rgba(255,195,107,0.06);border:1px solid rgba(255,195,107,0.2)"><div class="text-xs" style="color:var(--warn)">Predict: ${esc(s.predict)}</div></div>`:''}
        <div class="flex justify-end gap-2 mt-3">
          ${idx > 0 ? '<button class="btn" data-step-prev>← Back</button>' : ''}
          <button class="btn btn-primary" data-step-next>${idx<total-1 ? 'Next →' : 'Finish'}</button>
        </div>
      </div>
    `;
    stage.querySelector('[data-step-prev]')?.addEventListener('click', () => { idx--; paint(); });
    stage.querySelector('[data-step-next]').addEventListener('click', () => {
      if (idx < total-1) { idx++; paint(); }
      else { onDone(); }
    });
  }
  paint();
}

/* ----- Multiple choice ----- */
function renderMCQ(stage, it, onDone) {
  stage.innerHTML = `
    <div class="card thin">
      <div class="text-[14px] font-medium mb-3">${esc(it.q)}</div>
      <div class="grid gap-2">
        ${it.options.map((o,i) => `<button class="btn justify-start text-left w-full !py-2.5" data-opt="${i}"><span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}</button>`).join('')}
      </div>
      <div id="ca-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
    </div>
  `;
  // Stable ID for SRS tracking. If question already has an id, use it; else hash the prompt.
  const qid = it.id || ('mcq-' + simpleHash(it.q || ''));
  stage.querySelectorAll('[data-opt]').forEach(b => {
    b.addEventListener('click', () => {
      const i = parseInt(b.dataset.opt, 10);
      const right = i === it.correct;
      stage.querySelectorAll('[data-opt]').forEach(x => x.disabled = true);
      stage.querySelectorAll('[data-opt]').forEach((x,j) => {
        if (j === it.correct) { x.style.borderColor = 'var(--accent)'; x.style.color = 'var(--accent)'; }
        if (j === i && !right) { x.style.borderColor = 'var(--bad)'; x.style.color = 'var(--bad)'; ANIM.shake(x); }
      });
      // SRS hook — record wrong, or promote if reviewing a previously-missed
      const state = APP.getState();
      if (!right) {
        GAMI.recordWrongAnswer(state, qid, {
          q: it.q, options: it.options, correct: it.correct, explain: it.explain,
          cat: it.cat || 'general', source: it._source || 'mcq',
        });
        APP.afterStateChange();
      } else if (state.missedQuestions && state.missedQuestions[qid]) {
        // Was previously missed; correct attempt → SM-2 promotion
        GAMI.reviewMissedQuestion(state, qid, true);
        APP.afterStateChange();
      }
      const fb = stage.querySelector('#ca-fb');
      fb.classList.remove('hidden');
      fb.style.background = right ? 'rgba(124,241,194,0.08)' : 'rgba(255,122,140,0.06)';
      fb.style.border = `1px solid ${right ? 'rgba(124,241,194,0.3)' : 'rgba(255,122,140,0.25)'}`;
      const reviewNote = !right
        ? '<div class="text-[11px] mt-2 muted">Saved to your <b>wrong-answer review queue</b> — you\'ll see this again tomorrow.</div>'
        : '';
      fb.innerHTML = `<div style="color:${right?'var(--accent)':'var(--bad)'};font-weight:500">${right?'✓ Right':'✗ The answer is '+esc(it.options[it.correct])}</div><div class="muted mt-1">${esc(it.explain)}</div>${reviewNote}<div class="mt-3 text-right"><button class="btn btn-primary" id="ca-cont">Continue →</button></div>`;
      fb.querySelector('#ca-cont').addEventListener('click', onDone);
      if (right) ANIM.confettiBurst('s');
    });
  });
}

// Tiny string hash for stable SRS IDs on questions without explicit id field
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/* ----- True / False bank ----- */
function renderTF(stage, it, onDone) {
  let idx = 0, score = 0;
  function paint() {
    if (idx >= it.statements.length) {
      stage.innerHTML = `<div class="card thin text-center py-6"><div class="text-xs muted mb-1">All statements rated</div><div class="text-2xl font-bold numeric mb-3" style="color:var(--accent)">${score}/${it.statements.length}</div><button class="btn btn-primary" id="ca-cont">Continue →</button></div>`;
      stage.querySelector('#ca-cont').addEventListener('click', onDone);
      return;
    }
    const s = it.statements[idx];
    stage.innerHTML = `
      <div class="card thin">
        <div class="text-xs muted mb-2">Statement ${idx+1} / ${it.statements.length} — true or false?</div>
        <div class="text-[15px] leading-snug mb-4">${esc(s.text)}</div>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn" data-tf="true">True</button>
          <button class="btn" data-tf="false">False</button>
        </div>
        <div id="tf-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
      </div>
    `;
    stage.querySelectorAll('[data-tf]').forEach(b => {
      b.addEventListener('click', () => {
        const ans = b.dataset.tf === 'true';
        const right = ans === !!s.answer;
        if (right) score++;
        stage.querySelectorAll('[data-tf]').forEach(x => { x.disabled = true; });
        b.style.borderColor = right ? 'var(--accent)' : 'var(--bad)';
        b.style.color = right ? 'var(--accent)' : 'var(--bad)';
        if (!right) ANIM.shake(b);
        const fb = stage.querySelector('#tf-fb');
        fb.classList.remove('hidden');
        fb.style.background = right ? 'rgba(124,241,194,0.06)' : 'rgba(255,122,140,0.05)';
        fb.style.border = `1px solid ${right ? 'rgba(124,241,194,0.25)' : 'rgba(255,122,140,0.2)'}`;
        fb.innerHTML = `<div style="color:${right?'var(--accent)':'var(--bad)'};font-weight:500">${right?'✓':'✗'} ${s.answer?'True':'False'}</div><div class="muted mt-1">${esc(s.why)}</div><div class="mt-3 text-right"><button class="btn" id="tf-next">${idx<it.statements.length-1?'Next →':'Finish'}</button></div>`;
        fb.querySelector('#tf-next').addEventListener('click', () => { idx++; paint(); });
      });
    });
  }
  paint();
}

/* ----- Sort into correct order (click-to-pick) ----- */
function renderSort(stage, it, onDone) {
  // Click items in order
  const items = [...it.items];
  const picked = []; // indices into items in user-click-order
  function paint() {
    stage.innerHTML = `
      <div class="card thin">
        <div class="text-[13px] muted mb-3">${esc(it.prompt || 'Click these in the correct order:')}</div>
        <div class="grid gap-2">
          ${items.map((it2, i) => {
            const pIdx = picked.indexOf(i);
            const disabled = pIdx >= 0;
            const order = pIdx >= 0 ? (pIdx + 1) : '';
            return `<button class="btn justify-start text-left w-full !py-2.5" data-sort="${i}" ${disabled?'disabled':''} style="${disabled?'opacity:0.5':''}"><span class="dim mr-2 numeric w-5 inline-block">${order}</span>${esc(it2)}</button>`;
          }).join('')}
        </div>
        ${picked.length === items.length ? `<div class="mt-3"><button class="btn btn-primary" id="sort-check">Check answer</button></div>` : ''}
        ${picked.length > 0 ? `<div class="mt-2 text-right"><button class="btn btn-ghost text-xs" id="sort-reset">Reset</button></div>` : ''}
        <div id="sort-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
      </div>
    `;
    stage.querySelectorAll('[data-sort]').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.sort, 10);
        if (!picked.includes(i)) picked.push(i);
        paint();
      });
    });
    stage.querySelector('#sort-reset')?.addEventListener('click', () => { picked.length = 0; paint(); });
    stage.querySelector('#sort-check')?.addEventListener('click', () => {
      const correct = picked.every((p,i) => p === it.correct[i]);
      const fb = stage.querySelector('#sort-fb');
      fb.classList.remove('hidden');
      fb.style.background = correct ? 'rgba(124,241,194,0.06)' : 'rgba(255,122,140,0.06)';
      fb.style.border = `1px solid ${correct ? 'rgba(124,241,194,0.25)' : 'rgba(255,122,140,0.25)'}`;
      const correctList = it.correct.map(idx => items[idx]).map((v,i) => `<div>${i+1}. <span style="color:var(--accent)">${esc(v)}</span></div>`).join('');
      fb.innerHTML = `<div style="color:${correct?'var(--accent)':'var(--bad)'};font-weight:500">${correct?'✓ Correct order':'✗ Correct order:'}</div>${correct?'':correctList}<div class="muted mt-2">${esc(it.explain || '')}</div><div class="mt-3 text-right"><button class="btn btn-primary" id="ca-cont">Continue →</button></div>`;
      fb.querySelector('#ca-cont').addEventListener('click', onDone);
      if (correct) ANIM.confettiBurst('s');
    });
  }
  paint();
}

/* ----- Match pairs (click-pair: click left, then right) ----- */
function renderMatch(stage, it, onDone) {
  const left  = it.pairs.map(p => p[0]);
  const right = shuffleArr(it.pairs.map(p => p[1]));
  const matched = {}; // leftIndex -> rightItem
  let selectedLeft = null;

  function shuffleArr(a) { const x = [...a]; for (let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }

  function paint() {
    stage.innerHTML = `
      <div class="card thin">
        <div class="text-[13px] muted mb-3">${esc(it.prompt || 'Tap a term, then tap its match:')}</div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="text-xs muted uppercase tracking-wider mb-1">Terms</div>
            ${left.map((l,i) => `<button class="btn justify-start text-left w-full !py-2" data-left="${i}" ${matched[i]?'disabled':''} style="${matched[i]?'opacity:0.6':selectedLeft===i?'border-color:var(--accent);color:var(--accent)':''}">${esc(l)}${matched[i]?' <span class="dim ml-2">→ '+esc(matched[i])+'</span>':''}</button>`).join('')}
          </div>
          <div class="space-y-2">
            <div class="text-xs muted uppercase tracking-wider mb-1">Definitions</div>
            ${right.map((r,i) => {
              const used = Object.values(matched).includes(r);
              return `<button class="btn justify-start text-left w-full !py-2" data-right="${i}" ${used||selectedLeft===null?'disabled':''} style="${used?'opacity:0.4':''}">${esc(r)}</button>`;
            }).join('')}
          </div>
        </div>
        ${Object.keys(matched).length === left.length ? `<div class="mt-3"><button class="btn btn-primary" id="match-check">Check</button></div>` : ''}
        <div id="match-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
      </div>
    `;
    stage.querySelectorAll('[data-left]').forEach(b => {
      b.addEventListener('click', () => { selectedLeft = parseInt(b.dataset.left, 10); paint(); });
    });
    stage.querySelectorAll('[data-right]').forEach(b => {
      b.addEventListener('click', () => {
        const rIdx = parseInt(b.dataset.right, 10);
        matched[selectedLeft] = right[rIdx];
        selectedLeft = null;
        paint();
      });
    });
    stage.querySelector('#match-check')?.addEventListener('click', () => {
      // Score: how many left[i] -> matched[i] match the original pair[i][1]?
      const correct = it.pairs.every((p,i) => matched[i] === p[1]);
      const fb = stage.querySelector('#match-fb');
      fb.classList.remove('hidden');
      fb.style.background = correct ? 'rgba(124,241,194,0.06)' : 'rgba(255,122,140,0.06)';
      fb.style.border = `1px solid ${correct ? 'rgba(124,241,194,0.25)' : 'rgba(255,122,140,0.25)'}`;
      const answers = it.pairs.map(p => `<div>${esc(p[0])} <span class="dim">→</span> <span style="color:var(--accent)">${esc(p[1])}</span></div>`).join('');
      fb.innerHTML = `<div style="color:${correct?'var(--accent)':'var(--bad)'};font-weight:500">${correct?'✓ All matches correct':'Correct matches:'}</div>${correct?'':answers}<div class="muted mt-2">${esc(it.explain || '')}</div><div class="mt-3 text-right"><button class="btn btn-primary" id="ca-cont">Continue →</button></div>`;
      fb.querySelector('#ca-cont').addEventListener('click', onDone);
      if (correct) ANIM.confettiBurst('s');
    });
  }
  paint();
}

/* ----- Fill in the blank (code template) ----- */
function renderFillBlank(stage, it, onDone) {
  stage.innerHTML = `
    <div class="card thin">
      <div class="text-[13px] muted mb-3">${esc(it.prompt)}</div>
      <pre class="font-mono text-[12.5px] p-3 rounded-md whitespace-pre-wrap" style="background:rgba(0,0,0,0.3);border:1px solid var(--hairline)">${it.code.replace(/___/g, '<input type="text" class="!inline-block !w-32 !py-0.5 !px-2 font-mono" data-blank/>')}</pre>
      <div class="flex justify-end gap-2 mt-3">
        <button class="btn" id="fb-hint">Hint</button>
        <button class="btn btn-primary" id="fb-check">Check</button>
      </div>
      <div id="fb-fb" class="hidden mt-3 p-3 rounded-md text-[13px] leading-relaxed"></div>
    </div>
  `;
  stage.querySelector('#fb-hint').addEventListener('click', () => ANIM.toast({ icon: VIEWS.iconHTML('lightbulb', {size: 18}), title:'Hint', body: it.hint || 'Think about what data structure removes the next element in O(1).' }));
  stage.querySelector('#fb-check').addEventListener('click', () => {
    const blanks = [...stage.querySelectorAll('[data-blank]')];
    const ok = blanks.every((b,i) => {
      const v = b.value.trim().toLowerCase();
      const accept = (it.blanks[i] || '').toLowerCase();
      return v && (v === accept || accept.includes(v) || v.includes(accept.replace(/[^a-z0-9]/g,'')));
    });
    const fb = stage.querySelector('#fb-fb');
    fb.classList.remove('hidden');
    fb.style.background = ok ? 'rgba(124,241,194,0.06)' : 'rgba(255,122,140,0.06)';
    fb.style.border = `1px solid ${ok ? 'rgba(124,241,194,0.25)' : 'rgba(255,122,140,0.25)'}`;
    const answers = it.blanks.map((b,i) => `<div>blank ${i+1}: <code style="color:var(--accent)">${esc(b)}</code></div>`).join('');
    fb.innerHTML = `<div style="color:${ok?'var(--accent)':'var(--bad)'};font-weight:500">${ok?'✓ Looks right':'✗ Expected:'}</div>${ok?'':answers}<div class="muted mt-2">${esc(it.explain || '')}</div><div class="mt-3 text-right"><button class="btn btn-primary" id="ca-cont">Continue →</button></div>`;
    fb.querySelector('#ca-cont').addEventListener('click', onDone);
    if (ok) ANIM.confettiBurst('s');
  });
}

/* ----- Decision tree walker ----- */
function renderDecision(stage, it, onDone) {
  let path = [];
  let nodeId = it.start;
  function paint() {
    const node = it.nodes[nodeId];
    stage.innerHTML = `
      <div class="card thin">
        ${path.length ? `<div class="text-xs muted mb-2">Path: ${path.map(p => `<span class="chip">${esc(p)}</span>`).join('')}</div>` : ''}
        <div class="text-[14px] leading-relaxed mb-3">${esc(node.q || node.text)}</div>
        ${node.options ? `<div class="grid gap-2">${node.options.map((o,i) => `<button class="btn justify-start text-left w-full" data-opt="${i}">${esc(o.text)}</button>`).join('')}</div>` : `<div class="text-right"><button class="btn btn-primary" id="dec-done">Continue →</button></div>`}
      </div>
    `;
    stage.querySelectorAll('[data-opt]').forEach(b => {
      b.addEventListener('click', () => {
        const opt = node.options[parseInt(b.dataset.opt,10)];
        path.push(opt.text);
        if (opt.next) { nodeId = opt.next; paint(); }
        else { ANIM.confettiBurst('s'); onDone(); }
      });
    });
    stage.querySelector('#dec-done')?.addEventListener('click', onDone);
  }
  paint();
}

/* ======================================================================
 * SOTA learning-psychology widget types (added 2026)
 * Each forces *generation* over recognition. MCQ tests "can you spot the
 * right one;" these test "can you produce the answer." Strictly harder,
 * strictly higher transfer. Sources noted per widget.
 * ====================================================================== */

/* ----- Code-predict: show code, predict its output BEFORE reveal.
   Mechanism: prediction-error encoding (Brod 2018, Potts & Shanks 2014).
   Config:
     { type:'codepredict', code:'def f(x): ...', question:'What does f(3) return?',
       options:[ ... ],   // optional — if omitted, free-text answer field
       correct:N | 'answer-string',
       explain:'Trace: ...' }                                              */
function renderCodePredict(stage, it, onDone) {
  let phase = 1; // 1 = predict, 2 = reveal + self-check
  let userAnswer = null;
  function paint() {
    if (phase === 1) {
      const useOptions = Array.isArray(it.options) && it.options.length > 0;
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs muted uppercase tracking-wider mb-2">Predict the output</div>
          <pre class="text-[12.5px] leading-snug mb-3"><code>${esc(it.code || '')}</code></pre>
          <div class="text-[14px] font-medium mb-3">${esc(it.question || 'What does this code output?')}</div>
          ${useOptions
            ? `<div class="grid gap-2">${it.options.map((o,i) => `<button class="btn justify-start text-left w-full !py-2.5 font-mono text-[13px]" data-opt="${i}"><span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}</button>`).join('')}</div>`
            : `<input id="cp-free" class="w-full px-3 py-2 rounded-md border border-[color:var(--hairline)] font-mono text-[13px]" placeholder="Type the exact output">
               <div class="text-right mt-2"><button class="btn btn-primary" id="cp-submit">Submit prediction →</button></div>`}
          <div class="muted text-[11.5px] mt-3 dim">Predicting before reading triggers stronger encoding via prediction-error <span class="dim">(Brod 2018).</span></div>
        </div>
      `;
      stage.querySelectorAll('[data-opt]').forEach(b => {
        b.addEventListener('click', () => { userAnswer = parseInt(b.dataset.opt, 10); phase = 2; paint(); });
      });
      stage.querySelector('#cp-submit')?.addEventListener('click', () => {
        userAnswer = (stage.querySelector('#cp-free').value || '').trim();
        phase = 2; paint();
      });
    } else {
      const useOptions = Array.isArray(it.options) && it.options.length > 0;
      const isCorrect = useOptions
        ? userAnswer === it.correct
        : String(userAnswer).replace(/\s+/g,'') === String(it.correct).replace(/\s+/g,'');
      const correctText = useOptions ? it.options[it.correct] : it.correct;
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs uppercase tracking-wider mb-2" style="color:${isCorrect?'var(--accent)':'var(--bad)'}">${isCorrect?'✓ Match':'✗ Off — that\'s the point'}</div>
          <pre class="text-[12.5px] leading-snug mb-3"><code>${esc(it.code || '')}</code></pre>
          <div class="text-[13.5px] mb-2"><b>Your prediction:</b> <span class="font-mono">${esc(useOptions ? it.options[userAnswer] : userAnswer)}</span></div>
          <div class="text-[13.5px] mb-3"><b>Actual:</b> <span class="font-mono" style="color:var(--accent)">${esc(correctText)}</span></div>
          <div class="text-[13px] leading-relaxed muted">${it.explain || ''}</div>
        </div>
      `;
      // Wrong predictions enqueue for SRS — even on free-text we approximate
      if (!isCorrect && it.id) {
        const st = APP.getState();
        GAMI.recordWrongAnswer(st, {
          id: it.id, q: it.question, options: useOptions ? it.options : [], correct: it.correct,
          explain: it.explain || '', cat: it.cat || 'coding', source: it._source || 'codepredict',
        });
        APP.afterStateChange();
      }
      onDone();
    }
  }
  paint();
}

/* ----- Find-the-bug: show line-numbered code with a defect.
   Mechanism: desirable difficulty + transfer-appropriate processing
   (Bjork & Bjork 2011). Surfacing a subtle bug forces structural reading.
   Config:
     { type:'findbug', prompt:'...', codeLines:['line 1','line 2',...],
       correctLine:N (1-indexed), explain:'...' }                          */
function renderFindBug(stage, it, onDone) {
  let chosen = null;
  function paint(submitted) {
    stage.innerHTML = `
      <div class="card thin">
        <div class="text-xs muted uppercase tracking-wider mb-2">Find the bug</div>
        <div class="text-[14px] font-medium mb-3">${esc(it.prompt || 'Which line has the defect?')}</div>
        <div class="rounded-md border border-[color:var(--hairline)] overflow-hidden">
          ${(it.codeLines || []).map((ln, i) => {
            const lineNum = i + 1;
            const isPicked = chosen === lineNum;
            const isCorrect = submitted && lineNum === it.correctLine;
            const isWrong = submitted && isPicked && lineNum !== it.correctLine;
            let bg = 'transparent';
            if (isCorrect) bg = 'rgba(14,163,113,0.12)';
            else if (isWrong) bg = 'rgba(215,56,76,0.12)';
            else if (isPicked) bg = 'rgba(46,111,224,0.08)';
            return `<button class="block w-full text-left px-3 py-1.5 font-mono text-[12.5px] hover:bg-[rgba(46,111,224,0.05)]" data-line="${lineNum}" style="background:${bg};border-bottom:1px solid var(--hairline)"><span class="dim mr-3 numeric">${String(lineNum).padStart(2,' ')}</span>${esc(ln)}</button>`;
          }).join('')}
        </div>
        ${!submitted ? `<div class="text-right mt-3"><button class="btn btn-primary" id="fb-submit" ${chosen===null?'disabled style="opacity:0.5"':''}>Submit →</button></div>` : `<div class="mt-3 p-3 rounded-md text-[13px] leading-relaxed" style="background:${chosen===it.correctLine?'rgba(14,163,113,0.08)':'rgba(215,56,76,0.08)'};border:1px solid ${chosen===it.correctLine?'rgba(14,163,113,0.25)':'rgba(215,56,76,0.25)'}"><b>${chosen===it.correctLine?'✓ Caught it.':'✗ Bug was on line '+it.correctLine+'.'}</b> ${esc(it.explain || '')}</div>`}
      </div>
    `;
    stage.querySelectorAll('[data-line]').forEach(b => {
      b.addEventListener('click', () => { if (submitted) return; chosen = parseInt(b.dataset.line, 10); paint(false); });
    });
    stage.querySelector('#fb-submit')?.addEventListener('click', () => {
      paint(true);
      if (chosen !== it.correctLine && it.id) {
        const st = APP.getState();
        GAMI.recordWrongAnswer(st, {
          id: it.id, q: it.prompt, options: (it.codeLines || []).map((_,i)=>'line '+(i+1)),
          correct: it.correctLine - 1, explain: it.explain || '', cat: it.cat || 'coding', source: it._source || 'findbug',
        });
        APP.afterStateChange();
      }
      onDone();
    });
  }
  paint(false);
}

/* ----- Cloze: fill the missing line/expression in a code template.
   Mechanism: worked-example fading (Renkl & Atkinson 2003). Reduces
   cognitive load over from-scratch coding while preserving generation.
   Config:
     { type:'cloze', prompt:'...', before:'code above blank',
       blank:'____', after:'code after blank',
       options:[ ... ], correct:N, explain:'...' }                          */
function renderCloze(stage, it, onDone) {
  let chosen = null;
  function paint(submitted) {
    const opts = it.options || [];
    stage.innerHTML = `
      <div class="card thin">
        <div class="text-xs muted uppercase tracking-wider mb-2">Complete the snippet</div>
        <div class="text-[14px] font-medium mb-3">${esc(it.prompt || 'Pick the line that completes the template.')}</div>
        <pre class="text-[12.5px] leading-snug mb-3"><code>${esc(it.before || '')}<span style="background:rgba(255,195,107,0.18);border:1px dashed var(--warn);padding:1px 4px;border-radius:3px">${submitted && chosen!==null ? esc(opts[chosen]) : '____'}</span>${esc(it.after || '')}</code></pre>
        <div class="grid gap-2">
          ${opts.map((o,i) => {
            const isPicked = chosen === i;
            const isCorrect = submitted && i === it.correct;
            const isWrong = submitted && isPicked && i !== it.correct;
            let style = '';
            if (isCorrect) style = 'background:rgba(14,163,113,0.1);border-color:var(--accent)';
            else if (isWrong) style = 'background:rgba(215,56,76,0.1);border-color:var(--bad)';
            else if (isPicked) style = 'background:rgba(46,111,224,0.08);border-color:var(--sde)';
            return `<button class="btn justify-start text-left w-full !py-2.5 font-mono text-[12.5px]" data-cl="${i}" style="${style}"><span class="dim mr-2 numeric">${String.fromCharCode(65+i)}.</span> ${esc(o)}</button>`;
          }).join('')}
        </div>
        ${submitted ? `<div class="mt-3 p-3 rounded-md text-[13px] leading-relaxed" style="background:${chosen===it.correct?'rgba(14,163,113,0.08)':'rgba(215,56,76,0.08)'};border:1px solid ${chosen===it.correct?'rgba(14,163,113,0.25)':'rgba(215,56,76,0.25)'}"><b>${chosen===it.correct?'✓ Correct.':'✗ Off — see correct option above.'}</b> ${esc(it.explain || '')}</div>` : ''}
      </div>
    `;
    stage.querySelectorAll('[data-cl]').forEach(b => {
      b.addEventListener('click', () => {
        if (submitted) return;
        chosen = parseInt(b.dataset.cl, 10);
        paint(true);
        if (chosen !== it.correct && it.id) {
          const st = APP.getState();
          GAMI.recordWrongAnswer(st, {
            id: it.id, q: it.prompt, options: opts, correct: it.correct,
            explain: it.explain || '', cat: it.cat || 'coding', source: it._source || 'cloze',
          });
          APP.afterStateChange();
        }
        onDone();
      });
    });
  }
  paint(false);
}

/* ----- Why-explain: type a 1-2 sentence "why" BEFORE seeing the answer.
   Mechanism: self-explanation effect (Chi 1989, Bisra et al. 2018 meta).
   No automatic correctness check — user compares to model and self-rates.
   Config:
     { type:'whyexplain', prompt:'Why is X true?',
       modelAnswer:'...', rubric:['key point 1','key point 2'] }            */
function renderWhyExplain(stage, it, onDone) {
  let phase = 1;
  let userText = '';
  function paint() {
    if (phase === 1) {
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs muted uppercase tracking-wider mb-2">Explain — in your own words</div>
          <div class="text-[14px] font-medium mb-3">${esc(it.prompt || 'Why does this work?')}</div>
          <textarea id="we-text" rows="4" class="w-full px-3 py-2 rounded-md border border-[color:var(--hairline)] text-[13px] leading-relaxed" placeholder="One or two sentences. State the mechanism, not just the conclusion."></textarea>
          <div class="flex justify-between items-center mt-2">
            <div class="text-[11.5px] muted dim">Self-explaining BEFORE reading the answer ≈ +.55 d on procedural transfer <span class="dim">(Bisra et al. 2018 meta).</span></div>
            <button class="btn btn-primary" id="we-submit">Reveal model answer →</button>
          </div>
        </div>
      `;
      stage.querySelector('#we-submit').addEventListener('click', () => {
        userText = (stage.querySelector('#we-text').value || '').trim();
        phase = 2;
        paint();
      });
    } else {
      stage.innerHTML = `
        <div class="card thin">
          <div class="text-xs uppercase tracking-wider mb-2 muted">Compare</div>
          ${userText ? `<div class="text-[13px] mb-3 p-3 rounded-md" style="background:rgba(46,111,224,0.05);border:1px solid rgba(46,111,224,0.2)"><div class="text-[10.5px] muted uppercase tracking-wider mb-1">Your explanation</div><div class="leading-relaxed">${esc(userText)}</div></div>` : ''}
          <div class="text-[13px] mb-3 p-3 rounded-md" style="background:rgba(14,163,113,0.05);border:1px solid rgba(14,163,113,0.25)">
            <div class="text-[10.5px] uppercase tracking-wider mb-1" style="color:var(--accent)">Model answer</div>
            <div class="leading-relaxed">${esc(it.modelAnswer || '')}</div>
          </div>
          ${Array.isArray(it.rubric) && it.rubric.length ? `<div class="text-[12px] muted mb-3"><b>Did you hit these?</b><ul class="list-disc pl-5 mt-1 space-y-0.5">${it.rubric.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
          <div class="text-[12.5px] muted">Self-rate your explanation in the panel below — that drives your concept-review schedule.</div>
        </div>
      `;
      onDone();
    }
  }
  paint();
}

/* ====================================================================== */
/* RENDERER for the Games index view                                       */
/* ====================================================================== */
function renderGamesIndex(state, hub) {
  const container = document.createElement('div');
  container.className = 'fade-in space-y-5';
  container.innerHTML = `
    <div>
      <h1 class="font-display text-3xl font-bold">Interactive games</h1>
      <p class="muted mt-1 text-sm max-w-2xl">SOTA spaced-practice mini-games. Every game logs XP and rolls into your daily quest progress. Every lesson links to a relevant game.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="games-grid"></div>
  `;
  hub.appendChild(container);
  const grid = container.querySelector('#games-grid');
  DATA.GAMES.forEach(g => {
    const a = document.createElement('a');
    a.href = `#games/${g.id}`;
    a.className = 'card card-glow';
    a.innerHTML = `
      <div class="font-display font-semibold text-lg">${esc(g.name)}</div>
      <p class="muted text-sm mt-2 leading-relaxed">${esc(g.desc)}</p>
      <div class="flex items-center justify-between mt-4 text-xs">
        <span class="muted">≈ ${g.time} min</span>
        <span style="color:var(--accent)">+${g.xp} XP</span>
      </div>
    `;
    grid.appendChild(a);
  });
  ANIM.stagger(grid.children, { stagger: 0.05 });
}

function renderGame(state, hub, id) {
  const game = DATA.GAMES.find(g => g.id === id);
  if (!game) { hub.innerHTML = '<div class="muted">Unknown game.</div>'; return; }
  hub.innerHTML = `
    <div class="space-y-4">
      <a href="#games" class="text-xs muted hover:text-white">← Games</a>
      <div id="game-mount"></div>
    </div>
  `;
  const mount = hub.querySelector('#game-mount');
  const fns = { quiz: mountQuiz, bfs: mountBFS, lru: mountLRU, decomp: mountDecomp, roleplay: mountRoleplay };
  const fn = fns[id];
  if (fn) fn(mount, state);
}

/* ====================================================================== */
/* CATEGORY QUIZ — opens an overlay with that category's question bank      */
/* ====================================================================== */
function runCategoryQuiz(state, catId) {
  const cat = DATA.CATEGORIES.find(c => c.id === catId);
  const qs  = DATA.CATEGORY_QUIZZES[catId];
  if (!cat || !qs) return;
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-40 grid place-items-center p-4';
  wrap.style.background = 'rgba(248,249,252,0.55)';
  wrap.style.backdropFilter = 'blur(24px) saturate(180%)';
  wrap.style.webkitBackdropFilter = 'blur(24px) saturate(180%)';
  wrap.style.backdropFilter = 'blur(6px)';
  const card = document.createElement('div');
  card.className = 'card elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto';
  card.style.padding = '1.4rem 1.6rem';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <div class="text-xs muted uppercase tracking-wider">Category quiz</div>
        <h2 class="font-display text-xl font-semibold">${esc(cat.name)} — ${qs.length} questions</h2>
      </div>
      <button class="muted hover:text-white text-2xl" data-close-q>×</button>
    </div>
    <div id="cat-q-mount"></div>
  `;
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.dataset.closeQ !== undefined) wrap.remove(); });
  const mount = card.querySelector('#cat-q-mount');
  mountQuiz(mount, state, { questions: qs.map(q => ({ ...q, cat: cat.id })), size: qs.length });
}

return {
  mountQuiz, mountBFS, mountLRU, mountDecomp, mountRoleplay,
  mountLessonInteraction,
  renderGamesIndex, renderGame,
  runCategoryQuiz,
};
})();
