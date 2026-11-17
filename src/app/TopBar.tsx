import {Activity, ChevronRight, CircleHelp, Command, Menu, Moon, Share2, Sun} from 'lucide-react';
import {useState} from 'react';
import type {Route} from './router';
import {useTheme, type Theme} from '../theme/useTheme';
import {settingsStore, useSettings} from '../state/settingsStore';
import {simulationStore} from '../state/simulationStore';
import {encodeWorkspace} from '../state/share';
import {uiStore, notify} from '../state/uiStore';
import {Button} from '../components/ui/Button';
import {SegmentedControl} from '../components/ui/SegmentedControl';
import {Dialog} from '../components/ui/Dialog';

export function TopBar({route}: {route: Route}) {
  const [theme, setTheme] = useTheme(); const {experience} = useSettings(); const [menu, setMenu] = useState(false);
  const title = route.view === 'performance' ? 'Performance Lab' : route.view === 'learn' ? 'Learning Center' : 'CPU Explorer';
  const share = async () => {
    try {
      const encoded = await encodeWorkspace(simulationStore.get());
      const link = new URL(location.href); link.hash = `${route.path}?share=${encoded}`;
      if (navigator.clipboard) {await navigator.clipboard.writeText(link.href); notify('Workspace link copied. Share your experiment.');}
      else {uiStore.set({dialog: 'share'});}
    } catch (error) {notify((error as Error).message);}
  };
  const controls = <>
    <SegmentedControl label="Experience" value={experience} options={[{value: 'guided', label: 'Guided'}, {value: 'expert', label: 'Expert'}]} onChange={experience => settingsStore.set({experience})}/>
    <label className="theme-select">{theme === 'light' ? <Sun size={17}/> : <Moon size={17}/>}<span className="sr-only">Theme</span><select aria-label="Theme" value={theme} onChange={event => setTheme(event.target.value as Theme)}><option value="dark">Dark</option><option value="light">Light</option><option value="contrast">High contrast</option></select></label>
    <Button variant="ghost" className="icon-button" onClick={() => uiStore.set({dialog: 'help'})} aria-label="Help and shortcuts" title="Help and shortcuts"><CircleHelp/></Button>
    <Button variant="secondary" onClick={share}><Share2/><span>Share</span></Button>
  </>;
  return <><header className="topbar"><a className="mobile-brand" href="#/explorer" aria-label="RVMX home"><Activity size={22}/><strong>RVMX.</strong></a><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{title}</strong></div><div className="topbar-actions">{controls}<Button variant="ghost" className="icon-button command-trigger" onClick={() => uiStore.set({dialog: 'commands'})} aria-label="Open command menu" title="Command menu (Ctrl or Command + K)"><Command/></Button></div><Button variant="ghost" className="icon-button mobile-menu-trigger" onClick={() => setMenu(true)} aria-label="Open workspace menu"><Menu/></Button></header><Dialog open={menu} onClose={() => setMenu(false)} title="Workspace menu" kind="sheet"><div className="mobile-menu-actions">{controls}</div></Dialog></>;
}
