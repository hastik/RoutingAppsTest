import { useEffect } from 'react';
import { useShellRefs } from '../components/ShellProvider.jsx';

export function useRouteMeta({ title, label, path }) {
  const refs = useShellRefs();

  useEffect(() => {
    if (refs.panelTitle) refs.panelTitle.textContent = title;
  }, [title, refs.panelTitle]);

  useEffect(() => {
    if (refs.routeLabel) refs.routeLabel.textContent = label;
  }, [label, refs.routeLabel]);

  useEffect(() => {
    if (!refs.sidebarLinks) return;
    refs.sidebarLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === path);
    });
  }, [path, refs.sidebarLinks]);
}
