import type {Simulation} from '../../engine/simulator';
import {unitFor, type Unit} from '../../cpu/ooo/engine';
export function utilization(sim: Simulation, cycle: number): Record<Unit, number> {
  if (sim.oooSnapshots) return sim.oooSnapshots[Math.min(cycle, sim.totalCycles)].unitBusy;
  const result = {ALU: 0, MUL: 0, MEM: 0, BR: 0};
  for (const snapshot of sim.snapshots?.slice(0, cycle + 1) ?? []) {
    const entry = snapshot.stages.EX; if (entry && unitFor(entry.ins) !== 'MEM') result[unitFor(entry.ins)]++;
    if (snapshot.stages.MEM && unitFor(snapshot.stages.MEM.ins) === 'MEM') result.MEM++;
  }
  return result;
}
