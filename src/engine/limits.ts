/** Browser simulation budgets; execution history is retained for cycle-by-cycle inspection. */
export const SIMULATION_LIMITS = {
  staticInstructions: 1024,
  retiredInstructions: 10000,
  cycles: 100000,
} as const;
