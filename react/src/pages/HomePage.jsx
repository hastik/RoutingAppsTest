import { PanelActionsPortal } from '../components/ShellProvider.jsx';
import { useDataStore } from '../hooks/useDataStore.js';
import { useRouteMeta } from '../hooks/useRouteMeta.js';
import { useAuthMode } from '../hooks/useAuthMode.js';
import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';

export function HomePage() {
  useAuthMode(false);
  useRouteMeta({ title: 'Welcome back', label: 'Home', path: '/home' });
  const snapshot = useDataStore();
  const { projects, tasks } = snapshot;
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const urgentTasks = tasks.filter((task) => task.priority === 'urgent');
  const doneRate = tasks.length ? Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100) : 0;
  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const upcoming = tasks
    .filter((task) => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  return (
    <div className="stack">
      <PanelActionsPortal>
        <span className="badge">{new Date().toLocaleDateString()}</span>
      </PanelActionsPortal>
      <div className="tag-grid">
        <StatCard label="Projects" value={projects.length} helper="Total initiatives" />
        <StatCard label="Tasks" value={tasks.length} helper={`${openTasks.length} open`} />
        <StatCard label="Urgent tasks" value={urgentTasks.length} />
        <StatCard label="Done rate" value={`${doneRate}%`} helper="All-time completion" />
      </div>
      <div className="panel">
        <header className="panel-header">
          <h2 className="panel-title">Upcoming deadlines</h2>
        </header>
        <div className="panel-body">
          {upcoming.length ? (
            <div className="stack">
              {upcoming.map((task) => (
                <article key={task.id} className="stack">
                  <strong>{task.title}</strong>
                  <span className="form-helper">
                    {projectsById[task.projectId]?.name ?? 'Unknown'} • {formatDate(task.deadline)} • {formatRelativeDeadline(task.deadline)}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="form-helper">No upcoming deadlines. Enjoy the calm!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card stack">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {helper && <div className="form-helper">{helper}</div>}
    </div>
  );
}
