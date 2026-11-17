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
