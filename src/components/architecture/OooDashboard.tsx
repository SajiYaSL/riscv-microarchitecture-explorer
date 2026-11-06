import {useState} from 'react';
import {waitingReason,type OooSnapshot,type CPUConfig,type ROBEntry} from '../../cpu/ooo/engine';
import {Panel,hex} from './shared';
const components=['Fetch','Decode','Rename','Dispatch','Issue queue','Execute','ROB','Retire'] as const;
export function OooDiagram({s,config,onSelect}:{s:OooSnapshot;config:CPUConfig;onSelect:(id:number)=>void}){
 const [component,setComponent]=useState<string>('ROB');
 const counts=[s.fetchQueue.length,s.decodeQueue.length,s.rob.filter(e=>e.status==='renamed').length,
  s.events.filter(e=>e.kind==='Dispatch').length,s.rob.filter(e=>e.status==='waiting').length,
  s.rob.filter(e=>e.status==='executing').length,s.rob.length,s.retired.length];
 const contents=component==='Fetch'?s.fetchQueue:component==='Decode'?s.decodeQueue:component==='Retire'?s.retired.slice(-8):
  component==='Execute'?s.rob.filter(e=>e.status==='executing'):component==='Issue queue'?s.rob.filter(e=>e.status==='waiting'):
  component==='Rename'||component==='Dispatch'?s.rob.filter(e=>e.status==='renamed'||e.status==='waiting'):s.rob;
 return <Panel title="Out-of-order datapath" detail={<span className={s.recovery?'pill bad':'pill green'}>{s.recovery?'RECOVERING':'LIVE STATE'}</span>}>
  <div className="diagram-scroll"><svg viewBox="0 0 1120 220" className="architecture-diagram" role="img" aria-label="Interactive out-of-order processor architecture">
   <defs><marker id="arrow-ooo" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#5b7697"/></marker></defs>
   {components.map((name,i)=>{const x=12+i*139;return <g key={name} tabIndex={0} role="button" aria-label={`Inspect ${name}`} onClick={()=>setComponent(name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setComponent(name);}}}>
    {i<7&&<path d={`M${x+121},85 H${x+138}`} stroke="#5b7697" markerEnd="url(#arrow-ooo)"/>}
    <rect x={x} y={30} width={121} height={110} rx={10} fill={component===name?'#153e47':'#14263c'} stroke={component===name?'#4de1ca':'#36506c'}/>
    <text x={x+60} y={57} textAnchor="middle" fill="#a1b2ca" fontSize={11}>{name}</text><text x={x+60} y={96} textAnchor="middle" fill="#6ce8cf" fontSize={25}>{counts[i]}</text>
    <text x={x+60} y={122} textAnchor="middle" fill="#8199b6" fontSize={9}>{i===6?`capacity ${config.robSize}`:i===4?`capacity ${config.issueCapacity}`:i===7?'committed':'instructions'}</text>
   </g>;})}
   <path d="M900,150 V184 H350 V150" stroke={s.recovery?'#f7a0b5':'#40536b'} fill="none" strokeDasharray="5 4" markerEnd="url(#arrow-ooo)"/>
   <text x="620" y="207" fill={s.recovery?'#f7a0b5':'#91a3bb'} textAnchor="middle" fontSize="11">{s.recovery?'Branch recovery: restore mappings and discard younger work':'ROB preserves age · PRF tags wake dependent instructions'}</text>
  </svg></div>
  <div className="component-inspector"><b>{component}</b><p className="muted-text">Fetch PC {hex(s.fetchPC)} · Committed PC {hex(s.pc)} · {s.freeList.length} free physical registers</p><span className="muted-text">Click a component, then an instruction to inspect its lifecycle.</span><div className="inspection-items">{contents.map(e=><button key={e.id} onClick={()=>onSelect(e.id)}>I{e.id+1} · {e.ins.text}</button>)}{!contents.length&&<span className="muted-text">Empty this clock</span>}</div></div>
 </Panel>;
}
export function RobViewer({s,onSelect}:{s:OooSnapshot;onSelect:(id:number)=>void}){
 return <Panel title="Reorder buffer" detail={`${s.rob.length} in flight · head retires first`}><div className="table-wrap"><table><thead><tr><th>ENTRY / AGE</th><th>PC</th><th>INSTRUCTION</th><th>DESTINATION</th><th>STATUS</th><th>COMPLETE</th><th>CAN RETIRE</th></tr></thead><tbody>
  {s.rob.map((e,i)=><tr key={e.id} className={`${i===0?'rob-head':''} ${e.status==='complete'?'complete-entry':''}`} onClick={()=>onSelect(e.id)}><td><button className="text-button" onClick={()=>onSelect(e.id)}>{i===0?'HEAD · ':''}I{e.id+1}</button></td><td>{hex(e.ins.pc)}</td><td className="mono">{e.ins.text}</td><td>{e.ins.rd?`x${e.ins.rd} → p${e.dst}`:'—'}</td><td>{e.fault?'fault pending':e.status}</td><td>{e.status==='complete'?'yes':'no'}</td><td>{i===0&&e.status==='complete'?(e.fault?'fatal fault':'next clock'):'no'}</td></tr>)}
  {!s.rob.length&&<tr><td colSpan={7} className="placeholder">ROB empty. Advance the clock to rename instructions.</td></tr>}
 </tbody></table></div></Panel>;
}
const operand=(s:OooSnapshot,p:number)=>`p${p} ${s.physical[p].ready?`= ${s.physical[p].value}`:'· waiting'}`;
export function SchedulingViewer({s,onSelect}:{s:OooSnapshot;onSelect:(id:number)=>void}){
 const waiting=s.rob.filter(e=>['renamed','waiting','executing'].includes(e.status));
 return <Panel title="Issue queue & execution" detail="Oldest-ready selection · one operation per unit"><div className="table-wrap"><table><thead><tr><th>INSTRUCTION</th><th>SOURCE A</th><th>SOURCE B</th><th>UNIT</th><th>STATUS / REASON</th></tr></thead><tbody>{waiting.map(e=><tr key={e.id} className={e.status==='waiting'&&waitingReason(s,e).startsWith('Operands ready')?'eligible-entry':''}><td><button className="text-button mono" onClick={()=>onSelect(e.id)}>I{e.id+1} · {e.ins.text}</button></td><td className={s.physical[e.src1].ready?'ready-value':'pending-value'}>{operand(s,e.src1)}</td><td className={s.physical[e.src2].ready?'ready-value':'pending-value'}>{operand(s,e.src2)}</td><td>{e.unit}</td><td>{e.status==='executing'?`Executing · ${e.remaining} clocks remaining`:e.status==='renamed'?'Waiting for dispatch':waitingReason(s,e)}</td></tr>)}{!waiting.length&&<tr><td colSpan={5} className="placeholder">No waiting or executing instructions.</td></tr>}</tbody></table></div></Panel>;
}
export function RenameViewer({s}:{s:OooSnapshot}){
 const [tab,setTab]=useState<'rat'|'physical'>('rat');
 return <Panel title="Register renaming" detail={<div className="mini-tabs"><button aria-pressed={tab==='rat'} onClick={()=>setTab('rat')}>RAT</button><button aria-pressed={tab==='physical'} onClick={()=>setTab('physical')}>Physical file</button></div>}>
  <div className="inspector-note">{s.freeList.length} physical registers free. RAT is speculative; committed mappings change only at retirement.</div>
  <div className="table-wrap bounded-table"><table><thead><tr>{(tab==='rat'?['ARCH','COMMITTED MAP','RAT','SPECULATIVE VALUE','READY']:['PHYSICAL','VALUE','READY','ALLOCATION']).map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>
   {tab==='rat'?s.rat.map((p,r)=><tr key={r} className={p!==s.committedMap[r]?'speculative-row':''}><td>x{r}</td><td>p{s.committedMap[r]}</td><td>p{p}</td><td>{s.physical[p].ready?hex(s.physical[p].value):'pending'}</td><td>{s.physical[p].ready?'yes':'no'}</td></tr>):s.physical.map((p,i)=><tr key={i}><td>p{i}</td><td>{hex(p.value)}</td><td>{p.ready?'yes':'no'}</td><td>{s.freeList.includes(i)?'free':s.committedMap.includes(i)?'committed mapping':'allocated / speculative'}</td></tr>)}
  </tbody></table></div>
 </Panel>;
}
export function MemoryQueue({s}:{s:OooSnapshot}){
 const entries:ROBEntry[]=s.rob.filter(e=>e.unit==='MEM');
 return <Panel title="Load / store queue" detail="Conservative program order"><div className="inspector-note">Loads and stores wait for every older memory operation to retire. Stores update memory only at ROB retirement. No speculative memory disambiguation.</div><div className="table-wrap"><table><thead><tr><th>AGE</th><th>OP</th><th>ADDRESS</th><th>DATA</th><th>STATE</th></tr></thead><tbody>{entries.map(e=><tr key={e.id}><td>I{e.id+1}</td><td>{e.ins.op}</td><td>{e.addr===undefined?'unresolved':hex(e.addr)}</td><td>{e.store??e.value??'—'}</td><td>{e.status}</td></tr>)}{!entries.length&&<tr><td colSpan={5} className="placeholder">No memory operations in flight.</td></tr>}</tbody></table></div></Panel>;
}
