import {lazy, Suspense, useState} from 'react';
import {ArrowLeftRight, Columns2, Expand, Network, Table2} from 'lucide-react';
import {useSimulation} from '../../state/SimulationContext';
import {useSettings} from '../../state/settingsStore';
import {uiStore, useUI, selectInstruction, type VisualizationTab} from '../../state/uiStore';
import {InorderDiagram} from '../../components/architecture/InorderDiagram';
import {OooDiagram, RobViewer, SchedulingViewer, RenameViewer, MemoryQueue} from '../../components/architecture/OooDashboard';
import {Timeline} from '../../components/architecture/Timeline';
import {Tabs} from '../../components/ui/Tabs';
import {Button} from '../../components/ui/Button';
import {availableTabs} from './visualizationTabs';
import {TraceView} from './TraceView';
import {StatusPill} from '../../components/ui/StatusPill';
import {CycleSummary} from './CycleSummary';
import {ProcessorTextView} from './ProcessorTextView';
const Performance = lazy(() => import('../../components/architecture/Performance'));
const labels: Record<VisualizationTab, string> = {datapath: 'Datapath', timeline: 'Timeline', rob: 'Reorder buffer', rename: 'Rename', scheduling: 'Scheduling', memory: 'Memory queue', performance: 'Performance', trace: 'Trace'};
export function Visualization() {
  const model = useSimulation(); const {tab, selected, split} = useUI(); const {experience} = useSettings();
  const [fit, setFit] = useState(false), [textView, setTextView] = useState(false);
  const available = availableTabs(model.mode, experience);
  const current = available.includes(tab) ? tab : 'datapath';
  const render = (view: VisualizationTab) => {
    switch (view) {
      case 'datapath': return <div className="datapath-view" data-fit={fit}><div className="diagram-toolbar"><span><ArrowLeftRight size={14}/>{fit ? 'Fit to your workspace' : 'Scroll to explore the whole datapath'}</span><div><Button variant="ghost" aria-pressed={textView} onClick={() => setTextView(!textView)}><Table2/>Text view</Button><Button variant="ghost" aria-pressed={fit} onClick={() => setFit(!fit)}><Expand/>{fit ? 'Actual size' : 'Fit'}</Button></div></div>{textView ? <ProcessorTextView/> : model.pipeline ? <InorderDiagram s={model.pipeline} onSelect={selectInstruction}/> : model.ooo ? <OooDiagram s={model.ooo} config={model.config} onSelect={selectInstruction}/> : null}</div>;
      case 'timeline': return <Timeline sim={model.sim} cycle={model.current} selected={selected} onSelect={selectInstruction}/>;
      case 'rob': return model.ooo ? <RobViewer s={model.ooo} onSelect={selectInstruction}/> : null;
      case 'rename': return model.ooo ? <RenameViewer s={model.ooo}/> : null;
      case 'scheduling': return model.ooo ? <SchedulingViewer s={model.ooo} onSelect={selectInstruction}/> : null;
      case 'memory': return model.ooo ? <MemoryQueue s={model.ooo}/> : null;
      case 'performance': return <Suspense fallback={<div className="loading-state">Loading performance charts…</div>}><Performance sim={model.sim} cycle={model.selectedClock}/></Suspense>;
      case 'trace': return <TraceView/>;
      default: return null;
    }
  };
  return <section className="panel visualization-panel" data-tour={current === 'timeline' ? 'timeline' : 'datapath'}><div className="panel-header"><div className="panel-heading-group"><Network size={18}/><h2 className="panel-title">Inside the processor</h2></div><div className="visualization-actions">{experience === 'expert' && <Button variant="ghost" size="sm" aria-pressed={split} onClick={() => uiStore.set({split: !split})}><Columns2/>Split view</Button>}<StatusPill status={model.status}/><span className="pill">Cycle {model.current}</span></div></div><Tabs label="Visualization" value={current} options={available.map(id => ({id, label: labels[id], count: id === 'rob' ? model.ooo?.rob.length : undefined}))} onChange={tab => uiStore.set({tab})}><div className={split && experience === 'expert' ? 'visualization-body split-visualizations' : 'visualization-body'}>{render(current)}{split && experience === 'expert' && render(current === 'timeline' ? 'datapath' : 'timeline')}</div></Tabs><CycleSummary/></section>;
}
