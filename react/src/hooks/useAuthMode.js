import { useEffect } from 'react';

export function useAuthMode(active) {
  useEffect(() => {
    if (active) {
      document.body.classList.add('auth-mode');
    } else {
      document.body.classList.remove('auth-mode');
    }
    return () => {
      document.body.classList.remove('auth-mode');
    };
  }, [active]);
}
