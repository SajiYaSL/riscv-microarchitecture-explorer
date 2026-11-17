import {memo, useId, useState} from 'react';
import type {CPUConfig, OooSnapshot} from '../../cpu/ooo/engine';
import {useUI} from '../../state/uiStore';
import {Panel, hex} from './shared';
import {DiagramNode, StageLegend} from './DiagramNode';
import {InstructionTokens, type InstructionToken} from './InstructionTokens';

const descriptions: Record<string, string> = {Fetch: 'Follow predicted control flow and fetch instructions.', Decode: 'Decode the fetched assembly instructions.', Rename: 'Capture source tags and allocate new physical destinations.', Dispatch: 'Send renamed work into the issue queue.', 'Issue queue': 'Select the oldest ready instruction with an available execution unit.', Execute: 'Compute results independently in the ALU, multiply, memory, and branch units.', ROB: 'Preserve instruction age and wait for completion.', Retire: 'Commit one completed head instruction per clock.'};
export const OooDiagram = memo(function OooDiagram({s, config, onSelect}: {s: OooSnapshot; config: CPUConfig; onSelect: (id: number) => void}) {
  const [component, setComponent] = useState('ROB'); const {selected} = useUI(); const id = `ooo-${useId().replaceAll(':', '')}`;
  const waiting = s.rob.filter(entry => entry.status === 'waiting'), executing = s.rob.filter(entry => entry.status === 'executing');
  const tokens: InstructionToken[] = [];
  const add = (entry: {id: number} | undefined, x: number, y: number, phase: string) => {if (entry && !tokens.some(token => token.id === entry.id)) tokens.push({id: entry.id, x, y, phase});};
  add(s.fetchQueue[0], 166, 130, 'fetch'); add(s.decodeQueue[0], 424, 130, 'decode');
  add(s.rob.find(entry => entry.status === 'renamed'), 682, 130, 'rename');
  add(s.rob.find(entry => s.events.some(event => event.kind === 'Dispatch' && event.id === entry.id)), 940, 130, 'dispatch');
  (['ALU', 'MUL', 'MEM', 'BR'] as const).forEach((unit, index) => add(executing.find(entry => entry.unit === unit), 366 + index * 180, 338, 'execute'));
  add(waiting[0], 210, 264, 'issue'); add(s.rob.find(entry => entry.status === 'complete'), 590, 442, 'rob'); add(s.retired.at(-1), 930, 442, 'retire');
  const contents = component === 'Fetch' ? s.fetchQueue : component === 'Decode' ? s.decodeQueue : component === 'Retire' ? s.retired.slice(-8) : component === 'Execute' ? executing : component === 'Issue queue' ? waiting : component === 'Rename' || component === 'Dispatch' ? s.rob.filter(entry => entry.status === 'renamed' || entry.status === 'waiting') : s.rob;
  const frontend = [
    {name: 'Fetch', phase: 'fetch', value: s.fetchQueue.length, detail: `${config.fetchWidth} wide · predicted path`, entries: s.fetchQueue},
    {name: 'Decode', phase: 'decode', value: s.decodeQueue.length, detail: `${config.decodeWidth} wide · instruction decode`, entries: s.decodeQueue},
    {name: 'Rename', phase: 'rename', value: s.rob.filter(e => e.status === 'renamed').length, detail: `${s.freeList.length} physical registers free`, entries: s.rob.filter(e => e.status === 'renamed')},
    {name: 'Dispatch', phase: 'dispatch', value: s.events.filter(e => e.kind === 'Dispatch').length, detail: 'Ready for the issue queue', entries: waiting},
  ];
  return <Panel title="Out-of-order datapath" detail={<span className={`pill ${s.recovery ? 'bad' : 'good'}`}>{s.recovery ? 'Recovering' : 'Snapshot'} · cycle {s.cycle}</span>}>
    <div className="diagram-scroll"><svg viewBox="0 0 1040 516" className="architecture-diagram ooo-diagram" role="group" aria-label="Interactive out-of-order processor architecture" aria-describedby={`${id}-description`}><desc id={`${id}-description`}>Fetch, decode, rename, and dispatch feed an issue queue. Four execution units send results to a reorder buffer. Retirement commits in program order. Select a component to inspect its instructions.</desc><defs><marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--border-strong)"/></marker></defs>
      {[0, 1, 2].map(index => <path key={index} d={`M${234 + index * 258},96 H${282 + index * 258}`} className="diagram-wire" markerEnd={`url(#${id})`}/>)}
      <path d="M903,156 V180 H156 V216" className="diagram-wire" markerEnd={`url(#${id})`}/>
      <path d="M284,278 H310 V200 H926" className="diagram-wire"/>
      {[386, 566, 746, 926].map(x => <g key={x}><path d={`M${x},200 V216`} className="diagram-wire" markerEnd={`url(#${id})`}/><path d={`M${x},332 V364`} className="diagram-wire"/></g>)}
      <path d="M386,364 H926 M566,364 V398" className="diagram-wire" markerEnd={`url(#${id})`}/>
      <path d="M672,450 H714" className="diagram-wire" markerEnd={`url(#${id})`}/>
      <path d="M890,498 V506 H36 V196 H644 V156" fill="none" stroke={s.recovery ? 'var(--danger)' : 'var(--border)'} strokeDasharray="5 5" markerEnd={`url(#${id})`}/>
      {frontend.map((node, index) => <DiagramNode key={node.name} x={24 + index * 258} y={28} width={210} label={node.name} phase={node.phase} value={node.value} detail={node.detail} active={component === node.name} selected={node.entries.some(entry => entry.id === selected)} description={descriptions[node.name]} onClick={() => setComponent(node.name)}/>)}
      <DiagramNode x={24} y={216} width={260} height={116} label="Issue queue" phase="issue" value={waiting.length} detail={`${config.issueCapacity} entries · oldest ready`} active={component === 'Issue queue'} selected={waiting.some(entry => entry.id === selected)} description={descriptions['Issue queue']} onClick={() => setComponent('Issue queue')}/>
      {(['ALU', 'MUL', 'MEM', 'BR'] as const).map((unit, index) => {const entry = executing.find(item => item.unit === unit); return <DiagramNode key={unit} x={316 + index * 180} y={216} width={160} height={116} label={unit === 'MEM' ? 'Load / store' : unit === 'BR' ? 'Branch' : unit === 'MUL' ? 'Multiply' : 'ALU'} phase="execute" value={entry ? `I${entry.id + 1}` : 'Idle'} detail={entry ? `${entry.remaining} ${entry.remaining === 1 ? 'clock' : 'clocks'} left · ${entry.ins.op}` : 'Available for work'} active={component === 'Execute'} selected={entry?.id === selected} description={descriptions.Execute} onClick={() => setComponent('Execute')}/>;})}
      <text x="26" y="382" fontSize={13} fill="var(--text-3)">Results complete independently.</text><text x="26" y="403" fontSize={13} fill="var(--text-3)">Architectural state stays ordered.</text>
      <DiagramNode x={382} y={398} width={290} height={100} label="ROB" phase="rob" value={s.rob.length} detail={`${config.robSize} entries · oldest at head`} active={component === 'ROB'} selected={s.rob.some(entry => entry.id === selected)} description={descriptions.ROB} onClick={() => setComponent('ROB')}/>
      <DiagramNode x={714} y={398} width={292} height={100} label="Retire" phase="retire" value={s.retired.length} detail="One instruction per clock" active={component === 'Retire'} selected={s.retired.slice(-8).some(entry => entry.id === selected)} description={descriptions.Retire} onClick={() => setComponent('Retire')}/>
      <InstructionTokens tokens={tokens}/>
    </svg></div>
    <StageLegend phases={[{phase: 'fetch', label: 'Fetch'}, {phase: 'decode', label: 'Decode'}, {phase: 'rename', label: 'Rename'}, {phase: 'issue', label: 'Issue'}, {phase: 'execute', label: 'Execute'}, {phase: 'rob', label: 'Reorder'}, {phase: 'retire', label: 'Retire'}]}/>
    <div className="component-inspector"><div className="component-inspector-title"><b>{component}</b><span className="muted-text">{contents.length} {contents.length === 1 ? 'instruction' : 'instructions'} shown</span></div><p>{descriptions[component]}</p><div className="inspection-items">{contents.map(entry => <button type="button" key={entry.id} aria-pressed={selected === entry.id} onClick={() => onSelect(entry.id)}>I{entry.id + 1} <span>·</span> {entry.ins.text}</button>)}{!contents.length && <span className="muted-text">Empty this clock. Advance a cycle to see work arrive.</span>}</div><div className="diagram-state-line"><span>Fetch PC <code>{hex(s.fetchPC)}</code></span><span>Committed PC <code>{hex(s.pc)}</code></span>{s.recovery && <strong>Recovering the correct branch path</strong>}</div></div>
  </Panel>;
});
