import {Activity, ArrowUpRight, BookOpen, ChevronRight, Command, Cpu, FlaskConical, FolderOpen, Layers3} from 'lucide-react';
import {useSimulation} from '../state/SimulationContext';
import {uiStore} from '../state/uiStore';
import type {Route} from './router';
import {hex} from '../components/architecture/shared';
import {Button} from '../components/ui/Button';

export const navItems = [{path: '/explorer', label: 'CPU Explorer', short: 'Explorer', icon: Cpu}, {path: '/performance', label: 'Performance Lab', short: 'Performance', icon: FlaskConical}, {path: '/learn', label: 'Learning Center', short: 'Learn', icon: BookOpen}];
export function Sidebar({route}: {route: Route}) {
  const {mode, status, state, config} = useSimulation();
  return <aside className="sidebar">
    <a className="brand" href="#/explorer" aria-label="RVMX home"><div className="brand-icon"><Activity size={24}/></div><div className="brand-copy"><strong>RVMX<span className="brand-dot">.</span></strong><small>Think inside the machine</small></div></a>
    <div className="side-heading">Workspace</div>
    <nav aria-label="Primary">{navItems.map(({path, label, icon: Icon}) => <a key={path} href={`#${path}`} title={label} className={`side-link ${route.path.startsWith(path) ? 'selected' : ''}`} aria-current={route.path.startsWith(path) ? 'page' : undefined}><Icon size={19}/><span>{label}</span>{route.path.startsWith(path) && <ChevronRight size={15} className="nav-chevron"/>}</a>)}</nav>
    <Button variant="ghost" className="saved-experiments-trigger" onClick={() => uiStore.set({dialog: 'experiments'})} title="Saved experiments"><FolderOpen size={18}/><span>Saved experiments</span></Button>
    <div className="side-heading section-space">Your machine</div>
    <div className="machine-card"><div className="machine-symbol"><Layers3 size={22}/><span className={`machine-status status-${status}`}/></div><strong>{mode === 'ooo' ? 'Out-of-order' : 'Five-stage pipeline'}</strong><span>RV32 educational subset</span><div className="machine-spec"><span>Issue width <b>{config.issueWidth}</b></span><span>ROB entries <b>{config.robSize}</b></span></div><div className="machine-pc"><span>Committed PC</span><code>{hex(state.pc)}</code></div><Button variant="ghost" onClick={() => uiStore.set({configOpen: true})}>Configure machine <ArrowUpRight size={15}/></Button></div>
    <div className="side-bottom"><Button variant="ghost" onClick={() => uiStore.set({dialog: 'commands'})}><Command size={16}/><span>Command menu</span><kbd>⌘ K</kbd></Button><div className="sidebar-footnote"><span className="live-dot"/> Local & private</div><p>Observe. Experiment. Understand.</p></div>
  </aside>;
}
