# Five-stage in-order CPU

One instruction is fetched per clock. End-of-clock snapshots show IF, ID, EX,
MEM and WB. An independent instruction takes five clocks at default latency;
N independent instructions take N+4 clocks including fill/drain.
`fetchLatch`, `ifid`, `idex`, `exmem`, and `memwb` expose the latch contents.
Null means bubble. Architectural PC is the next PC after the last retirement;
frontend fetch PC can be ahead or on a wrong path.

ALU values are computed when entering EX and become available after their
configured EX occupancy. EX/MEM and MEM/WB bypassing supplies operands to the
next EX instruction, including store data and branch operands. The youngest
matching producer wins; x0 is never a producer. An immediate load consumer
holds IF/ID for one clock and inserts an EX bubble. Default MUL occupies EX
for four clocks, holding younger frontend work for the additional three.
ALU and MUL occupancy are configurable; branches and address calculation
remain one EX clock. The shared execution stage is nonpipelined.

Memory has one MEM-stage clock and uses aligned sparse 32-bit words; locations
are unsigned byte addresses wrapping modulo 2^32 and default to zero. Stores
become visible only at WB. A following load reads after an older store has
committed in that clock. There are no caches, port conflicts, memory protection,
MMIO or external memory agents.

Static sequential fetch predicts conditional branches not taken. Branches and
JAL resolve at the EX-to-MEM boundary; a redirect clears both younger frontend
latches, and fetch restarts the next clock. A branch whose next PC is sequential
needs no redirect. Squashed instructions cannot enter EX or modify state.

Misaligned LW/SW cause a fatal simulator fault, including LW into x0. Older WB
work retires first, younger work is discarded, and architectural PC identifies
the faulting instruction. The UI preserves the final state and displays the
fault. There are no trap CSRs or trap handlers.

Run limits are 2,000 clocks or 160 retirements. Reaching a limit is truncation,
not successful termination. UI timeline cells derive from actual snapshots,
including held frontend stages and squashed dynamic instructions. The engine
never calls the interpreter to obtain execution values or branch outcomes.
