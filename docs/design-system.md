# RVMX design system

RVMX is a quiet, precise workspace for learning through direct inspection. Code, current state, and the next useful action take priority over decorative content.

## Foundations

`src/styles/tokens.css` is the application’s source of truth for surfaces, text, semantic colors, stage colors, typography, spacing, shape, motion, and layering. `themes.css` overrides those tokens for light and high-contrast appearances.

| Role | Token / convention |
| --- | --- |
| Main canvas, navigation, panels | `--bg-0` through `--bg-3` |
| Primary, secondary, supporting text | `--text-1`, `--text-2`, `--text-3` |
| Main action and selected state | `--accent`, `--accent-contrast`, `--accent-soft` |
| Information, success, warning, error | Semantic `--info`, `--success`, `--warning`, `--danger` tokens and soft surfaces |
| Instruction stages | `--stage-*`; one palette shared by diagrams, tokens, timelines, legends, and charts |
| UI / code | Bundled Inter Variable / JetBrains Mono Variable |
| Text | 15px body, 13px supporting text, 12px minimum labels |
| Spacing | 4, 8, 12, 16, 24, 32, 48px scale |
| Controls | 40px desktop, 44px mobile/touch; compact editor gutter has an equivalent full-size inspection action |
| Motion | 120–200ms, removed under reduced motion |

Light-theme stage fills use darker colors with light text; dark-theme fills use lighter colors with dark text. Text and selection do not depend on stage color alone.

## Layout

- **Desktop, ≥1180px:** labeled sidebar, fixed header/playback controls, independently scrollable content, editor and sticky inspector, tabbed visualizations.
- **Tablet, 760–1179px:** icon rail with named links; inspector moves below the editor.
- **Mobile, <760px:** labeled bottom navigation, fixed 44px playback controls, a More sheet, and an inspector sheet with keyboard/drag snap sizes.

Tables, diagrams, and timelines scroll within their own regions. The content area itself must fit horizontally. The diagram’s Fit action is optional; its text view preserves a readable alternative.

## Components

See [components.md](components.md) for APIs, variants, and interaction contracts. Keep primitive styles in their component files; put feature-specific layout in workspace/feature styles.

- Give each task one primary action. Use ghost buttons for supporting actions.
- Use native inputs, buttons, and dialogs. Tab/radio groups provide arrow-key navigation without stepping the simulation.
- Add an accessible name and tooltip to icon-only controls.
- Keep explanations in Guided mode and make technical terms discoverable through glossary popovers.
- Keep body text in sentence case. Use uppercase only for short instruction/stage labels.
- Pair color with names, icons, changed-value dots, or status text.
- Keep visualizations connected to actual snapshots; preserve architectural/speculative distinctions.
- Keep source drafts separate from the loaded program. Validate imported work before replacing the current workspace.

## State and routes

The shell is in `src/app/`; features are in `src/features/`; separate workspace, UI, settings, and experiment stores live in `src/state/`.

Supported views: `/#/explorer`, `/#/performance`, `/#/learn`, `/#/learn/:lessonId`, and `/#/learn/glossary`. Hash routing works on static hosts. Share links use compressed, bounded data and open paused.

Browser storage is optional. Program drafts, the assembled source, settings, presets, experiments, and progress persist locally when available. Learn pauses playback. Changing CPU settings restarts both models.

## Checks and assets

Run `npm run check:ui` for color literals, undersized text, and removed legacy selectors. Run `npm run check:bundle` after a production build. Browser tests cover themes, focus, responsive layout, and visual baselines; see [QUALITY_REPORT.md](QUALITY_REPORT.md).

Standalone brand assets embed colors resolved from the tokens. Run `npm run brand` to regenerate the SVG logo/artwork, app manifest, and PNG renditions for social previews and platform icons. A compatible local browser is required for PNG rendering.
