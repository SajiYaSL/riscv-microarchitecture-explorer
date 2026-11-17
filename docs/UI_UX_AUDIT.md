# RVMX UI/UX Audit Brief

Source review plus Chrome layout checks at 320–1440px. The dashboard is visually consistent, with accessibility and maintainability as the main improvement areas.

## 1. Tech stack

React 18 + TypeScript; Vite 6 build tool; plain global CSS with some inline chart/SVG styling. Lucide React supplies icons; Recharts supplies charts. Custom UI components; no Tailwind, component framework, or routing library. Vitest handles tests. See [package.json](../package.json).

## 2. Folder structure

Two directory levels, excluding internal tooling:

```text
.github/
  workflows/
docs/
  screenshots/
examples/
public/
scripts/
src/
  components/
  cpu/
  engine/
tests/
dist/              # generated
  assets/
node_modules/      # dependencies
```

App entry points are `src/main.tsx` and `src/App.tsx`; global styling lives in `src/styles.css`.

## 3. Pages/routes

All three views use `/`, selected through React state in [App.tsx](../src/App.tsx).

| View | Main components |
| --- | --- |
| CPU Explorer | `AssemblyEditor`, `Configuration`, `InorderDiagram` or `OooDiagram`, `RobViewer`, `SchedulingViewer`, `RenameViewer`, `MemoryQueue`, `Timeline`, `Performance`, register/memory inspectors |
| Performance Lab | Shared execution controls and `Configuration`; verification banner; comparison metrics; two `Timeline` instances; `Performance` charts |
| Learning Center | Inline concept cards; `Panel` containing supported assembly reference |

Shared primitives are `Panel` and `Metric`. Sidebar, header, controls, and footer are largely inline in `App.tsx`.

## 4. Global styles

Defined in [styles.css](../src/styles.css).

- **Colors:** background `#090f1d`; sidebar `#0c1424`; panels `#111b2d`; borders `#263249`; primary text `#e8edf7`; muted text `#94a4b9`; teal accent `#42d7c7`. Blue, green, purple, amber, and pink distinguish statuses.
- **Fonts:** declared `DM Sans` with system fallback; `JetBrains Mono` for code/data. Neither font is bundled or imported; Chrome used a fallback.
- **Sizing:** UI text mostly 10–14px, with some 8–9px labels. Main heading uses `clamp(30px,3.3vw,47px)`, overridden to 31px on mobile.
- **Spacing:** mostly 7–20px gaps/padding; desktop page padding `35px 36px 20px`; panel radii approximately 6–13px. No centralized spacing/color tokens.
- **Breakpoints:** `max-width:1180px` and `max-width:760px`; reduced-motion media queries are present.

## 5. Navigation

Desktop has a sticky sidebar with three workspace buttons and simulation status. Mobile converts it into a horizontal, icon-only navigation row with accessible names. Header contains breadcrumb text and a simulation badge; footer contains project/model information. Native selects handle examples and speed; configuration expands inline. No dropdown navigation or modal menus.

## 6. Forms and interactions

Syntax-highlighted assembly textarea, example selector, assemble/load action, CPU mode toggles, run/pause/reset/step/finish buttons, speed selector, history slider, numeric CPU settings, predictor selector, memory-address input, register buttons, diagram inspectors, and timeline pagination. Validation disables invalid submissions and displays alerts. No modal dialogs or conventional `<form>` elements.

## 7. Responsive handling and accessibility

- Grids stack at narrower widths; metrics become two columns. Diagrams retain a 760px minimum width inside scroll containers. Sampled views had no overall horizontal overflow or uncaught browser errors.
- Good foundations: labeled inputs, named icon controls, visible keyboard-focus rules, Enter/Space support for diagram controls, validation alerts, and reduced-motion styling.
- **Contrast:** footer text is approximately **3.97:1** and sidebar small print **3.72:1**, below 4.5:1 for small text.
- Execution buttons are about 29px high; timeline arrows approximately 26–29px, making touch interaction cramped.
- Timeline paging uses ambiguous `↑`/`↓` names; phase buttons have terse labels. Charts lack equivalent accessible data tables. Register selection lacks an announced selected state.
- No navigation landmark or skip link. There are no content images needing alt text; architecture SVGs have accessible labels.

## 8. Main UI problems and inconsistencies

- **Fragile view/state handling:** views cannot be bookmarked; refresh resets the workspace and edits. Switching to Learning Center leaves playback running while its controls disappear.
- **Long inspection flow:** explorer panels create substantial vertical scrolling. Selecting an instruction updates a potentially distant lifecycle inspector without moving focus or scrolling to it.
- **Small, dense presentation:** tiny metadata and icon-only mobile navigation reduce readability and discoverability.
- **CSS duplication:** repeated `.panel-header`, `.metrics`, `.pill`, register, and breakpoint rules span the original styles and appended workspace styles. Legacy selectors such as `.editor-body`, `.mode-switch`, and `.stage-card` remain alongside replacements.
- **Scattered theme values:** CSS, SVGs, and chart components hard-code related colors independently, increasing the chance of visual drift.
