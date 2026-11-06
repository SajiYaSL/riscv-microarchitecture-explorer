import type {Instruction, Program} from '../../engine/assembler';

export type Predictor = 'static'|'one-bit'|'two-bit';
export type CPUConfig = {
  fetchWidth:number; decodeWidth:number; issueWidth:number; robSize:number;
  physicalRegisters:number; issueCapacity:number; aluLatency:number;
  multiplyLatency:number; predictor:Predictor;
};
export const DEFAULT_CONFIG:CPUConfig={fetchWidth:2,decodeWidth:2,issueWidth:2,
  robSize:16,physicalRegisters:64,issueCapacity:12,aluLatency:1,multiplyLatency:4,predictor:'static'};
export function validateConfig(c:CPUConfig):string[] {
  const limits:Record<Exclude<keyof CPUConfig,'predictor'>,[number,number]>={
    fetchWidth:[1,4],decodeWidth:[1,4],issueWidth:[1,4],robSize:[2,64],
    physicalRegisters:[33,128],issueCapacity:[1,64],aluLatency:[1,8],multiplyLatency:[1,16]};
  const errors:string[]=[];
  for(const [name,[min,max]] of Object.entries(limits)){
    const value=c[name as keyof typeof limits];
    if(!Number.isInteger(value)||value<min||value>max)errors.push(`${name} must be an integer from ${min} to ${max}`);
  }
  if(!['static','one-bit','two-bit'].includes(c.predictor))errors.push('Unsupported branch predictor');
  return errors;
}
export type Phase='Fetch'|'Decode'|'Rename'|'Dispatch'|'Issue'|'Execute'|'Writeback'|'Retire'|'Stall'|'Squash'|'Fault';
export type Unit='ALU'|'MUL'|'MEM'|'BR';
export type DynamicInstruction={id:number;ins:Instruction;predictedPC:number;predictionTaken:boolean};
export type ROBEntry=DynamicInstruction & {
  src1:number;src2:number;dst?:number;oldDst?:number;
  status:'renamed'|'waiting'|'executing'|'complete';unit:Unit;remaining:number;
  a?:number;b?:number;value?:number;addr?:number;store?:number;nextPC:number;fault?:string;
};
export type Lifecycle=DynamicInstruction & {history:Record<number,Phase>;reason:Record<number,string>;retired?:number;squashed?:number;faulted?:number};
export type OooEvent={kind:Phase|'Recovery';id?:number;message:string};
export type PhysicalRegister={value:number;ready:boolean};
export type OooSnapshot={
  cycle:number;fetchPC:number;pc:number;nextId:number;registers:number[];memory:Map<number,number>;
  rat:number[];committedMap:number[];physical:PhysicalRegister[];freeList:number[];
  fetchQueue:DynamicInstruction[];decodeQueue:DynamicInstruction[];rob:ROBEntry[];
  retired:ROBEntry[];instructions:Lifecycle[];events:OooEvent[];predictorTable:Record<number,number>;
  stalls:number;squashed:number;resolvedBranches:number;mispredictions:number;recoveryCycles:number;
  unitBusy:Record<Unit,number>;halted:boolean;fault?:string;recovery:boolean;
};
export const unitFor=(ins:Instruction):Unit=>ins.op==='MUL'?'MUL':
  ins.op==='LW'||ins.op==='SW'?'MEM':['BEQ','BNE','JAL'].includes(ins.op)?'BR':'ALU';
export const isMemory=(e:ROBEntry)=>e.unit==='MEM';
export function initialOoo(config:CPUConfig=DEFAULT_CONFIG):OooSnapshot {
  const errors=validateConfig(config);if(errors.length)throw Error(errors.join('; '));
  return {cycle:0,fetchPC:0,pc:0,nextId:0,registers:Array<number>(32).fill(0),memory:new Map(),
    rat:Array.from({length:32},(_,i)=>i),committedMap:Array.from({length:32},(_,i)=>i),
    physical:Array.from({length:config.physicalRegisters},()=>({value:0,ready:true})),
    freeList:Array.from({length:config.physicalRegisters-32},(_,i)=>i+32),
    fetchQueue:[],decodeQueue:[],rob:[],retired:[],instructions:[],events:[],predictorTable:{},
    stalls:0,squashed:0,resolvedBranches:0,mispredictions:0,recoveryCycles:0,
    unitBusy:{ALU:0,MUL:0,MEM:0,BR:0},halted:false,recovery:false};
}
/** Restore mappings from committed state plus surviving entries, never from oracle values. */
function rebuildRename(s:OooSnapshot){
  s.rat=[...s.committedMap];
  const used=new Set(s.committedMap);
  for(const e of s.rob){
    if(e.ins.rd&&e.dst!==undefined)s.rat[e.ins.rd]=e.dst;
    for(const tag of [e.src1,e.src2,e.dst,e.oldDst])if(tag!==undefined)used.add(tag);
  }
  s.freeList=s.physical.flatMap((_,i)=>used.has(i)?[]:[i]);
}
export function waitingReason(s:OooSnapshot,e:ROBEntry):string {
  const missing=[e.src1,e.src2].filter(p=>!s.physical[p].ready);
  if(missing.length)return `RAW: waiting for ${[...new Set(missing)].map(p=>`p${p}`).join(', ')}`;
  // Deliberately conservative: every older memory operation must RETIRE first.
  if(isMemory(e)&&s.rob.some(older=>older.id<e.id&&isMemory(older)))return 'Memory order: older load/store must retire';
  if(s.rob.some(other=>other.status==='executing'&&other.unit===e.unit))return `${e.unit} unit busy`;
  return 'Operands ready; eligible for oldest-ready selection';
}
export function stepOoo(program:Program,old:OooSnapshot,config:CPUConfig=DEFAULT_CONFIG):OooSnapshot {
  if(old.halted)return old;
  const s:OooSnapshot={...old,cycle:old.cycle+1,registers:[...old.registers],memory:new Map(old.memory),
    rat:[...old.rat],committedMap:[...old.committedMap],physical:old.physical.map(p=>({...p})),
    freeList:[...old.freeList],fetchQueue:old.fetchQueue.map(e=>({...e})),decodeQueue:old.decodeQueue.map(e=>({...e})),
    rob:old.rob.map(e=>({...e})),retired:[...old.retired],
    instructions:old.instructions.map(e=>({...e,history:{...e.history},reason:{...e.reason}})),
    events:[],predictorTable:{...old.predictorTable},unitBusy:{...old.unitBusy},recovery:false};
  const mark=(id:number,phase:Phase,message?:string)=>{
    const life=s.instructions.find(e=>e.id===id)!;life.history[s.cycle]=phase;
    if(message)life.reason[s.cycle]=message;
    if(phase==='Retire')life.retired=s.cycle;if(phase==='Squash')life.squashed=s.cycle;if(phase==='Fault')life.faulted=s.cycle;
    if(message)s.events.push({kind:phase,id,message});
  };
  const squash=(ids:Set<number>)=>{for(const id of ids)mark(id,'Squash','Discard speculative instruction; no architectural effect');s.squashed+=ids.size;};
  // One retirement per clock; only entries complete in the PREVIOUS snapshot qualify.
  const head=s.rob[0];
  if(head?.status==='complete'){
    if(head.fault){
      s.fault=head.fault;s.pc=head.ins.pc;s.halted=true;
      mark(head.id,'Fault',`Fault at ROB head: ${head.fault}`);
      squash(new Set([...s.rob.slice(1),...s.fetchQueue,...s.decodeQueue].map(e=>e.id)));
      s.rob=[];s.fetchQueue=[];s.decodeQueue=[];rebuildRename(s);
      s.events.push({kind:'Recovery',id:head.id,message:`Precise fatal fault: ${head.fault}`});return s;
    }
    if(head.ins.rd&&head.dst!==undefined){
      s.registers[head.ins.rd]=head.value!;s.committedMap[head.ins.rd]=head.dst;
      s.freeList.push(head.oldDst!);
    }
    if(head.store!==undefined)s.memory.set(head.addr!,head.store);
    s.pc=head.nextPC;s.retired.push({...head});s.rob.shift();
    mark(head.id,'Retire',`Retire I${head.id+1} in program order`);
  }
  const busy=new Set<Unit>();
  // Completion visits oldest first so recovery can remove younger completions this clock.
  for(const e of [...s.rob]){
    if(e.status!=='executing'||!s.rob.includes(e))continue;
    if(!busy.has(e.unit)){s.unitBusy[e.unit]++;busy.add(e.unit);}
    if(e.remaining>1){e.remaining--;mark(e.id,'Execute');continue;}
    const a=e.a!,b=e.b!,ins=e.ins;
    switch(ins.op){
      case 'ADD':e.value=(a+b)|0;break;case 'ADDI':e.value=(a+ins.imm!)|0;break;
      case 'SUB':e.value=(a-b)|0;break;case 'AND':e.value=a&b;break;
      case 'OR':e.value=a|b;break;case 'XOR':e.value=a^b;break;
      case 'MUL':e.value=Math.imul(a,b);break;
      case 'LW':case 'SW':
        e.addr=(a+ins.imm!)>>>0;
        if(e.addr%4!==0)e.fault=`Line ${ins.line}: misaligned word ${ins.op==='LW'?'load':'store'} at ${e.addr}`;
        else if(ins.op==='LW')e.value=s.memory.get(e.addr)??0;else e.store=b;
        break;
      case 'BEQ':if(a===b)e.nextPC=ins.target!;break;
      case 'BNE':if(a!==b)e.nextPC=ins.target!;break;
      case 'JAL':e.value=ins.pc+4;e.nextPC=ins.target!;break;
      case 'NOP':break;
    }
    e.status='complete';e.remaining=0;
    if(e.dst!==undefined&&!e.fault)s.physical[e.dst]={value:e.value!,ready:true};
    mark(e.id,'Writeback',e.fault?`Fault recorded; wait for ROB head: ${e.fault}`:e.unit==='BR'?`Branch resolves to PC ${e.nextPC}; predicted PC ${e.predictedPC}`:`I${e.id+1} completes; wake consumers of ${e.dst===undefined?'no destination':`p${e.dst}`}`);
    if(e.unit==='BR'){
      const taken=ins.op==='JAL'||(ins.op==='BEQ'?a===b:a!==b);
      s.resolvedBranches++;
      if(ins.op!=='JAL'){
        const before=s.predictorTable[ins.pc]??(config.predictor==='two-bit'?1:0);
        s.predictorTable[ins.pc]=config.predictor==='two-bit'?Math.max(0,Math.min(3,before+(taken?1:-1))):Number(taken);
      }
      if(e.nextPC!==e.predictedPC){
        s.mispredictions++;s.recoveryCycles++;s.recovery=true;
        squash(new Set([...s.rob.filter(x=>x.id>e.id),...s.fetchQueue,...s.decodeQueue].map(x=>x.id)));
        s.rob=s.rob.filter(x=>x.id<=e.id);s.fetchQueue=[];s.decodeQueue=[];s.fetchPC=e.nextPC;
        rebuildRename(s);
        s.events.push({kind:'Recovery',id:e.id,message:`Mispredict: predicted PC ${e.predictedPC}, actual ${e.nextPC}. Restore RAT, reclaim younger registers, restart next clock.`});
        break;
      }
    }
  }
  // Issue only entries that were waiting before this clock. Wakeup is visible next clock.
  let issued=0;
  const selectedUnits=new Set<Unit>();
  for(const e of s.rob){
    if(e.status!=='waiting')continue;
    const prior=old.rob.find(p=>p.id===e.id);
    let reason=waitingReason(old,prior??e);
    if(!prior||prior.status!=='waiting')continue;
    const operandsReady=old.physical[e.src1].ready&&old.physical[e.src2].ready;
    const memoryReady=!isMemory(e)||!s.rob.some(p=>p.id<e.id&&isMemory(p));
    const unitReady=!selectedUnits.has(e.unit)&&!s.rob.some(p=>p.status==='executing'&&p.unit===e.unit);
    if(issued<config.issueWidth&&operandsReady&&memoryReady&&unitReady){
      e.a=old.physical[e.src1].value;e.b=old.physical[e.src2].value;
      e.remaining=e.unit==='MUL'?config.multiplyLatency:e.unit==='ALU'?config.aluLatency:e.unit==='MEM'?2:1;
      e.status='executing';issued++;selectedUnits.add(e.unit);
      mark(e.id,'Issue',`I${e.id+1} issues to ${e.unit}: p${e.src1} and p${e.src2} ready${s.rob.some(p=>p.id<e.id&&p.status==='waiting')?'; bypasses older blocked work':''}`);
    }else{
      if(operandsReady&&!memoryReady)reason='Memory order: older load/store must retire';
      else if(operandsReady&&!unitReady)reason=`${e.unit} unit busy`;
      else if(issued>=config.issueWidth)reason='Issue bandwidth exhausted';
      mark(e.id,'Stall',reason);
    }
  }
  // Renamed entries spend one distinct Dispatch clock before selection.
  for(const e of s.rob)if(e.status==='renamed'){
    const occupancy=s.rob.filter(x=>x.status==='waiting').length;
    if(occupancy<config.issueCapacity){e.status='waiting';mark(e.id,'Dispatch',`Dispatch to issue queue with physical source tags p${e.src1}, p${e.src2}`);}
    else mark(e.id,'Stall','Issue queue full; rename backpressure');
  }
  let frontendStalled=false;
  if(!s.recovery){
    for(let i=0;i<config.decodeWidth&&s.decodeQueue.length;i++){
      const dynamic=s.decodeQueue[0],ins=dynamic.ins;
      if(s.rob.length>=config.robSize||(ins.rd&&!s.freeList.length)){
        frontendStalled=true;mark(dynamic.id,'Stall',s.rob.length>=config.robSize?'ROB full':'Physical free list empty');break;
      }
      const entry:ROBEntry={...dynamic,src1:s.rat[ins.rs1??0],src2:s.rat[ins.rs2??0],
        status:'renamed',unit:unitFor(ins),remaining:0,nextPC:ins.pc+4};
      if(ins.rd){entry.oldDst=s.rat[ins.rd];entry.dst=s.freeList.shift()!;
        s.rat[ins.rd]=entry.dst;s.physical[entry.dst]={value:0,ready:false};}
      s.rob.push(entry);s.decodeQueue.shift();
      mark(entry.id,'Rename',ins.rd?`x${ins.rd}: p${entry.oldDst} → p${entry.dst}; capture sources before changing RAT`:'No destination allocation');
    }
    const frontendCapacity=Math.max(4,config.fetchWidth*4);
    for(let i=0;i<config.decodeWidth&&s.fetchQueue.length&&s.decodeQueue.length<frontendCapacity;i++){
      const e=s.fetchQueue.shift()!;s.decodeQueue.push(e);mark(e.id,'Decode');
    }
    for(let i=0;i<config.fetchWidth&&s.fetchQueue.length<frontendCapacity;i++){
      const ins=program.instructions[s.fetchPC/4];if(!ins)break;
      const state=s.predictorTable[ins.pc]??(config.predictor==='two-bit'?1:0);
      const taken=ins.op==='JAL'||(['BEQ','BNE'].includes(ins.op)&&config.predictor!=='static'&&state>=(config.predictor==='two-bit'?2:1));
      const e:DynamicInstruction={id:s.nextId++,ins,predictedPC:taken?ins.target!:ins.pc+4,predictionTaken:taken};
      s.instructions.push({...e,history:{[s.cycle]:'Fetch'},reason:{}});
      s.fetchQueue.push(e);s.fetchPC=e.predictedPC;
    }
    if(s.fetchQueue.length>=frontendCapacity||s.decodeQueue.length>=frontendCapacity)frontendStalled=true;
  }
  if(frontendStalled)s.stalls++;
  s.registers[0]=0;s.rat[0]=0;s.physical[0]={value:0,ready:true};
  s.halted=!s.rob.length&&!s.fetchQueue.length&&!s.decodeQueue.length&&!program.instructions[s.fetchPC/4];
  return s;
}
export function runOoo(program:Program,config:CPUConfig=DEFAULT_CONFIG,maxCycles=2000,maxRetired=160):OooSnapshot[]{
  const history=[initialOoo(config)];
  while(!history.at(-1)!.halted&&history.length<=maxCycles&&history.at(-1)!.retired.length<maxRetired)
    history.push(stepOoo(program,history.at(-1)!,config));
  return history;
}
