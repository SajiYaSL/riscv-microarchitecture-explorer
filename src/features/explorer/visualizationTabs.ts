import type {Mode} from '../../engine/simulator';
import type {Experience} from '../../state/settingsStore';
import type {VisualizationTab} from '../../state/uiStore';
export function availableTabs(mode: Mode, experience: Experience): VisualizationTab[] {
  if (experience === 'guided') return mode === 'ooo' ? ['datapath', 'timeline', 'rob'] : ['datapath', 'timeline'];
  return mode === 'ooo' ? ['datapath', 'timeline', 'rob', 'rename', 'scheduling', 'memory', 'performance', 'trace'] : ['datapath', 'timeline', 'performance', 'trace'];
}
