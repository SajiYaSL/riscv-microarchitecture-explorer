import {useState} from 'react';
import type {OooSnapshot} from '../../cpu/ooo/engine';
import {uiStore, useUI} from '../../state/uiStore';
import {Tabs} from '../../components/ui/Tabs';
import {RegisterMappingTable} from '../../components/architecture/RegisterMappingTable';
import {hex} from '../../components/architecture/shared';

type RegisterView = 'architectural' | 'physical' | 'rat';
export function RegisterInspector({state, previous, snapshot}: {state: {registers: number[]}; previous: {registers: number[]}; snapshot?: OooSnapshot}) {
  const [view, setView] = useState<RegisterView>('architectural');
  const {selectedRegister} = useUI();
  return <Tabs<RegisterView> label="Register views" value={view} onChange={setView} options={[{id: 'architectural', label: 'Architectural'}, {id: 'physical', label: 'Physical'}, {id: 'rat', label: 'RAT'}]}>
    {view === 'architectural' ? <div className="register-inspector"><p className="inspector-caption">Committed architectural state. Changed values are marked with a dot.</p><div className="reg-grid">{state.registers.map((value, index) => <button key={index} type="button" className={`reg-cell ${index === selectedRegister ? 'selected-reg' : ''} ${value !== previous.registers[index] ? 'changed-reg' : ''}`} aria-pressed={index === selectedRegister} aria-label={`Register x${index}, value ${value}${value !== previous.registers[index] ? ', changed this cycle' : ''}`} onClick={() => uiStore.set({selectedRegister: index})}><span>x{index}{value !== previous.registers[index] && <span aria-hidden="true"> ●</span>}</span><strong>{value}</strong></button>)}</div><div className="register-detail"><span>Selected x{selectedRegister}{selectedRegister === 0 ? ' · fixed at zero' : ''}</span><strong className="mono">{hex(state.registers[selectedRegister])}</strong><small>Signed {state.registers[selectedRegister]} · unsigned {state.registers[selectedRegister] >>> 0}</small></div></div> : snapshot ? <>
      <p className="inspector-caption">{view === 'physical' ? `Physical register file · cycle ${snapshot.cycle} · ${snapshot.freeList.length} free. Values are valid when ready; free entries may retain old values.` : `Register Alias Table · cycle ${snapshot.cycle}. Compare committed and speculative mappings; values and readiness follow the speculative map.`}</p>
      <RegisterMappingTable s={snapshot} tab={view}/>
    </> : <p className="inspector-caption">Physical registers and the RAT are available in Out-of-order mode. The In-order processor uses architectural registers directly.</p>}
  </Tabs>;
}
