import {describe,it,expect} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {executeProgram} from '../src/engine/simulator';
import {DEFAULT_CONFIG,initialOoo,runOoo,stepOoo,validateConfig,type CPUConfig} from '../src/cpu/ooo/engine';
import {EXAMPLES} from '../src/engine/programs';
function check(code:string,changes:Partial<CPUConfig>={}){
 const config={...DEFAULT_CONFIG,...changes};const p=assemble(code),o=executeProgram(p),history=runOoo(p,config),s=history.at(-1)!;
 expect(s.fault).toBeUndefined();expect(s.halted).toBe(true);expect(s.registers).toEqual(o.registers);expect(s.memory).toEqual(o.memory);
 expect(s.retired.map(e=>e.ins.pc)).toEqual(o.trace.map(e=>e.ins.pc));expect(s.pc).toBe(o.trace.at(-1)?.afterPC);
 expect(new Set(s.retired.map(e=>e.id)).size).toBe(s.retired.length);
 for(const snap of history){
  expect(new Set(snap.freeList).size).toBe(snap.freeList.length);
  expect(snap.freeList.every(p=>!snap.rat.includes(p)&&!snap.committedMap.includes(p))).toBe(true);
  expect(snap.rob.length).toBeLessThanOrEqual(config.robSize);
  expect(snap.rob.filter(e=>e.status==='waiting').length).toBeLessThanOrEqual(config.issueCapacity);
  expect(snap.rat[0]).toBe(0);expect(snap.physical[0]).toEqual({value:0,ready:true});
 }
 return history;
}
describe('independent OoO execution',()=>{
 it.each(Object.entries(EXAMPLES))('matches independent oracle: %s',(_,code)=>{check(code);});
 it('renames WAW and WAR while preserving captured RAW sources',()=>{
  const code='ADDI x1,x0,3\nMUL x2,x1,x1\nADD x3,x2,x1\nADDI x1,x0,8\nADDI x1,x0,9\nADD x4,x3,x1';
  const h=check(code);const s=h.at(-1)!;expect(s.registers[3]).toBe(12);expect(s.registers[4]).toBe(21);
  expect(h.some(s=>s.rob.filter(e=>e.ins.rd===1).length>=2)).toBe(true);
 });
 it('issues independent younger work before an older blocked consumer, but retires in order',()=>{
  const h=check('ADDI x1,x0,2\nMUL x2,x1,x1\nADD x3,x2,x1\nADDI x4,x0,7');const s=h.at(-1)!;
  const phase=(id:number,p:string)=>Number(Object.entries(s.instructions.find(e=>e.id===id)!.history).find(([,v])=>v===p)![0]);
  expect(phase(3,'Issue')).toBeLessThan(phase(2,'Issue'));expect(s.retired.map(e=>e.id)).toEqual([0,1,2,3]);
 });
 it('never commits wrong-path memory, register writes or faults after branch recovery',()=>{
  const code='ADDI x1,x0,1\nMUL x2,x1,x1\nBEQ x2,x1,target\nADDI x3,x0,99\nSW x3,0(x0)\nLW x4,1(x0)\ntarget: ADDI x5,x0,42';
  const h=check(code,{fetchWidth:4,decodeWidth:4});const s=h.at(-1)!;
  expect(s.mispredictions).toBe(1);expect(s.squashed).toBeGreaterThan(0);expect(s.memory.size).toBe(0);expect(s.registers[3]).toBe(0);
  expect(s.freeList).toHaveLength(DEFAULT_CONFIG.physicalRegisters-32);
 });
 it('handles older branch recovery after a younger branch already resolved',()=>{
  check('ADDI x1,x0,1\nMUL x2,x1,x1\nBEQ x2,x1,outer\nBEQ x0,x0,inner\nADDI x4,x0,99\ninner: ADDI x3,x0,88\nouter: ADDI x5,x0,12',{multiplyLatency:10,fetchWidth:4,decodeWidth:4});
 });
 it.each(['static','one-bit','two-bit'] as const)('trains %s predictor consistently on a loop',predictor=>{
  const h=check(EXAMPLES['Sum 1 to 5'],{predictor});expect(h.at(-1)!.resolvedBranches).toBeGreaterThanOrEqual(5);
 });
 it('conservatively orders loads and stores, including WAW memory addresses',()=>{
  check('ADDI x1,x0,5\nMUL x2,x1,x1\nSW x2,0(x0)\nLW x3,0(x0)\nSW x1,0(x0)\nLW x4,0(x0)');
 });
 it('reports precise faults only at ROB head with older state preserved',()=>{
  const s=runOoo(assemble('ADDI x1,x0,9\nSW x1,0(x0)\nLW x0,1(x0)\nSW x1,4(x0)')).at(-1)!;
  expect(s.fault).toMatch(/misaligned/);expect(s.memory).toEqual(new Map([[0,9]]));expect(s.registers[1]).toBe(9);
  expect(s.retired.map(e=>e.ins.pc)).toEqual([0,4]);expect(s.pc).toBe(8);expect(s.registers[0]).toBe(0);
 });
 it('makes progress with a single spare physical register, tiny ROB and issue queue',()=>{
  check('ADDI x1,x0,4\nMUL x1,x1,x1\nADDI x2,x1,2\nADD x3,x2,x1',{physicalRegisters:33,robSize:2,issueCapacity:1,issueWidth:1,fetchWidth:1,decodeWidth:1});
 });
 it('replays pure snapshots without mutation',()=>{
  const p=assemble('ADDI x1,x0,4');const s=initialOoo();const a=stepOoo(p,s);expect(stepOoo(p,s)).toEqual(a);expect(s.instructions).toHaveLength(0);expect(s.cycle).toBe(0);
 });
 it('validates unsupported configurations',()=>{
  expect(validateConfig({...DEFAULT_CONFIG,physicalRegisters:32})).not.toHaveLength(0);
  expect(()=>initialOoo({...DEFAULT_CONFIG,issueWidth:0})).toThrow();
 });
 it('differentially verifies reproducible mixed programs across resource configurations',()=>{
  let seed=8191;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>8;};
  for(let t=0;t<35;t++){
   const lines:string[]=[];
   for(let i=0;i<35;i++){
    const d=rand()%10,a=rand()%10,b=rand()%10;
    switch(rand()%7){
     case 0:lines.push(`ADDI x${d},x${a},${rand()%4096-2048}`);break;
     case 1:lines.push(`SW x${b},${(rand()%4)*4}(x0)`);break;
     case 2:lines.push(`LW x${d},${(rand()%4)*4}(x0)`);break;
     default:lines.push(`${['ADD','SUB','MUL','AND','OR','XOR'][rand()%6]} x${d},x${a},x${b}`);
    }
   }
   check(lines.join('\n'),{physicalRegisters:33+rand()%40,robSize:2+rand()%20,issueCapacity:1+rand()%12,
    fetchWidth:1+rand()%4,decodeWidth:1+rand()%4,issueWidth:1+rand()%4,aluLatency:1+rand()%3,multiplyLatency:1+rand()%8});
  }
 });
});
