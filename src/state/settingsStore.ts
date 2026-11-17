import {createStore, readSaved} from './createStore';
import {initialTheme, type Theme} from '../theme/theme';

export type Experience = 'guided' | 'expert';
type Settings = {theme: Theme; experience: Experience; welcomed: boolean; lastRoute: string; completedLessons: string[]};
const defaults: Settings = {theme: initialTheme(), experience: 'guided', welcomed: false, lastRoute: '/explorer', completedLessons: []};
export const settingsStore = createStore(readSaved('rvmx-settings-v2', defaults, value => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<Settings>;
  return {
    theme: ['dark', 'light', 'contrast'].includes(v.theme ?? '') ? v.theme! : defaults.theme,
    experience: v.experience === 'expert' ? 'expert' : 'guided',
    welcomed: v.welcomed === true,
    lastRoute: typeof v.lastRoute === 'string' && /^\/(explorer|performance|learn)(\/[-a-z0-9]+)?$/.test(v.lastRoute) ? v.lastRoute : '/explorer',
    completedLessons: Array.isArray(v.completedLessons) ? v.completedLessons.filter((s): s is string => typeof s === 'string').slice(0, 100) : [],
  };
}), 'rvmx-settings-v2');
export const useSettings = settingsStore.useStore;
