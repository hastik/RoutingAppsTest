import { dataStore } from '@shared/dataStore.js';
import { shell } from '../ui/shell.js';
import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/options.js';
import { escapeHtml } from '../utils/dom.js';

const PRIORITY_WEIGHT = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3
};

const tasksState = {
  editingTaskId: null,
  filters: {
    projectId: 'all',
    status: 'all',
    priority: 'all'
  },
  sort: {
    by: 'createdAt',
    direction: 'desc'
  }
};

function sortTasks(tasks) {
  const { by, direction } = tasksState.sort;
  const factor = direction === 'asc' ? 1 : -1;
  return [...tasks].sort((a, b) => {
    if (by === 'priority') {
      return (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * factor;
    }
    const valueA = by === 'deadline' ? a.deadline : a.createdAt;
    const valueB = by === 'deadline' ? b.deadline : b.createdAt;
    return (new Date(valueA).getTime() - new Date(valueB).getTime()) * factor;
  });
}

function filterTasks(tasks) {
  return tasks.filter((task) => {
    if (tasksState.filters.projectId !== 'all' && task.projectId !== tasksState.filters.projectId) {
      return false;
    }
    if (tasksState.filters.status !== 'all' && task.status !== tasksState.filters.status) {
      return false;
    }
    if (tasksState.filters.priority !== 'all' && task.priority !== tasksState.filters.priority) {
      return false;
    }
    return true;
  });
}

function buildProjectOptions(projects, includeAll = false) {
  const base = includeAll ? '<option value="all">All projects</option>' : '';
  const options = projects
    .map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`)
    .join('');
  return base + options;
}

function buildFilters(projects) {
  const wrapper = document.createElement('div');
  wrapper.className = 'toolbar';

  const projectSelect = document.createElement('select');
  projectSelect.className = 'priority-select';
  projectSelect.innerHTML = buildProjectOptions(projects, true);
  projectSelect.value = tasksState.filters.projectId;
  projectSelect.addEventListener('change', () => {
    tasksState.filters.projectId = projectSelect.value;
    renderTasksView();
  });

  const statusSelect = document.createElement('select');
  statusSelect.className = 'status-select';
  statusSelect.innerHTML = `
    <option value="all">All status values</option>
    ${STATUS_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
  `;
  statusSelect.value = tasksState.filters.status;
  statusSelect.addEventListener('change', () => {
    tasksState.filters.status = statusSelect.value;
    renderTasksView();
  });

  const prioritySelect = document.createElement('select');
  prioritySelect.className = 'priority-select';
  prioritySelect.innerHTML = `
    <option value="all">All priorities</option>
    ${PRIORITY_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
  `;
  prioritySelect.value = tasksState.filters.priority;
  prioritySelect.addEventListener('change', () => {
    tasksState.filters.priority = prioritySelect.value;
    renderTasksView();
  });

  const sortBy = document.createElement('select');
  sortBy.innerHTML = `
    <option value="createdAt">Sort by created date</option>
    <option value="deadline">Sort by deadline</option>
    <option value="priority">Sort by priority</option>
  `;
  sortBy.value = tasksState.sort.by;
  sortBy.addEventListener('change', () => {
    tasksState.sort.by = sortBy.value;
    renderTasksView();
  });

  const sortDir = document.createElement('select');
  sortDir.innerHTML = `
    <option value="desc">Newest first</option>
    <option value="asc">Oldest first</option>
  `;
  sortDir.value = tasksState.sort.direction;
  sortDir.addEventListener('change', () => {
    tasksState.sort.direction = sortDir.value;
    renderTasksView();
  });

  wrapper.append(projectSelect, statusSelect, prioritySelect, sortBy, sortDir);
  return wrapper;
}

function buildTaskForm(projects, task) {
  const form = document.createElement('form');
  form.className = 'stack form';
  form.innerHTML = `
    <div class="form-field">
      <span>Project</span>
      <select name="projectId" required></select>
    </div>
    <div class="form-field">
      <span>Title</span>
      <input name="title" required placeholder="Task title" />
    </div>
    <div class="form-field">
      <span>Description</span>
      <textarea name="description" rows="3" placeholder="Details"></textarea>
    </div>
    <div class="toolbar">
      <label class="form-field">
        <span>Priority</span>
        <select name="priority"></select>
      </label>
      <label class="form-field">
        <span>Status</span>
        <select name="status"></select>
      </label>
      <label class="form-field">
        <span>Deadline</span>
        <input type="date" name="deadline" />
      </label>
    </div>
    <div class="toolbar">
      <div class="spacer"></div>
      ${task ? '<button type="button" class="btn ghost" data-action="cancel">Cancel</button>' : ''}
      <button type="submit" class="btn primary">${task ? 'Update task' : 'Create task'}</button>
    </div>
  `;

  const projectSelect = form.querySelector('select[name="projectId"]');
  projectSelect.innerHTML = buildProjectOptions(projects);
  projectSelect.value = task?.projectId ?? projects[0]?.id ?? '';

  const prioritySelect = form.querySelector('select[name="priority"]');
  prioritySelect.innerHTML = PRIORITY_OPTIONS.map(
    (option) => `<option value="${option.value}">${option.label}</option>`
  ).join('');
  prioritySelect.value = task?.priority ?? 'medium';

  const statusSelect = form.querySelector('select[name="status"]');
  statusSelect.innerHTML = STATUS_OPTIONS.map(
    (option) => `<option value="${option.value}">${option.label}</option>`
  ).join('');
  statusSelect.value = task?.status ?? 'new';

  form.querySelector('[name="title"]').value = task?.title ?? '';
  form.querySelector('[name="description"]').value = task?.description ?? '';
  form.querySelector('[name="deadline"]').value = task?.deadline ?? '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      projectId: formData.get('projectId'),
      title: formData.get('title').toString().trim(),
      description: formData.get('description')?.toString().trim() ?? '',
      priority: formData.get('priority'),
      status: formData.get('status'),
      deadline: formData.get('deadline') || ''
    };
    if (!payload.projectId || !payload.title) return;
    if (task) {
      dataStore.updateTask(task.id, payload);
      tasksState.editingTaskId = null;
    } else {
      dataStore.createTask(payload);
      form.reset();
    }
    renderTasksView();
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    tasksState.editingTaskId = null;
    renderTasksView();
  });

  return form;
}

function buildStatusSelect(task) {
  const select = document.createElement('select');
  select.className = 'status-select';
  STATUS_OPTIONS.forEach((option) => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  });
  select.value = task.status;
  select.addEventListener('change', () => {
    dataStore.updateTask(task.id, { status: select.value });
    renderTasksView();
  });
  return select;
}

function buildTasksTable(projects, tasks) {
  const projectLookup = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
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
  `;
  const tbody = document.createElement('tbody');
  tasks.forEach((task) => {
    const row = document.createElement('tr');
    row.dataset.id = task.id;

    const titleCell = document.createElement('td');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = task.title;
    const titleMeta = document.createElement('span');
    titleMeta.className = 'form-helper';
    titleMeta.textContent = task.description || 'No details';
    titleCell.append(titleStrong, document.createElement('br'), titleMeta);

    const projectCell = document.createElement('td');
    projectCell.textContent = projectLookup[task.projectId] ?? 'Unknown';

    const priorityCell = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = task.priority;
    if (task.priority === 'urgent' || task.priority === 'high') {
      pill.classList.add('danger');
    } else if (task.priority === 'medium') {
      pill.classList.add('warning');
    } else {
      pill.classList.add('success');
    }
    priorityCell.appendChild(pill);

    const statusCell = document.createElement('td');
    statusCell.appendChild(buildStatusSelect(task));

    const createdCell = document.createElement('td');
    createdCell.textContent = formatDate(task.createdAt);

    const deadlineCell = document.createElement('td');
    const deadlineDate = document.createElement('div');
    deadlineDate.textContent = formatDate(task.deadline);
    const deadlineMeta = document.createElement('span');
    deadlineMeta.className = 'form-helper';
    deadlineMeta.textContent = formatRelativeDeadline(task.deadline);
    deadlineCell.append(deadlineDate, deadlineMeta);

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

    row.append(
      titleCell,
      projectCell,
      priorityCell,
      statusCell,
      createdCell,
      deadlineCell,
      actionsCell
    );
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
      tasksState.editingTaskId = id;
      renderTasksView();
    }
    if (button.dataset.action === 'delete') {
      if (confirm('Delete this task?')) {
        dataStore.deleteTask(id);
        if (tasksState.editingTaskId === id) tasksState.editingTaskId = null;
        renderTasksView();
      }
    }
  });

  wrapper.appendChild(table);
  return wrapper;
}

export async function renderTasksView() {
  await shell.ready();
  const snapshot = dataStore.getSnapshot();
  const filtered = sortTasks(filterTasks(snapshot.tasks));
  const task = snapshot.tasks.find((item) => item.id === tasksState.editingTaskId);
  const body = document.createElement('div');
  body.className = 'stack';

  body.appendChild(buildFilters(snapshot.projects));
  if (snapshot.projects.length) {
    body.appendChild(buildTaskForm(snapshot.projects, task));
  } else {
    const warn = document.createElement('div');
    warn.className = 'empty-state';
    warn.textContent = 'Create a project first to start assigning tasks.';
    body.appendChild(warn);
  }

  if (filtered.length) {
    body.appendChild(buildTasksTable(snapshot.projects, filtered));
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks match the current filters.';
    body.appendChild(empty);
  }

  shell.setRouteLabel('Tasks');
  shell.highlight('/tasks');
  shell.setPanel({
    title: 'Tasks',
    actions: `<span class="badge">${filtered.length} shown</span>`,
    body
  });
}
