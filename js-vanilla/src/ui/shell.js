import { authService } from '@shared/auth.js';
import { router } from '../services/router.js';

let layoutReadyPromise;
const refs = {};

async function fetchLayout() {
  const response = await fetch('/design/html/layout.html', {
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Unable to load layout');
  }
  return response.text();
}

function bindPanelRefs() {
  refs.panelTitle = document.querySelector('.panel-title');
  refs.panelActions = document.querySelector('[data-slot="panel-actions"]');
  refs.panelBody = document.querySelector('[data-slot="panel-body"]');
}

function adoptLayout(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  document.title = doc.title || document.title;

  document.head.querySelectorAll('link[data-shared-style], style[data-shared-style]').forEach((node) =>
    node.remove()
  );

  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const cloned = link.cloneNode(true);
    cloned.dataset.sharedStyle = 'true';
    document.head.appendChild(cloned);
  });

  document.body.innerHTML = doc.body.innerHTML;

  refs.routeLabel = document.querySelector('[data-slot="route-label"]');
  refs.sidebarLinks = document.querySelectorAll('.sidebar-link');
  refs.userDisplay = document.querySelector('[data-slot="user-display"]');
  refs.logoutButton = document.querySelector('[data-action="logout"]');
  refs.sidebarToggle = document.querySelector('[data-action="toggle-sidebar"]');
  refs.main = document.getElementById('app-main');
  refs.loginTemplate = document.getElementById('login-form-template');
  refs.mainBlueprint = refs.main.innerHTML;
  refs.panelMounted = true;
  bindPanelRefs();

  refs.logoutButton?.addEventListener('click', () => {
    authService.logout();
    router.navigate('/login');
  });

  refs.sidebarToggle?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });
}

function ensureLayout() {
  if (!layoutReadyPromise) {
    layoutReadyPromise = fetchLayout().then(adoptLayout);
  }
  return layoutReadyPromise;
}

function fragmentFrom(content) {
  if (content instanceof Node) {
    return content;
  }
  if (typeof content === 'string') {
    const template = document.createElement('template');
    template.innerHTML = content.trim();
    return template.content;
  }
  return document.createDocumentFragment();
}

function mountPanelIfNeeded() {
  if (!refs.panelMounted && refs.main) {
    refs.main.innerHTML = refs.mainBlueprint;
    refs.panelMounted = true;
    bindPanelRefs();
  }
}

export const shell = {
  async ready() {
    await ensureLayout();
    return refs;
  },
  setRouteLabel(label) {
    if (refs.routeLabel) {
      refs.routeLabel.textContent = label;
    }
  },
  setUser(user) {
    if (refs.userDisplay) {
      refs.userDisplay.textContent = user ? user.username : 'Guest';
    }
  },
  ensurePanel() {
    mountPanelIfNeeded();
    document.body.classList.remove('auth-mode');
  },
  setPanel({ title, actions = '', body = '' }) {
    this.ensurePanel();
    if (refs.panelTitle) refs.panelTitle.textContent = title;
    if (refs.panelActions) {
      refs.panelActions.replaceChildren(fragmentFrom(actions));
    }
    if (refs.panelBody) {
      refs.panelBody.replaceChildren(fragmentFrom(body));
    }
  },
  highlight(path) {
    refs.sidebarLinks?.forEach((link) => {
      const isActive = link.getAttribute('href') === path;
      link.classList.toggle('is-active', isActive);
    });
  },
  showAuthScreen(content) {
    if (!refs.main) return;
    document.body.classList.add('auth-mode');
    refs.main.innerHTML = '';
    refs.panelMounted = false;
    refs.main.appendChild(fragmentFrom(content));
  },
  getLoginTemplate() {
    return refs.loginTemplate?.content.cloneNode(true) ?? document.createDocumentFragment();
  }
};
