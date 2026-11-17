import {CheckCircle2, CircleAlert, GitCompareArrows, MoveUpRight} from 'lucide-react';
import {useSimulation} from '../../state/SimulationContext';
import {useUI, selectInstruction} from '../../state/uiStore';
import {stateAt} from '../../engine/simulator';
import {Metric, Panel} from '../../components/architecture/shared';
import {Timeline} from '../../components/architecture/Timeline';
import Performance from '../../components/architecture/Performance';
import {PinnedRuns} from './PinnedRuns';
import {ExportMenu} from '../experiments/ExportMenu';
import {Inspector} from '../explorer/Inspector';

export default function PerformancePage() {
  const {simulations, sim, current, selectedClock, verification} = useSimulation(); const {selected, inspectedMode} = useUI();
  const difference = simulations.inorder.totalCycles - simulations.ooo.totalCycles;
  return <><div className="page-heading"><div><div className="page-kicker"><GitCompareArrows size={15}/>Independent execution. Honest comparisons.</div><h1>Performance lab<span className="title-dot">.</span></h1><p>The same code, two architectures. See where the cycles go.</p></div><ExportMenu/></div>
    <div className={`verification-banner ${verification.verified ? 'verified' : 'unverified'}`}>{verification.verified ? <CheckCircle2 size={22}/> : <CircleAlert size={22}/>}<div><strong>{verification.verified ? 'Verified against interpreter' : 'Verification needs attention'}</strong><p>{verification.message}</p></div></div>
    <div className="comparison-highlight"><span className="comparison-highlight-icon"><MoveUpRight size={23}/></span><div><strong>{difference === 0 ? 'A different path. The same cycle count.' : `${Math.abs(difference)} ${Math.abs(difference) === 1 ? 'cycle' : 'cycles'} ${difference > 0 ? 'saved with out-of-order execution' : 'fewer with in-order execution'}`}</strong><p>Full bounded runs · dependencies and unit availability determine the result.</p></div></div>
    <div className="compare-panels architecture-comparison">{(['inorder', 'ooo'] as const).map(mode => {const model = simulations[mode], clock = Math.min(current, model.totalCycles), state = stateAt(model, clock); return <Panel key={mode} title={mode === 'inorder' ? 'Five-stage in-order' : 'Renamed out-of-order'} detail={<span className="pill">{model.fault ? 'Fault' : model.truncated ? 'Safety limit' : 'Complete run'}</span>}><div className="comparison-metrics"><Metric label="Total cycles" value={model.totalCycles} detail={`${model.retired} retired`}/><Metric label="Instructions / cycle" definition="IPC is retired instructions divided by elapsed clocks. CPI is elapsed clocks divided by retired instructions. Both include fill, drain, stalls, and recovery." value={model.ipc.toFixed(2)} detail={`CPI ${model.cpi.toFixed(2)}`}/><Metric label="Stall clocks" value={model.stalls} detail={mode === 'ooo' ? 'Frontend backpressure' : 'EX / RAW interlocks'}/></div><p className="inspector-note">Independent cycle {clock} · {state.retired} retired at this snapshot.</p><Timeline sim={model} cycle={clock} selected={inspectedMode === mode ? selected : null} onSelect={id => selectInstruction(id, mode)} compact/></Panel>;})}</div>
    <PinnedRuns/><div className="section-heading"><h2>{sim.mode === 'ooo' ? 'Out-of-order' : 'In-order'} execution detail</h2><span className="muted-text">Change architecture in the execution bar.</span></div><Performance sim={sim} cycle={selectedClock}/><p className="model-note">These are educational microarchitecture models. In-order stalls count execution and data interlocks; out-of-order stalls count frontend backpressure. Results describe this simulation.</p><Inspector presentation="overlay"/>
  </>;
}
