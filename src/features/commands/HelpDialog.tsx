import {ArrowRight, BookOpen, Map, RotateCcw} from 'lucide-react';
import {Dialog} from '../../components/ui/Dialog';
import {Button} from '../../components/ui/Button';
import {uiStore, useUI} from '../../state/uiStore';
import {settingsStore} from '../../state/settingsStore';
import {navigate} from '../../app/router';

const shortcuts = [['Space', 'Run / pause'], ['→ / ←', 'Next / previous cycle'], ['R', 'Reset simulation'], ['F', 'Run to completion'], ['[ / ]', 'Previous / next visualization'], ['Ctrl / ⌘ K', 'Open command menu'], ['?', 'Help and shortcuts'], ['Esc', 'Close a dialog or tour']];
export function HelpDialog() {
  const {dialog} = useUI();
  return <Dialog open={dialog === 'help'} onClose={() => uiStore.set({dialog: null})} title="A few useful shortcuts" description="Keep your attention on the machine. Shortcuts stay out of the way while you type."><div className="shortcut-list">{shortcuts.map(([key, action]) => <div key={key}><span>{action}</span><kbd>{key}</kbd></div>)}</div><div className="help-links"><Button onClick={() => {navigate('/explorer'); uiStore.set({dialog: null, tourStep: 0});}}><Map/>Take the 5-step tour<ArrowRight size={15}/></Button><a href="#/learn/glossary" onClick={() => uiStore.set({dialog: null})}><BookOpen size={18}/>Architecture glossary<ArrowRight size={15}/></a><Button variant="ghost" onClick={() => {uiStore.set({dialog: null}); settingsStore.set({welcomed: false});}}><RotateCcw/>Change your welcome preferences</Button></div></Dialog>;
}
