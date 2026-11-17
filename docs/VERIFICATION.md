# Verification

## Commands

```bash
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run check:ui
npm run check:bundle   # after the production build
```

The regular unit suite does not require a browser, network or backend. The
production build includes strict TypeScript compilation. Playwright starts a
local Vite server on port 5176 and uses isolated browser contexts. Matching
Chromium is used for CI and visual baselines; a custom `CHROME_BIN` is also supported
for workflow/accessibility checks.
The runner stops its server and does not use a personal profile or credentials.

## Independent differential execution

The sequential interpreter, in-order engine and OoO engine each have a separately
written execution switch. Neither CPU consumes interpreter outcomes or traces.
Comparison checks all 32 committed registers, every written memory word,
retired PC sequence, final PC and fatal fault. Bounded/truncated runs are never
reported as verified. Stores and fault behavior are checked, not just registers.

- All eleven examples execute under default, constrained and wider configurations.
- Forty reproducible 45-instruction register/memory programs test in-order state.
- Thirty-five reproducible mixed OoO programs vary free-list, ROB, issue queue,
  widths and execution latencies.
- Thirty reproducible acyclic branch/memory programs compare both engines under
  different predictors and resource configurations.
- Seeds and LCG formulas are fixed in the tests for reproducibility.

## Directed behavior and invariants

Tests cover assembler operand validation, signed decimal/hex immediates,
32-bit overflow, low-word multiplication, x0, word load/store behavior,
unsigned address wrapping, labels and jumps, N+4 pipeline fill/drain, forwarding
priority/store data, one-clock load-use bubbles and configured EX occupancy.

OoO tests cover WAR/WAW renaming, captured RAW source tags, wakeup, younger
independent issue, ordered exactly-once retirement, memory ordering, wrong-path
store/write/fault suppression, older recovery after a younger branch resolves,
predictor training, one-spare-register progress, snapshot replay and resource
limits. State invariants check free-list uniqueness, no free RAT/committed/source
mappings, committed PRF values, issue/ROB capacity, one active operation per unit,
unit busy clocks no greater than elapsed clocks, and no squashed retirement.

Fault tests compare committed memory/registers, PC, retired sequence and fatal
fault across all three implementations. Loads into x0 still fault. Older effects
remain committed; younger effects never become architectural.

The user-supplied CPU verification program has a dedicated regression: the
undefined `wrong_path` target is rejected, and the corrected program retires
17 instructions with expected register values, memory[64] = 30 and final PC 76
on both engines. The editor highlights assembly errors and states explicitly
that the previously loaded program is still active.

## UI and real browser

The Playwright suite exercises all eleven examples, independent comparison,
configuration validation, precise fault display, stepping/replay, reload
persistence, share links, blocked storage, learning/progress, exports, pinned
runs, keyboard behavior, and mobile menus/sheets.

Axe scans cover three themes and all main views, lesson/glossary routes, active
visualizations, and dialogs. Eight visual baselines cover dark/light Explorer
layouts at 360, 768, 1280, and 1440px, with additional breakpoint checks from
320px to 1440px. Baselines live in `tests/e2e/__screenshots__/`; public docs
screenshots are captured with `npm run capture:docs -- <local-preview-url>`.

## Current result

- `npm test`: **91 passed**, seven files, including the original 79 engine tests.
- `npm run build`: successful strict TypeScript and static Vite build.
- Charts are dynamically split from the initial application bundle.
- `npm run test:browser`: **38 passed**, including all eleven examples, UI
  workflows, accessibility scans, and visual baselines.
- `npm run check:ui` and `npm run check:bundle`: successful.
- Local desktop production Lighthouse: **100 / 100 / 100** for Performance,
  Accessibility, and Best Practices; see [quality report](QUALITY_REPORT.md).
- Public desktop and mobile screenshots captured and visually reviewed.
- `git diff --check`: successful; source/docs checked for private paths and
  obvious credential markers. No private code, configuration or traces used.
- No public hosting deployment was performed as part of these verification checks.

## Limits of verification

These tests are not formal proofs, an ISA compliance suite or RTL comparison.
The random corpus is bounded and does not exhaust all values or control flow.
Instruction decoding is assembly-level parsing, not binary decoding. No
interrupts, CSR trap state, multicore memory model, caches, memory speculation,
writeback-port contention or full RV32I/M behavior is claimed. See the model
contracts before interpreting timing or adding instructions.
