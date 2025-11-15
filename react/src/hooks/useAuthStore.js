import { useSyncExternalStore } from 'react';
import { authService } from '@shared/auth.js';

const subscribe = (listener) => authService.subscribe(() => listener());

export function useAuthStore() {
  return useSyncExternalStore(subscribe, () => authService.getUser(), () => authService.getUser());
}
