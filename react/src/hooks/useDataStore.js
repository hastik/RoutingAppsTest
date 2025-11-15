import { useSyncExternalStore } from 'react';
import { dataStore } from '@shared/dataStore.js';

const subscribe = (listener) => dataStore.subscribe(() => listener());

export function useDataStore() {
  return useSyncExternalStore(subscribe, () => dataStore.getSnapshot(), () => dataStore.getSnapshot());
}
