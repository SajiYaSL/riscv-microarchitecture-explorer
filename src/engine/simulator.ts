import type {Instruction,Program} from './assembler';
export type Mode='inorder'|'ooo';
export type Trace={id:number;ins:Instruction;reads:number[];write?:number;value?:number;addr?:number;store?:number;taken?:boolean;beforePC:number;afterPC:number};
export type Scheduled=Trace&{fetch:number;decode:number;execute:number;executeEnd:number;memory:number;commit:number;stalls:number;unit:number};
export type Simulation={mode:Mode;events:Scheduled[];totalCycles:number;retired:number;ipc:number;cpi:number;stalls:number;registers:number[];memory:Map<number,number>;instructions:Instruction[];truncated:boolean};
const int=(n:number)=>n|0;
const reads=(ins:Instruction)=>{
 const arr:number[]=[];
 if(ins.rs1!==undefined&&ins.rs1!==0)arr.push(ins.rs1);
 if(ins.rs2!==undefined&&ins.rs2!==0)arr.push(ins.rs2);
 return arr;
};
const writes=(ins:Instruction)=>ins.rd!==undefined && ins.rd!==0?ins.rd:undefined;
/** Independent sequential ISA oracle: no pipeline timing assumptions. */
export function executeProgram(program:Program,maxSteps=160):{trace:Trace[];registers:number[];memory:Map<number,number>;truncated:boolean}{
 const regs=new Array<number>(32).fill(0),memory=new Map<number,number>(),trace:Trace[]=[];
 let pc=0;
 while(pc>=0&&pc<program.instructions.length*4&&trace.length<maxSteps){
  const ins=program.instructions[pc/4];if(!ins)throw Error(`Invalid PC 0x${pc.toString(16)}`);
  const a=regs[ins.rs1??0],b=regs[ins.rs2??0];let value:number|undefined,addr:number|undefined,store:number|undefined,taken=false;
  let next=pc+4;
  switch(ins.op){
   case 'ADD':value=int(a+b);break; case 'ADDI':value=int(a+(ins.imm??0));break;
   case 'SUB':value=int(a-b);break;case 'AND':value=a&b;break;case 'OR':value=a|b;break;case 'XOR':value=a^b;break;
   case 'MUL':value=Math.imul(a,b);break;
   case 'LW':addr=int(a+(ins.imm??0));if(addr%4!==0)throw Error(`Line ${ins.line}: misaligned word load at ${addr}`);value=memory.get(addr)??0;break;
   case 'SW':addr=int(a+(ins.imm??0));if(addr%4!==0)throw Error(`Line ${ins.line}: misaligned word store at ${addr}`);store=b;memory.set(addr,b);break;
   case 'BEQ':case 'BNE':taken=ins.op==='BEQ'?a===b:a!==b;if(taken)next=ins.target!;break;
   case 'JAL':value=pc+4;next=ins.target!;taken=true;break;
   case 'NOP':break;
  }
  const write=writes(ins);if(write!==undefined&&value!==undefined)regs[write]=int(value);
  trace.push({id:trace.length,ins,reads:reads(ins),write,value,addr,store,taken,beforePC:pc,afterPC:next});
  pc=next;
 }
 return {trace,registers:regs,memory,truncated:trace.length>=maxSteps&&pc>=0&&pc<program.instructions.length*4};
}
const latency=(t:Trace)=>t.ins.op==='MUL'?4:t.ins.op==='LW'?2:1;
const isControl=(t:Trace)=>['BEQ','BNE','JAL'].includes(t.ins.op);
/** Pedagogical five-stage pipeline timing: single fetch/decode/execute lane, ALU forwarding,
 *  load-use interlock, and resolved-taken-branch fetch bubbles. Not an RTL cycle model. */
function scheduleInorder(trace:Trace[]):Scheduled[]{
 const out:Scheduled[]=[];let nextFetch=1,lastDecode=0,lastExecuteEnd=0,lastCommit=0;
 for(const t of trace){
  let fetch=Math.max(nextFetch,lastDecode),decode=Math.max(fetch+1,lastDecode+1),execute=Math.max(decode+1,lastExecuteEnd+1),stalls=0;
  for(const dep of out){if(dep.write!==undefined&&t.reads.includes(dep.write)){
    const latest=out.findLast(x=>x.id< t.id&&x.write===dep.write);
    if(latest?.id===dep.id){const ready=dep.ins.op==='LW'?dep.memory+1:dep.executeEnd+1;execute=Math.max(execute,ready);}
  }}
  // Decode is held while an older instruction occupies the issue path.
  decode=Math.max(decode,execute-1);stalls=Math.max(0,decode-(fetch+1));
  const executeEnd=execute+latency(t)-1;
  const memory=executeEnd+1;
  const commit=Math.max(memory+1,lastCommit+1);
  out.push({...t,fetch,decode,execute,executeEnd,memory,commit,stalls,unit:0});
  nextFetch=fetch+1;
  if(isControl(t)&&t.taken)nextFetch=Math.max(nextFetch,executeEnd+2);
  lastDecode=decode;lastExecuteEnd=executeEnd;lastCommit=commit;
 }
 return out;
}
/** Simplified speculative-free OoO timing: one dispatch/cycle, two execution units,
 * finite ROB, tagged dependencies, in-order single retirement. Control redirects serialize.
 * All instruction values come from an independent sequential ISA oracle. */
function scheduleOoo(trace:Trace[]):Scheduled[]{
 const out:Scheduled[]=[];let fetchNext=1,commitPrev=0;const units=[0,0];const robSize=8;
 for(const t of trace){
  let fetch=fetchNext;
  if(out.length>=robSize)fetch=Math.max(fetch,out[out.length-robSize].commit);
  let decode=fetch+1;
  let earliest=decode+1;
  for(const r of t.reads){const producer=out.findLast(x=>x.write===r);if(producer)earliest=Math.max(earliest,producer.executeEnd+1);}
  // A store/load cannot bypass older unresolved memory operations in this teaching model.
  if(t.ins.op==='LW'||t.ins.op==='SW'){
   const mem=out.findLast(x=>x.ins.op==='LW'||x.ins.op==='SW');if(mem)earliest=Math.max(earliest,mem.memory+1);
  }
  let unit=units[0]<=units[1]?0:1;
  let execute=Math.max(earliest,units[unit]+1);
  if(isControl(t)){execute=Math.max(execute,...units.map(x=>x+1));}
  const executeEnd=execute+latency(t)-1;units[unit]=executeEnd;
  const memory=executeEnd+1;
  const commit=Math.max(memory+1,commitPrev+1);
  const stalls=Math.max(0,execute-(decode+1));
  out.push({...t,fetch,decode,execute,executeEnd,memory,commit,stalls,unit});
  fetchNext=fetch+1;
  // No speculative wrong-path instructions are fetched. Control stops dispatch until resolved.
  if(isControl(t))fetchNext=Math.max(fetchNext,executeEnd+2);
  commitPrev=commit;
 }
 return out;
}
export function simulate(program:Program,mode:Mode):Simulation{
 const oracle=executeProgram(program);
 const events=mode==='inorder'?scheduleInorder(oracle.trace):scheduleOoo(oracle.trace);
 const totalCycles=events.at(-1)?.commit??0;
 return {mode,events,totalCycles,retired:events.length,ipc:totalCycles?events.length/totalCycles:0,cpi:events.length?totalCycles/events.length:0,stalls:events.reduce((s,t)=>s+t.stalls,0),registers:oracle.registers,memory:oracle.memory,instructions:program.instructions,truncated:oracle.truncated};
}
export function stateAt(sim:Simulation,cycle:number){
 const registers=Array<number>(32).fill(0),memory=new Map<number,number>();
 const retired=sim.events.filter(e=>e.commit<=cycle);
 for(const e of retired){if(e.write!==undefined&&e.value!==undefined)registers[e.write]=e.value;if(e.store!==undefined&&e.addr!==undefined)memory.set(e.addr,e.store);}
 const next=sim.events.find(e=>e.commit>cycle);
 return {registers,memory,retired:retired.length,pc:next?.beforePC??sim.events.at(-1)?.afterPC??0,lastWrite:retired.at(-1)?.write};
}
export type Stage='IF'|'ID'|'EX'|'MEM'|'WB'|'WAIT'|'DONE'|'NOT STARTED';
export function stageAt(e:Scheduled,c:number):Stage{
 if(c<e.fetch)return 'NOT STARTED';if(c===e.fetch)return 'IF';if(c<=e.decode)return 'ID';
 if(c<e.execute)return 'WAIT';if(c<=e.executeEnd)return 'EX';if(c===e.memory)return 'MEM';
 if(c<e.commit)return 'WAIT';if(c===e.commit)return 'WB';return 'DONE';
}
