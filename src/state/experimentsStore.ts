import type {CPUConfig} from '../cpu/ooo/engine';
import {validateConfig} from '../cpu/ooo/engine';
import {createStore, readSaved} from './createStore';
import {validateWorkspace, type WorkspaceInput} from './simulationStore';
import type {runSummary} from '../features/experiments/export';

export type SavedExperiment = {id: string; name: string; workspace: WorkspaceInput};
export type SavedPreset = {id: string; name: string; config: CPUConfig};
export type PinnedRun = SavedExperiment & {metrics: ReturnType<typeof runSummary>};
type Library = {experiments: SavedExperiment[]; presets: SavedPreset[]; runs: PinnedRun[]};
export function validateExperiment(value: unknown): SavedExperiment | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as SavedExperiment; const workspace = validateWorkspace(v.workspace);
  if (!workspace || typeof v.name !== 'string' || !v.name.trim()) return null;
  return {id: typeof v.id === 'string' ? v.id.slice(0, 80) : makeId(), name: v.name.trim().slice(0, 60), workspace};
}
function makeId() {return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;}
const defaults: Library = {experiments: [], presets: [], runs: []};
export const experimentsStore = createStore<Library>(readSaved('rvmx-library-v2', defaults, value => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Library;
  const experiments = Array.isArray(v.experiments) ? v.experiments.map(validateExperiment).filter((e): e is SavedExperiment => e !== null).slice(0, 20) : [];
  const presets = Array.isArray(v.presets) ? v.presets.filter(p => p && typeof p.name === 'string' && typeof p.id === 'string' && p.config && !validateConfig(p.config).length).slice(0, 20) : [];
  const runs = Array.isArray(v.runs) ? v.runs.filter(run => validateExperiment(run) && run.metrics && ['inorder', 'ooo'].includes(run.metrics.architecture) && ['cycles', 'retired', 'ipc', 'cpi', 'stalls'].every(key => Number.isFinite(run.metrics[key as keyof typeof run.metrics]))).slice(0, 5) : [];
  return {experiments, presets, runs};
}), 'rvmx-library-v2');
export const useExperiments = experimentsStore.useStore;
export function saveExperiment(name: string, workspace: WorkspaceInput) {
  const item = validateExperiment({id: makeId(), name, workspace});
  if (!item) throw Error('Choose a name and a valid workspace.');
  experimentsStore.set(s => ({experiments: [item, ...s.experiments].slice(0, 20)}));
}
export function savePreset(name: string, config: CPUConfig) {
  if (!name.trim() || validateConfig(config).length) throw Error('Name your preset and check the configuration.');
  experimentsStore.set(s => ({presets: [{id: makeId(), name: name.trim().slice(0, 60), config: {...config}}, ...s.presets].slice(0, 20)}));
}
export function pinRun(name: string, workspace: WorkspaceInput, metrics: PinnedRun['metrics']) {
  const item = validateExperiment({id: makeId(), name, workspace}); if (!item) throw Error('This run cannot be pinned.');
  experimentsStore.set(s => ({runs: [{...item, metrics: {...metrics}}, ...s.runs].slice(0, 5)}));
}
