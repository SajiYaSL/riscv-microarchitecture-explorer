export type Theme = 'dark' | 'light' | 'contrast';
export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('rvmx-theme');
    if (saved === 'dark' || saved === 'light' || saved === 'contrast') return saved;
  } catch { /* Optional persistence. */ }
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-contrast: more)').matches) return 'contrast';
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
