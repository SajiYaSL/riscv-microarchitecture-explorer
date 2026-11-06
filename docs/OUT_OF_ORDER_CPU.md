# Independent out-of-order CPU

The previous trace scheduler has been removed. `src/cpu/ooo/engine.ts` executes
assembly instructions from live speculative state and never calls the
architectural interpreter. This is an original, bounded teaching model of an
RV32 subset, not a production core or full ISA implementation.

## Clock contract

Every snapshot is the end of one clock. A step copies state and processes:

1. Retire at most one previously complete ROB head.
2. Advance executing units; complete results, write physical destinations,
   resolve branches and recover from mispredictions.
3. Select up to issue width previously waiting instructions. Operand readiness
   is read from the prior snapshot, so completion wakes consumers next clock.
4. Dispatch previously renamed entries when issue-queue space is available.
5. Rename up to decode width from the decoded queue; move fetched instructions
   through decode; fetch up to fetch width along predicted control flow.

No instruction skips these distinct frontend phases in one clock. Rename and
ROB allocation occur together. Dispatch is a separate clock before selection.
Retirement width is fixed at one, independent of issue width.

## Renaming and retirement

Initial x0–x31 map to p0–p31, with all values zero and ready. Additional physical
registers form the free list. Rename captures both source mappings **before**
changing the destination mapping, then allocates a fresh not-ready destination.
Every ROB entry retains its previous destination. Writes to x0 allocate nothing.

Completion marks the physical destination ready. The committed architectural
register file and committed map change only at retirement. The replaced physical
register returns to the free list then. This removes WAR and WAW name hazards;
RAW dependencies still wait for their captured physical producers. No architectural
register result is taken from an interpreter or a precomputed trace.

## Scheduling and units

Oldest-ready selection visits the ROB in age order and can skip older blocked
instructions. The issue queue is the bounded subset of entries with `waiting`
status; `renamed` entries form a bounded-by-ROB dispatch backlog. These typed
views are shown separately in the UI. One operation can be selected per unit per
clock, with four nonpipelined units: ALU, multiply, memory and branch.

Selection is an Issue lifecycle clock; configurable execution latency counts
following execution clocks, ending in Writeback. A completing unit can select its
next operation in that same clock for execution beginning next clock. ALU and
MUL latencies are configurable; memory latency is two, branch latency one.
NOP follows the ALU path. There is no writeback-port contention model.

## Conservative load/store queue

The LSQ is an age-ordered view of memory entries retained in the ROB. Loads and
stores must wait until **all older memory instructions retire**, even when their
addresses differ. There is no memory speculation, address disambiguation,
store-to-load forwarding or load replay. Non-memory instructions can pass a
blocked memory instruction. Stores compute buffered addresses/data at execution
and update committed memory only at retirement. Word loads use committed memory.
This is intentionally more restrictive than many real CPUs, and suffices for
single-threaded programs in the supported subset.

Addresses wrap modulo 2^32 and are shown as unsigned byte addresses. Sparse
32-bit aligned words default to zero. There are no byte accesses, memory
protection, MMIO, caches or external agents.

## Branch prediction and recovery

Static mode predicts conditional branches not taken. Per-PC one-bit predictors
start not-taken; two-bit saturating counters start weakly not-taken (1), predict
taken at 2/3, increment on taken and decrement on not-taken. JAL's direct target
is known during fetch. Prediction compares next PCs; a branch to the sequential
next instruction requires no recovery even if taken.

Predictors train at execution resolution, including speculative branches that
may later be squashed. This policy is explicit: predictor state is performance
state and is not rolled back. Counters count actual resolution and recovery
events, including speculative events. They are not retired-branch statistics.

Misprediction discards every younger ROB, decoded and fetched instruction,
including executing instructions. RAT reconstruction starts with committed
mappings and reapplies surviving destinations in program order. Physical
register reclamation retains committed mappings and every surviving source,
destination and previous destination. Completed speculative values are never
copied into architectural state. Fetch/decode/rename are suppressed on the
resolution clock; target fetch resumes next clock. Older surviving work can
continue. There are no branch checkpoints or a reorder rollback timing model.

## Fatal faults

Misaligned LW/SW record an execution fault, even for a load into x0. The fault is
reported only when that instruction reaches the ROB head. Older state is
committed, the faulting instruction does not retire, and all younger work is
squashed. The final snapshot retains committed registers/memory and fault PC.
No CSR state, exception handler or privileged behavior is implemented.
