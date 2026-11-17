import {useCallback, useSyncExternalStore} from 'react';
export function useMediaQuery(query: string) {
  const subscribe = useCallback((listener: () => void) => {const media = matchMedia(query); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener);}, [query]);
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false);
}
