import { authService } from '@shared/auth.js';
import { router } from './services/router.js';
import { shell } from './ui/shell.js';
import { renderHomeView } from './views/home.js';
import { renderLoginView } from './views/login.js';
import { renderProjectsView } from './views/projects.js';
import { renderTasksView } from './views/tasks.js';

async function bootstrap() {
  await shell.ready();
  shell.setUser(authService.getUser());

  router.register('/login', () => renderLoginView(), { public: true });
  router.register('/home', () => renderProtected(renderHomeView));
  router.register('/projects', () => renderProtected(renderProjectsView));
  router.register('/tasks', () => renderProtected(renderTasksView));
  router.register('/', () => router.navigate('/home', { replace: true }), { public: true });
  router.setFallback(() => renderProtected(renderHomeView));

  router.onChange(() => {
    shell.setUser(authService.getUser());
  });

  router.start();
}

function renderProtected(view) {
  if (!authService.isAuthenticated()) {
    router.navigate('/login', { replace: true });
    return;
  }
  view();
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap app', error);
});
