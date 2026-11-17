import {createStore, readSaved} from './createStore';

export const visualizationTabs = ['datapath', 'timeline', 'rob', 'rename', 'scheduling', 'memory', 'performance', 'trace'] as const;
export type VisualizationTab = typeof visualizationTabs[number];
export type InspectorTab = 'overview' | 'instruction' | 'registers' | 'memory';
type UI = {
  tab: VisualizationTab; inspectorTab: InspectorTab; selected: number | null; selectedRegister: number; memoryAddress: number;
  configOpen: boolean; inspectorOpen: boolean; dialog: 'welcome' | 'help' | 'commands' | 'share' | null;
  toast: string | null; split: boolean; tourStep: number;
};
const defaults: UI = {tab: 'datapath', inspectorTab: 'overview', selected: null, selectedRegister: 3, memoryAddress: 0, configOpen: false, inspectorOpen: false, dialog: null, toast: null, split: false, tourStep: -1};
export const uiStore = createStore<UI>(readSaved('rvmx-ui-v2', defaults, value => {
  const v = value as Partial<UI> | null;
  return v && visualizationTabs.includes(v.tab as VisualizationTab) ? {...defaults, tab: v.tab!, split: v.split === true} : defaults;
}), 'rvmx-ui-v2', ({tab, split}) => ({tab, split}));
export const useUI = uiStore.useStore;
export function selectInstruction(selected: number) {
  uiStore.set({selected, inspectorTab: 'instruction', inspectorOpen: typeof matchMedia !== 'undefined' && matchMedia('(max-width:759px)').matches});
}
export function notify(toast: string) { uiStore.set({toast}); }
