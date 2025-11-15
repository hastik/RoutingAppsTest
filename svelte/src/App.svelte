<script>
  import { get, onDestroy, setContext } from 'svelte';
  import { derived } from 'svelte/store';
  import { authStore } from './lib/stores/auth.js';
  import { dataState } from './lib/stores/data.js';
  import { route, navigate } from './lib/router.js';
  import Login from './pages/Login.svelte';
  import Home from './pages/Home.svelte';
  import Projects from './pages/Projects.svelte';
  import Tasks from './pages/Tasks.svelte';

  export let shell;

  setContext('shell', shell);

  const dataStore = dataState;
  const routeStore = route;

  const componentMap = {
    '/login': Login,
    '/home': Home,
    '/projects': Projects,
    '/tasks': Tasks
  };

  const state = derived([authStore, dataStore, routeStore], ([$auth, $data, $route]) => ({
    user: $auth,
    data: $data,
    currentRoute: $route
  }));

    let snapshot = {
      user: get(authStore),
      data: get(dataStore),
      currentRoute: get(routeStore)
    };
  const unsubscribe = state.subscribe((value) => {
    snapshot = value;
    shell?.setUser(value.user);
    shell?.highlight(value.currentRoute);
    document.body.classList.toggle('auth-mode', value.currentRoute === '/login');
    if (!value.user && value.currentRoute !== '/login') {
      navigate('/login', { replace: true });
    }
    if (value.user && value.currentRoute === '/login') {
      navigate('/home', { replace: true });
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  $: currentComponent = componentMap[snapshot.currentRoute] ?? Home;
  $: routeProps = { data: snapshot.data, user: snapshot.user, currentRoute: snapshot.currentRoute };
</script>

<svelte:component this={currentComponent} {...routeProps} />
