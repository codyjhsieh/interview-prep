/* In-page perf agent — injected by the Playwright driver before any
 * site script runs. Exposes window.__perf with rAF-driven FPS sampling,
 * PerformanceObserver long-tasks + layout-shift counters, and helpers
 * the driver uses to scope metrics per route.
 *
 * Design intent:
 *   - Zero runtime impact on idle (just one rAF loop, one PO).
 *   - Driver calls __perf.startRoute(label) / __perf.endRoute() to scope
 *     a metrics window; metrics returned are absolute counters minus the
 *     snapshot taken at startRoute, so we don't double-count between
 *     routes.
 *   - Frame durations stored in a ring buffer so we can compute p95
 *     without unbounded memory growth.
 */
(function () {
  const FRAME_BUF = 1024;             // ~17s @ 60fps before wraparound
  const frames = new Float32Array(FRAME_BUF);
  let frameWriteIdx = 0;
  let frameCount = 0;                 // monotonic; total frames seen
  let lastFrameTs = performance.now();

  const longTasks = [];               // [{start, duration, name}]
  const layoutShifts = [];            // [{start, value, hadRecentInput}]

  function tick(ts) {
    const delta = ts - lastFrameTs;
    lastFrameTs = ts;
    frames[frameWriteIdx] = delta;
    frameWriteIdx = (frameWriteIdx + 1) % FRAME_BUF;
    frameCount++;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        longTasks.push({ start: e.startTime, duration: e.duration, name: e.name });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (_) {}

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        layoutShifts.push({ start: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}

  /* Snapshot of the cumulative counters at a moment in time. The driver
   * subtracts this from a later snapshot to scope per-route metrics. */
  function snapshot() {
    return {
      t: performance.now(),
      frameCount,
      longTaskCount: longTasks.length,
      longTaskMs: longTasks.reduce((s, t) => s + t.duration, 0),
      maxLongTaskMs: longTasks.reduce((m, t) => Math.max(m, t.duration), 0),
      layoutShiftSum: layoutShifts.reduce((s, l) => s + (l.hadRecentInput ? 0 : l.value), 0),
      heap: (performance.memory && performance.memory.usedJSHeapSize) || null,
    };
  }

  /* Read the ring buffer of frame deltas accumulated since `sinceFrameCount`.
   * Returns the distribution we need without sending the whole buffer back. */
  function framesSince(sinceFrameCount) {
    const count = Math.min(frameCount - sinceFrameCount, FRAME_BUF);
    if (count <= 0) return { count: 0, fps: 0, p95Ms: 0, maxMs: 0, buckets: null };
    const start = (frameWriteIdx - count + FRAME_BUF) % FRAME_BUF;
    const arr = new Array(count);
    for (let i = 0; i < count; i++) arr[i] = frames[(start + i) % FRAME_BUF];
    arr.sort((a, b) => a - b);
    const sum = arr.reduce((s, d) => s + d, 0);
    const avgMs = sum / count;
    const p95Ms = arr[Math.min(count - 1, Math.floor(count * 0.95))];
    const maxMs = arr[count - 1];
    // Frame-duration histogram. Buckets line up with sustained-fps brackets:
    //   <17ms  -> 60fps     (smooth)
    //   17-33  -> 30-60fps
    //   33-50  -> 20-30fps
    //   50-100 -> 10-20fps  (visible jank)
    //   >=100  -> <10fps    (drops)
    const buckets = { '<17': 0, '17-33': 0, '33-50': 0, '50-100': 0, '>=100': 0 };
    for (const d of arr) {
      if (d < 17) buckets['<17']++;
      else if (d < 33) buckets['17-33']++;
      else if (d < 50) buckets['33-50']++;
      else if (d < 100) buckets['50-100']++;
      else buckets['>=100']++;
    }
    return { count, fps: avgMs > 0 ? 1000 / avgMs : 0, p95Ms, maxMs, avgMs, buckets };
  }

  let routeStart = null;

  window.__perf = {
    /* Driver calls this when it has finished navigating + waiting for a
     * stable state, before it starts the dwell phase. */
    startRoute(label) {
      routeStart = { label, snap: snapshot() };
    },
    /* Returns the per-route metrics scoped from startRoute to now. */
    endRoute() {
      if (!routeStart) return null;
      const before = routeStart.snap;
      const after = snapshot();
      const frameStats = framesSince(before.frameCount);
      const out = {
        label: routeStart.label,
        durationMs: after.t - before.t,
        ...frameStats,
        longTaskCount: after.longTaskCount - before.longTaskCount,
        longTaskMs: after.longTaskMs - before.longTaskMs,
        maxLongTaskMs: Math.max(0, after.maxLongTaskMs - before.maxLongTaskMs),
        layoutShiftSum: Math.max(0, after.layoutShiftSum - before.layoutShiftSum),
        heapBefore: before.heap,
        heapAfter: after.heap,
        heapDelta: after.heap != null && before.heap != null ? after.heap - before.heap : null,
      };
      routeStart = null;
      return out;
    },
    /* For ad-hoc reads. */
    snapshot,
    /* Initial navigation timing summary — read once after first paint. */
    navTiming() {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return {
        domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
        loadEvent: nav ? nav.loadEventEnd : null,
        firstContentfulPaint: fcp ? fcp.startTime : null,
      };
    },
  };
})();
