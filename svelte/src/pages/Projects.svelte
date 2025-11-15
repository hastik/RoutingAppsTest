<script>
  import { getContext } from 'svelte';
  import { dataStore } from '@shared/dataStore.js';

  export let data;

  const shell = getContext('shell');

  $: shell?.setTitle('Projects');
  $: shell?.setRouteLabel('Projects');
  $: shell?.setActions(() => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${projects.length} total`;
    return badge;
  });

  $: projects = data.projects ?? [];

  let form = { name: '', description: '', editingId: null };

  const submit = () => {
    if (!form.name.trim()) return;
    if (form.editingId) {
      dataStore.updateProject(form.editingId, {
        name: form.name.trim(),
        description: form.description.trim()
      });
    } else {
      dataStore.createProject({
        name: form.name.trim(),
        description: form.description.trim()
      });
    }
    form = { name: '', description: '', editingId: null };
  };

  const editProject = (project) => {
    form = { name: project.name, description: project.description ?? '', editingId: project.id };
  };

  const deleteProject = (id) => {
    if (confirm('Delete this project? Tasks linked to it will also be removed.')) {
      dataStore.deleteProject(id);
      if (form.editingId === id) {
        form = { name: '', description: '', editingId: null };
      }
    }
  };
</script>

<div class="stack">
  <form class="form stack" on:submit|preventDefault={submit}>
    <div class="form-field">
      <span>Project name</span>
      <input bind:value={form.name} required placeholder="e.g. Mobile revamp" />
    </div>
    <div class="form-field">
      <span>Description</span>
      <textarea rows="3" bind:value={form.description} placeholder="Optional context"></textarea>
    </div>
    <div class="toolbar">
      <div class="spacer"></div>
      {#if form.editingId}
        <button type="button" class="btn ghost" on:click={() => (form = { name: '', description: '', editingId: null })}>Cancel</button>
      {/if}
      <button type="submit" class="btn primary">{form.editingId ? 'Update project' : 'Create project'}</button>
    </div>
  </form>

  {#if projects.length}
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each projects as project (project.id)}
            <tr>
              <td>{project.name}</td>
              <td class:form-helper={!project.description}>{project.description || 'No description'}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn ghost" on:click={() => editProject(project)}>Edit</button>
                  <button type="button" class="btn ghost" on:click={() => deleteProject(project.id)}>Delete</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">No projects yet. Create your first one above.</div>
  {/if}
</div>
