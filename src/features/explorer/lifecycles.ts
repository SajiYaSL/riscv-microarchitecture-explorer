import type {Simulation} from '../../engine/simulator';
import type {Instruction} from '../../engine/assembler';
export type LifeRow={id:number;ins:Instruction;history:Record<number,string>;reason:Record<number,string>;retired?:number;squashed?:number;faulted?:number};
export function lifecycles(sim:Simulation):LifeRow[]{
 if(sim.oooSnapshots)return sim.oooSnapshots.at(-1)!.instructions;
 const rows=new Map<number,LifeRow>();
 for(const s of sim.snapshots??[]){
  for(const [stage,e] of Object.entries(s.stages))if(e){
   if(!rows.has(e.id))rows.set(e.id,{id:e.id,ins:e.ins,history:{},reason:{}});
   const life=rows.get(e.id)!;life.history[s.cycle]=({IF:'Fetch',ID:'Decode',EX:'Execute',MEM:'Memory',WB:'Retire'})[stage]!;
   if(stage==='WB')life.retired=s.cycle;
  }
  for(const event of s.events){
   if(event.kind==='fault'&&event.id!==undefined&&rows.has(event.id)){const life=rows.get(event.id)!;life.history[s.cycle]='Fault';life.faulted=s.cycle;}
   if(event.id!==undefined&&rows.has(event.id))rows.get(event.id)!.reason[s.cycle]=event.message;
  }
  if(s.events.some(e=>e.kind==='flush'||e.kind==='fault')){
   const prior=sim.snapshots![s.cycle-1];
   for(const entry of [prior.fetchLatch,prior.ifid])if(entry){
    const life=rows.get(entry.id)!;life.history[s.cycle]='Squash';life.squashed=s.cycle;
    life.reason[s.cycle]='Younger frontend instruction discarded during recovery';
   }
  }
 }
 return [...rows.values()];
}
export function phaseAt(life:LifeRow,c:number):string {
 if((life.faulted!==undefined&&c>life.faulted)||(life.retired!==undefined&&c>life.retired)||(life.squashed!==undefined&&c>life.squashed))return '';
 if(life.history[c])return life.history[c];
 const last=Object.entries(life.history).filter(([n])=>Number(n)<c).at(-1)?.[1];
 return last==='Writeback'?'ROB':last==='Issue'?'Execute':last??'';
}
