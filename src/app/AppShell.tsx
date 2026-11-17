import {lazy, Suspense} from 'react';
import {ArrowRight, CircleHelp} from 'lucide-react';
import {useRoute, type Route} from './router';
import {SimulationProvider} from '../state/SimulationContext';
import {Sidebar} from './Sidebar';
import {MobileTabBar} from './MobileTabBar';
import {TopBar} from './TopBar';
import {ExecutionBar} from './ExecutionBar';
import {ConfigDrawer} from './ConfigDrawer';
import {ViewErrorBoundary} from './ViewErrorBoundary';
import {Toast} from '../components/ui/Toast';
import {Onboarding} from '../features/onboarding/Onboarding';
import {CommandPalette} from '../features/commands/CommandPalette';
import {HelpDialog} from '../features/commands/HelpDialog';
import {useShortcuts} from '../features/commands/useShortcuts';
import {ExperimentsDialog} from '../features/experiments/ExperimentsDialog';
import {ShareDialog} from '../features/experiments/ShareDialog';
import ExplorerPage from '../features/explorer/ExplorerPage';
const PerformancePage = lazy(() => import('../features/performance/PerformancePage'));
const LearnPage = lazy(() => import('../features/learn/LearnPage'));

function Workspace({route}: {route: Route}) {
  useShortcuts(route);
  const executable = route.view === 'explorer' || route.view === 'performance';
  return <div className="app-shell"><a className="skip-link" href="#main" onClick={event => {event.preventDefault(); document.getElementById('main')?.focus();}}>Skip to content</a><Sidebar route={route}/><div className="main"><TopBar route={route}/>{executable && <ExecutionBar/>}<main id="main" tabIndex={-1} className="page"><ViewErrorBoundary key={route.view}><Suspense fallback={<div className="loading-state" role="status">Preparing your workspace…</div>}>{route.view === 'explorer' ? <ExplorerPage/> : route.view === 'performance' ? <PerformancePage/> : route.view === 'learn' ? <LearnPage/> : <div className="empty-state"><CircleHelp size={40}/><h1>This view is not here.</h1><p>Your work is still saved. Head back to the explorer.</p><a className="button button-primary" href="#/explorer">Open explorer<ArrowRight size={18}/></a></div>}</Suspense></ViewErrorBoundary><footer className="footer"><span>Made for curious minds.</span><span><span className="live-dot"/>Educational model · Computed in your browser</span></footer></main></div><MobileTabBar route={route}/><ConfigDrawer/><Toast/>
    <Onboarding route={route}/><CommandPalette/><HelpDialog/><ExperimentsDialog/><ShareDialog/>

  </div>;
}
export function AppShell() {
  const route = useRoute();
  return <SimulationProvider route={route}><Workspace route={route}/></SimulationProvider>;
}
