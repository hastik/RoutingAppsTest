import { authService } from '@shared/auth.js';

const routes = new Map();
const listeners = new Set();
let fallbackHandler = null;
let currentPath = window.location.pathname;

function normalize(pathname) {
  if (!pathname.startsWith('/')) return `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getRoute(pathname) {
  const match = routes.get(pathname);
  if (match) return match;
  return fallbackHandler;
}

function runRoute(target, options = {}) {
  const route = getRoute(target);
  if (!route) {
    console.warn('No route handler for', target);
    return;
  }

  const isPublic = route.options?.public === true;
  const isLoginRoute = target === '/login';

  if (!isPublic && !authService.isAuthenticated()) {
    if (!isLoginRoute) {
      navigate('/login', { replace: true });
      return;
    }
  }

  if (isLoginRoute && authService.isAuthenticated()) {
    navigate('/home', { replace: true });
    return;
  }

  if (options.replace) {
    history.replaceState({}, '', target);
  } else if (currentPath !== target) {
    history.pushState({}, '', target);
  }

  currentPath = target;
  route.handler({ path: target });
  listeners.forEach((cb) => cb({ path: target }));
}

export const router = {
  register(path, handler, options = {}) {
    routes.set(path, { handler, options });
  },
  setFallback(handler) {
    fallbackHandler = { handler, options: { public: true } };
  },
  start() {
    window.addEventListener('popstate', () => {
      runRoute(normalize(window.location.pathname), { replace: true });
    });

    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[data-nav]');
      if (anchor && anchor.getAttribute('href').startsWith('/')) {
        event.preventDefault();
        this.navigate(anchor.getAttribute('href'));
      }
    });

    runRoute(normalize(window.location.pathname), { replace: true });
  },
  navigate(path, options = {}) {
    runRoute(normalize(path), options);
  },
  onChange(callback) {
    listeners.add(callback);
    callback({ path: currentPath });
    return () => listeners.delete(callback);
  },
  getCurrentPath() {
    return currentPath;
  }
};
