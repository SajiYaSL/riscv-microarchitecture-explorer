import {describe,it,expect} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {executeProgram} from '../src/engine/simulator';
import {initialState,runPipeline,step} from '../src/cpu/inorder/engine';
import {EXAMPLES} from '../src/engine/programs';
const run=(code:string)=>runPipeline(assemble(code));
function differential(code:string){
 const p=assemble(code),oracle=executeProgram(p),history=runPipeline(p),s=history.at(-1)!;
 expect(s.fault).toBeUndefined();expect(s.halted).toBe(true);
 expect(s.registers).toEqual(oracle.registers);expect(s.memory).toEqual(oracle.memory);
 expect(s.retired.map(l=>l.ins.pc)).toEqual(oracle.trace.map(t=>t.beforePC));
 expect(new Set(s.retired.map(l=>l.id)).size).toBe(s.retired.length);
 expect(s.pc).toBe(oracle.trace.at(-1)?.afterPC);
}
describe('independent cycle-level pipeline',()=>{
 it.each(Object.entries(EXAMPLES))('matches oracle: %s',(_,code)=>differential(code));
 it('fills and drains in N+4 clocks without hazards',()=>{
  const h=run('ADDI x1,x0,1\nADDI x2,x0,2');expect(h.at(-1)!.cycle).toBe(6);
  expect(h[1].stages.IF?.ins.pc).toBe(0);expect(h[2].stages.ID?.ins.pc).toBe(0);
  expect(h[3].stages.EX?.ins.pc).toBe(0);expect(h[4].stages.MEM?.ins.pc).toBe(0);
  expect(h[4].registers[1]).toBe(0);expect(h[5].registers[1]).toBe(1);
 });
 it('forwards the youngest matching producer including store data',()=>{
  const code='ADDI x1,x0,1\nADDI x1,x1,2\nADD x2,x1,x1\nSW x2,0(x0)';differential(code);
  const h=run(code);expect(h.some(s=>s.events.some(e=>e.kind==='forward'))).toBe(true);
  expect(h.at(-1)!.registers[2]).toBe(6);expect(h.at(-1)!.stalls).toBe(0);
 });
 it('inserts exactly one bubble for an immediate load consumer',()=>{
  const code='ADDI x1,x0,21\nSW x1,0(x0)\nLW x2,0(x0)\nADD x3,x2,x2';differential(code);
  const h=run(code),stall=h.find(s=>s.events.some(e=>e.kind==='stall'))!;
  expect(h.at(-1)!.stalls).toBe(1);expect(stall.idex).toBeNull();expect(stall.stages.ID?.ins.op).toBe('ADD');
 });
 it('interlocks a four-clock MUL and wakes a dependent consumer',()=>{
  const code='ADDI x1,x0,7\nMUL x2,x1,x1\nADD x3,x2,x1';differential(code);
  const h=run(code);expect(h.filter(s=>s.stages.EX?.ins.op==='MUL')).toHaveLength(4);
  expect(h.at(-1)!.stalls).toBe(3);
 });
 it('squashes wrong-path stores, writes and misaligned loads',()=>{
  const code='ADDI x1,x0,1\nBEQ x1,x1,target\nSW x1,0(x0)\nLW x2,1(x0)\ntarget: ADDI x3,x0,8';
  differential(code);const h=run(code);expect(h.at(-1)!.memory.size).toBe(0);
  expect(h.at(-1)!.squashed).toBe(2);expect(h.some(s=>s.events.some(e=>e.kind==='flush'))).toBe(true);
 });
 it('supports link forwarding and negative hexadecimal immediates',()=>{
  differential('ADDI x1,x0,-0x10\nJAL x2,target\nADDI x1,x0,0\ntarget: ADD x3,x2,x1');
  expect(assemble('ADDI x1,x0,-0x10').instructions[0].imm).toBe(-16);
 });
 it('keeps x0 zero but still faults on a load into x0 with precise older effects',()=>{
  const h=run('ADDI x1,x0,9\nSW x1,0(x0)\nLW x0,1(x0)\nSW x1,4(x0)');const s=h.at(-1)!;
  expect(s.fault).toMatch(/misaligned/);expect(s.memory.get(0)).toBe(9);expect(s.memory.has(4)).toBe(false);
  expect(s.retired.map(l=>l.ins.pc)).toEqual([0,4]);expect(s.registers[0]).toBe(0);expect(s.pc).toBe(8);
 });
 it('does not mutate earlier snapshots and replays deterministically',()=>{
  const p=assemble('ADDI x1,x0,4\nSW x1,0(x0)'),start=initialState();
  const one=step(p,start);expect(step(p,start)).toEqual(one);expect(start.cycle).toBe(0);
  const h=runPipeline(p);expect(h[0].memory.size).toBe(0);expect(h[4].registers[1]).toBe(0);
  expect(h.at(-1)!.memory.get(0)).toBe(4);
 });
 it('matches seeded register and memory programs with WAW and RAW chains',()=>{
  let seed=7341;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let trial=0;trial<40;trial++){
   const lines:string[]=[];
   for(let i=0;i<45;i++){
    const rd=rand()%9,a=rand()%9,b=rand()%9;
    switch(rand()%6){
     case 0:lines.push(`ADDI x${rd},x${a},${(rand()%4096)-2048}`);break;
     case 1:lines.push(`MUL x${rd},x${a},x${b}`);break;
     case 2:lines.push(`SW x${b},${(rand()%8)*4}(x0)`);break;
     case 3:lines.push(`LW x${rd},${(rand()%8)*4}(x0)`);break;
     default:lines.push(`${['ADD','SUB','AND','OR','XOR'][rand()%5]} x${rd},x${a},x${b}`);
    }
   }
   differential(lines.join('\n'));
  }
 });
 it('exposes safety termination without claiming completion',()=>{
  const h=runPipeline(assemble('loop: JAL x0,loop'),30);expect(h.at(-1)!.halted).toBe(false);expect(h.at(-1)!.cycle).toBe(30);
 });
});
