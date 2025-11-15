import { useEffect, useMemo, useState } from 'react';
import { dataStore } from '@shared/dataStore.js';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/options.js';
import { formatDate, formatRelativeDeadline } from '@shared/formatters.js';
import { PanelActionsPortal } from '../components/ShellProvider.jsx';
import { useDataStore } from '../hooks/useDataStore.js';
import { useRouteMeta } from '../hooks/useRouteMeta.js';
import { useAuthMode } from '../hooks/useAuthMode.js';

const PRIORITY_WEIGHT = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3
};

export function TasksPage() {
  useAuthMode(false);
  useRouteMeta({ title: 'Tasks', label: 'Tasks', path: '/tasks' });
  const snapshot = useDataStore();
  const [filters, setFilters] = useState({ projectId: 'all', status: 'all', priority: 'all' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const editingTask = useMemo(() => snapshot.tasks.find((task) => task.id === editingId) ?? null, [snapshot.tasks, editingId]);
  const [formState, setFormState] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'new',
    deadline: ''
  });

  useEffect(() => {
    if (editingTask) {
      setFormState({
        projectId: editingTask.projectId,
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        deadline: editingTask.deadline || ''
      });
    } else {
      setFormState((prev) => ({
        ...prev,
        projectId: snapshot.projects[0]?.id ?? '',
        title: '',
        description: '',
        priority: 'medium',
        status: 'new',
        deadline: ''
      }));
    }
  }, [editingTask, snapshot.projects]);

  const filteredTasks = useMemo(() => {
    return snapshot.tasks
      .filter((task) => {
        if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
        if (filters.status !== 'all' && task.status !== filters.status) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'priority') {
          return (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * direction;
        }
        const field = sortBy === 'deadline' ? 'deadline' : 'createdAt';
        return (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * direction;
      });
  }, [snapshot.tasks, filters, sortBy, sortDirection]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (event) => {
    const { name, value } = event.target;
    if (name === 'sortBy') setSortBy(value);
    if (name === 'sortDirection') setSortDirection(value);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.projectId || !formState.title.trim()) return;
    const payload = {
      projectId: formState.projectId,
      title: formState.title.trim(),
      description: formState.description.trim(),
      priority: formState.priority,
      status: formState.status,
      deadline: formState.deadline
    };
    if (editingTask) {
      dataStore.updateTask(editingTask.id, payload);
      setEditingId(null);
    } else {
      dataStore.createTask(payload);
      setFormState((prev) => ({
        ...prev,
        title: '',
        description: '',
        deadline: ''
      }));
    }
  };

  const updateTaskStatus = (taskId, status) => {
    dataStore.updateTask(taskId, { status });
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Delete this task?')) {
      dataStore.deleteTask(taskId);
      if (editingId === taskId) {
        setEditingId(null);
      }
    }
  };

  const disableForm = snapshot.projects.length === 0;

  return (
    <div className="stack">
      <PanelActionsPortal>
        <span className="badge">{filteredTasks.length} shown</span>
      </PanelActionsPortal>

      <div className="toolbar">
        <select name="projectId" className="priority-select" value={filters.projectId} onChange={handleFilterChange}>
          <option value="all">All projects</option>
          {snapshot.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select name="status" className="status-select" value={filters.status} onChange={handleFilterChange}>
          <option value="all">All status values</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="priority" className="priority-select" value={filters.priority} onChange={handleFilterChange}>
          <option value="all">All priorities</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="sortBy" value={sortBy} onChange={handleSortChange}>
          <option value="createdAt">Sort by created date</option>
          <option value="deadline">Sort by deadline</option>
          <option value="priority">Sort by priority</option>
        </select>
        <select name="sortDirection" value={sortDirection} onChange={handleSortChange}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {disableForm ? (
        <div className="empty-state">Create a project to start assigning tasks.</div>
      ) : (
        <form className="stack form" onSubmit={handleSubmit}>
          <div className="form-field">
            <span>Project</span>
            <select name="projectId" value={formState.projectId} onChange={handleFormChange} required>
              {snapshot.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <span>Title</span>
            <input name="title" value={formState.title} onChange={handleFormChange} required placeholder="Task title" />
          </div>
          <div className="form-field">
            <span>Description</span>
            <textarea name="description" rows="3" value={formState.description} onChange={handleFormChange} placeholder="Details" />
          </div>
          <div className="toolbar">
            <label className="form-field">
              <span>Priority</span>
              <select name="priority" value={formState.priority} onChange={handleFormChange}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Status</span>
              <select name="status" value={formState.status} onChange={handleFormChange}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Deadline</span>
              <input type="date" name="deadline" value={formState.deadline} onChange={handleFormChange} />
            </label>
          </div>
          <div className="toolbar">
            <div className="spacer" />
            {editingTask && (
              <button type="button" className="btn ghost" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn primary">
              {editingTask ? 'Update task' : 'Create task'}
            </button>
          </div>
        </form>
      )}

      {filteredTasks.length ? (
        <div className="table-scroll">
          <table className="table">
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
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    <br />
                    <span className="form-helper">{task.description || 'No details'}</span>
                  </td>
                  <td>{snapshot.projects.find((p) => p.id === task.projectId)?.name ?? 'Unknown'}</td>
                  <td>
                    <span className={`pill ${priorityTone(task.priority)}`}>{task.priority}</span>
                  </td>
                  <td>
                    <select className="status-select" value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(task.createdAt)}</td>
                  <td>
                    <div>{formatDate(task.deadline)}</div>
                    <span className="form-helper">{formatRelativeDeadline(task.deadline)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn ghost" onClick={() => setEditingId(task.id)}>
                        Edit
                      </button>
                      <button type="button" className="btn ghost" onClick={() => deleteTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No tasks match the current filters.</div>
      )}
    </div>
  );
}

function priorityTone(priority) {
  if (priority === 'urgent' || priority === 'high') return 'danger';
  if (priority === 'medium') return 'warning';
  return 'success';
}
