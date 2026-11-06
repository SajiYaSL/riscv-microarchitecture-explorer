# Architecture upgrade plan and implementation record

## Baseline analysis

The original React/Vite application parsed assembly and used a sequential
interpreter to generate outcomes for two postprocessed timing schedulers.
Neither scheduler had live CPU state. OoO lacked actual renaming, allocation,
issue queues, speculative fetch or rollback. Pipeline stages were intervals on
a known correct execution trace; wrong-path operations were never fetched.
The UI had an editor, interval pipeline/timeline, architectural inspectors and
Recharts comparisons. Tests covered basic outcomes, not independent engines.

The replacement retains compatible assembly examples and a React-free engine
boundary, removes both trace timing schedulers, and derives visual state from
actual instruction execution. Existing dependencies are retained; no new runtime
or test-library dependency was introduced. Optional browser tests use Chrome's
DevTools protocol through Node's built-in WebSocket client.

## Public scope and independence

Implement the publicly documented RV32I arithmetic/word-memory/label-control
subset plus low-word MUL. This is not RV64, full RV32I/M, binary decoding or RTL.
Public reference: https://docs.riscv.org/reference/isa/unpriv/rv32.html .
A read-only directory survey of a separate reference was performed; no private
source, algorithms, configuration, tests or traces are used or included. The
application is independently implemented and has no private dependency.

## Milestones

| Stage | Implemented result | Verification |
| --- | --- | --- |
| 1. Analysis and plan | Baseline limitations, public scope, architecture and staged verification | Repository/configuration review |
| 2. In-order CPU | Explicit latches, bypassing, interlocks, bubbles, multi-cycle EX, branch flush, ordered retirement, fatal alignment faults | Directed, seeded and interpreter differential tests |
| 3. In-order visualization | Live SVG, latch inspection, bypass/recovery indicators, events, full dynamic timeline including squashes | Browser controls and diagram checks |
| 4. OoO foundations | PRF, RAT, committed map, free list, rename, dispatch, oldest-ready issue, wakeup, four units, ROB and retirement | Allocation invariants, dependency/WAR/WAW, ordering and random resource configurations |
| 5. OoO visualization | Clickable live SVG, ROB table, rename/physical inspectors, issue readiness and dependency reasons | Browser diagram and inspector checks |
| 6. Memory and recovery | Conservative LSQ, commit-only stores, three predictor modes, younger squash, rename reconstruction, precise fatal faults | Memory/full-state checks, nested recovery and wrong-path-fault suppression |
| 7. Learning and comparison | Config/reset, highlighted assembly, eleven examples, clock history, lifecycles, event charts, independent comparison verification | All examples exercised in both models and browser |
| 8. Verification and readiness | Documentation, desktop/mobile screenshots, static build and CI compatibility | Install, TypeScript/build, unit/differential tests, Chrome smoke checks |

## Deliberate modeling limits

These milestones complete the requested **simplified educational** platform,
not a production CPU. The LSQ is a typed age-ordered view of ROB memory entries;
the issue queue is a bounded view of waiting entries, with renamed dispatch
backlog held in the ROB. There are no caches, memory speculation, store forwarding,
branch checkpoints, pipelined unit initiation intervals or writeback-port limits.
Retirement width is fixed at one. Faults terminate simulation without privileged
trap handlers. Frontend queues are bounded internally, not configurable.
Recovery rebuilds mappings functionally rather than modeling hardware rollback
latency. Runs are bounded at 160 retirements/2,000 clocks and 128 static instructions.

## Verification strategy

Three separately written instruction execution switches model the interpreter,
in-order CPU and OoO CPU. Tests compare every architectural register, committed
memory, retired PC sequence, final PC and fatal fault; limited runs are never
reported as verified. Tests also assert exactly-once retirement, free-list/RAT
ownership, PRF committed values, queue/unit capacities and squash safety.
Seeded programs exercise RAW/WAR/WAW, memory, branches, traps, overflow and
address wrapping under narrow/wide and resource-constrained configurations.
Browser smoke checks exercise all examples, both diagrams, stepping/backward
navigation, configuration validation/reset, fault display, verified comparison,
responsive layout and learning content. See VERIFICATION.md for the actual result.

## Future roadmap

Binary instruction decoding and ISA expansion should precede any compliance
claim. Further work can add byte-addressed endianness, caches, independently
verified store forwarding/disambiguation, pipelined units, branch checkpoints,
configurable commit bandwidth and exported traces. Every extension needs new
differential and state-invariant tests before it is advertised as accurate.
