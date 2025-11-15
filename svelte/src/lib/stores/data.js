import { readable } from 'svelte/store';
import { dataStore } from '@shared/dataStore.js';

export const dataState = readable(dataStore.getSnapshot(), (set) => {
  const unsubscribe = dataStore.subscribe((snapshot) => set(snapshot));
  return unsubscribe;
});
