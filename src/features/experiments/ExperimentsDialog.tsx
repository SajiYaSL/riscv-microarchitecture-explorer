import {useRef, useState} from 'react';
import {Download, FolderOpen, Plus, Trash2, Upload} from 'lucide-react';
import {Dialog} from '../../components/ui/Dialog';
import {Button} from '../../components/ui/Button';
import {experimentsStore, useExperiments, saveExperiment, validateExperiment} from '../../state/experimentsStore';
import {useSimulation} from '../../state/SimulationContext';
import {simulationActions} from '../../state/simulationStore';
import {notify, uiStore, useUI} from '../../state/uiStore';
import {downloadFile} from './export';
import {navigate} from '../../app/router';

export function ExperimentsDialog() {
  const {dialog} = useUI(); const model = useSimulation(); const {experiments, presets} = useExperiments();
  const [name, setName] = useState(''); const input = useRef<HTMLInputElement>(null);
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 200000) throw Error('Choose an experiment smaller than 200 KB.');
      const parsed = JSON.parse(await file.text());
      if (parsed.version !== 2) throw Error('This experiment format is not supported.');
      const item = validateExperiment(parsed);
      if (!item) throw Error('The file contains an invalid program or configuration.');
      saveExperiment(item.name, item.workspace); notify('Experiment imported.');
    } catch (error) {notify((error as Error).message);}
    if (input.current) input.current.value = '';
  };
  return <Dialog open={dialog === 'experiments'} onClose={() => uiStore.set({dialog: null})} title="Your experiments" description="Saved on this device. Export a copy to keep or share."><form className="save-experiment-form" onSubmit={event => {event.preventDefault(); try {saveExperiment(name, model); setName(''); notify('Experiment saved on this device.');} catch (error) {notify((error as Error).message);}}}><label>Experiment name<input type="text" maxLength={60} required value={name} placeholder={model.sample} onChange={event => setName(event.target.value)}/></label><Button variant="primary" type="submit"><Plus/>Save current workspace</Button></form><div className="section-heading"><h3>Saved experiments <span className="pill">{experiments.length} / 20</span></h3><Button variant="ghost" onClick={() => input.current?.click()}><Upload/>Import JSON</Button><input className="sr-only" ref={input} type="file" accept="application/json,.json" aria-label="Import experiment file" onChange={event => {void importFile(event.target.files?.[0]);}}/></div>{!experiments.length && <div className="empty-state"><FolderOpen size={30}/><h3>Make room for a good idea.</h3><p>Save an experiment to return to its source and configuration.</p></div>}<ul className="saved-experiment-list">{experiments.map(item => <li key={item.id}><div><strong>{item.name}</strong><span>{item.workspace.mode === 'ooo' ? 'Out-of-order' : 'In-order'} · issue {item.workspace.config.issueWidth} · ROB {item.workspace.config.robSize}</span></div><Button variant="ghost" aria-label={`Load ${item.name}`} title="Load experiment" onClick={() => {simulationActions.restore(item.workspace); uiStore.set({dialog: null}); navigate('/explorer'); notify(`Loaded ${item.name}.`);}}><FolderOpen/></Button><Button variant="ghost" aria-label={`Export ${item.name}`} title="Export JSON" onClick={() => downloadFile('rvmx-experiment.json', JSON.stringify({version: 2, ...item}, null, 2))}><Download/></Button><Button variant="ghost" aria-label={`Delete ${item.name}`} title="Delete saved experiment" onClick={() => experimentsStore.set(s => ({experiments: s.experiments.filter(saved => saved.id !== item.id)}))}><Trash2/></Button></li>)}</ul>{presets.length > 0 && <><h3>Saved CPU presets</h3><ul className="saved-experiment-list">{presets.map(preset => <li key={preset.id}><div><strong>{preset.name}</strong><span>Issue {preset.config.issueWidth} · ROB {preset.config.robSize}</span></div><Button variant="ghost" aria-label={`Apply ${preset.name}`} onClick={() => {simulationActions.configure(preset.config); notify(`Applied ${preset.name}.`);}}><FolderOpen/></Button><Button variant="ghost" aria-label={`Delete preset ${preset.name}`} onClick={() => experimentsStore.set(s => ({presets: s.presets.filter(item => item.id !== preset.id)}))}><Trash2/></Button></li>)}</ul></>}</Dialog>;
}
