import {describe,it,expect} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {executeProgram,simulate,stateAt} from '../src/engine/simulator';
import {EXAMPLES} from '../src/engine/programs';
describe('assembler and ISA oracle',()=>{
 it('computes dependent arithmetic and x0 stays zero',()=>{const p=assemble('ADDI x1,x0,10\nADDI x2,x0,20\nADD x3,x1,x2\nSUB x4,x3,x1\nADDI x0,x4,8');const t=executeProgram(p);expect(t.registers[3]).toBe(30);expect(t.registers[4]).toBe(20);expect(t.registers[0]).toBe(0)});
 it('branches to a label and skips wrong path',()=>{const t=executeProgram(assemble(EXAMPLES['Branch & Flush']));expect(t.registers[3]).toBe(0);expect(t.registers[4]).toBe(42)});
 it('supports stores and loads',()=>{const t=executeProgram(assemble(EXAMPLES['Load-Use Hazard']));expect(t.registers[3]).toBe(21);expect(t.registers[4]).toBe(42);expect(t.memory.get(100)).toBe(21)});
 it('terminates a loop',()=>{const t=executeProgram(assemble(EXAMPLES['Sum 1 to 5']));expect(t.registers[3]).toBe(15);expect(t.registers[4]).toBe(15);expect(t.truncated).toBe(false)});
 it('rejects invalid registers and labels',()=>{expect(()=>assemble('ADD x32,x1,x2')).toThrow(/invalid register/);expect(()=>assemble('BEQ x1,x2,missing')).toThrow(/unknown branch label/)});
 it('supports unsigned bitwise and signed int results',()=>{const t=executeProgram(assemble('ADDI x1,x0,-1\nADDI x2,x0,4\nAND x3,x1,x2\nXOR x4,x1,x2'));expect(t.registers[3]).toBe(4);expect(t.registers[4]).toBe(-5)});
});
describe('execution models',()=>{
 it.each(['inorder','ooo'] as const)('%s has ordered retirement and correct final state',mode=>{const p=assemble(EXAMPLES['Independent Instructions']);const s=simulate(p,mode);expect(s.events.map(e=>e.commit)).toEqual([...s.events.map(e=>e.commit)].sort((a,b)=>a-b));expect(stateAt(s,s.totalCycles).registers).toEqual(s.registers);expect(s.retired).toBe(10);expect(s.registers[3]).toBe(32)});
 it('out-of-order can use second execution unit',()=>{const s=simulate(assemble(EXAMPLES['Independent Instructions']),'ooo');expect(s.events.some(e=>e.unit===1)).toBe(true)});
 it('starts at zero retired and finishes at all retired',()=>{const s=simulate(assemble(EXAMPLES['Data Hazards']),'inorder');expect(stateAt(s,0).retired).toBe(0);expect(stateAt(s,s.totalCycles).retired).toBe(s.retired)});
});
