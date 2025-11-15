import { authService } from '@shared/auth.js';
import { navigate } from './router.js';

export async function loadLayout() {
  const response = await fetch('/design/html/layout.html', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load shared layout');
  }
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  document.title = doc.title || document.title;
  document.head.querySelectorAll('link[data-shared-style]').forEach((node) => node.remove());
  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const cloned = link.cloneNode(true);
    cloned.dataset.sharedStyle = 'true';
    document.head.appendChild(cloned);
  });

  document.body.innerHTML = doc.body.innerHTML;

  const refs = {
    panelBody: document.querySelector('[data-slot="panel-body"]'),
    panelTitle: document.querySelector('.panel-title'),
    panelActions: document.querySelector('[data-slot="panel-actions"]'),
    routeLabel: document.querySelector('[data-slot="route-label"]'),
    userDisplay: document.querySelector('[data-slot="user-display"]'),
    sidebarLinks: Array.from(document.querySelectorAll('.sidebar-link')),
    logoutButton: document.querySelector('[data-action="logout"]'),
    sidebarToggle: document.querySelector('[data-action="toggle-sidebar"]')
  };

  refs.panelBody.innerHTML = '';
  const rootContainer = document.createElement('div');
  rootContainer.id = 'svelte-root';
  refs.panelBody.appendChild(rootContainer);
  refs.rootContainer = rootContainer;

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('.sidebar-link');
    if (anchor && anchor.getAttribute('href')?.startsWith('/')) {
      event.preventDefault();
      navigate(anchor.getAttribute('href'));
    }
  });

  refs.logoutButton?.addEventListener('click', (event) => {
    event.preventDefault();
    authService.logout();
    navigate('/login');
  });

  refs.sidebarToggle?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });

  return refs;
}
