import {useEffect, useId, useMemo, useState} from 'react';
import {ArrowDown, ArrowRight, ArrowUp, Search} from 'lucide-react';
import {Dialog} from '../../components/ui/Dialog';
import {useUI, uiStore} from '../../state/uiStore';
import {simulationActions} from '../../state/simulationStore';
import {settingsStore} from '../../state/settingsStore';
import {useSimulation} from '../../state/SimulationContext';
import {EXAMPLES, type ExampleName} from '../../engine/programs';
import {navigate} from '../../app/router';
import {filterCommands, type CommandItem} from './commands';
import {exportRun} from '../experiments/export';

export function CommandPalette() {
  const {dialog} = useUI(); const model = useSimulation(); const [query, setQuery] = useState(''), [active, setActive] = useState(0); const id = useId();
  const commands = useMemo<CommandItem[]>(() => [
    ...[{path: '/explorer', label: 'Go to CPU Explorer'}, {path: '/performance', label: 'Go to Performance Lab'}, {path: '/learn', label: 'Go to Learning Center'}, {path: '/learn/glossary', label: 'Search the glossary'}].map(item => ({id: item.path, label: item.label, section: 'Navigate', run: () => navigate(item.path)})),
    {id: 'run', label: model.playing ? 'Pause simulation' : 'Run simulation', section: 'Execution', shortcut: 'Space', run: () => {navigate('/explorer'); model.togglePlay();}},
    {id: 'next', label: 'Step to next cycle', section: 'Execution', shortcut: '→', run: () => {navigate('/explorer'); model.step(1);}},
    {id: 'previous', label: 'Step to previous cycle', section: 'Execution', shortcut: '←', run: () => {navigate('/explorer'); model.step(-1);}},
    {id: 'reset', label: 'Reset simulation', section: 'Execution', shortcut: 'R', run: simulationActions.reset},
    {id: 'finish', label: 'Run to completion', section: 'Execution', shortcut: 'F', run: () => {navigate('/explorer'); model.finish();}},
    {id: 'configure', label: 'Configure CPU', section: 'Workspace', run: () => uiStore.set({configOpen: true})},
    {id: 'experiments', label: 'Open saved experiments', section: 'Workspace', run: () => uiStore.set({dialog: 'experiments'})},
    ...(['guided', 'expert'] as const).map(experience => ({id: experience, label: `Switch to ${experience} mode`, section: 'Workspace', run: () => settingsStore.set({experience})})),
    ...(['dark', 'light', 'contrast'] as const).map(theme => ({id: theme, label: `Use ${theme === 'contrast' ? 'high-contrast' : theme} theme`, section: 'Appearance', run: () => settingsStore.set({theme})})),
    ...(['inorder', 'ooo'] as const).map(mode => ({id: mode, label: `Use ${mode === 'ooo' ? 'out-of-order' : 'in-order'} CPU`, section: 'Architecture', run: () => simulationActions.setMode(mode)})),
    ...Object.keys(EXAMPLES).map(name => ({id: `example-${name}`, label: `Load ${name}`, section: 'Examples', keywords: 'assembly program', run: () => {simulationActions.loadExample(name as ExampleName); navigate('/explorer');}})),
    {id: 'export', label: 'Export run and trace as JSON', section: 'Export', run: () => exportRun(model.loadedSource, model.config, model.sim)},
    {id: 'tour', label: 'Take the product tour', section: 'Help', run: () => {navigate('/explorer'); uiStore.set({tourStep: 0});}},
    {id: 'help', label: 'Show keyboard shortcuts', section: 'Help', shortcut: '?', run: () => uiStore.set({dialog: 'help'})},
  ], [model]);
  const results = filterCommands(commands, query); const safeActive = Math.min(active, Math.max(0, results.length - 1));
  useEffect(() => {if (dialog === 'commands') {setQuery(''); setActive(0);}}, [dialog]);
  const execute = (command: CommandItem) => {uiStore.set({dialog: null}); command.run();};
  return <Dialog open={dialog === 'commands'} onClose={() => uiStore.set({dialog: null})} title="Command menu" className="command-dialog"><label className="command-search"><Search size={20}/><input autoFocus type="search" role="combobox" aria-label="Search commands" aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-results`} aria-activedescendant={results.length ? `${id}-${safeActive}` : undefined} placeholder="What would you like to do?" value={query} onChange={event => {setQuery(event.target.value); setActive(0);}} onKeyDown={event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); const next = (safeActive + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(results.length, 1); setActive(next); document.getElementById(`${id}-${next}`)?.scrollIntoView({block: 'nearest'});}
    if (event.key === 'Enter' && results[safeActive]) {event.preventDefault(); execute(results[safeActive]);}
  }}/></label><ul id={`${id}-results`} role="listbox" aria-label="Commands" className="command-results">{results.slice(0, 40).map((command, index) => <li key={command.id} id={`${id}-${index}`} role="option" aria-selected={safeActive === index} onMouseMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => execute(command)}><div><span>{command.section}</span><strong>{command.label}</strong></div>{command.shortcut ? <kbd>{command.shortcut}</kbd> : <ArrowRight size={15}/>}</li>)}</ul>{!results.length && <div className="empty-state"><h3>No matching commands</h3><p>Try “branch”, “theme”, or “export”.</p></div>}<div className="command-footer"><span><ArrowUp size={12}/><ArrowDown size={12}/> to navigate</span><span><kbd>Enter</kbd> to select</span><span><kbd>Esc</kbd> to close</span></div></Dialog>;
}
