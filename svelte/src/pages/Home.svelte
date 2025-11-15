<script>
  import { getContext } from 'svelte';
  import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';

  export let data;

  const shell = getContext('shell');

  $: shell?.setTitle('Welcome back');
  $: shell?.setRouteLabel('Home');
  $: shell?.setActions(() => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = new Date().toLocaleDateString();
    return badge;
  });

  $: projects = data.projects ?? [];
  $: tasks = data.tasks ?? [];
  $: openTasks = tasks.filter((task) => task.status !== 'done');
  $: urgentTasks = tasks.filter((task) => task.priority === 'urgent');
  $: doneRate = tasks.length ? Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100) : 0;
  $: upcoming = tasks.filter((task) => task.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 4);
  $: projectNames = Object.fromEntries(projects.map((project) => [project.id, project.name]));
</script>

<div class="stack">
  <div class="tag-grid">
    <article class="stat-card stack">
      <div class="stat-value">{projects.length}</div>
      <div class="stat-label">Projects</div>
      <span class="form-helper">Total initiatives</span>
    </article>
    <article class="stat-card stack">
      <div class="stat-value">{tasks.length}</div>
      <div class="stat-label">Tasks</div>
      <span class="form-helper">{openTasks.length} open</span>
    </article>
    <article class="stat-card stack">
      <div class="stat-value">{urgentTasks.length}</div>
      <div class="stat-label">Urgent tasks</div>
    </article>
    <article class="stat-card stack">
      <div class="stat-value">{doneRate}%</div>
      <div class="stat-label">Done rate</div>
      <span class="form-helper">All-time completion</span>
    </article>
  </div>

  <div class="panel">
    <header class="panel-header">
      <h2 class="panel-title">Upcoming deadlines</h2>
    </header>
    <div class="panel-body">
      {#if upcoming.length}
        <div class="stack">
          {#each upcoming as task}
            <article class="stack">
              <strong>{task.title}</strong>
              <span class="form-helper">{projectNames[task.projectId] ?? 'Unknown'} • {formatDate(task.deadline)} • {formatRelativeDeadline(task.deadline)}</span>
            </article>
          {/each}
        </div>
      {:else}
        <p class="form-helper">No upcoming deadlines. Enjoy the calm!</p>
      {/if}
    </div>
  </div>
</div>
