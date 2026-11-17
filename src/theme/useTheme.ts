import {useEffect, useState} from 'react';

export type Theme = 'dark' | 'light' | 'contrast';
export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('rvmx-theme');
    if (saved === 'dark' || saved === 'light' || saved === 'contrast') return saved;
  } catch { /* The workspace remains usable when storage is unavailable. */ }
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('rvmx-theme', theme); } catch { /* Optional persistence. */ }
  }, [theme]);
  return [theme, setTheme] as const;
}
