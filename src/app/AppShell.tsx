import {lazy, Suspense} from 'react';
import {ArrowRight, CircleHelp} from 'lucide-react';
import {useRoute, type Route} from './router';
import {SimulationProvider} from '../state/SimulationContext';
import {uiStore, useUI} from '../state/uiStore';
import {Sidebar} from './Sidebar';
import {MobileTabBar} from './MobileTabBar';
import {TopBar} from './TopBar';
import {ExecutionBar} from './ExecutionBar';
import {ConfigDrawer} from './ConfigDrawer';
import {ViewErrorBoundary} from './ViewErrorBoundary';
import {Toast} from '../components/ui/Toast';
import {Dialog} from '../components/ui/Dialog';
import {Button} from '../components/ui/Button';
import ExplorerPage from '../features/explorer/ExplorerPage';
const PerformancePage = lazy(() => import('../features/performance/PerformancePage'));
const LearnPage = lazy(() => import('../features/learn/LearnPage'));

function Workspace({route}: {route: Route}) {
  const {dialog} = useUI();
  const executable = route.view === 'explorer' || route.view === 'performance';
  return <div className="app-shell"><a className="skip-link" href="#main" onClick={event => {event.preventDefault(); document.getElementById('main')?.focus();}}>Skip to content</a><Sidebar route={route}/><div className="main"><TopBar route={route}/>{executable && <ExecutionBar/>}<main id="main" tabIndex={-1} className="page"><ViewErrorBoundary key={route.view}><Suspense fallback={<div className="loading-state" role="status">Preparing your workspace…</div>}>{route.view === 'explorer' ? <ExplorerPage/> : route.view === 'performance' ? <PerformancePage/> : route.view === 'learn' ? <LearnPage/> : <div className="empty-state"><CircleHelp size={40}/><h1>This view is not here.</h1><p>Your work is still saved. Head back to the explorer.</p><a className="button button-primary" href="#/explorer">Open explorer<ArrowRight size={18}/></a></div>}</Suspense></ViewErrorBoundary><footer className="footer"><span>Made for curious minds.</span><span><span className="live-dot"/>Educational model · Computed in your browser</span></footer></main></div><MobileTabBar route={route}/><ConfigDrawer/><Toast/>
    <Dialog open={dialog === 'help' || dialog === 'commands'} onClose={() => uiStore.set({dialog: null})} title={dialog === 'commands' ? 'Command menu' : 'Make yourself at home'}><p>Choose an example, assemble your code, and use Run or the arrow buttons to explore each cycle.</p><div className="help-links"><a href="#/explorer" onClick={() => uiStore.set({dialog: null})}>CPU Explorer<ArrowRight size={17}/></a><a href="#/performance" onClick={() => uiStore.set({dialog: null})}>Performance Lab<ArrowRight size={17}/></a><a href="#/learn" onClick={() => uiStore.set({dialog: null})}>Learning Center<ArrowRight size={17}/></a><Button onClick={() => {uiStore.set({dialog: null, configOpen: true});}}>Configure CPU</Button></div></Dialog>
  </div>;
}
export function AppShell() {
  const route = useRoute();
  return <SimulationProvider route={route}><Workspace route={route}/></SimulationProvider>;
}
