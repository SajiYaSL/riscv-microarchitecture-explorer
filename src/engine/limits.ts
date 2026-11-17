/** Browser simulation budgets; execution history is retained for cycle-by-cycle inspection. */
export const SIMULATION_LIMITS = {
  staticInstructions: 1024,
  retiredInstructions: 2048,
  cycles: 20000,
} as const;
