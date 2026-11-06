import type {Program} from '../../engine/assembler';
import {executeProgram,type Simulation} from '../../engine/simulator';
export function compareArchitecturalState(program:Program,a:Simulation,b:Simulation):{verified:boolean;message:string}{
 if(a.truncated||b.truncated)return {verified:false,message:'Unverified: a run reached its cycle or retirement safety limit.'};
 const oracle=executeProgram(program);
 if(oracle.truncated)return {verified:false,message:'Unverified: interpreter retirement limit reached.'};
 const match=(s:Simulation)=>{
  const last=s.snapshots?.at(-1)??s.oooSnapshots?.at(-1);
  return s.registers.every((v,i)=>v===oracle.registers[i])&&s.memory.size===oracle.memory.size&&
   [...s.memory].every(([address,value])=>oracle.memory.get(address)===value)&&
   s.events.length===oracle.trace.length&&s.events.every((e,i)=>e.ins.pc===oracle.trace[i].ins.pc)&&
   last?.pc===oracle.pc&&s.fault===oracle.fault;
 };
 return match(a)&&match(b)?{verified:true,message:'Verified against interpreter: all registers, memory, retired PC sequence, final PC and fatal fault agree.'}:
  {verified:false,message:'Architectural mismatch: inspect final registers, memory, retirement sequence and fault state.'};
}
