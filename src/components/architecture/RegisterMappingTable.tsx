import type {OooSnapshot} from '../../cpu/ooo/engine';
import {uiStore, useUI} from '../../state/uiStore';
import {useMediaQuery} from '../../app/useMediaQuery';
import {hex} from './shared';

export function RegisterMappingTable({s, tab}: {s: OooSnapshot; tab: 'rat' | 'physical'}) {
  const {selectedRegister} = useUI();
  const mobile = useMediaQuery('(max-width:759px)');
  return <div className="table-wrap bounded-table"><table><caption className="sr-only">{tab === 'rat' ? 'Architectural and speculative register mappings' : 'Physical register values and allocation'}</caption><thead><tr>{(tab === 'rat' ? ['Register', 'Committed map', 'Speculative map', 'Value', 'Ready'] : ['Physical', 'Value', 'Ready', 'Allocation']).map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{tab === 'rat' ? s.rat.map((physical, register) => <tr key={register} aria-selected={selectedRegister === register} className={selectedRegister === register ? 'selected-row' : physical !== s.committedMap[register] ? 'speculative-row' : ''}><td><button className="text-button mono" aria-pressed={selectedRegister === register} aria-label={`Inspect register x${register}`} onClick={() => uiStore.set({selectedRegister: register, inspectorTab: 'registers', inspectorOpen: mobile})}>x{register}</button></td><td>p{s.committedMap[register]}</td><td>p{physical}</td><td className="mono">{s.physical[physical].ready ? hex(s.physical[physical].value) : 'Pending'}</td><td>{s.physical[physical].ready ? 'Yes' : 'Waiting'}</td></tr>) : s.physical.map((physical, index) => <tr key={index}><td className="mono">p{index}</td><td className="mono">{hex(physical.value)}</td><td>{physical.ready ? 'Yes' : 'Waiting'}</td><td><span className="pill">{s.freeList.includes(index) ? 'Free' : s.committedMap.includes(index) ? 'Committed' : 'Speculative'}</span></td></tr>)}</tbody></table></div>;
}
