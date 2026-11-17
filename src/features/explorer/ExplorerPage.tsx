import {SIMULATION_LIMITS} from '../../engine/limits';
import {Command} from 'lucide-react';
import {useSimulation} from '../../state/SimulationContext';
import {useSettings} from '../../state/settingsStore';
import {uiStore} from '../../state/uiStore';
import {Metric, hex} from '../../components/architecture/shared';
import {Button} from '../../components/ui/Button';
import {ProgramPanel} from './ProgramPanel';
import {Inspector} from './Inspector';
import {Visualization} from './Visualization';
import {ExportMenu} from '../experiments/ExportMenu';
import {GlossaryTerm} from '../learn/GlossaryTerm';
export default function ExplorerPage() {
  const model = useSimulation(); const {experience} = useSettings();
  return <><div className="page-heading"><div><div className="page-kicker"><span className="live-dot"/>The architecture workspace</div><h1>CPU explorer<span className="title-dot">.</span></h1><p>A few lines of code. A whole machine to understand.</p></div><div className="page-heading-actions"><Button variant="ghost" className="shortcut-hint" onClick={() => uiStore.set({dialog: 'commands'})} aria-label="Find a command" title="Find a command"><Command size={16}/></Button><ExportMenu/></div></div>
    {model.fault && <div className="error-banner" role="alert">Fatal fault at PC {hex(model.state.pc)}: {model.fault}. Earlier committed state is preserved.</div>}
    {model.current === model.total && model.sim.truncated && <div className="error-banner" role="alert">This program reached the safety limit of {SIMULATION_LIMITS.retiredInstructions.toLocaleString()} retirements or {SIMULATION_LIMITS.cycles.toLocaleString()} clocks. Try a terminating program.</div>}
    <div className="explorer-grid"><div className="program-area"><ProgramPanel/></div><div className="inspector-area"><Inspector/></div><div className="metrics-area"><div className="metrics kpi-strip"><Metric label="Instructions retired" value={model.state.retired} detail={`of ${model.sim.retired} in this run`}/><Metric label={<><GlossaryTerm term="IPC"/> · instructions / cycle</>} value={model.current ? (model.state.retired / model.current).toFixed(2) : '0.00'} detail="IPC · selected snapshot"/><Metric label={model.mode === 'ooo' ? 'Frontend stalls' : 'Interlock clocks'} value={model.pipeline?.stalls ?? model.ooo?.stalls ?? 0} detail="Cycles waiting for resources"/><Metric label={<>Instructions <GlossaryTerm term="Squash" display="squashed"/></>} value={model.pipeline?.squashed ?? model.ooo?.squashed ?? 0} detail="Discarded during recovery"/></div>{experience === 'expert' && model.ooo && <div className="expert-metric-row"><span>Prediction accuracy <strong>{model.ooo.resolvedBranches ? `${(100 * (1 - model.ooo.mispredictions / model.ooo.resolvedBranches)).toFixed(1)}%` : '—'}</strong></span><span>Recovery clocks <strong>{model.ooo.recoveryCycles}</strong></span><span>Issue queue <strong>{model.ooo.rob.filter(entry => entry.status === 'waiting').length} / {model.config.issueCapacity}</strong></span></div>}</div><div className="visualization-area"><Visualization/></div></div>
  </>;
}
