# UI v2 implementation record

Branch: `redesign/ui-v2`. Original version: `main` at `d86a0d6`.
The source brief is [RVMX_REDESIGN_PLAN.md](RVMX_REDESIGN_PLAN.md).
Simulation engines under `src/engine/` and `src/cpu/` are preserved.

## Phase 1 — Design foundation

- Replaced the legacy stylesheet with layered tokens, base, layout, theme, and component files.
- Bundled Inter and JetBrains Mono. Added dark, light, and high-contrast themes with saved selection.
- Replaced SVG/chart color literals with semantic variables and removed unused legacy selectors.
- Increased UI text and control sizing; retained the original UI temporarily for the architecture phase.
- Validation: production build; all 79 existing tests; desktop/mobile Chrome captures with no runtime errors or mobile page overflow.

## Phase 2 — Workspace architecture

- Added hash routes, guarded local persistence, separate workspace/UI/settings stores, compressed size-limited share links, and recovery boundaries.
- Preserved unsaved drafts separately from the assembled program. Invalid saved or shared configurations cannot reach the engines.
- Playback pauses on Learn; reload restores work without starting playback.
- Validation: production build; 84 unit tests; real-browser checks for reload persistence, themes, share restoration in a fresh context, routes, and playback safety; desktop/mobile captures.

## Phase 3 — Workspace layout

- Split the shell, navigation, controls, configuration, explorer, performance, and learning views into focused components.
- Replaced stacked visualizations with tabs, added a sticky desktop inspector and playback bar, and auto-sized the source editor.
- Added grouped configuration presets and a pending-change review before applying.
- Mobile now has labeled bottom navigation, a compact fixed playback bar, and an instruction inspector sheet. Tablet uses an icon rail.
- Validation: production build; 84 unit tests; browser layout checks at 320, 360, 390, 768, 1180, 1280, and 1440px; selection/preset/sheet interaction checks; desktop/mobile captures.

## Phase 4 — Guided learning and professional tools

- Added first-run experience choices, a five-step tour, help/shortcuts, a searchable keyboard command menu, and saved Guided/Expert density.
- Built 13 lessons with real-snapshot mini-processors, runnable examples, two quizzes each, saved completion, glossary search/tooltips, and searchable assembly reference.
- Added timeline/metrics CSV and JSON, SVG/PNG image export, copied run summaries, named experiments with JSON import/export, saved CPU presets, pinned-run comparisons, and a sortable/filterable paginated trace.
- Performance timeline selection now opens an inspector for the correct independent CPU model.
- Validation: production build; 90 unit tests; browser workflows for commands/shortcuts, trace filtering, experiment export, pinned comparisons, quiz/progress, Try it, tour, and mobile/desktop captures.

## Phase 5 — Shared components and visualizations

- Completed reusable buttons, segmented controls, tabs, panels, metrics, tooltips, dialogs/drawers/sheets, notifications, status pills, and feedback states; documented their contracts in `components.md`.
- Rebuilt both processor diagrams with readable nodes, coherent stage colors, keyboard selection, legends, text alternatives, and snapshot details.
- Added timeline zoom/window controls, cycle jumping, full cell labels, sticky instruction columns, and bounded row rendering. Inactive cells no longer add tab stops.
- Added synchronized table selection, soft-wrapped source with measured gutter alignment, accessible chart tables, and per-chart image exports.
- Validation: production build; 90 unit tests; browser checks for stage/row selection, timeline jumps, wrapped alignment, keyboard activation, chart tables, and downloaded standalone SVG/PNG files; visual captures.

## Phase 6 — Polish and motion

- Added instruction tokens that move between real snapshot locations, restrained selection/value feedback, and consistent status presentation.
- Added a plain-language cycle summary with immediate manual-step announcements and throttled announcements during playback.
- Stabilized visualization detail and summary heights while stepping. All motion follows reduced-motion preferences.
- Validation: production build; 90 unit tests; desktop/mobile browser captures without runtime errors or page overflow.

## Phase 7 — Accessibility

- Fixed transient theme-switch contrast, isolated scrollable desktop content from the playback bar, and completed the diagram text alternative.
- Added explicit modal focus wrapping, correct native Space behavior, independent tab/radio arrow handling, an equivalent full-size source-line inspection action, and error association.
- Added keyboard/drag-operated inspector sheet snap sizes. Glossary popovers remain inside their owning modal.
- Validation: production build; 90 unit tests; axe scans of 25 UI states across three themes with zero violations; manual browser automation for focus containment/return, keyboard controls, reduced motion, 200% equivalent layout, sheet gestures, and source inspection; desktop/mobile captures.

## Phase 8 — Performance and regression coverage

- Added 37 reproducible Playwright tests and eight reviewed screenshot baselines, including theme/route accessibility scans, all examples, persistence/sharing, lessons, exports, comparisons, keyboard behavior, and responsive layouts.
- Expanded workspace tests to cover bounded decompression and guarded imported state. All 91 unit tests pass, including the original 79 CPU tests.
- Removed unused styles, consolidated primitive styling, bundled only the two needed font assets, and added token/bundle checks.
- Verified lazy route/chart loading and bounded timeline/trace rendering. Exported metrics now include branch, occupancy, and execution-unit data where available.
- Production Lighthouse scores: 100 Performance, 100 Accessibility, 100 Best Practices. Default replay p95: 16.8 ms to the next animation frame. See `QUALITY_REPORT.md`.
