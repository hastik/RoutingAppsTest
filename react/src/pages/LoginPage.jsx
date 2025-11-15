import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@shared/auth.js';
import { useAuthStore } from '../hooks/useAuthStore.js';
import { useAuthMode } from '../hooks/useAuthMode.js';
import { useRouteMeta } from '../hooks/useRouteMeta.js';

export function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore();
  useAuthMode(true);
  useRouteMeta({ title: 'Sign in', label: 'Login', path: '/login' });

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username')?.toString().trim();
    const password = formData.get('password')?.toString();
    const result = authService.login(username, password);
    if (result.ok) {
      setError('');
      navigate('/home', { replace: true });
    } else {
      setError(result.error ?? 'Unable to sign in');
    }
  };

  return (
    <section className="auth-panel">
      <form className="form auth-form" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="form-helper">Use admin / 1234 to continue.</p>
        <label className="form-field">
          <span>Username</span>
          <input name="username" required autoComplete="username" />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn primary w-full">
          Sign in
        </button>
      </form>
    </section>
  );
}
