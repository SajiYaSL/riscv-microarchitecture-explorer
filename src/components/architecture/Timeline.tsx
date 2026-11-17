import {memo, useEffect, useMemo, useState, type CSSProperties} from 'react';
import {ChevronLeft, ChevronRight, LocateFixed} from 'lucide-react';
import type {Simulation} from '../../engine/simulator';
import {simulationStore} from '../../state/simulationStore';
import {lifecycles, phaseAt} from '../../features/explorer/lifecycles';
import {Panel, hex} from './shared';
import {Button} from '../ui/Button';
import {StageLegend} from './DiagramNode';
export {lifecycles, phaseAt} from '../../features/explorer/lifecycles';
export type {LifeRow} from '../../features/explorer/lifecycles';
const short: Record<string, string> = {Fetch: 'IF', Decode: 'ID', Rename: 'RN', Dispatch: 'DP', Issue: 'IS', Execute: 'EX', Writeback: 'WB', Retire: 'RT', Stall: 'ST', Squash: 'SQ', Memory: 'MEM', ROB: 'ROB', Fault: 'FT'};
type Props = {sim: Simulation; cycle: number; selected: number | null; onSelect: (id: number) => void; compact?: boolean};
export const Timeline = memo(function Timeline({sim, cycle, selected, onSelect, compact = false}: Props) {
  const rows = useMemo(() => lifecycles(sim), [sim]);
  const [page, setPage] = useState(0), [zoom, setZoom] = useState(compact ? 12 : 24), [manualStart, setManualStart] = useState<number | null>(null), [jump, setJump] = useState('');
  useEffect(() => {setPage(0); setManualStart(null);}, [sim]);
  const pageSize = compact ? 8 : 12, maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1), safePage = Math.min(page, maxPage);
  const count = Math.min(zoom, Math.max(1, sim.totalCycles)), maxStart = Math.max(1, sim.totalCycles - count + 1);
  const start = Math.max(1, Math.min(maxStart, manualStart ?? Math.max(1, cycle - Math.floor(count / 3))));
  const visible = rows.slice(safePage * pageSize, (safePage + 1) * pageSize), life = rows.find(row => row.id === selected);
  const jumpTo = () => {const clock = Number(jump); if (!jump.trim() || !Number.isInteger(clock) || clock < 0 || clock > sim.totalCycles) return; simulationStore.set({cycle: clock, playing: false}); setManualStart(Math.max(1, Math.min(maxStart, clock)));};
  return <Panel title={compact ? `${sim.mode === 'ooo' ? 'Out-of-order' : 'In-order'} timeline` : 'Instruction lifecycle'} detail={<div className="timeline-nav"><Button variant="ghost" aria-label="Previous instructions" title="Previous instructions" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft/><span>Previous</span></Button><span>{safePage + 1} / {maxPage + 1}</span><Button variant="ghost" aria-label="Next instructions" title="Next instructions" disabled={safePage >= maxPage} onClick={() => setPage(safePage + 1)}><span>Next</span><ChevronRight/></Button></div>}>
    <div className="timeline-tools"><span>{rows.length} fetched instructions · cycles {start}–{start + count - 1}</span><div><label className="timeline-zoom"><span className="sr-only">Visible cycle window</span><select aria-label="Visible cycle window" value={zoom} onChange={event => setZoom(Number(event.target.value))}><option value={12}>12 cycles</option><option value={24}>24 cycles</option><option value={48}>48 cycles</option></select></label><Button variant="ghost" className="icon-button" aria-label="Follow current cycle" title="Follow current cycle" onClick={() => setManualStart(null)}><LocateFixed/></Button></div></div>
    {!compact && <form className="timeline-jump" onSubmit={event => {event.preventDefault(); jumpTo();}}><label>Jump to cycle<input aria-label="Jump to cycle" type="number" min={0} max={sim.totalCycles} step={1} value={jump} placeholder={String(cycle)} onChange={event => setJump(event.target.value)}/></label><Button type="submit" variant="ghost">Go<ChevronRight/></Button><span>Choose a cell to inspect that clock.</span></form>}
    <div className="timeline-scroll" tabIndex={0} role="region" aria-label={`${sim.mode === 'ooo' ? 'Out-of-order' : 'In-order'} instruction history, scroll horizontally`}><div className="timeline lifecycle-grid" style={{minWidth: 204 + count * 44, '--cycle-count': count} as CSSProperties}>
      <div className="timeline-row timeline-header"><span className="instr-label header-label">Instruction</span>{Array.from({length: count}, (_, index) => <span className={`tick ${start + index === cycle ? 'current-tick' : ''}`} key={index}>{start + index}</span>)}</div>
      {visible.map(row => <div className={`timeline-row ${selected === row.id ? 'selected-instruction' : ''}`} key={row.id}><button type="button" className="instr-label text-button" aria-label={`Inspect instruction I${row.id + 1}: ${row.ins.text}, PC ${hex(row.ins.pc)}`} aria-pressed={selected === row.id} title={`${hex(row.ins.pc)} · ${row.ins.text}`} onClick={() => onSelect(row.id)}><strong>I{row.id + 1}</strong><span>{row.ins.text}</span></button>{Array.from({length: count}, (_, index) => {
        const clock = start + index, phase = phaseAt(row, clock), description = `Instruction I${row.id + 1}, cycle ${clock}: ${phase}${row.reason[clock] ? `. ${row.reason[clock]}` : ''}${clock > cycle ? '. Future snapshot' : ''}`;
        return phase ? <button type="button" key={clock} className={`timecell phase-${phase.toLowerCase()} ${clock === cycle ? 'playhead' : ''} ${clock > cycle ? 'future-phase' : ''}`} title={description} aria-label={description} aria-pressed={selected === row.id && clock === cycle} onClick={() => {simulationStore.set({cycle: clock, playing: false}); onSelect(row.id);}}>{short[phase] ?? phase}</button> : <span key={clock} className={`timecell empty ${clock === cycle ? 'playhead' : ''}`} aria-hidden="true"/>;
      })}</div>)}
    </div></div>
    <StageLegend phases={[{phase: 'fetch', label: 'IF · Fetch'}, {phase: 'decode', label: 'ID · Decode'}, ...(sim.mode === 'ooo' ? [{phase: 'rename', label: 'RN · Rename'}, {phase: 'issue', label: 'IS · Issue'}, {phase: 'writeback', label: 'WB · Writeback'}] : []), {phase: 'execute', label: 'EX · Execute'}, {phase: 'retire', label: 'RT · Retire'}, {phase: 'stall', label: 'ST · Stall'}, {phase: 'squash', label: 'SQ · Squash'}]}/>
    {!compact && <div className="lifecycle-inspection">{life ? <><strong>I{life.id + 1} · {life.ins.text}</strong><span>{life.faulted !== undefined && life.faulted <= cycle ? `Faulted at cycle ${life.faulted}` : life.squashed !== undefined && life.squashed <= cycle ? `Squashed at cycle ${life.squashed}` : life.retired !== undefined && life.retired <= cycle ? `Retired at cycle ${life.retired}` : phaseAt(life, cycle) || 'Not fetched yet'} · Full details in the inspector.</span></> : <span>Select an instruction to see its journey. Dashed cells are future snapshots.</span>}</div>}
  </Panel>;
});
