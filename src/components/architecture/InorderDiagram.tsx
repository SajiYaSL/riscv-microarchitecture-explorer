import {useState} from 'react';
import type {Snapshot} from '../../cpu/inorder/engine';
import {Panel,hex} from './shared';
const stages=['IF','ID','EX','MEM','WB'] as const;
export function InorderDiagram({s,onSelect}:{s:Snapshot;onSelect:(id:number)=>void}){
 const [inspect,setInspect]=useState<typeof stages[number]>('EX');
 const forwarding=s.events.filter(e=>e.kind==='forward'),flushed=s.events.some(e=>e.kind==='flush'),stalled=s.events.some(e=>e.kind==='stall');
 const entry=s.stages[inspect];
 return <Panel title="Five-stage pipeline" detail={<span className={`pill ${flushed?'bad':stalled?'amber':'green'}`}>{flushed?'REDIRECT':stalled?'INTERLOCK':'LIVE STATE'}</span>}>
 <div className="diagram-scroll"><svg viewBox="0 0 1000 265" className="architecture-diagram" role="img" aria-label="Interactive five-stage pipeline with forwarding and flush paths"><defs><marker id="arrow-in" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#65d9c2"/></marker></defs>
  {stages.map((stage,i)=>{const x=15+i*198,e=s.stages[stage];return <g key={stage} tabIndex={0} role="button" aria-label={`Inspect ${stage}`} onClick={()=>{setInspect(stage);if(e)onSelect(e.id);}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setInspect(stage);if(e)onSelect(e.id);}}}>
   <rect x={x} y={60} width={170} height={132} rx={12} fill={e?'#163a43':'#152437'} stroke={inspect===stage?'#58e1c8':'#3a526d'}/>
   <text x={x+85} y={88} textAnchor="middle" fill="#65e4ce" fontSize={22}>{stage}</text><text x={x+85} y={112} textAnchor="middle" fill="#a5b4cb" fontSize={10}>{['Instruction fetch','Decode','Execute','Memory','Writeback'][i]}</text>
   <text x={x+85} y={143} textAnchor="middle" fill="#e2edf9" fontSize={12}>{e?`I${e.id+1} · ${e.ins.op}`:'Bubble'}</text><text x={x+85} y={170} textAnchor="middle" fill="#90a7be" fontSize={10}>{e?hex(e.ins.pc):'No valid instruction'}</text>
   {i<4&&<><path d={`M${x+171},125 H${x+196}`} stroke="#65d9c2" markerEnd="url(#arrow-in)"/><text x={x+181} y={205} fill="#8c9fb7" fontSize={9} textAnchor="middle">{['IF/ID','ID/EX','EX/MEM','MEM/WB'][i]}</text></>}
  </g>;})}
  <path d="M690,55 V35 H496 V55" fill="none" stroke={forwarding.some(e=>e.message.includes('EX/MEM'))?'#f9cc82':'#34465e'} markerEnd="url(#arrow-in)"/><text x="605" y="28" textAnchor="middle" fontSize={9} fill="#a9b8cb">EX/MEM → EX</text>
  <path d="M890,55 V10 H496 V55" fill="none" stroke={forwarding.some(e=>e.message.includes('MEM/WB'))?'#f9cc82':'#34465e'} markerEnd="url(#arrow-in)"/><text x="805" y="27" textAnchor="middle" fontSize={9} fill="#a9b8cb">MEM/WB → EX</text>
  <path d="M495,215 V242 H100 V198" fill="none" stroke={flushed?'#ff9eb2':'#34465e'} strokeDasharray="5 4" markerEnd="url(#arrow-in)"/><text x="300" y="259" textAnchor="middle" fill={flushed?'#ff9eb2':'#829ab5'} fontSize={10}>{flushed?'Redirect: discard younger IF / ID':'Branch resolution → frontend redirect'}</text>
 </svg></div><div className="component-inspector"><b>{inspect} latch</b><p>{entry?.ins.text??'Bubble — this latch has no valid instruction.'}</p>{entry&&<div className="latch-details"><span>PC <b>{hex(entry.ins.pc)}</b></span><span>Sources <b>{entry.ins.rs1===undefined?'—':`x${entry.ins.rs1}`} / {entry.ins.rs2===undefined?'—':`x${entry.ins.rs2}`}</b></span><span>Destination <b>{entry.ins.rd===undefined?'—':`x${entry.ins.rd}`}</b></span><span>Result <b>{entry.value===undefined?'pending':hex(entry.value)}</b></span><span>Memory address <b>{entry.addr===undefined?'—':hex(entry.addr)}</b></span><span>Store data <b>{entry.store===undefined?'—':hex(entry.store)}</b></span><span>EX clocks remaining <b>{entry.remaining}</b></span><span>Resolved next PC <b>{inspect==='IF'||inspect==='ID'?'unresolved':hex(entry.nextPC)}</b></span></div>}<span className="muted-text">Fetch PC {hex(s.fetchPC)} · committed PC {hex(s.pc)} · {s.stalls} interlock clocks · {s.squashed} squashed instructions</span></div>
 </Panel>;
}
