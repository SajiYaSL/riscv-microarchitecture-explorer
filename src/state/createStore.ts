import {useSyncExternalStore} from 'react';

export function readSaved<T>(key: string, fallback: T, validate: (value: unknown) => T | null): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? validate(JSON.parse(raw)) ?? fallback : fallback;
  } catch { return fallback; }
}

export function createStore<T>(initial: T, key?: string, persist: (state: T) => unknown = state => state) {
  let state = initial;
  let saved = '';
  const listeners = new Set<() => void>();
  const get = () => state;
  const set = (update: Partial<T> | ((previous: T) => Partial<T>)) => {
    state = {...state, ...(typeof update === 'function' ? update(state) : update)};
    if (key) {
      try {
        const next = JSON.stringify(persist(state));
        if (next !== saved) { localStorage.setItem(key, next); saved = next; }
      } catch { /* Storage may be full or disabled. In-memory work continues. */ }
    }
    listeners.forEach(listener => listener());
  };
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  const useStore = () => useSyncExternalStore(subscribe, get, get);
  return {get, set, subscribe, useStore};
}
