export const concepts=[
 ['In-order execution','Instructions enter execution in program order. A blocked older operation holds younger work; forwarding can supply values before register writeback.'],
 ['Instruction-level parallelism','Independent instructions can overlap across execution units. Issue width is an upper bound: true dependencies and unit availability still limit execution.'],
 ['RAW dependency','Read after write is a true data dependency. The consumer waits for its physical source register to become ready. Renaming cannot remove it.'],
 ['WAR and WAW hazards','Write after read and write after write are name dependencies. Capturing physical source tags and giving each writer a new destination prevents younger writers from corrupting older values.'],
 ['Register renaming','The speculative RAT maps each architectural register to its latest physical writer. Committed mappings remain separate until retirement. Old destinations return to the free list when their replacement retires.'],
 ['Reservation stations / issue queue','Waiting instructions retain source tags. Completed producers mark physical registers ready. Oldest-ready selection can bypass an older instruction blocked on operands or a unit.'],
 ['Reorder buffer','The ROB records program age. Execution can finish in any order, but only a complete head entry can retire. Register and store effects become architectural at retirement.'],
 ['Speculative execution','The frontend follows predicted control flow. Wrong-path operations may execute into temporary physical registers, but their architectural effects are discarded on recovery.'],
 ['Branch prediction','Static mode predicts conditional branches not taken. A one-bit predictor remembers the last resolved outcome; a two-bit saturating counter changes direction after sustained opposing outcomes. JAL targets are known at fetch.'],
 ['Pipeline flushing','A misprediction discards younger instructions and rebuilds the speculative map from committed state plus older surviving ROB entries. Fetch restarts the following clock.'],
 ['Precise retirement and faults','Retirement is single-width and ordered. Misaligned word operations record a fatal fault; OoO reports it only at ROB head so older work commits and younger work cannot commit. Trap handlers and CSRs are unsupported.'],
 ['CPI and IPC','CPI is elapsed clocks divided by retired instructions. IPC is retired instructions divided by elapsed clocks. Fill, drain, stalls and recovery affect both; they describe this simulation, not silicon measurements.'],
 ['Memory-ordering model','All loads and stores wait for older memory operations to retire. Stores update sparse, zero-initialized word memory only at retirement. There is no cache, alias speculation or store-to-load forwarding.']
];
