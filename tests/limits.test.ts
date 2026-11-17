import {describe, it, expect} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {simulate, executeProgram} from '../src/engine/simulator';
import {SIMULATION_LIMITS} from '../src/engine/limits';
import {compareArchitecturalState} from '../src/cpu/verification/compare';
import {DEFAULT_CONFIG, runOoo, stepOoo} from '../src/cpu/ooo/engine';
import {runPipeline} from '../src/cpu/inorder/engine';

describe('larger program budgets', () => {
  it('runs 1,024 static instructions past the old cycle and retirement caps in both engines', () => {
    const p = assemble(Array.from({length: 1024}, () => 'ADDI x1,x1,1').join('\n'));
    const config = {...DEFAULT_CONFIG, aluLatency: 3};
    const a = simulate(p, 'inorder', config), b = simulate(p, 'ooo', config);
    for (const s of [a, b]) {
      expect(s.totalCycles).toBeGreaterThan(2000);
      expect(s.retired).toBe(1024);
      expect(s.registers[1]).toBe(1024);
      expect(s.truncated).toBe(false);
    }
    expect(compareArchitecturalState(p, a, b).verified).toBe(true);
  });
  it('executes a loop with over 1,000 dynamic instructions and verifies its result', () => {
    const p = assemble('ADDI x1,x0,500\nloop: ADDI x2,x2,1\nADDI x1,x1,-1\nBNE x1,x0,loop');
    const a = simulate(p, 'inorder'), b = simulate(p, 'ooo');
    expect(a.retired).toBe(1501); expect(b.retired).toBe(1501);
    expect(a.registers[2]).toBe(500); expect(b.registers[2]).toBe(500);
    expect(compareArchitecturalState(p, a, b).verified).toBe(true);
  });
  it('preserves earlier lifecycle snapshots while advancing large histories', () => {
    const p = assemble('ADDI x1,x0,30\nloop: ADDI x1,x1,-1\nBNE x1,x0,loop');
    const history = runOoo(p);
    for (const s of history) for (const life of s.instructions) {
      expect(Object.keys(life.history).every(c => Number(c) <= s.cycle)).toBe(true);
      expect(life.retired === undefined || life.retired <= s.cycle).toBe(true);
    }
    const s = history[20], before = JSON.stringify(s);
    stepOoo(p, s); expect(JSON.stringify(s)).toBe(before);
  });
  it('still bounds infinite programs and rejects oversized source', () => {
    const p = assemble('loop: JAL x0,loop');
    expect(executeProgram(p).trace).toHaveLength(SIMULATION_LIMITS.retiredInstructions);
    expect(executeProgram(p).truncated).toBe(true);
    for (const h of [runPipeline(p, 37, 100), runOoo(p, DEFAULT_CONFIG, 37, 100)]) {
      expect(h.at(-1)!.cycle).toBe(37); expect(h.at(-1)!.halted).toBe(false);
    }
    for (const h of [runPipeline(p, 1000, 7), runOoo(p, DEFAULT_CONFIG, 1000, 7)]) expect(h.at(-1)!.retired).toHaveLength(7);
    expect(() => assemble(Array.from({length: 1025}, () => 'NOP').join('\n'))).toThrow('maximum 1024');
  });
});
