import App from './App.svelte';
import { loadLayout } from './lib/layout.js';
import { createShell } from './lib/shell.js';

loadLayout()
  .then((refs) => {
    const shell = createShell(refs);
    new App({
      target: refs.rootContainer,
      props: { shell }
    });
  })
  .catch((error) => {
    console.error('Failed to bootstrap Svelte stack', error);
    const pre = document.createElement('pre');
    pre.textContent = `Unable to boot Svelte app: ${error.message}`;
    document.body.appendChild(pre);
  });
