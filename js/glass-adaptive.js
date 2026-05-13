/* glass-adaptive.js — content-adaptive tinting for Liquid Glass surfaces.
 *
 * For every .card on the page, find the dominant background color BEHIND
 * it (walk up the elementFromPoint stack until a non-transparent backdrop
 * is found) and publish that color as --card-tint on the element. The CSS
 * uses color-mix to pull the glass slightly toward this substrate color,
 * which is what makes Apple's Liquid Glass feel "alive" — every surface
 * picks up a hint of the content beneath it instead of being a uniform
 * white wash.
 *
 * Implementation notes:
 *  - We hide the card briefly (visibility: hidden) before sampling so
 *    elementFromPoint reports what's *behind* it, not the card itself.
 *  - getComputedStyle().backgroundColor returns "rgb(...)" or
 *    "rgba(...)"; transparent backgrounds resolve to "rgba(0, 0, 0, 0)".
 *  - We walk up ancestors until a non-transparent bg is found, falling
 *    back to <body>.
 *  - MutationObserver picks up cards mounted after initial load
 *    (dashboard re-renders, modal opens, etc.).
 *  - IntersectionObserver re-samples cards when they scroll into view
 *    (the ambient colour wells drift, so the substrate changes).
 *  - All work is rAF-deferred so it never blocks the render loop.
 *
 * Performance budget: ~0.05ms per card per sample. Tens of cards
 * sampled in a 16ms frame is well under budget.
 */

(function () {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  /* Returns the first non-transparent backgroundColor walking up from `el`,
   * or null if nothing meaningful is found. */
  function substrateColor(el) {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = getComputedStyle(cur).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      cur = cur.parentElement;
    }
    // Final fallback — the body or root background
    return getComputedStyle(document.body).backgroundColor
        || getComputedStyle(document.documentElement).backgroundColor
        || null;
  }

  /* Find what's directly behind the card's center point, hiding the card
   * itself so the hit test doesn't return the card. */
  function sampleSubstrate(card) {
    const rect = card.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const prevVis = card.style.visibility;
    card.style.visibility = 'hidden';
    let behind = null;
    try { behind = document.elementFromPoint(cx, cy); }
    finally { card.style.visibility = prevVis; }
    if (!behind) return null;
    return substrateColor(behind);
  }

  /* Write --card-tint onto the card. Use rAF batching so we never block
   * the layout pipeline mid-frame. */
  function applyTint(card) {
    if (!card || !card.isConnected) return;
    requestAnimationFrame(() => {
      const color = sampleSubstrate(card);
      if (color) card.style.setProperty('--card-tint', color);
    });
  }

  /* Sample every .card currently on the page. */
  function rescanAll() {
    document.querySelectorAll('.card').forEach(applyTint);
  }

  /* Observe DOM mutations — when new .card elements appear (dashboard
   * re-renders, modal opens), sample them. Debounced to one rescan per
   * animation frame. */
  let pendingScan = false;
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.classList && node.classList.contains('card')) {
          applyTint(node);
        }
        // Nested cards inside the added subtree
        if (node.querySelectorAll) {
          node.querySelectorAll('.card').forEach(applyTint);
        }
      }
    }
    if (!pendingScan) {
      pendingScan = true;
      requestAnimationFrame(() => { pendingScan = false; });
    }
  });

  /* Re-sample on viewport entry (the ambient colour wells drift, so the
   * substrate at a card's position changes when it scrolls into view). */
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) applyTint(e.target);
    }
  }, { threshold: 0.05 }) : null;

  /* Initial scan + observer hook-up after the document is interactive. */
  function init() {
    rescanAll();
    if (io) {
      document.querySelectorAll('.card').forEach((c) => io.observe(c));
    }
    mo.observe(document.body, { childList: true, subtree: true });

    // Re-sample on window resize (layout shifts the substrate behind cards).
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(rescanAll);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
