import {describe,it,expect} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {executeProgram,simulate,stateAt} from '../src/engine/simulator';
import {compareArchitecturalState} from '../src/cpu/verification/compare';
import {DEFAULT_CONFIG,runOoo,type CPUConfig} from '../src/cpu/ooo/engine';
import {runPipeline} from '../src/cpu/inorder/engine';
import {EXAMPLES} from '../src/engine/programs';
const configs:Partial<CPUConfig>[]=[{}, {physicalRegisters:33,robSize:2,issueCapacity:1,fetchWidth:1,decodeWidth:1,issueWidth:1},
 {predictor:'two-bit',aluLatency:3,multiplyLatency:9,fetchWidth:4,decodeWidth:4,issueWidth:4},
 {predictor:'one-bit',physicalRegisters:40,robSize:8,issueCapacity:2,aluLatency:2}];
function checkBoth(code:string,changes:Partial<CPUConfig>={}){
 const program=assemble(code),config={...DEFAULT_CONFIG,...changes};
 const a=simulate(program,'inorder',config),b=simulate(program,'ooo',config);
 expect(compareArchitecturalState(program,a,b)).toEqual({verified:true,message:expect.any(String)});
 const oracle=executeProgram(program);
 for(const model of [a,b]){
  expect(model.events.map(e=>e.beforePC)).toEqual(oracle.trace.map(e=>e.beforePC));
  expect(model.fault).toBe(oracle.fault);
  expect(stateAt(model,model.totalCycles).memory).toEqual(oracle.memory);
 }
 return {a,b};
}
describe('full-state differential verification',()=>{
 it.each(Object.entries(EXAMPLES))('both engines verify %s under resource configurations',(_,code)=>{for(const config of configs)checkBoth(code,config);});
 it.each(['LW x0,1(x0)','SW x1,2(x0)','LW x3,-1(x0)'])('matches precise fault state: %s',instruction=>{
  for(const config of configs)checkBoth(`ADDI x1,x0,9\nSW x1,0(x0)\n${instruction}\nADDI x1,x0,99\nSW x1,4(x0)`,config);
 });
 it('wraps memory addresses to unsigned 32 bits, and preserves signed load values',()=>{
  const {a}=checkBoth('ADDI x1,x0,-4\nADDI x2,x0,-1\nSW x2,0(x1)\nLW x3,-4(x0)\nSW x3,4(x1)\nLW x4,0(x0)');
  expect(a.memory.get(4294967292)).toBe(-1);expect(a.registers[4]).toBe(-1);
 });
 it('handles overflow and signed multiplication independently',()=>{
  const code=['ADDI x1,x0,1',...Array.from({length:31},()=> 'ADD x1,x1,x1'),'ADDI x2,x1,-1','MUL x3,x2,x2','SUB x4,x0,x1'].join('\n');
  const {a}=checkBoth(code);expect(a.registers[1]).toBe(-2147483648);expect(a.registers[2]).toBe(2147483647);expect(a.registers[3]).toBe(1);expect(a.registers[4]).toBe(-2147483648);
 });
 it('never forwards a discarded write to x0',()=>{checkBoth('ADDI x0,x0,33\nADD x1,x0,x0\nMUL x0,x1,x1\nADDI x2,x0,9');});
 it('does not mark safety-limited comparisons verified',()=>{
  const p=assemble('loop: JAL x0,loop');const a=simulate(p,'inorder'),b=simulate(p,'ooo');expect(compareArchitecturalState(p,a,b).verified).toBe(false);
 });
 it('reduces loop mispredictions after predictor training',()=>{
  const p=assemble(EXAMPLES['Branch Prediction']);const s=runOoo(p).at(-1)!,t=runOoo(p,{...DEFAULT_CONFIG,predictor:'two-bit'}).at(-1)!;
  expect(t.mispredictions).toBeLessThan(s.mispredictions);expect(t.recoveryCycles).toBe(t.mispredictions);
 });
 it('bounds execution occupancy and never retires a squashed instruction',()=>{
  const h=runOoo(assemble(EXAMPLES['Branch Prediction']),{...DEFAULT_CONFIG,fetchWidth:4,decodeWidth:4,predictor:'one-bit'});
  for(const s of h){
   for(const unit of ['ALU','MUL','MEM','BR'] as const){expect(s.rob.filter(e=>e.status==='executing'&&e.unit===unit).length).toBeLessThanOrEqual(1);expect(s.unitBusy[unit]).toBeLessThanOrEqual(s.cycle);}
   expect(s.retired.every(e=>!s.instructions.find(l=>l.id===e.id)?.squashed)).toBe(true);
   expect(s.committedMap.every((p,r)=>s.physical[p].value===s.registers[r])).toBe(true);
   expect(s.rob.every(e=>!s.freeList.includes(e.src1)&&!s.freeList.includes(e.src2)&&(e.dst===undefined||!s.freeList.includes(e.dst)))).toBe(true);
  }
 });
 it('uses the configured in-order multiply and ALU latencies',()=>{
  const p=assemble('ADDI x1,x0,3\nMUL x2,x1,x1');const h=runPipeline(p,2000,160,{aluLatency:3,multiplyLatency:7});
  expect(h.filter(s=>s.stages.EX?.ins.op==='ADDI')).toHaveLength(3);expect(h.filter(s=>s.stages.EX?.ins.op==='MUL')).toHaveLength(7);
 });
 it('verifies seeded acyclic control flow, wrong-path memory and register allocation pressure',()=>{
  let seed=90213;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>7;};
  for(let t=0;t<30;t++){
   const lines=['ADDI x1,x0,1','ADDI x2,x0,2'];
   for(let i=0;i<8;i++){
    const d=3+rand()%8;
    lines.push(`MUL x${d},x1,x2`,`${rand()%2?'BEQ':'BNE'} x${d},x2,next${i}`,
     `ADDI x${3+rand()%8},x0,${rand()%20}`,`SW x${d},${(rand()%4)*4}(x0)`,
     `next${i}: ADD x${3+rand()%8},x${d},x1`,`LW x${3+rand()%8},${(rand()%4)*4}(x0)`);
   }
   checkBoth(lines.join('\n'),{...configs[t%configs.length],predictor:(['static','one-bit','two-bit'] as const)[t%3]});
  }
 });
});
