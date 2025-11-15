<script>
  import { getContext } from 'svelte';
  import { dataStore } from '@shared/dataStore.js';
  import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/options.js';
  import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';

  export let data;

  const shell = getContext('shell');

  let filters = { projectId: 'all', status: 'all', priority: 'all' };
  let sort = { by: 'createdAt', direction: 'desc' };
  let form = { projectId: '', title: '', description: '', priority: 'medium', status: 'new', deadline: '', editingId: null };

  $: projects = data.projects ?? [];
  $: tasks = data.tasks ?? [];
  $: if (!form.projectId && projects.length) {
    form = { ...form, projectId: projects[0].id };
  }

  const weight = { low: 0, medium: 1, high: 2, urgent: 3 };
  $: filtered = tasks
    .filter((task) => {
      if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      return true;
    })
    .sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      if (sort.by === 'priority') {
        return (weight[a.priority] - weight[b.priority]) * direction;
      }
      const key = sort.by === 'deadline' ? 'deadline' : 'createdAt';
      return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction;
    });

  $: shell?.setTitle('Tasks');
  $: shell?.setRouteLabel('Tasks');
  $: shell?.setActions(() => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${filtered.length} shown`;
    return badge;
  });

  const submit = () => {
    if (!form.projectId || !form.title.trim()) return;
    const payload = {
      projectId: form.projectId,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      deadline: form.deadline
    };
    if (form.editingId) {
      dataStore.updateTask(form.editingId, payload);
    } else {
      dataStore.createTask(payload);
    }
    form = { projectId: projects[0]?.id ?? '', title: '', description: '', priority: 'medium', status: 'new', deadline: '', editingId: null };
  };

  const editTask = (task) => {
    form = {
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline || '',
      editingId: task.id
    };
  };

  const deleteTask = (id) => {
    if (confirm('Delete this task?')) {
      dataStore.deleteTask(id);
      if (form.editingId === id) {
        form = { projectId: projects[0]?.id ?? '', title: '', description: '', priority: 'medium', status: 'new', deadline: '', editingId: null };
      }
    }
  };

  const updateStatus = (id, status) => {
    dataStore.updateTask(id, { status });
  };

  const priorityClass = (priority) => {
    if (priority === 'urgent' || priority === 'high') return 'pill danger';
    if (priority === 'medium') return 'pill warning';
    return 'pill success';
  };
</script>

<div class="stack">
  <div class="toolbar">
    <select class="priority-select" bind:value={filters.projectId}>
      <option value="all">All projects</option>
      {#each projects as project}
        <option value={project.id}>{project.name}</option>
      {/each}
    </select>
    <select class="status-select" bind:value={filters.status}>
      <option value="all">All status values</option>
      {#each STATUS_OPTIONS as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <select class="priority-select" bind:value={filters.priority}>
      <option value="all">All priorities</option>
      {#each PRIORITY_OPTIONS as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <select bind:value={sort.by}>
      <option value="createdAt">Sort by created date</option>
      <option value="deadline">Sort by deadline</option>
      <option value="priority">Sort by priority</option>
    </select>
    <select bind:value={sort.direction}>
      <option value="desc">Newest first</option>
      <option value="asc">Oldest first</option>
    </select>
  </div>

  {#if projects.length}
    <form class="stack form" on:submit|preventDefault={submit}>
      <div class="form-field">
        <span>Project</span>
        <select bind:value={form.projectId} required>
          {#each projects as project}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
      </div>
      <div class="form-field">
        <span>Title</span>
        <input bind:value={form.title} required placeholder="Task title" />
      </div>
      <div class="form-field">
        <span>Description</span>
        <textarea rows="3" bind:value={form.description} placeholder="Details"></textarea>
      </div>
      <div class="toolbar">
        <label class="form-field">
          <span>Priority</span>
          <select bind:value={form.priority}>
            {#each PRIORITY_OPTIONS as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
        <label class="form-field">
          <span>Status</span>
          <select bind:value={form.status}>
            {#each STATUS_OPTIONS as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
        <label class="form-field">
          <span>Deadline</span>
          <input type="date" bind:value={form.deadline} />
        </label>
      </div>
      <div class="toolbar">
        <div class="spacer"></div>
        {#if form.editingId}
          <button type="button" class="btn ghost" on:click={() => (form = { projectId: projects[0]?.id ?? '', title: '', description: '', priority: 'medium', status: 'new', deadline: '', editingId: null })}>Cancel</button>
        {/if}
        <button type="submit" class="btn primary">{form.editingId ? 'Update task' : 'Create task'}</button>
      </div>
    </form>
  {:else}
    <div class="empty-state">Create a project first to start assigning tasks.</div>
  {/if}

  {#if filtered.length}
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>Deadline</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as task (task.id)}
            <tr>
              <td>
                <strong>{task.title}</strong>
                <br />
                <span class="form-helper">{task.description || 'No details'}</span>
              </td>
              <td>{projects.find((p) => p.id === task.projectId)?.name ?? 'Unknown'}</td>
              <td>
                <span class={priorityClass(task.priority)}>{task.priority}</span>
              </td>
              <td>
                <select class="status-select" bind:value={task.status} on:change={(event) => updateStatus(task.id, event.target.value)}>
                  {#each STATUS_OPTIONS as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </td>
              <td>{formatDate(task.createdAt)}</td>
              <td>
                <div>{formatDate(task.deadline)}</div>
                <span class="form-helper">{formatRelativeDeadline(task.deadline)}</span>
              </td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn ghost" on:click={() => editTask(task)}>Edit</button>
                  <button type="button" class="btn ghost" on:click={() => deleteTask(task.id)}>Delete</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">No tasks match the current filters.</div>
  {/if}
</div>
