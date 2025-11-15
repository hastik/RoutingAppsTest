import { readable } from 'svelte/store';
import { authService } from '@shared/auth.js';

export const authStore = readable(authService.getUser(), (set) => {
  const unsubscribe = authService.subscribe((user) => set(user));
  return unsubscribe;
});
