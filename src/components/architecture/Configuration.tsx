import {useState} from 'react';
import {ArrowRight, Check, RotateCcw} from 'lucide-react';
import {DEFAULT_CONFIG, validateConfig, type CPUConfig} from '../../cpu/ooo/engine';
import {PRESETS} from '../../features/explorer/presets';
import {Button} from '../ui/Button';
import {savePreset, useExperiments} from '../../state/experimentsStore';
import {notify} from '../../state/uiStore';

const fields: {name: Exclude<keyof CPUConfig, 'predictor'>; label: string; min: number; max: number; group: string}[] = [
  {name: 'fetchWidth', label: 'Fetch width', min: 1, max: 4, group: 'Frontend'},
  {name: 'decodeWidth', label: 'Decode / rename width', min: 1, max: 4, group: 'Frontend'},
  {name: 'issueWidth', label: 'Issue width', min: 1, max: 4, group: 'Frontend'},
  {name: 'robSize', label: 'Reorder buffer entries', min: 2, max: 64, group: 'Capacity'},
  {name: 'physicalRegisters', label: 'Physical registers', min: 33, max: 128, group: 'Capacity'},
  {name: 'issueCapacity', label: 'Issue queue entries', min: 1, max: 64, group: 'Capacity'},
  {name: 'aluLatency', label: 'ALU latency', min: 1, max: 8, group: 'Execution'},
  {name: 'multiplyLatency', label: 'Multiply latency', min: 1, max: 16, group: 'Execution'},
];
export function Configuration({config, onApply}: {config: CPUConfig; onApply: (next: CPUConfig) => void}) {
  const [draft, setDraft] = useState<CPUConfig>({...config}); const errors = validateConfig(draft);
  const [presetName, setPresetName] = useState(''); const {presets} = useExperiments();
  const changes = (Object.keys(config) as (keyof CPUConfig)[]).filter(key => draft[key] !== config[key]);
  return <div className="configuration">
    <div className="config-presets">{PRESETS.map(preset => <button type="button" key={preset.name} className={`preset-card ${JSON.stringify(draft) === JSON.stringify(preset.config) ? 'active' : ''}`} onClick={() => setDraft({...preset.config})}><strong>{preset.name}</strong><span>{preset.description}</span></button>)}</div>
    {presets.length > 0 && <label className="predictor-field">Your presets<select aria-label="Saved CPU presets" defaultValue="" onChange={event => {const preset = presets.find(item => item.id === event.target.value); if (preset) setDraft({...preset.config});}}><option value="" disabled>Choose a saved preset</option>{presets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>}
    {['Frontend', 'Capacity', 'Execution'].map(group => <fieldset className="config-group" key={group}><legend>{group}</legend><div className="configuration-fields">{fields.filter(field => field.group === group).map(field => <label key={field.name}>{field.label}<input type="number" min={field.min} max={field.max} step={1} value={Number.isNaN(draft[field.name]) ? '' : draft[field.name]} aria-invalid={errors.length > 0 && (!Number.isInteger(draft[field.name]) || draft[field.name] < field.min || draft[field.name] > field.max)} onChange={event => setDraft({...draft, [field.name]: event.currentTarget.valueAsNumber})}/><small>{field.min}–{field.max}{group === 'Execution' ? ' clocks' : ''}</small></label>)}</div></fieldset>)}
    <label className="predictor-field">Branch predictor<select value={draft.predictor} onChange={event => setDraft({...draft, predictor: event.target.value as CPUConfig['predictor']})}><option value="static">Static · predict not taken</option><option value="one-bit">1-bit · remember the last outcome</option><option value="two-bit">2-bit · adapt to repeated outcomes</option></select></label>
    <p className="config-explanation">Widths and capacities apply to out-of-order execution. Latencies apply to both CPUs. Each execution unit handles one operation at a time; retirement is one instruction per clock.</p>
    <div className="config-diff"><h3>{changes.length ? `${changes.length} pending change${changes.length === 1 ? '' : 's'}` : 'Your current configuration'}</h3>{changes.length ? <ul>{changes.map(key => <li key={key}><span>{fields.find(field => field.name === key)?.label ?? 'Branch predictor'}</span><code>{String(config[key])}</code><ArrowRight size={14}/><code>{String(draft[key])}</code></li>)}</ul> : <p>Choose a preset or edit a field to experiment.</p>}</div>
    {errors.length > 0 && <div role="alert" className="error-banner">{errors.join('. ')}</div>}
    <div className="save-preset-row"><label>Save these settings as a preset<input type="text" maxLength={60} placeholder="My configuration" value={presetName} onChange={event => setPresetName(event.target.value)}/></label><Button disabled={!presetName.trim() || !!errors.length} onClick={() => {try {savePreset(presetName, draft); setPresetName(''); notify('CPU preset saved.');} catch (error) {notify((error as Error).message);}}}>Save preset</Button></div>
    <div className="config-actions"><Button variant="ghost" onClick={() => setDraft({...DEFAULT_CONFIG})}><RotateCcw/>Reset to defaults</Button><Button variant="primary" disabled={errors.length > 0 || !changes.length} onClick={() => onApply({...draft})}><Check/>Apply & restart</Button></div>
  </div>;
}
