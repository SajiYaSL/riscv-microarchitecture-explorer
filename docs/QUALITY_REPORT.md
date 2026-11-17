# UI v2 quality report

Measured on 17 November 2026 using the production build on localhost. These measurements describe the website’s rendering and responsiveness.

## Automated verification

- **91 Vitest tests pass**, including all 79 original CPU/assembler tests and 12 workspace/tool checks.
- **37 Playwright tests pass** with matching Chromium 159, including all 11 assembly examples, both independent engines, configuration validation, precise faults, saved drafts, share restoration, lessons, exports, and comparisons.
- Axe scans cover dark, light, and high-contrast themes; all main views, lesson/glossary routes, active visualizations, and dialogs have **zero violations** for the selected WCAG 2.2 AA rule sets.
- Eight visual baselines cover dark/light Explorer layouts at **360, 768, 1280, and 1440px**. Additional layout checks cover **320, 390, 720, 760, 1024, and 1180px**.
- Keyboard tests cover tab/radio arrows, native Space activation, focus wrapping/return, reduced motion, and mobile sheet resizing. Separate gesture checks cover dragging the sheet between snap heights.
- Source and CPU engines in `src/engine/` and `src/cpu/` have no changes from the original `main` branch.

## Production measurements

Lighthouse 13.6.0, desktop preset, Chrome 157, initial welcome view at 1440 × 1000:

| Category | Target | Result |
| --- | --- | --- |
| Performance | ≥90 | **100** |
| Accessibility | ≥95 | **100** |
| Best Practices | ≥95 | **100** |

First contentful paint and largest contentful paint were about **0.20 seconds**; total blocking time was **0 ms** and cumulative layout shift was **0.0002**.

Default out-of-order replay, 12 manual steps, click dispatch to next animation frame: **16.7 ms median**, **16.8 ms p95**. The machine reached cycle 12 as expected. See [measurement data](quality-summary.json) for exact values and scenario.

## Bundle

- Initial JavaScript: **95.9 KB gzip**, below the enforced 110 KB budget.
- Global CSS: **12.5 KB gzip**.
- Charts load separately: **113.2 KB gzip**.
- Bundled font assets: Inter **48.3 KB** and JetBrains Mono **40.4 KB**.
- Performance and Learning views load on demand. Timeline and trace rendering use bounded pages.

## Reproduce

```bash
npm ci
npm test
npm run check:ui
npm run build
npm run check:bundle
npx playwright install chromium
npm run test:browser
```

For Lighthouse, serve the production build with `npm run preview`, then run:

```bash
npx lighthouse http://localhost:4173 --preset desktop \
  --only-categories performance,accessibility,best-practices
```

Visual baseline updates are intentional review artifacts:

```bash
npm run test:visual -- --update-snapshots
```

The accessibility results combine automated rules and the documented keyboard/gesture checks; they do not represent an independent screen-reader certification.
