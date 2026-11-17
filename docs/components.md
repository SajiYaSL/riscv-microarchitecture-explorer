# UI component reference

Components use the shared tokens in `src/styles/tokens.css` and theme overrides in `themes.css`. UI primitives live in `src/components/ui/`; processor visualizations live in `src/components/architecture/`.

| Component | API and states | Accessibility |
| --- | --- | --- |
| `Button` | `variant`: primary, secondary, ghost, danger; `size`: sm, md, lg; `loading`, `disabled`, forwarded ref | Native button; loading exposes `aria-busy`. Icon-only usage requires an accessible label. |
| `SegmentedControl` | Typed `value`, `options`, `onChange`, `label` | Radio group; arrow, Home, End keys; one tab stop. |
| `Tabs` | Typed `value`, `options`, `onChange`, `children`, `label` | Tab/tabpanel relationship; roving focus; arrows, Home, End. Overflow scrolls. |
| `Panel` | `title`, `subtitle`, `detail`, `actions`, `collapsible`, `defaultOpen`, `children` | Named section; optional disclosure exposes expanded state and controlled body. |
| `Metric` | `label`, `value`, `detail`, optional `definition`, `delta`, `history` | Definitions available by pointer, focus, and tap. Sparklines are decorative supplements to readable values. |
| `Tooltip` | `label`, `children`, optional `interactive` | Opens on hover, focus, or tap; Escape and outside click close it; interactive definitions link to the glossary. |
| `Dialog` | `open`, `onClose`, `title`, `description`; `kind`: dialog, drawer, sheet | Native modal focus containment, Escape, scroll lock, focus return, accessible title and description. |
| `Toast` | Driven by `notify(message)` | Polite status region; dismiss button; dismissal timer pauses on hover/focus. |
| `AssemblyEditor` | `value`, `onChange`, `activeLines`, selection/error line, `softWrap` | Labeled textarea, accessible line inspection, error markers. Overlay/gutter heights track wrapping and resize. |
| `InorderDiagram`, `OooDiagram` | Snapshot and instruction selection callback; OoO also takes configuration | Named interactive SVG groups, keyboard-operated nodes, selection state, descriptions, stage legend, text alternative in visualization toolbar. |
| `Timeline` | Simulation, cycle, selected instruction, callback, optional compact mode | Named instruction/cell buttons, paging, cycle jump, window size, sticky instruction labels, full stage legend. Inactive cells do not add tab stops. |
| ROB / scheduler / rename / memory viewers | Snapshot and selection | Named tables with captions and column headers; selected rows/buttons; status text accompanies semantic colors. |
| `Performance` | Simulation and selected cycle | Named charts with summaries, keyboard chart navigation, equivalent paginated data tables, SVG/PNG exports. |
| `StatusPill` | running, paused, finished, error, limited | Status icon plus visible text. |
| `EmptyState`, `ErrorState`, `Skeleton` | Title/description/action or loading label | Clear next action; alerts for errors; loading status; decorative skeleton bars hidden from assistive technology. |

Use a single primary button for a local task. Use secondary buttons for alternatives and ghost buttons for supporting actions. Keep copy in sentence case, respect reduced motion, and use stage tokens consistently across diagrams, timelines, and charts.
