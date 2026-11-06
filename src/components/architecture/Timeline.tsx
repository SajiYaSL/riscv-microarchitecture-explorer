import {useMemo,useState} from 'react';
import type {Simulation} from '../../engine/simulator';
import type {Instruction} from '../../engine/assembler';
import {Panel,hex} from './shared';
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
const short:Record<string,string>={Fetch:'IF',Decode:'ID',Rename:'RN',Dispatch:'DP',Issue:'IS',Execute:'EX',Writeback:'WB',Retire:'RT',Stall:'ST',Squash:'SQ',Memory:'MEM',ROB:'ROB',Fault:'FT'};
export function Timeline({sim,cycle,selected,onSelect,compact=false}:{sim:Simulation;cycle:number;selected:number|null;onSelect:(id:number)=>void;compact?:boolean}){
 const rows=useMemo(()=>lifecycles(sim),[sim]);const [page,setPage]=useState(0);
 const pageSize=compact?8:18,maxPage=Math.max(0,Math.ceil(rows.length/pageSize)-1),safePage=Math.min(page,maxPage);
 const start=Math.max(1,cycle-12),count=Math.min(compact?30:48,Math.max(sim.totalCycles-start+1,1));
 const visible=rows.slice(safePage*pageSize,(safePage+1)*pageSize);
 const life=rows.find(e=>e.id===selected);
 return <Panel title={compact?`${sim.mode==='ooo'?'Out-of-order':'In-order'} timeline`:'Instruction lifecycle'} detail={<div className="timeline-nav"><button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>↑</button><span>{safePage+1}/{maxPage+1}</span><button disabled={safePage>=maxPage} onClick={()=>setPage(safePage+1)}>↓</button></div>}>
 <div className="inspector-note">{compact?'Independent clock scale':'All fetched instructions, including squashes'} · cycles {start}–{start+count-1} · select a row or cell</div>
 <div className="timeline-scroll"><div className="timeline lifecycle-grid" style={{minWidth:180+count*28}}>
  <div className="timeline-row"><span className="instr-label header-label">DYNAMIC INSTRUCTION</span>{Array.from({length:count},(_,i)=><span className={`tick ${start+i===cycle?'current-tick':''}`} key={i}>{start+i}</span>)}</div>
  {visible.map(e=><div className={`timeline-row ${selected===e.id?'selected-instruction':''}`} key={e.id}><button className="instr-label text-button" title={`${hex(e.ins.pc)} · ${e.ins.text}`} onClick={()=>onSelect(e.id)}>I{e.id+1} · {e.ins.text}</button>{Array.from({length:count},(_,i)=>{const c=start+i,p=phaseAt(e,c);return <button className={`timecell phase-${p.toLowerCase()} ${!p?'empty':''} ${c===cycle?'playhead':''}`} title={`I${e.id+1} · cycle ${c}: ${p||'inactive'}${e.reason[c]?` — ${e.reason[c]}`:''}`} onClick={()=>onSelect(e.id)} key={c}>{short[p]??p}</button>;})}</div>)}
 </div></div>
 {!compact&&<div className="lifecycle-inspection">{life?<><strong>I{life.id+1} · {life.ins.text}</strong><span>PC {hex(life.ins.pc)} · {life.faulted!==undefined&&life.faulted<=cycle?`Fatal fault at clock ${life.faulted}`:life.squashed!==undefined&&life.squashed<=cycle?`Squashed at clock ${life.squashed}`:life.retired!==undefined&&life.retired<=cycle?`Retired at clock ${life.retired}`:phaseAt(life,cycle)||'Not fetched yet'}</span><p>{Object.entries(life.reason).filter(([c])=>Number(c)<=cycle).at(-1)?.[1]??'Advance the clock to inspect execution.'}</p></>:<span>Select an instruction to inspect its live lifecycle and latest explanation.</span>}</div>}
 </Panel>;
}
