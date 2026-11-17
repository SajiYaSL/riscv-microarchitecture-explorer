import {assemble} from '../engine/assembler';
import {EXAMPLES, type ExampleName} from '../engine/programs';
import {DEFAULT_CONFIG, validateConfig, type CPUConfig} from '../cpu/ooo/engine';
import type {Mode} from '../engine/simulator';
import {createStore, readSaved} from './createStore';

export type WorkspaceInput = {code: string; loadedSource: string; sample: ExampleName; config: CPUConfig; mode: Mode; speed: number};
export type WorkspaceState = WorkspaceInput & {cycle: number; playing: boolean};
export const DEFAULT_WORKSPACE: WorkspaceInput = {
  code: EXAMPLES['Out-of-Order Scheduling'], loadedSource: EXAMPLES['Out-of-Order Scheduling'],
  sample: 'Out-of-Order Scheduling', config: {...DEFAULT_CONFIG}, mode: 'ooo', speed: 550,
};
export function validateWorkspace(value: unknown): WorkspaceInput | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<WorkspaceInput>;
  if (typeof v.code !== 'string' || v.code.length > 20000 || typeof v.loadedSource !== 'string' || v.loadedSource.length > 20000) return null;
  if (!v.config || typeof v.config !== 'object' || validateConfig(v.config).length) return null;
  if (v.mode !== 'inorder' && v.mode !== 'ooo') return null;
  try { assemble(v.loadedSource); } catch { return null; }
  const config = Object.fromEntries(Object.keys(DEFAULT_CONFIG).map(key => [key, v.config![key as keyof CPUConfig]])) as CPUConfig;
  return {code: v.code, loadedSource: v.loadedSource, config, mode: v.mode,
    sample: typeof v.sample === 'string' && v.sample in EXAMPLES ? v.sample : DEFAULT_WORKSPACE.sample,
    speed: [150, 550, 1000].includes(v.speed ?? 0) ? v.speed! : 550};
}
export const simulationStore = createStore<WorkspaceState>(
  {...readSaved('rvmx-workspace-v2', DEFAULT_WORKSPACE, validateWorkspace), cycle: 0, playing: false},
  'rvmx-workspace-v2', ({code, loadedSource, sample, config, mode, speed}) => ({code, loadedSource, sample, config, mode, speed}),
);
export const useWorkspace = simulationStore.useStore;
export const simulationActions = {
  editCode: (code: string) => simulationStore.set({code}),
  selectExample: (sample: ExampleName) => simulationStore.set({sample, code: EXAMPLES[sample]}),
  load: () => {
    const {code} = simulationStore.get();
    try { assemble(code); simulationStore.set({loadedSource: code, cycle: 0, playing: false}); return true; }
    catch { return false; }
  },
  loadExample: (sample: ExampleName, config?: CPUConfig) => simulationStore.set({sample, code: EXAMPLES[sample], loadedSource: EXAMPLES[sample], ...(config ? {config: {...config}} : {}), cycle: 0, playing: false}),
  configure: (config: CPUConfig) => { if (!validateConfig(config).length) simulationStore.set({config: {...config}, cycle: 0, playing: false}); },
  reset: () => simulationStore.set({cycle: 0, playing: false}),
  setMode: (mode: Mode) => simulationStore.set({mode, cycle: 0, playing: false}),
  restore: (input: WorkspaceInput) => simulationStore.set({...input, cycle: 0, playing: false}),
};
