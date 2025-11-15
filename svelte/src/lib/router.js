import { writable } from 'svelte/store';

const normalize = (path) => {
  if (!path.startsWith('/')) return `/${path}`;
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
};

const route = writable(normalize(window.location.pathname || '/home'));

function navigate(path, { replace = false } = {}) {
  const target = normalize(path);
  if (replace) {
    history.replaceState({}, '', target);
  } else {
    history.pushState({}, '', target);
  }
  route.set(target);
}

window.addEventListener('popstate', () => {
  route.set(normalize(window.location.pathname));
});

export { route, navigate };
