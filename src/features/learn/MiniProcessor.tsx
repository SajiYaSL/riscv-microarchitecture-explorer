import {useMemo, useState} from 'react';
import {ArrowRight, RotateCcw} from 'lucide-react';
import {assemble} from '../../engine/assembler';
import {simulate} from '../../engine/simulator';
import {EXAMPLES} from '../../engine/programs';
import {Button} from '../../components/ui/Button';
import type {Lesson} from './content';

export function MiniProcessor({lesson}: {lesson: Lesson}) {
  const sim = useMemo(() => simulate(assemble(lesson.source ?? EXAMPLES[lesson.example]), lesson.mode), [lesson]);
  const [cycle, setCycle] = useState(0);
  const pipeline = sim.snapshots?.[Math.min(cycle, sim.totalCycles)], ooo = sim.oooSnapshots?.[Math.min(cycle, sim.totalCycles)];
  const components = pipeline ? Object.entries(pipeline.stages).map(([name, entry]) => ({name, phase: {IF: 'fetch', ID: 'decode', EX: 'execute', MEM: 'memory', WB: 'retire'}[name], text: entry ? `I${entry.id + 1} · ${entry.ins.op}` : 'Bubble'})) : [
    {name: 'Fetch', phase: 'fetch', text: `${ooo?.fetchQueue.length ?? 0} queued`}, {name: 'Decode', phase: 'decode', text: `${ooo?.decodeQueue.length ?? 0} queued`}, {name: 'Execute', phase: 'execute', text: `${ooo?.rob.filter(e => e.status === 'executing').length ?? 0} active`}, {name: 'ROB', phase: 'rob', text: `${ooo?.rob.length ?? 0} entries`}, {name: 'Retire', phase: 'retire', text: `${ooo?.retired.length ?? 0} retired`},
  ];
  return <section className="mini-processor" aria-label="Interactive lesson processor"><div className="mini-processor-header"><div><strong>Try a cycle.</strong><span>{lesson.mode === 'ooo' ? 'Out-of-order' : 'In-order'} · cycle {cycle} of {sim.totalCycles}</span></div><div><Button variant="ghost" aria-label="Reset lesson diagram" onClick={() => setCycle(0)}><RotateCcw/></Button><Button onClick={() => setCycle(Math.min(sim.totalCycles, cycle + 1))} disabled={cycle === sim.totalCycles}>Step<ArrowRight/></Button></div></div><div className="mini-processor-stages">{components.map(component => <div key={component.name}><span className={`journey-dot phase-${component.phase}`}/><strong>{component.name}</strong><code>{component.text}</code></div>)}</div><p className="mini-processor-event" role="status">{(pipeline?.events ?? ooo?.events ?? [])[0]?.message ?? (cycle ? 'No state-changing event at this clock.' : 'Advance a cycle to fetch your first instruction.')}</p></section>;
}
