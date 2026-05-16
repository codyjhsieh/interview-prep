# Clickthrough perf report

- Captured: 2026-05-16T22:30:58.205Z
- URL: http://localhost:5500/
- CPU throttle: 4× (Lighthouse Moto G Power ≈ 4×)
- Viewport: 390x844 @2x
- Wall time: 53.8s

## Initial paint

| Metric | Value |
|---|---|
| First Contentful Paint | 1492.0 ms |
| DOMContentLoaded | 2395.1 ms |
| load event | 3021.2 ms |

## Per-route

Status: ✓ = ≥50 fps · ~ = 30–50 · ✗ = <30. p95 frame = 95th-percentile frame duration in ms (60 fps target ≈ 16.7 ms).

| Route | FPS | p95 frame | max frame | Long tasks | Long-task ms | Heap Δ |
|---|---|---|---|---|---|---|
| `cold-load` | **15.6** ✗ | 100.0 ms | 150.0 ms | 0 | 0 | +0.2 MB |
| `curriculum` | **15.7** ✗ | 116.7 ms | 299.9 ms | 3 | 365 | +0.0 MB |
| `category/coding` | **17.5** ✗ | 83.3 ms | 133.3 ms | 0 | 0 | +0.0 MB |
| `lesson-open` | **6.7** ✗ | 216.7 ms | 283.4 ms | 1 | 71 | +0.0 MB |
| `lesson-close` | **15.9** ✗ | 116.6 ms | 150.0 ms | 1 | 133 | +0.0 MB |
| `flashcards` | **16.0** ✗ | 116.6 ms | 133.3 ms | 1 | 55 | +0.0 MB |
| `flashcard-flip` | **16.0** ✗ | 100.1 ms | 166.7 ms | 0 | 0 | -0.0 MB |
| `companies` | **10.2** ✗ | 399.9 ms | 466.7 ms | 4 | 1399 | -0.2 MB |
| `dashboard` | **14.4** ✗ | 116.6 ms | 333.3 ms | 3 | 403 | +0.4 MB |
| `review` | **14.5** ✗ | 100.0 ms | 166.7 ms | 0 | 0 | +0.0 MB |
| `prep` | **17.8** ✗ | 83.3 ms | 100.0 ms | 0 | 0 | -0.9 MB |

## Diagnostics

- Worst sustained FPS: `lesson-open` at **6.7 fps** (p95 frame 216.7 ms).
- Total long tasks across journey: **13**.
