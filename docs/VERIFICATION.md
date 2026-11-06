# Verification

## Commands

```bash
npm test
npm run build
npm run test:browser   # optional: Node 22+ and Google Chrome / CHROME_BIN required
```

The regular unit suite does not require a browser, network or backend. The
production build includes strict TypeScript compilation. The browser runner
starts a local Vite server and headless Chrome with an isolated temporary profile,
uses DevTools through Node's built-in WebSocket client, writes public screenshots,
and stops its child processes. It uses localhost ports 5175 and 9224; choose an
environment where those are available. Chrome runs with `--no-sandbox` for
container compatibility and does not use a personal profile or credentials.

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

The smoke script exercises all eleven examples, independent comparison,
interactive SVG components, physical/RAT tabs, both CPU diagrams, cycle stepping,
backward/forward replay, invalid configuration and reset, fatal fault display,
mobile horizontal-overflow bounds and learning content. Uncaught browser
exceptions fail the run. Screenshots are saved to `docs/screenshots/`.

## Current result

- `npm install`: successful; existing esbuild install-script approval notices
  may appear in managed environments.
- `npm test`: **79 passed**, five files, zero failures.
- `npm run build`: successful strict TypeScript and static Vite build.
- Charts are dynamically split from the initial application bundle.
- Chrome smoke checks: successful for all eleven examples, both CPU views,
  configuration, fault/comparison behavior and desktop/mobile layouts.
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
