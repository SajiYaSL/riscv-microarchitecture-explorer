import {runOoo, DEFAULT_CONFIG, validateConfig, type OooSnapshot, type CPUConfig} from '../cpu/ooo/engine';
import {runPipeline, type Snapshot} from '../cpu/inorder/engine';
import type {Instruction,Program} from './assembler';
export type Mode='inorder'|'ooo';
export type Trace={id:number;ins:Instruction;reads:number[];write?:number;value?:number;addr?:number;store?:number;taken?:boolean;beforePC:number;afterPC:number};
export type Scheduled=Trace&{fetch:number;decode:number;execute:number;executeEnd:number;memory:number;commit:number;stalls:number;unit:number;cycleStages?:Record<number,Stage>};
export type Simulation={mode:Mode;events:Scheduled[];totalCycles:number;retired:number;ipc:number;cpi:number;stalls:number;registers:number[];memory:Map<number,number>;instructions:Instruction[];truncated:boolean;snapshots?:Snapshot[];oooSnapshots?:OooSnapshot[];fault?:string};
const int=(n:number)=>n|0;
const reads=(ins:Instruction)=>{
 const arr:number[]=[];
 if(ins.rs1!==undefined&&ins.rs1!==0)arr.push(ins.rs1);
 if(ins.rs2!==undefined&&ins.rs2!==0)arr.push(ins.rs2);
 return arr;
};
const writes=(ins:Instruction)=>ins.rd!==undefined && ins.rd!==0?ins.rd:undefined;
/** Independent sequential ISA oracle: no pipeline timing assumptions. */
export function executeProgram(program:Program,maxSteps=160):{trace:Trace[];registers:number[];memory:Map<number,number>;truncated:boolean;pc:number;fault?:string}{
 const regs=new Array<number>(32).fill(0),memory=new Map<number,number>(),trace:Trace[]=[];
 let pc=0;let fault:string|undefined;
 execution: while(pc>=0&&pc<program.instructions.length*4&&trace.length<maxSteps){
  const ins=program.instructions[pc/4];if(!ins)throw Error(`Invalid PC 0x${pc.toString(16)}`);
  const a=regs[ins.rs1??0],b=regs[ins.rs2??0];let value:number|undefined,addr:number|undefined,store:number|undefined,taken=false;
  let next=pc+4;
  switch(ins.op){
   case 'ADD':value=int(a+b);break; case 'ADDI':value=int(a+(ins.imm??0));break;
   case 'SUB':value=int(a-b);break;case 'AND':value=a&b;break;case 'OR':value=a|b;break;case 'XOR':value=a^b;break;
   case 'MUL':value=Math.imul(a,b);break;
   case 'LW':addr=(a+(ins.imm??0))>>>0;if(addr%4!==0){fault=`Line ${ins.line}: misaligned word load at ${addr}`;break execution;}value=memory.get(addr)??0;break;
   case 'SW':addr=(a+(ins.imm??0))>>>0;if(addr%4!==0){fault=`Line ${ins.line}: misaligned word store at ${addr}`;break execution;}store=b;memory.set(addr,b);break;
   case 'BEQ':case 'BNE':taken=ins.op==='BEQ'?a===b:a!==b;if(taken)next=ins.target!;break;
   case 'JAL':value=pc+4;next=ins.target!;taken=true;break;
   case 'NOP':break;
  }
  const write=writes(ins);if(write!==undefined&&value!==undefined)regs[write]=int(value);
  trace.push({id:trace.length,ins,reads:reads(ins),write,value,addr,store,taken,beforePC:pc,afterPC:next});
  pc=next;
 }
 return {trace,registers:regs,memory,pc,fault,truncated:trace.length>=maxSteps&&pc>=0&&pc<program.instructions.length*4};
}
export function simulate(program:Program,mode:Mode,config:CPUConfig=DEFAULT_CONFIG):Simulation{
 const errors=validateConfig(config);if(errors.length)throw Error(errors.join('; '));
 if(mode==='inorder'){
  const snapshots=runPipeline(program,2000,160,config),last=snapshots.at(-1)!;

  const events:Scheduled[]=last.retired.map(l=>{
   const at=(stage:keyof Snapshot['stages'])=>snapshots.filter(s=>s.stages[stage]?.id===l.id).map(s=>s.cycle);
   const fetch=at('IF')[0],decode=at('ID').at(-1)!,execute=at('EX')[0],executeEnd=at('EX').at(-1)!,memory=at('MEM')[0],commit=at('WB')[0];
   return {id:l.id,ins:l.ins,reads:reads(l.ins),write:writes(l.ins),value:l.value,addr:l.addr,store:l.store,
    taken:l.nextPC!==l.ins.pc+4,beforePC:l.ins.pc,afterPC:l.nextPC,fetch,decode,execute,executeEnd,memory,commit,
    stalls:Math.max(0,execute-fetch-2),unit:0,cycleStages:Object.fromEntries(snapshots.flatMap(s=>Object.entries(s.stages).filter(([,entry])=>entry?.id===l.id).map(([stage])=>[s.cycle,stage as Stage])))};
  });
  const totalCycles=last.cycle,retired=events.length;
  return {mode,events,totalCycles,retired,ipc:retired/totalCycles,cpi:retired?totalCycles/retired:0,
   stalls:last.stalls,registers:last.registers,memory:last.memory,instructions:program.instructions,truncated:!last.halted,fault:last.fault,snapshots};
 }
 const oooSnapshots=runOoo(program,config),last=oooSnapshots.at(-1)!;
 const events:Scheduled[]=last.retired.map(e=>{
  const life=last.instructions.find(l=>l.id===e.id)!;
  const at=(phase:string)=>Number(Object.entries(life.history).find(([,p])=>p===phase)?.[0]??0);
  const execute=at('Issue'),executeEnd=at('Writeback');
  return {id:e.id,ins:e.ins,reads:reads(e.ins),write:writes(e.ins),value:e.value,addr:e.addr,store:e.store,
   taken:e.nextPC!==e.ins.pc+4,beforePC:e.ins.pc,afterPC:e.nextPC,
   fetch:at('Fetch'),decode:at('Decode'),execute,executeEnd,memory:executeEnd,commit:life.retired!,
   stalls:Object.values(life.history).filter(p=>p==='Stall').length,unit:({ALU:0,MUL:1,MEM:2,BR:3})[e.unit]};
 });
 const totalCycles=last.cycle,retired=events.length;
 return {mode,events,totalCycles,retired,ipc:retired/totalCycles,cpi:retired?totalCycles/retired:0,
  stalls:last.stalls,registers:last.registers,memory:last.memory,instructions:program.instructions,
  truncated:!last.halted,fault:last.fault,oooSnapshots};
}
export function stateAt(sim:Simulation,cycle:number){
 const snapshots=sim.snapshots??sim.oooSnapshots;
 if(snapshots){const s=snapshots[Math.max(0,Math.min(Math.floor(cycle),snapshots.length-1))];
  return {registers:s.registers,memory:s.memory,retired:s.retired.length,pc:s.pc,lastWrite:s.retired.at(-1)?.ins.rd};}

 const registers=Array<number>(32).fill(0),memory=new Map<number,number>();
 const retired=sim.events.filter(e=>e.commit<=cycle);
 for(const e of retired){if(e.write!==undefined&&e.value!==undefined)registers[e.write]=e.value;if(e.store!==undefined&&e.addr!==undefined)memory.set(e.addr,e.store);}
 const next=sim.events.find(e=>e.commit>cycle);
 return {registers,memory,retired:retired.length,pc:next?.beforePC??sim.events.at(-1)?.afterPC??0,lastWrite:retired.at(-1)?.write};
}
export type Stage='IF'|'ID'|'EX'|'MEM'|'WB'|'WAIT'|'DONE'|'NOT STARTED';
export function stageAt(e:Scheduled,c:number):Stage{
 if(e.cycleStages)return e.cycleStages[c]??(c<e.fetch?'NOT STARTED':c>e.commit?'DONE':'WAIT');
 if(c<e.fetch)return 'NOT STARTED';if(c===e.fetch)return 'IF';if(c<=e.decode)return 'ID';
 if(c<e.execute)return 'WAIT';if(c<=e.executeEnd)return 'EX';if(c===e.memory)return 'MEM';
 if(c<e.commit)return 'WAIT';if(c===e.commit)return 'WB';return 'DONE';
}
