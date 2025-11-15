export function createShell(refs) {
  return {
    setTitle(text) {
      if (refs.panelTitle) refs.panelTitle.textContent = text;
    },
    setRouteLabel(text) {
      if (refs.routeLabel) refs.routeLabel.textContent = text;
    },
    setUser(user) {
      if (refs.userDisplay) refs.userDisplay.textContent = user ? user.username : 'Guest';
    },
    setActions(renderFn) {
      if (!refs.panelActions) return;
      refs.panelActions.innerHTML = '';
      if (!renderFn) return;
      const node = renderFn();
      if (node instanceof Node) {
        refs.panelActions.appendChild(node);
      } else if (typeof node === 'string') {
        refs.panelActions.innerHTML = node;
      }
    },
    highlight(path) {
      refs.sidebarLinks?.forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('is-active', href === path);
      });
    }
  };
}
