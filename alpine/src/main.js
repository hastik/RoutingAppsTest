import Alpine from 'alpinejs';
import { authService } from '@shared/auth.js';
import { dataStore } from '@shared/dataStore.js';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/options.js';
import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';

const normalize = (path) => {
  if (!path.startsWith('/')) return `/${path}`;
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
};

const getPanelTemplate = () => `
  <div x-show="route === '/login'" class="auth-panel">
    <form class="form auth-form" x-on:submit.prevent="submitLogin()">
      <h1>Welcome back</h1>
      <p class="form-helper">Use admin / 1234 to continue.</p>
      <label class="form-field">
        <span>Username</span>
        <input x-model="loginForm.username" autocomplete="username" required />
      </label>
      <label class="form-field">
        <span>Password</span>
        <input type="password" x-model="loginForm.password" autocomplete="current-password" required />
      </label>
      <p class="form-error" x-text="loginForm.error"></p>
      <button type="submit" class="btn primary w-full">Sign in</button>
    </form>
  </div>
  <div x-show="route !== '/login'" class="stack">
    <template x-if="route === '/home'">
      <section class="stack">
        <div class="tag-grid">
          <article class="stat-card stack">
            <div class="stat-value" x-text="projects.length"></div>
            <div class="stat-label">Projects</div>
            <span class="form-helper">Total initiatives</span>
          </article>
          <article class="stat-card stack">
            <div class="stat-value" x-text="tasks.length"></div>
            <div class="stat-label">Tasks</div>
            <span class="form-helper" x-text="openTasksCount() + ' open'"></span>
          </article>
          <article class="stat-card stack">
            <div class="stat-value" x-text="urgentTasksCount()"></div>
            <div class="stat-label">Urgent tasks</div>
          </article>
          <article class="stat-card stack">
            <div class="stat-value" x-text="doneRate() + '%' "></div>
            <div class="stat-label">Done rate</div>
            <span class="form-helper">All-time completion</span>
          </article>
        </div>
        <div class="panel">
          <header class="panel-header">
            <h2 class="panel-title">Upcoming deadlines</h2>
          </header>
          <div class="panel-body">
            <template x-if="upcomingTasks().length">
              <div class="stack">
                <template x-for="task in upcomingTasks()" :key="task.id">
                  <article class="stack">
                    <strong x-text="task.title"></strong>
                    <span class="form-helper" x-text="projectName(task.projectId) + ' • ' + formatDateValue(task.deadline) + ' • ' + formatDeadline(task.deadline)"></span>
                  </article>
                </template>
              </div>
            </template>
            <template x-if="!upcomingTasks().length">
              <p class="form-helper">No upcoming deadlines. Enjoy the calm!</p>
            </template>
          </div>
        </div>
      </section>
    </template>

    <template x-if="route === '/projects'">
      <section class="stack">
        <form class="stack form" x-on:submit.prevent="saveProject()">
          <div class="form-field">
            <span>Project name</span>
            <input x-model="projectForm.name" required placeholder="e.g. Mobile revamp" />
          </div>
          <div class="form-field">
            <span>Description</span>
            <textarea rows="3" x-model="projectForm.description" placeholder="Optional context"></textarea>
          </div>
          <div class="toolbar">
            <div class="spacer"></div>
            <template x-if="projectForm.editingId">
              <button type="button" class="btn ghost" x-on:click="resetProjectForm()">Cancel</button>
            </template>
            <button type="submit" class="btn primary" x-text="projectForm.editingId ? 'Update project' : 'Create project'"></button>
          </div>
        </form>

        <template x-if="projects.length">
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
                <template x-for="project in projects" :key="project.id">
                  <tr>
                    <td x-text="project.name"></td>
                    <td>
                      <span x-text="project.description || 'No description'" :class="{'form-helper': !project.description}"></span>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn ghost" x-on:click="editProject(project.id)">Edit</button>
                        <button type="button" class="btn ghost" x-on:click="deleteProject(project.id)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
        <template x-if="!projects.length">
          <div class="empty-state">No projects yet. Create your first one above.</div>
        </template>
      </section>
    </template>

    <template x-if="route === '/tasks'">
      <section class="stack">
        <div class="toolbar">
          <select class="priority-select" x-model="filters.projectId">
            <option value="all">All projects</option>
            <template x-for="project in projects" :key="project.id">
              <option :value="project.id" x-text="project.name"></option>
            </template>
          </select>
          <select class="status-select" x-model="filters.status">
            <option value="all">All status values</option>
            <template x-for="status in statusOptions" :key="status.value">
              <option :value="status.value" x-text="status.label"></option>
            </template>
          </select>
          <select class="priority-select" x-model="filters.priority">
            <option value="all">All priorities</option>
            <template x-for="priority in priorityOptions" :key="priority.value">
              <option :value="priority.value" x-text="priority.label"></option>
            </template>
          </select>
          <select x-model="sort.by">
            <option value="createdAt">Sort by created date</option>
            <option value="deadline">Sort by deadline</option>
            <option value="priority">Sort by priority</option>
          </select>
          <select x-model="sort.direction">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        <template x-if="projects.length">
          <form class="stack form" x-on:submit.prevent="saveTask()">
            <div class="form-field">
              <span>Project</span>
              <select x-model="taskForm.projectId" required>
                <template x-for="project in projects" :key="project.id">
                  <option :value="project.id" x-text="project.name"></option>
                </template>
              </select>
            </div>
            <div class="form-field">
              <span>Title</span>
              <input x-model="taskForm.title" required placeholder="Task title" />
            </div>
            <div class="form-field">
              <span>Description</span>
              <textarea rows="3" x-model="taskForm.description" placeholder="Details"></textarea>
            </div>
            <div class="toolbar">
              <label class="form-field">
                <span>Priority</span>
                <select x-model="taskForm.priority">
                  <template x-for="priority in priorityOptions" :key="priority.value">
                    <option :value="priority.value" x-text="priority.label"></option>
                  </template>
                </select>
              </label>
              <label class="form-field">
                <span>Status</span>
                <select x-model="taskForm.status">
                  <template x-for="status in statusOptions" :key="status.value">
                    <option :value="status.value" x-text="status.label"></option>
                  </template>
                </select>
              </label>
              <label class="form-field">
                <span>Deadline</span>
                <input type="date" x-model="taskForm.deadline" />
              </label>
            </div>
            <div class="toolbar">
              <div class="spacer"></div>
              <template x-if="taskForm.editingId">
                <button type="button" class="btn ghost" x-on:click="resetTaskForm()">Cancel</button>
              </template>
              <button type="submit" class="btn primary" x-text="taskForm.editingId ? 'Update task' : 'Create task'"></button>
            </div>
          </form>
        </template>
        <template x-if="!projects.length">
          <div class="empty-state">Create a project first to start assigning tasks.</div>
        </template>

        <template x-if="filteredTasks().length">
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
                <template x-for="task in filteredTasks()" :key="task.id">
                  <tr>
                    <td>
                      <strong x-text="task.title"></strong>
                      <br />
                      <span class="form-helper" x-text="task.description || 'No details'"></span>
                    </td>
                    <td x-text="projectName(task.projectId)"></td>
                    <td>
                      <span class="pill" :class="priorityClass(task.priority)" x-text="task.priority"></span>
                    </td>
                    <td>
                      <select class="status-select" x-model="task.status" x-on:change="changeTaskStatus(task.id, task.status)">
                        <template x-for="status in statusOptions" :key="status.value">
                          <option :value="status.value" x-text="status.label"></option>
                        </template>
                      </select>
                    </td>
                    <td x-text="formatDateValue(task.createdAt)"></td>
                    <td>
                      <div x-text="formatDateValue(task.deadline)"></div>
                      <span class="form-helper" x-text="formatDeadline(task.deadline)"></span>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn ghost" x-on:click="editTask(task.id)">Edit</button>
                        <button type="button" class="btn ghost" x-on:click="deleteTask(task.id)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
        <template x-if="!filteredTasks().length">
          <div class="empty-state">No tasks match the current filters.</div>
        </template>
      </section>
    </template>
  </div>
`;

function setupBindings({ appShellEl, routeLabelEl, panelTitleEl, userDisplayEl, logoutButton, sidebarLinks, panelActionsEl, panelBodyEl }) {
  appShellEl.setAttribute('x-data', 'appShell()');
  appShellEl.setAttribute('x-init', 'init()');
  routeLabelEl?.setAttribute('x-text', 'routeLabel');
  panelTitleEl?.setAttribute('x-text', 'panelTitle');
  userDisplayEl?.setAttribute('x-text', "user ? user.username : 'Guest'");
  logoutButton?.setAttribute('x-on:click.prevent', 'logout()');
  sidebarLinks?.forEach((link) => {
    const path = link.getAttribute('href');
    link.setAttribute('x-on:click.prevent', `navigate('${path}')`);
    link.setAttribute(':class', `{'is-active': route === '${path}'}`);
  });
  panelActionsEl.innerHTML = `
    <template x-if="route === '/home'">
      <span class="badge" x-text="currentDate"></span>
    </template>
    <template x-if="route === '/projects'">
      <span class="badge" x-text="projects.length + ' total'"></span>
    </template>
    <template x-if="route === '/tasks'">
      <span class="badge" x-text="filteredTasks().length + ' shown'"></span>
    </template>
  `;
  panelBodyEl.innerHTML = getPanelTemplate();
}

const appShell = () => ({
  route: normalize(window.location.pathname || '/home'),
  panelTitle: 'Welcome',
  routeLabel: 'Home',
  projects: dataStore.listProjects(),
  tasks: dataStore.listTasks(),
  filters: { projectId: 'all', status: 'all', priority: 'all' },
  sort: { by: 'createdAt', direction: 'desc' },
  projectForm: { name: '', description: '', editingId: null },
  taskForm: { projectId: '', title: '', description: '', priority: 'medium', status: 'new', deadline: '', editingId: null },
  loginForm: { username: '', password: '', error: '' },
  user: authService.getUser(),
  priorityOptions: PRIORITY_OPTIONS,
  statusOptions: STATUS_OPTIONS,
  init() {
    this.ensureTaskProject();
    this.updateMeta();
    this.unsubscribeData = dataStore.subscribe((snapshot) => {
      this.projects = snapshot.projects;
      this.tasks = snapshot.tasks;
      this.ensureTaskProject();
    });
    this.unsubscribeAuth = authService.subscribe((user) => {
      this.user = user;
      if (!user) {
        this.navigate('/login', true);
      }
    });
    window.addEventListener('popstate', () => this.navigate(window.location.pathname, true));
    document.body.classList.toggle('auth-mode', this.route === '/login');
  },
  destroy() {
    this.unsubscribeData?.();
    this.unsubscribeAuth?.();
  },
  ensureTaskProject() {
    if (!this.taskForm.projectId && this.projects.length) {
      this.taskForm.projectId = this.projects[0].id;
    }
  },
  currentDate() {
    return new Date().toLocaleDateString();
  },
  openTasksCount() {
    return this.tasks.filter((task) => task.status !== 'done').length;
  },
  urgentTasksCount() {
    return this.tasks.filter((task) => task.priority === 'urgent').length;
  },
  doneRate() {
    if (!this.tasks.length) return 0;
    return Math.round((this.tasks.filter((task) => task.status === 'done').length / this.tasks.length) * 100);
  },
  upcomingTasks() {
    return this.tasks
      .filter((task) => task.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);
  },
  projectName(id) {
    return this.projects.find((project) => project.id === id)?.name ?? 'Unknown';
  },
  filteredTasks() {
    return this.tasks
      .filter((task) => {
        if (this.filters.projectId !== 'all' && task.projectId !== this.filters.projectId) return false;
        if (this.filters.status !== 'all' && task.status !== this.filters.status) return false;
        if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = this.sort.direction === 'asc' ? 1 : -1;
        if (this.sort.by === 'priority') {
          return (PRIORITY_OPTIONS.findIndex((option) => option.value === a.priority) - PRIORITY_OPTIONS.findIndex((option) => option.value === b.priority)) * direction;
        }
        const key = this.sort.by === 'deadline' ? 'deadline' : 'createdAt';
        return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction;
      });
  },
  priorityClass(priority) {
    if (priority === 'urgent' || priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'success';
  },
  formatDateValue(value) {
    return formatDate(value);
  },
  formatDeadline(value) {
    return formatRelativeDeadline(value);
  },
  navigate(path, replace = false) {
    const target = normalize(path);
    if (!this.user && target !== '/login') {
      this.route = '/login';
      history.replaceState({}, '', '/login');
      this.updateMeta();
      document.body.classList.add('auth-mode');
      return;
    }
    if (replace) {
      history.replaceState({}, '', target);
    } else {
      history.pushState({}, '', target);
    }
    this.route = target;
    this.updateMeta();
    document.body.classList.toggle('auth-mode', target === '/login');
  },
  updateMeta() {
    if (this.route === '/projects') {
      this.panelTitle = 'Projects';
      this.routeLabel = 'Projects';
    } else if (this.route === '/tasks') {
      this.panelTitle = 'Tasks';
      this.routeLabel = 'Tasks';
    } else if (this.route === '/login') {
      this.panelTitle = 'Sign in';
      this.routeLabel = 'Login';
    } else {
      this.panelTitle = 'Welcome back';
      this.routeLabel = 'Home';
    }
  },
  submitLogin() {
    const result = authService.login(this.loginForm.username.trim(), this.loginForm.password);
    if (result.ok) {
      this.loginForm.error = '';
      this.navigate('/home', true);
    } else {
      this.loginForm.error = result.error ?? 'Invalid credentials';
    }
  },
  logout() {
    authService.logout();
    this.navigate('/login', true);
  },
  saveProject() {
    if (!this.projectForm.name.trim()) return;
    if (this.projectForm.editingId) {
      dataStore.updateProject(this.projectForm.editingId, {
        name: this.projectForm.name.trim(),
        description: this.projectForm.description.trim()
      });
    } else {
      dataStore.createProject({
        name: this.projectForm.name.trim(),
        description: this.projectForm.description.trim()
      });
    }
    this.resetProjectForm();
  },
  editProject(id) {
    const project = this.projects.find((item) => item.id === id);
    if (!project) return;
    this.projectForm = {
      name: project.name,
      description: project.description ?? '',
      editingId: project.id
    };
  },
  resetProjectForm() {
    this.projectForm = { name: '', description: '', editingId: null };
  },
  deleteProject(id) {
    if (confirm('Delete this project? Tasks linked to it will also be removed.')) {
      dataStore.deleteProject(id);
      if (this.projectForm.editingId === id) this.resetProjectForm();
      if (this.taskForm.projectId === id) this.taskForm.projectId = this.projects[0]?.id ?? '';
    }
  },
  saveTask() {
    if (!this.taskForm.projectId || !this.taskForm.title.trim()) return;
    const payload = {
      projectId: this.taskForm.projectId,
      title: this.taskForm.title.trim(),
      description: this.taskForm.description.trim(),
      priority: this.taskForm.priority,
      status: this.taskForm.status,
      deadline: this.taskForm.deadline
    };
    if (this.taskForm.editingId) {
      dataStore.updateTask(this.taskForm.editingId, payload);
    } else {
      dataStore.createTask(payload);
    }
    this.resetTaskForm();
  },
  editTask(id) {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) return;
    this.taskForm = {
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline || '',
      editingId: task.id
    };
  },
  resetTaskForm() {
    this.taskForm = {
      projectId: this.projects[0]?.id ?? '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'new',
      deadline: '',
      editingId: null
    };
  },
  deleteTask(id) {
    if (confirm('Delete this task?')) {
      dataStore.deleteTask(id);
      if (this.taskForm.editingId === id) this.resetTaskForm();
    }
  },
  changeTaskStatus(id, status) {
    dataStore.updateTask(id, { status });
  }
});

async function bootstrap() {
  const response = await fetch('/design/html/layout.html', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load shared layout');
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  document.title = doc.title || document.title;
  document.head.querySelectorAll('link[data-shared-style]').forEach((node) => node.remove());
  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const cloned = link.cloneNode(true);
    cloned.dataset.sharedStyle = 'true';
    document.head.appendChild(cloned);
  });

  document.body.innerHTML = doc.body.innerHTML;

  const refs = {
    appShellEl: document.querySelector('.app-shell'),
    routeLabelEl: document.querySelector('[data-slot="route-label"]'),
    panelTitleEl: document.querySelector('.panel-title'),
    userDisplayEl: document.querySelector('[data-slot="user-display"]'),
    logoutButton: document.querySelector('[data-action="logout"]'),
    sidebarLinks: Array.from(document.querySelectorAll('.sidebar-link')),
    panelActionsEl: document.querySelector('[data-slot="panel-actions"]'),
    panelBodyEl: document.querySelector('[data-slot="panel-body"]')
  };

  setupBindings(refs);

  window.Alpine = Alpine;
  document.addEventListener('alpine:init', () => {
    Alpine.data('appShell', appShell);
  });
  Alpine.start();
}

bootstrap().catch((error) => {
  console.error(error);
  const pre = document.createElement('pre');
  pre.textContent = `Alpine stack failed to boot: ${error.message}`;
  document.body.appendChild(pre);
});
