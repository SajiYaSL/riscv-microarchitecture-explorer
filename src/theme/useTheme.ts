import {useLayoutEffect} from 'react';
import {settingsStore, useSettings} from '../state/settingsStore';
export type {Theme} from './theme';
import type {Theme} from './theme';
export function useTheme() {
  const {theme} = useSettings();
  useLayoutEffect(() => {
    document.documentElement.classList.add('theme-switching');
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('rvmx-theme', theme); } catch { /* Optional persistence. */ }
    let second = 0;
    const frame = requestAnimationFrame(() => {second = requestAnimationFrame(() => document.documentElement.classList.remove('theme-switching'));});
    return () => {cancelAnimationFrame(frame); cancelAnimationFrame(second); document.documentElement.classList.remove('theme-switching');};
  }, [theme]);
  return [theme, (next: Theme) => settingsStore.set({theme: next})] as const;
}
