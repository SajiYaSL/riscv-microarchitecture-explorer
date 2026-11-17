import {ArrowLeft, ArrowRight, ChevronDown, Flag, Pause, Play, RotateCcw, Settings2} from 'lucide-react';
import {useState} from 'react';
import {useSimulation} from '../state/SimulationContext';
import {simulationActions, simulationStore} from '../state/simulationStore';
import {uiStore} from '../state/uiStore';
import {Button} from '../components/ui/Button';
import {SegmentedControl} from '../components/ui/SegmentedControl';
import {Dialog} from '../components/ui/Dialog';

export function ExecutionBar() {
  const {mode, current, total, playing, speed, step, togglePlay, finish, status} = useSimulation();
  const [more, setMore] = useState(false);
  const modeControl = <SegmentedControl label="CPU mode" value={mode} options={[{value: 'inorder', label: 'In-order'}, {value: 'ooo', label: 'Out-of-order'}]} onChange={simulationActions.setMode}/>;
  const speedControl = <label className="speed-select"><span className="sr-only">Playback speed</span><select aria-label="Playback speed" value={speed} onChange={event => simulationStore.set({speed: Number(event.target.value)})}><option value={1000}>0.5× speed</option><option value={550}>1× speed</option><option value={150}>3× speed</option></select></label>;
  return <>
    <div className="mobile-mode-switch">{modeControl}</div>
    <section className="execution-bar" aria-label="Execution controls" data-tour="controls"><div className="execution-top"><div className="desktop-mode-switch">{modeControl}</div><div className="playback-buttons"><Button variant="ghost" className="icon-button" aria-label="Reset simulation" title="Reset (R)" onClick={simulationActions.reset}><RotateCcw/></Button><Button variant="secondary" className="icon-button" aria-label="Previous cycle" title="Previous cycle (Left arrow)" disabled={current === 0} onClick={() => step(-1)}><ArrowLeft/></Button><Button variant="primary" className="play-button" aria-label={playing ? 'Pause simulation' : 'Run simulation'} onClick={togglePlay}>{playing ? <Pause/> : <Play/>}<span>{playing ? 'Pause' : 'Run'}</span><kbd>Space</kbd></Button><Button variant="secondary" className="icon-button" aria-label="Next cycle" title="Next cycle (Right arrow)" disabled={current === total} onClick={() => step(1)}><ArrowRight/></Button><Button variant="ghost" className="finish-button" onClick={finish} disabled={current === total} title="Run to completion (F)"><Flag/><span>Finish</span></Button></div><div className="execution-options">{speedControl}<span className="toolbar-divider"/><Button variant="ghost" className="icon-button" aria-label="Configure CPU" title="Configure CPU" onClick={() => uiStore.set({configOpen: true})}><Settings2/></Button></div><Button variant="ghost" className="mobile-more icon-button" aria-label="More execution options" onClick={() => setMore(true)}><ChevronDown/></Button><div className="clock-counter"><span className={`status-indicator status-${status}`}/><span>Cycle <strong>{String(current).padStart(2, '0')}</strong><span className="clock-total"> / {total}</span></span></div></div><label className="history-scrubber"><span>History</span><input aria-label="Clock history" type="range" min={0} max={total} value={current} onChange={event => simulationStore.set({playing: false, cycle: Number(event.target.value)})}/><span>{current === total ? 'End' : 'Live snapshot'}</span></label></section>
    <Dialog title="Execution options" open={more} onClose={() => setMore(false)} kind="sheet"><div className="more-options"><label>Architecture</label>{modeControl}<label>Playback</label>{speedControl}<Button onClick={() => {finish(); setMore(false);}}><Flag/>Run to completion</Button><Button onClick={() => {setMore(false); uiStore.set({configOpen: true});}}><Settings2/>Configure CPU</Button></div></Dialog>
  </>;
}
