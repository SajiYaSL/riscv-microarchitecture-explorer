import {useEffect} from 'react';
import {settingsStore, useSettings} from '../state/settingsStore';
export type {Theme} from './theme';
import type {Theme} from './theme';
export function useTheme() {
  const {theme} = useSettings();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('rvmx-theme', theme); } catch { /* Optional persistence. */ }
  }, [theme]);
  return [theme, (next: Theme) => settingsStore.set({theme: next})] as const;
}
