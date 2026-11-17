import {useSimulation} from '../../state/SimulationContext';
import {selectInstruction} from '../../state/uiStore';
type Entry = {id: number; ins: {text: string}};
export function ProcessorTextView() {
  const {pipeline, ooo, current} = useSimulation();
  const rows: {name: string; detail: string; entries: Entry[]}[] = pipeline ? Object.entries(pipeline.stages).map(([name, entry]) => ({name: ({IF: 'Fetch (IF)', ID: 'Decode (ID)', EX: 'Execute (EX)', MEM: 'Memory (MEM)', WB: 'Writeback (WB)'} as Record<string, string>)[name], detail: entry ? 'Valid latch' : 'Bubble — no valid instruction', entries: entry ? [entry] : []})) : ooo ? [
    {name: 'Fetch', detail: `${ooo.fetchQueue.length} queued`, entries: ooo.fetchQueue},
    {name: 'Decode', detail: `${ooo.decodeQueue.length} queued`, entries: ooo.decodeQueue},
    {name: 'Rename', detail: `${ooo.freeList.length} physical registers free`, entries: ooo.rob.filter(entry => entry.status === 'renamed')},
    {name: 'Dispatch', detail: `${ooo.events.filter(event => event.kind === 'Dispatch').length} dispatched this cycle`, entries: ooo.rob.filter(entry => ooo.events.some(event => event.kind === 'Dispatch' && event.id === entry.id))},
    {name: 'Issue queue', detail: 'Oldest ready selection', entries: ooo.rob.filter(entry => entry.status === 'waiting')},
    ...(['ALU', 'MUL', 'MEM', 'BR'] as const).map(unit => ({name: {ALU: 'Arithmetic / logic unit', MUL: 'Multiply unit', MEM: 'Load / store unit', BR: 'Branch unit'}[unit], detail: 'Currently executing', entries: ooo.rob.filter(entry => entry.status === 'executing' && entry.unit === unit)})),
    {name: 'Reorder buffer', detail: `${ooo.rob.length} in flight, oldest first`, entries: ooo.rob},
    {name: 'Retirement', detail: `${ooo.retired.length} retired, last 8 shown`, entries: ooo.retired.slice(-8)},
  ] : [];
  return <div className="table-wrap processor-text-view" tabIndex={0} role="region" aria-label="Processor text alternative"><table><caption>Processor snapshot at cycle {current}</caption><thead><tr><th scope="col">Component</th><th scope="col">State</th><th scope="col">Instructions</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.detail}</td><td>{row.entries.length ? <div className="text-view-instructions">{row.entries.map(entry => <button className="text-button mono" key={entry.id} onClick={() => selectInstruction(entry.id)}>I{entry.id + 1} · {entry.ins.text}</button>)}</div> : 'Empty'}</td></tr>)}</tbody></table></div>;
}
