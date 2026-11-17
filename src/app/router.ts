import {useEffect, useMemo, useSyncExternalStore} from 'react';
import {settingsStore} from '../state/settingsStore';

export type Route = {view: 'explorer' | 'performance' | 'learn' | 'components' | 'missing'; path: string; lessonId?: string; share?: string};
export function parseRoute(hash: string): Route {
  const [raw, query = ''] = hash.replace(/^#/, '').split('?');
  const path = raw || '/explorer';
  const share = new URLSearchParams(query).get('share') ?? undefined;
  if (path === '/explorer' || path === '/performance') return {view: path.slice(1) as 'explorer' | 'performance', path, share};
  if (path === '/learn' || /^\/learn\/[-a-z0-9]+$/.test(path)) return {view: 'learn', path, lessonId: path.split('/')[2], share};
  if (path === '/dev/components' && import.meta.env.DEV) return {view: 'components', path};
  return {view: 'missing', path};
}
export function navigate(path: string) { window.location.hash = path; }
const subscribe = (listener: () => void) => { window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); };
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '#/explorer');
  const route = useMemo(() => parseRoute(hash), [hash]);
  useEffect(() => {
    if (!hash) { navigate(settingsStore.get().lastRoute); return; }
    if (route.view !== 'missing' && route.view !== 'components') settingsStore.set({lastRoute: route.path});
  }, [hash, route]);
  return route;
}
