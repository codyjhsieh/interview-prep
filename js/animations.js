/* =========================================================================
 * animations.js — GSAP-based motion helpers + confetti + toasts +
 * background star field.
 * ========================================================================= */

window.ANIM = (function () {

const hasGSAP = typeof gsap !== 'undefined';

function viewIn(el) {
  if (!hasGSAP || !el) return;
  // Force GPU layer promotion BEFORE the animation starts so each frame
  // is a pure compositor op (no re-raster of the card subtree, which is
  // expensive on the lesson modal due to backdrop-filter + Prism token
  // spans). will-change is cleared on complete so the layer can release.
  el.style.willChange = 'transform, opacity';
  gsap.fromTo(el, { y: 14, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.45, ease: 'power3.out',
    onComplete: () => { el.style.willChange = ''; },
  });
}

function stagger(els, opts={}) {
  if (!hasGSAP || !els || !els.length) return;
  for (const e of els) e.style.willChange = 'transform, opacity';
  gsap.fromTo(els,
    { y: 16, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
      stagger: opts.stagger || 0.05,
      onComplete: () => { for (const e of els) e.style.willChange = ''; },
    }
  );
}

function countUp(el, to, duration=1.1, suffix='') {
  if (!el) return;
  const from = parseFloat(el.dataset.value || 0);
  el.dataset.value = to;
  if (!hasGSAP) { el.textContent = to + suffix; return; }
  const obj = { v: from };
  gsap.to(obj, {
    v: to, duration, ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
  });
}

function shake(el) {
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 320);
}

function confettiBurst(intensity='m') {
  const counts = { s:60, m:120, l:240 };
  const c = counts[intensity] || 120;
  const fire = () => {
    if (typeof confetti === 'undefined') return;
    confetti({ particleCount: c, spread: 80, origin: { y: 0.7 }, colors: ['#7CF1C2','#8B5CF6','#FFB95C','#FB7185'] });
  };
  // canvas-confetti is lazy-loaded (see index.html LAZY). Idle prefetch
  // means it's almost always already cached by the time a level-up
  // fires; if not, kick off the load now.
  if (typeof confetti !== 'undefined') { fire(); return; }
  if (window.LAZY && window.LAZY.confetti) {
    window.LAZY.confetti().then(fire).catch(() => {});
  }
}

function celebrateLevelUp(newLevel) {
  confettiBurst('l');
  setTimeout(() => confettiBurst('m'), 300);
  toast({ icon:'🌟', title:`Level ${newLevel}!`, body:`You leveled up. Keep going.` });
}

function toast({ icon='✨', title='Nice', body='', timeout=3200, href='' }) {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  // If href is provided, make the whole toast clickable to navigate there
  // (used by the "Bit's hungry" toast to jump to the dashboard).
  if (href) {
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'link');
    el.setAttribute('tabindex', '0');
    const go = () => { try { window.location.hash = href.replace(/^#/, ''); } catch (_) {} el.remove(); };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); });
  }
  el.innerHTML = `<div class="icon">${icon}</div><div><div class="title">${title}</div>${body?`<div class="body">${body}</div>`:''}</div>`;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.style.transform = 'translateX(120%)';
    setTimeout(() => el.remove(), 400);
  }, timeout);
}

function starfield() {
  const wrap = document.getElementById('bg-stars');
  if (!wrap) return;
  const count = 60;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.opacity = (0.15 + Math.random() * 0.4).toFixed(2);
    s.style.width = (1 + Math.random() * 1.5).toFixed(1) + 'px';
    s.style.height = s.style.width;
    wrap.appendChild(s);
    if (hasGSAP) {
      gsap.to(s, {
        opacity: 0.05,
        duration: 2 + Math.random()*4,
        repeat: -1, yoyo: true, ease: 'sine.inOut',
        delay: Math.random()*4
      });
    }
  }
}

function pulse(el) {
  if (!el) return;
  el.classList.add('pulse-glow');
  setTimeout(() => el.classList.remove('pulse-glow'), 1800);
}

return { viewIn, stagger, countUp, shake, confettiBurst, celebrateLevelUp, toast, starfield, pulse };
})();
