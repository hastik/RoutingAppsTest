import { dataStore } from '@shared/dataStore.js';
import { shell } from '../ui/shell.js';

let editingProjectId = null;

function buildForm(project) {
  const form = document.createElement('form');
  form.className = 'stack form';
  form.innerHTML = `
    <div class="form-field">
      <span>Project name</span>
      <input name="name" required placeholder="e.g. Mobile revamp" />
    </div>
    <div class="form-field">
      <span>Description</span>
      <textarea name="description" rows="3" placeholder="Optional context"></textarea>
    </div>
    <div class="toolbar">
      <div class="spacer"></div>
      ${project ? '<button type="button" class="btn ghost" data-action="cancel">Cancel</button>' : ''}
      <button type="submit" class="btn primary">${project ? 'Update project' : 'Create project'}</button>
    </div>
  `;

  form.querySelector('[name="name"]').value = project?.name ?? '';
  form.querySelector('[name="description"]').value = project?.description ?? '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name').toString().trim(),
      description: formData.get('description')?.toString().trim() ?? ''
    };
    if (!payload.name) {
      return;
    }
    if (project) {
      dataStore.updateProject(project.id, payload);
      editingProjectId = null;
    } else {
      dataStore.createProject(payload);
      form.reset();
    }
    renderProjectsView();
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    editingProjectId = null;
    renderProjectsView();
  });

  return form;
}

function buildTable(projects) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';

  const table = document.createElement('table');
  table.className = 'table';
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Description</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  projects.forEach((project) => {
    const row = document.createElement('tr');
    row.dataset.id = project.id;

    const nameCell = document.createElement('td');
    nameCell.textContent = project.name;

    const descCell = document.createElement('td');
    descCell.textContent = project.description || 'No description';
    descCell.classList.toggle('form-helper', !project.description);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'table-actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn ghost';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = 'Edit';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn ghost';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.textContent = 'Delete';
    actions.append(editBtn, deleteBtn);
    actionsCell.appendChild(actions);

    row.append(nameCell, descCell, actionsCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  table.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('tr[data-id]');
    const id = row?.dataset.id;
    if (!id) return;
    if (button.dataset.action === 'edit') {
      editingProjectId = id;
      renderProjectsView();
    }
    if (button.dataset.action === 'delete') {
      if (confirm('Delete this project? Tasks linked to it will also go.')) {
        dataStore.deleteProject(id);
        if (editingProjectId === id) editingProjectId = null;
        renderProjectsView();
      }
    }
  });

  wrapper.appendChild(table);
  return wrapper;
}

export async function renderProjectsView() {
  await shell.ready();
  const snapshot = dataStore.getSnapshot();
  const project = snapshot.projects.find((item) => item.id === editingProjectId);
  const body = document.createElement('div');
  body.className = 'stack';

  body.appendChild(buildForm(project));
  if (snapshot.projects.length) {
    body.appendChild(buildTable(snapshot.projects));
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No projects yet. Create your first one above.';
    body.appendChild(empty);
  }

  shell.setRouteLabel('Projects');
  shell.highlight('/projects');
  shell.setPanel({
    title: 'Projects',
    actions: `<span class="badge">${snapshot.projects.length} total</span>`,
    body
  });
}
