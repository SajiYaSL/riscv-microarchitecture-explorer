# RVMX Full UI/UX Redesign Plan (Codex Task Spec)

> Hand this file to Codex. Work **phase by phase**, in order. Finish, test, and commit each phase before starting the next.

## 0. Context

- **Product:** RVMX, an interactive RISC-V microarchitecture explorer (in-order and out-of-order CPU, ROB, rename, scheduling, timeline, performance lab, learning center).
- **Stack (keep it):** React 18 + TypeScript, Vite 6, plain CSS, Lucide React, Recharts, Vitest.
- **Audience:** (1) undergraduates learning computer architecture, (2) industry professionals who want fast, precise, exportable analysis.
- **Goal:** a product that feels guided and welcoming for students, and dense, fast, and trustworthy for professionals. The same app serves both through a **Guided / Expert** mode.
- **Input audit:** `UI_UX_AUDIT.md` (existing). Every finding in it is mapped to a task in Section 9.

### Hard rules for Codex

1. **Do not change simulation logic.** Leave `src/engine/` and `src/cpu/` untouched except for exporting existing data. Existing tests must keep passing.
2. Work on a new branch: `git checkout -b redesign/ui-v2`.
3. After each phase: run `npm run build`, `npm test`, fix errors, then commit with a clear message.
4. No new heavy dependencies. Allowed additions: `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` (or the variable version), `react-router-dom` (or a tiny hash router), `@playwright/test`, `@axe-core/playwright`, `driver.js` (or a small custom tour). Ask before adding anything else.
5. Never commit secrets or `.env` files.
6. Keep all user-facing text clear and plain. Avoid jargon without a tooltip.

---

## 1. Problems Observed (from audit + screenshots)

| # | Problem | Evidence |
|---|---------|----------|
| 1 | Text is too small and dense | 8–11px labels, "MICROARCHITECTURE EXPLORER" wraps awkwardly in sidebar brand |
| 2 | Low contrast small text | Footer 3.97:1, sidebar small print 3.72:1 (needs 4.5:1) |
| 3 | Wasted space and imbalance | Assembly editor has a large empty area below 6 lines; Experiment Guide card has a big blank gap |
| 4 | Long vertical scroll | Datapath, inspectors, timeline, memory, performance all stacked in one column |
| 5 | Disconnected inspection | Clicking an instruction updates a lifecycle panel far away with no focus or scroll |
| 6 | Controls feel cramped | Run/step/finish buttons ~29px high; on mobile controls wrap into a messy 3-row block |
| 7 | Icon-only mobile nav | Three unlabeled icons at top; poor discoverability |
| 8 | No persistence or deep links | Refresh loses the program; views cannot be bookmarked or shared |
| 9 | Fonts not bundled | DM Sans / JetBrains Mono fall back to system fonts |
| 10 | CSS duplication and hard-coded colors | Repeated `.panel-header`, `.metrics`, legacy selectors; SVG/charts have their own colors |
| 11 | Hero uses space but gives no onboarding | "Inside the machine." is nice but there is no "start here" path for beginners |
| 12 | Charts and diagrams are visual only | No accessible data tables or text equivalents |

---

## 2. Design Principles

1. **Clarity first.** One primary action per area. Always show what is happening *now* and what to do *next*.
2. **Progressive disclosure.** Guided mode shows explanations and fewer controls; Expert mode shows everything densely.
3. **Direct manipulation.** Clicking anything (instruction, pipeline stage, ROB entry) focuses the related inspector and highlights the same instruction everywhere.
4. **Consistency.** One token system, one component per pattern.
5. **Accessible by default.** WCAG 2.2 AA minimum.
6. **Fast.** Interaction under 100ms; no layout shift while stepping.

---

## 3. Phase 1: Design System and Tokens

Create `src/styles/` and split `styles.css` into layered files:

```
src/styles/
  tokens.css        # all CSS variables (colors, type, space, radius, shadow, motion, z-index)
  base.css          # reset, body, typography, focus ring, scrollbars
  layout.css        # shell, grids, breakpoints
  components/
    button.css  panel.css  metric.css  pill.css  tabs.css
    tooltip.css  editor.css  timeline.css  diagram.css  form.css
  themes.css        # dark (default), light, high-contrast
  index.css         # @import order
```

### 3.1 Tokens (starting values; Codex may refine but must meet contrast)

```css
:root {
  /* Surfaces (dark default) */
  --bg-0:#070c18; --bg-1:#0b1322; --bg-2:#101a2e; --bg-3:#16233a;
  --border-subtle:#1f2c44; --border:#2a3a56; --border-strong:#3b4f72;

  /* Text (all >= 4.5:1 on bg-1/bg-2) */
  --text-1:#eef2fb; --text-2:#b4c0d4; --text-3:#8d9bb2;

  /* Accent and semantic */
  --accent:#2dd4bf; --accent-hover:#5eead4; --accent-contrast:#04201c;
  --info:#60a5fa; --success:#4ade80; --warning:#fbbf24; --danger:#f87171; --special:#c084fc;

  /* Pipeline stage colors (use everywhere: diagram, timeline, charts, legend) */
  --stage-fetch:#60a5fa; --stage-decode:#818cf8; --stage-rename:#c084fc;
  --stage-dispatch:#f472b6; --stage-issue:#fbbf24; --stage-exec:#4ade80;
  --stage-rob:#2dd4bf; --stage-retire:#a3e635; --stage-squash:#f87171;

  /* Type */
  --font-ui:"Inter Variable",system-ui,sans-serif;
  --font-mono:"JetBrains Mono Variable",ui-monospace,monospace;
  --fs-xs:12px; --fs-sm:13px; --fs-md:15px; --fs-lg:18px; --fs-xl:24px; --fs-2xl:clamp(28px,3vw,40px);

  /* Space (4px scale) */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px; --sp-7:48px;

  /* Shape and depth */
  --r-sm:6px; --r-md:10px; --r-lg:14px;
  --shadow-1:0 1px 2px rgba(0,0,0,.3); --shadow-2:0 8px 24px rgba(0,0,0,.35);

  /* Motion */
  --ease:cubic-bezier(.2,.8,.2,1); --dur-fast:120ms; --dur:200ms;

  /* Sizing */
  --hit-min:40px;           /* min touch target (44px on touch devices) */
  --sidebar-w:248px;
}
```

### 3.2 Rules

- **Minimum body text 13px; minimum any visible text 12px.** No 8–10px text anywhere.
- Replace every hard-coded color in CSS, SVG, and Recharts with tokens (`var(--stage-rob)`, or a `src/theme/colors.ts` that reads CSS variables).
- Bundle fonts through `@fontsource` imports in `main.tsx`.
- Provide **Dark (default), Light, High-contrast** themes via `data-theme` on `<html>`, with a toggle in the header and `prefers-color-scheme` as the first-run default. Save the choice.
- Delete all legacy selectors (`.editor-body`, `.mode-switch`, `.stage-card`, and any other unused ones). Use a quick script or grep to confirm they are unused first.
- Global focus ring: `:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }`.

**Done when:** no hex colors remain outside `tokens.css` / `themes.css`; build passes; visual output matches current look or better.

---

## 4. Phase 2: App Architecture and State

1. **Routing:** add real routes (React Router or hash router so static hosting works).
   - `/#/explorer`, `/#/performance`, `/#/learn`, `/#/learn/:lessonId`
2. **Split `App.tsx`** into:
   ```
   src/app/
     AppShell.tsx  Sidebar.tsx  TopBar.tsx  MobileTabBar.tsx
     ExecutionBar.tsx   # run/pause/step/reset/finish/speed/history
     ConfigDrawer.tsx   # replaces inline Configure expansion
   src/features/
     explorer/  performance/  learn/
   src/state/
     simulationStore.ts  uiStore.ts  settingsStore.ts
   ```
3. **Persistence:** save to `localStorage` (try/catch every access): program text, config, selected example, theme, mode, speed, last route.
4. **Shareable links:** encode program and config in the URL hash (compressed, size-limited) and add a **Share** button that copies the link. Loading a link restores state.
5. **Playback safety:** pause automatically when leaving Explorer/Performance for Learn, or keep a mini playback bar visible. (Audit issue: playback runs while controls vanish.)
6. **Error boundary** around each view with a friendly recovery message and "Reset workspace" button.

**Done when:** refresh keeps the work; links open the right view; no playback runs invisibly.

---

## 5. Phase 3: Layout and Information Architecture

### 5.1 Desktop shell (>=1180px)

```
┌ Sidebar ┬ TopBar: breadcrumb · Guided/Expert · Theme · Share · Help(?) ┐
│ brand   ├──────────────────────────────────────────────────────────────┤
│ nav     │ ExecutionBar (sticky): mode · ⟲ ◀ ▶/⏸ ▶| Finish · speed · clock │
│ status  │ ─ history scrubber ──────────────────────────────────────── │
│         │ ┌ Left: Program ───────────┐ ┌ Right: Inspector (sticky) ──┐ │
│         │ │ Editor (auto height)     │ │ Tabs: Overview | Instruction │ │
│         │ │ Examples + Assemble      │ │ | Registers | Memory | Config│ │
│         │ └──────────────────────────┘ └──────────────────────────────┘ │
│         │ KPI strip (4 metrics, compact)                                │
│         │ Main visualization tabs: Datapath | Timeline | ROB | Rename  │
│         │ | Scheduling | Memory queue | Performance                    │
└─────────┴──────────────────────────────────────────────────────────────┘
```

Key changes:

- **Replace the long vertical stack with tabs** under one "Visualization" panel. Remember the last tab. Expert mode may show two panels side by side (split view).
- **Sticky ExecutionBar** so controls are always reachable while scrolling.
- **Sticky Inspector** on the right. Selecting an instruction anywhere (editor line, ROB entry, timeline row, pipeline chip) opens the **Instruction** tab and highlights the same instruction in every view. If the inspector is off-screen (mobile), show a toast "Instruction I3 selected · View" or open a bottom sheet.
- **Editor panel:** auto-size height to content (min 6 lines, max ~16 then scroll). Remove the big empty gap. Show inline error markers and a status line ("6 lines · assembled · 0 errors").
- **Experiment Guide card:** becomes a compact collapsible "Lesson" card in Guided mode (what to watch, 1–3 bullets, "Next step" button); hidden or collapsed in Expert mode. Config values (width, ROB size, PRF, predictor) move to a small chip row, not a tall empty card.
- **Configure** opens a **right-side drawer** with grouped fields, presets (Small / Typical / Wide), and a "Reset to defaults" button. Changes apply with an explicit "Apply & restart" button and a diff of what changed.
- **Hero:** keep the strong "Inside the machine." headline only on a first-run/Home state. In normal use, collapse to a compact page title + one-line description so work areas start higher.

### 5.2 Tablet (760–1180px)

- Sidebar collapses to an icon rail with labels on hover/focus.
- Inspector becomes a collapsible panel under the editor.

### 5.3 Mobile (<760px)

- **Bottom tab bar** with icon **and label** (Explorer · Performance · Learn). Remove the top icon-only nav.
- Top bar: logo, view title, menu (theme, share, help).
- **Compact ExecutionBar:** one row `⟲ ◀ ▶ ▶|` with large (44px) buttons, plus a "More" sheet for Finish, speed, and mode. Pin it above the bottom tab bar while Explorer is open.
- Mode switch (In-order / Out-of-order) as a segmented control at the top of the page.
- Inspector as a **bottom sheet** (drag handle, snap points).
- Diagrams: horizontal scroll with a visible scroll hint, pinch-zoom if feasible, and a "Fit" button.
- Editor: horizontal scroll or soft wrap toggle; never clipped without indication.

---

## 6. Phase 4: Serving Students and Professionals

### 6.1 Guided / Expert mode (global toggle, saved)

| Feature | Guided (students) | Expert (professionals) |
|---|---|---|
| Density | Comfortable spacing, larger text | Compact spacing |
| Explanations | Lesson card, "What to watch", inline hints | Hidden; hover tooltips only |
| Terms | Glossary tooltips on ROB, PRF, RAT, IPC, CPI, squash, etc. | Same, but subtler |
| Panels | Essential tabs (Datapath, Timeline, ROB) | All tabs + split view |
| Metrics | IPC, retired, stalls, squashed | Plus occupancy, branch accuracy, per-stage stalls, utilization |

### 6.2 First-run experience

- Welcome dialog: "I'm learning" (Guided) / "I'm experienced" (Expert), "Start with an example" or "Paste your own".
- 5-step product tour (editor → controls → datapath → inspector → timeline). Re-openable from Help.
- Empty state for a fresh load: preloaded small example with a pulsing hint on the Run button.

### 6.3 Learning Center redesign

- Lesson list with **difficulty tags** (Beginner / Intermediate / Advanced) and estimated time.
- Each lesson: concept explanation (short), animated or interactive mini-diagram, **"Try it" button that loads the example into Explorer** with the right config, and 2–3 quiz questions with feedback.
- Progress tracking (saved locally) and "Next lesson" suggestion.
- Glossary page with search; linked from tooltips.
- Keep the supported-assembly reference as a searchable table (instruction, format, description, example).

### 6.4 Professional features

- **Command palette** (`Ctrl/Cmd+K`): jump to views, load examples, toggle mode/theme, run actions.
- **Keyboard shortcuts:** `Space` run/pause, `→` step, `←` step back, `R` reset, `F` finish, `[` `]` previous/next tab, `?` show shortcuts. Document in a shortcuts dialog.
- **Export:** CSV and JSON of timeline and metrics; PNG/SVG of datapath and charts; "Copy run summary" to clipboard.
- **Compare runs:** pin a run (config + results) and compare in Performance Lab (in-order vs OoO, config A vs B) with delta badges (e.g., IPC +38%).
- **Presets and saved experiments:** named configs stored locally; import/export as JSON.
- **Trace view:** table of every instruction with fetch/issue/execute/commit cycles, sortable and filterable.

---

## 7. Phase 5: Component Specifications

Build each as a reusable component with props, variants, and states. Document in a `docs/components.md` or Storybook-lite page `/#/dev/components` (dev only).

| Component | Requirements |
|---|---|
| **Button** | Variants: primary, secondary, ghost, danger. Sizes: sm (32), md (40), lg (44). Icon-only buttons require `aria-label` and a tooltip. Loading and disabled states. |
| **SegmentedControl** | For In-order/Out-of-order and similar. Keyboard arrows, `role="radiogroup"`. |
| **Tabs** | Accessible tablist, arrow-key navigation, overflow scroll on narrow widths. |
| **Panel** | Header (title, subtitle, actions), collapsible, consistent padding. Single implementation replaces all duplicates. |
| **Metric / KPI** | Label (>=12px), value, delta, tooltip definition, optional sparkline. |
| **Tooltip / Popover** | Hover, focus, and tap; Esc to close; does not trap focus. |
| **Drawer / BottomSheet / Dialog** | Focus trap, Esc, focus return, scroll lock, `aria-modal`. |
| **Toast** | Non-blocking, `role="status"`, auto-dismiss with pause on hover. |
| **CodeEditor** | Line numbers, syntax highlighting, current-PC line highlight, inline error markers with messages, soft wrap toggle, readable 14px mono, auto-height. Keep textarea-based approach if it is simplest, but align overlay and gutter precisely. |
| **PipelineDiagram** | Stage boxes with larger labels (>=13px), animated token movement (respect reduced motion), stall/flush indicators with legend, click to select, keyboard focusable, tooltip with stage description. |
| **Timeline** | Gantt-style rows per instruction, colored by stage token, sticky instruction column, zoom, jump-to-cycle, clear paging buttons labelled "Previous instructions / Next instructions" (not arrows only). |
| **ROB / Rename / Scheduler viewers** | Table style with row highlight sync, status pills, age indicator, `aria-selected` for selected rows. |
| **Charts** | Token colors, axis labels >=12px, tooltips, legend, "View as table" toggle for accessibility. |
| **StatusPill** | Consistent set: running, paused, finished, error, with icon plus text (not color alone). |
| **EmptyState / ErrorState / Skeleton** | Friendly copy plus a next action. |

---

## 8. Phase 6: Visual Polish and Motion

- Larger, clearer type hierarchy: page title (`--fs-2xl`), section titles (`--fs-lg`), body (`--fs-md`/`--fs-sm`), labels (`--fs-xs`, uppercase only when short).
- Remove excessive letter-spaced uppercase microcopy; use sentence case for most labels.
- Brand block: logo + "RVMX" with a one-line tagline that does not wrap awkwardly; remove or enlarge the tiny "MICROARCHITECTURE EXPLORER".
- Sidebar bottom text ("Observe the state. Understand the machine.") becomes a single readable line at >=12px with AA contrast.
- Subtle motion: 120–200ms transitions for hover/selection; stage-token movement during stepping; no motion when `prefers-reduced-motion`.
- Consistent iconography (Lucide only), 16–20px, stroke 1.75.
- Highlight the **current clock cycle changes** (what moved, what stalled) with short-lived highlights and a "Cycle summary" line: "Cycle 8: I3 issued, I4 executed, 0 stalls."

---

## 9. Phase 7: Accessibility (maps to audit findings)

| Audit finding | Task |
|---|---|
| Footer 3.97:1, sidebar small print 3.72:1 | Use `--text-2`/`--text-3` tokens that pass 4.5:1; verify with axe |
| Buttons ~29px, timeline arrows 26–29px | Min hit area 40px desktop, 44px touch |
| Ambiguous `↑`/`↓` timeline names | Rename to "Previous instructions" / "Next instructions" with visible text or tooltip |
| Terse phase button labels | Full `aria-label`s, e.g. "Show Rename stage" |
| Charts lack data tables | "View as table" toggle plus `aria-describedby` summary text |
| Register selection lacks announced state | `aria-pressed` or `aria-selected` plus visible selected style |
| No nav landmark, no skip link | `<nav aria-label="Primary">`, `<main id="main">`, "Skip to content" link, `<header>`, `<footer>` landmarks |
| Playback with hidden controls | Pause on route change or keep mini player |
| Live updates | `aria-live="polite"` cycle summary region (throttled so stepping does not spam) |

Additional requirements:

- Full keyboard operation for every interaction, including diagrams and timeline.
- Do not rely on color alone (add icons, patterns, or text for stall/squash/commit).
- Respect `prefers-reduced-motion` and `prefers-contrast`.
- Zoom to 200% without loss of function.

---

## 10. Phase 8: Performance and Quality

- Lazy-load the Performance Lab and Learning Center routes (`React.lazy`).
- Memoize heavy diagram/timeline components; virtualize long timeline/trace tables.
- Keep bundle small; analyze with `vite build --report` or `rollup-plugin-visualizer`.
- **Targets:** Lighthouse (desktop) Performance >=90, Accessibility >=95, Best Practices >=95.
- **Tests:**
  - Vitest unit tests for state stores, URL encode/decode, command palette, shortcut handling.
  - Playwright e2e: load app, run program, step, switch views, persistence after reload, share link restore, mobile viewport.
  - `@axe-core/playwright` scan on each view in dark and light themes: zero serious/critical violations.
  - Visual snapshots at 360, 768, 1280, and 1440px widths.

---

## 11. Phase 9: Documentation and Release

- Update `README.md`: features, screenshots (replace `docs/screenshots/`), keyboard shortcuts, accessibility statement.
- Add `docs/design-system.md` (tokens, components, do/don't).
- Add `CHANGELOG.md` entry for v2 UI.
- CI (`.github/workflows`): build, unit tests, Playwright, axe.
- Add favicon set, Open Graph image, page title/description meta.

---

## 12. Suggested Order and Size

| Phase | Work | Effort |
|---|---|---|
| 1 | Tokens, fonts, CSS split, cleanup | Small |
| 2 | Routing, state split, persistence, share links | Medium |
| 3 | New layout (desktop/tablet/mobile) | Large |
| 4 | Guided/Expert, onboarding, learning center, pro features | Large |
| 5 | Component library | Medium (done alongside 3) |
| 6 | Polish and motion | Small |
| 7 | Accessibility pass | Medium |
| 8 | Performance and tests | Medium |
| 9 | Docs and release | Small |

If time is limited, ship in this **priority order**: Phase 1 → 2 → 3 → 7 → 4 (Guided/Expert + onboarding) → remainder.

---

## 13. Final Acceptance Checklist

- [ ] No simulation logic changed; all original tests pass
- [ ] All colors/fonts/spacing come from tokens; fonts bundled
- [ ] No text below 12px; all text >=4.5:1 contrast in every theme
- [ ] Dark, Light, High-contrast themes work and persist
- [ ] Routes, deep links, share links, and persistence work
- [ ] Sticky controls; inspector syncs with every selection
- [ ] Tabs replace the long vertical stack; no large empty panels
- [ ] Mobile: labeled bottom nav, compact 44px controls, bottom-sheet inspector, no horizontal page overflow
- [ ] Guided/Expert modes, first-run tour, glossary tooltips
- [ ] Learning Center has lessons, "Try it" links, and quizzes
- [ ] Command palette, shortcuts, export, compare runs
- [ ] Every audit finding in Section 9 is resolved
- [ ] axe: zero serious/critical issues; Lighthouse targets met
- [ ] Playwright e2e and visual tests pass in CI
- [ ] README and design-system docs updated

---

## 14. How to Use This File with Codex

Paste one prompt at a time, for example:

```
Read RVMX_REDESIGN_PLAN.md and UI_UX_AUDIT.md in the repo root.
Execute Phase 1 only (Design System and Tokens). Follow the Hard Rules in section 0.
Create the branch if it does not exist. When finished, run build and tests, summarize
what changed, list any files you removed, and stop so I can review.
```

Then continue with "Execute Phase 2 only…", and so on. After each phase, take new screenshots (desktop 1440px and mobile 390px) and compare with the originals.
