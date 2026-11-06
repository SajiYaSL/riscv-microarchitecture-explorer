# Event-derived performance metrics

All counters and charts derive from actual clock snapshots. No hardware
measurements or fabricated benchmark results are included.

| Metric | Definition |
| --- | --- |
| Cycles | Elapsed modeled clocks, including fill/drain |
| Retired | Instructions committed at WB or ROB head; includes stores, branches, NOP and x0 writes |
| IPC | Retired / elapsed cycles; zero before execution |
| CPI | Elapsed cycles / retired; undefined before first retirement |
| In-order interlock clocks | Frontend holds due to load-use RAW or occupied multi-cycle EX |
| OoO frontend stall clocks | Rename resource pressure or full frontend queues; counted once per clock |
| Squashed | Actual younger fetched dynamic instructions discarded during redirect/fault |
| ROB occupancy | Current number of ROB entries, including dispatch backlog and completed entries |
| Issue queue occupancy | ROB entries in waiting status, bounded by configured capacity |
| Branches resolved | All executed branch/JAL resolutions, including speculative resolutions |
| Mispredictions | Resolved next PC differs from predicted next PC |
| Prediction accuracy | 1 − mispredictions / resolutions; undefined before first resolution |
| Recovery clocks | Resolution clocks on which redirect suppresses frontend progress |
| Unit occupancy | Actual execution busy clocks / elapsed clocks |

In-order unit charts count EX for ALU/MUL/branch and MEM for memory operations.
OoO unit charts count execution clocks after Issue through Writeback, excluding
the selection clock. Different stage definitions prevent direct claims about
unit efficiency. A completion can wake consumers only for the following clock.

Recovery clocks are a modeled frontend suppression counter, **not** a full
counterfactual measurement of lost performance. Additional refetch, rename,
dependency and drain costs are reflected in total cycles. Predictor training
and resolution statistics can include operations later squashed by an older
branch; predictor state is deliberately not restored on recovery.

Explorer cards show the selected snapshot. Comparison cards report complete
bounded runs and distinguish safety-limited runs and faults. In-order interlock
and OoO frontend-stall counts have different meanings and must not be treated
as identical measures. Both timelines have independent clock scales. Completion
order may differ while retirement remains in program order. × marks completed
OoO operations that were subsequently squashed.

Comparison verification checks all registers, memory, retired PC sequence,
final PC and fault against an independent interpreter. Safety-limited runs are
never labeled verified. Results reflect the chosen simplified microarchitectures
and parameters, not a general claim that OoO is always faster.
