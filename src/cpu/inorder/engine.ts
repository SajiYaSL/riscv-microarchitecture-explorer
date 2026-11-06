import type {Instruction, Program} from '../../engine/assembler';

export type Latch = {id:number; ins:Instruction; value?:number; addr?:number;
  store?:number; nextPC:number; remaining:number; fault?:string};
export type PipelineEvent = {kind:'forward'|'stall'|'flush'|'retire'|'fault'; message:string; id?:number};
export type Snapshot = {
  cycle:number; fetchPC:number; pc:number; registers:number[]; memory:Map<number,number>;
  fetchLatch:Latch|null; ifid:Latch|null; idex:Latch|null; exmem:Latch|null; memwb:Latch|null;
  stages:Record<'IF'|'ID'|'EX'|'MEM'|'WB',Latch|null>;
  retired:Latch[]; events:PipelineEvent[]; nextId:number; stalls:number; squashed:number;
  halted:boolean; fault?:string;
};
export type InorderTiming={aluLatency:number;multiplyLatency:number};
const defaultTiming:InorderTiming={aluLatency:1,multiplyLatency:4};
const destination=(l:Latch|null)=>l?.ins.rd ? l.ins.rd : undefined;
export function initialState():Snapshot {
  return {cycle:0,fetchPC:0,pc:0,registers:Array<number>(32).fill(0),memory:new Map(),
    fetchLatch:null,ifid:null,idex:null,exmem:null,memwb:null,stages:{IF:null,ID:null,EX:null,MEM:null,WB:null},
    retired:[],events:[],nextId:0,stalls:0,squashed:0,halted:false};
}
/** Snapshot is the end of the labeled clock. WB effects are committed in that clock.
 * IF is the fetch latch; ID is the decoded latch; EX is the executing latch.
 * Single-cycle memory; nonpipelined four-cycle MUL; static sequential fetch.
 */
export function step(program:Program, old:Snapshot,timing:InorderTiming=defaultTiming):Snapshot {
  if(old.halted)return old;
  const s:Snapshot={...old,cycle:old.cycle+1,registers:[...old.registers],memory:new Map(old.memory),
    retired:[...old.retired],events:[],fetchLatch:null,ifid:null,idex:null,exmem:null,memwb:null,
    stages:{IF:null,ID:null,EX:null,MEM:null,WB:null}};
  // Old MEM enters WB; memory stores become architectural only at retirement.
  const wb=old.exmem;
  if(wb){
    const rd=destination(wb);
    if(rd!==undefined&&wb.value!==undefined)s.registers[rd]=wb.value;
    if(wb.store!==undefined&&wb.addr!==undefined)s.memory.set(wb.addr,wb.store);
    s.pc=wb.nextPC;s.retired.push({...wb});s.memwb={...wb};
    s.events.push({kind:'retire',id:wb.id,message:`Retire I${wb.id+1}: ${wb.ins.text}`});
  }
  s.registers[0]=0;
  const ex=old.idex;
  let redirect:number|undefined;
  let blocked=false;
  if(ex){
    if(ex.remaining>1){s.idex={...ex,remaining:ex.remaining-1};blocked=true;}
    else {
      const mem={...ex};
      if(mem.ins.op==='LW'||mem.ins.op==='SW'){
        if(mem.addr!%4!==0)mem.fault=`Line ${mem.ins.line}: misaligned word ${mem.ins.op==='LW'?'load':'store'} at ${mem.addr}`;
        else if(mem.ins.op==='LW')mem.value=s.memory.get(mem.addr!)??0;
      }
      if(mem.fault){
        s.fault=mem.fault;s.halted=true;s.pc=mem.ins.pc;
        s.events.push({kind:'fault',id:mem.id,message:mem.fault});
        s.squashed+=Number(!!old.fetchLatch)+Number(!!old.ifid);
        s.stages.WB=s.memwb;return s;
      }
      s.exmem=mem;
      if(mem.nextPC!==mem.ins.pc+4)redirect=mem.nextPC;
    }
  }
  const decoded=old.ifid;
  if(redirect!==undefined){
    s.fetchPC=redirect;s.squashed+=Number(!!old.fetchLatch)+Number(!!decoded);
    s.events.push({kind:'flush',id:ex?.id,message:`Resolved redirect to PC ${redirect}; flush IF and ID`});
  }else {
    const loadUse=!!decoded&&ex?.ins.op==='LW'&&destination(ex)!==undefined&&
      [decoded.ins.rs1,decoded.ins.rs2].includes(destination(ex));
    if(blocked||loadUse){
      s.fetchLatch=old.fetchLatch;s.ifid=decoded;s.stalls++;
      s.events.push({kind:'stall',id:decoded?.id,message:blocked?`EX occupied by multi-cycle ${ex?.ins.op}; hold IF/ID`:`Load-use RAW on x${ex?.ins.rd}; insert EX bubble`});
    }else {
      if(decoded){
        const operand=(r:number|undefined):number=>{
          if(!r)return 0;
          for(const producer of [s.exmem,s.memwb]){
            if(destination(producer)===r&&producer?.value!==undefined){
              s.events.push({kind:'forward',id:decoded.id,message:`Forward x${r} from ${producer.id===s.exmem?.id?'EX/MEM':'MEM/WB'} to I${decoded.id+1}`});return producer.value;
            }
          }
          return s.registers[r];
        };
        const ins=decoded.ins,a=operand(ins.rs1),b=operand(ins.rs2);
        const l:Latch={...decoded,nextPC:ins.pc+4,remaining:ins.op==='MUL'?timing.multiplyLatency:['ADD','ADDI','SUB','AND','OR','XOR','NOP'].includes(ins.op)?timing.aluLatency:1};
        switch(ins.op){
          case 'ADD':l.value=(a+b)|0;break;case 'ADDI':l.value=(a+ins.imm!)|0;break;
          case 'SUB':l.value=(a-b)|0;break;case 'AND':l.value=a&b;break;
          case 'OR':l.value=a|b;break;case 'XOR':l.value=a^b;break;
          case 'MUL':l.value=Math.imul(a,b);break;
          case 'LW':case 'SW':l.addr=(a+ins.imm!)>>>0;if(ins.op==='SW')l.store=b;break;
          case 'BEQ':if(a===b)l.nextPC=ins.target!;break;
          case 'BNE':if(a!==b)l.nextPC=ins.target!;break;
          case 'JAL':l.value=ins.pc+4;l.nextPC=ins.target!;break;
          case 'NOP':break;
        }
        s.idex=l;
      }
      s.ifid=old.fetchLatch;
      const ins=program.instructions[s.fetchPC/4];
      if(ins){s.fetchLatch={id:s.nextId++,ins,nextPC:ins.pc+4,remaining:1};s.fetchPC+=4;}
    }
  }
  s.stages={IF:s.fetchLatch,ID:s.ifid,EX:s.idex,MEM:s.exmem,WB:s.memwb};
  s.halted=!s.fetchLatch&&!s.ifid&&!s.idex&&!s.exmem&&!program.instructions[s.fetchPC/4];
  return s;
}
export function runPipeline(program:Program,maxCycles=2000,maxRetired=160,timing:InorderTiming=defaultTiming):Snapshot[]{
  const history=[initialState()];
  while(!history.at(-1)!.halted&&history.length<=maxCycles&&history.at(-1)!.retired.length<maxRetired)
    history.push(step(program,history.at(-1)!,timing));
  return history;
}
