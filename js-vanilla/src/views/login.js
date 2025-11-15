import { authService } from '@shared/auth.js';
import { router } from '../services/router.js';
import { shell } from '../ui/shell.js';

async function mountLogin(errorMessage = '') {
  const template = shell.getLoginTemplate();
  const form = template.querySelector('form[data-form="login"]');
  const errorSlot = template.querySelector('[data-slot="error"]');
  if (errorSlot) errorSlot.textContent = errorMessage;

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const username = data.get('username')?.toString().trim();
    const password = data.get('password')?.toString();
    const result = authService.login(username, password);
    if (result.ok) {
      shell.ensurePanel();
      shell.setUser(result.account);
      router.navigate('/home', { replace: true });
    } else if (errorSlot) {
      mountLogin(result.error);
    }
  });

  shell.showAuthScreen(template);
}

export async function renderLoginView() {
  await shell.ready();
  shell.setRouteLabel('Login');
  shell.setUser(null);
  shell.highlight('');
  mountLogin();
}
