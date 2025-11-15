import { dataStore } from '@shared/dataStore.js';
import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';
import { shell } from '../ui/shell.js';

function createStatCard(label, value, helper) {
  const card = document.createElement('div');
  card.className = 'stat-card stack';
  const valueEl = document.createElement('div');
  valueEl.className = 'stat-value';
  valueEl.textContent = value;
  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;
  card.appendChild(valueEl);
  card.appendChild(labelEl);
  if (helper) {
    const helperEl = document.createElement('div');
    helperEl.className = 'stat-helper';
    helperEl.textContent = helper;
    card.appendChild(helperEl);
  }
  return card;
}

function buildUpcomingList(tasks, projectsById) {
  const list = document.createElement('div');
  list.className = 'stack';
  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'form-helper';
    empty.textContent = 'No upcoming deadlines. Enjoy the calm!';
    list.appendChild(empty);
    return list;
  }

  tasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'stack';
    const title = document.createElement('strong');
    title.textContent = task.title;
    const meta = document.createElement('span');
    meta.className = 'form-helper';
    meta.textContent = `${projectsById[task.projectId]?.name ?? 'Unknown'} • ${formatDate(
      task.deadline
    )} • ${formatRelativeDeadline(task.deadline)}`;
    item.appendChild(title);
    item.appendChild(meta);
    list.appendChild(item);
  });

  return list;
}

function render(snapshot) {
  const { projects, tasks } = snapshot;
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const urgentTasks = tasks.filter((task) => task.priority === 'urgent');
  const doneRate = tasks.length
    ? Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100)
    : 0;

  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const upcoming = tasks
    .filter((task) => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  const layout = document.createElement('div');
  layout.className = 'stack';

  const statsGrid = document.createElement('div');
  statsGrid.className = 'tag-grid';
  statsGrid.appendChild(createStatCard('Projects', projects.length, 'Total initiatives'));
  statsGrid.appendChild(createStatCard('Tasks', tasks.length, `${openTasks.length} open`));
  statsGrid.appendChild(createStatCard('Urgent tasks', urgentTasks.length));
  statsGrid.appendChild(createStatCard('Done rate', `${doneRate}%`, 'All-time completion'));

  const upcomingCard = document.createElement('div');
  upcomingCard.className = 'panel';
  const upcomingHeader = document.createElement('header');
  upcomingHeader.className = 'panel-header';
  upcomingHeader.innerHTML = '<h2 class="panel-title">Upcoming deadlines</h2>';
  const upcomingBody = document.createElement('div');
  upcomingBody.className = 'panel-body';
  upcomingBody.appendChild(buildUpcomingList(upcoming, projectsById));
  upcomingCard.appendChild(upcomingHeader);
  upcomingCard.appendChild(upcomingBody);

  layout.appendChild(statsGrid);
  layout.appendChild(upcomingCard);

  shell.setPanel({
    title: 'Welcome back',
    actions: `<span class="badge">${new Date().toLocaleDateString()}</span>`,
    body: layout
  });
}

export async function renderHomeView() {
  await shell.ready();
  shell.setRouteLabel('Home');
  shell.highlight('/home');
  shell.ensurePanel();
  render(dataStore.getSnapshot());
}
