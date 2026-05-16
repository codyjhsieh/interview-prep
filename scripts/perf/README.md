# Clickthrough perf system

Automated journey through the app that measures FPS, long tasks, layout shift, and heap growth per route. Produces `perf-report.md` and `perf-report.json`.

## Quick start

Requires Node 18+ (the project's Node 16 default is too old for Playwright). Use nvm:

```sh
nvm use 22
# Site must be reachable. The VS Code Live Server on :5500 works.
# Otherwise: npx http-server -p 5500
npm run perf
```

Open the result: [perf-report.md](perf-report.md).

## Options

```sh
npm run perf -- --headed              # watch the browser drive itself
npm run perf -- --throttle 1          # no CPU throttle (default 4× = Moto G Power)
npm run perf -- --url http://localhost:5500/
npm run perf -- --dwell 5000          # default per-route dwell in ms
```

## How it works

- **agent.js** — injected into the page *before* any site script via Playwright's `addInitScript`. Runs one `requestAnimationFrame` loop, records frame deltas to a ring buffer, observes `longtask` + `layout-shift` via `PerformanceObserver`. Exposes `window.__perf` so the driver can scope metrics per route.
- **clickthrough.mjs** — Playwright driver. Walks `JOURNEY`, dwelling on each route while the agent accumulates frame data, then reads `window.__perf.endRoute()` between steps.
- The driver throttles CPU via the Chrome DevTools Protocol (`Emulation.setCPUThrottlingRate`). 4× lines up with the Lighthouse "Moto G Power" emulation profile.

## Reading the report

- **FPS** — ✓ ≥50, ~ 30–50, ✗ <30. The dashboard route is the usual ✗ (pet 3D + heatmap).
- **p95 frame** — 95th-percentile frame duration in ms. 60 fps target = 16.7 ms.
- **Long tasks** — main-thread tasks ≥50 ms. These are what kill TBT and interaction latency.
- **Heap Δ** — JS heap growth during the route. Significant positives across nav suggest a leak (uncleaned listeners, retained closures).

## Extending the journey

Add a step to `JOURNEY` in `clickthrough.mjs`. Each step is `{ label, go, wait?, dwell? }`:

```js
{
  label: 'mocks',
  go: (page) => page.evaluate(() => { location.hash = '#mocks'; }),
  wait: 'text=Mock interview',
  dwell: 3000,
}
```
