<script>
  import { getContext } from 'svelte';
  import { authService } from '@shared/auth.js';
  import { navigate } from '../lib/router.js';

  export let user;

  const shell = getContext('shell');
  let username = '';
  let password = '';
  let error = '';

  $: shell?.setTitle('Sign in');
  $: shell?.setRouteLabel('Login');
  $: shell?.setActions(null);

  if (user) {
    navigate('/home', { replace: true });
  }

  const submit = () => {
    const result = authService.login(username.trim(), password);
    if (result.ok) {
      error = '';
      navigate('/home', { replace: true });
    } else {
      error = result.error ?? 'Invalid credentials';
    }
  };
</script>

<section class="auth-panel">
  <form class="form auth-form" on:submit|preventDefault={submit}>
    <h1>Welcome back</h1>
    <p class="form-helper">Use admin / 1234 to continue.</p>
    <label class="form-field">
      <span>Username</span>
      <input bind:value={username} autocomplete="username" required />
    </label>
    <label class="form-field">
      <span>Password</span>
      <input type="password" bind:value={password} autocomplete="current-password" required />
    </label>
    {#if error}
      <p class="form-error">{error}</p>
    {/if}
    <button type="submit" class="btn primary w-full">Sign in</button>
  </form>
</section>
