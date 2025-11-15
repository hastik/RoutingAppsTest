import { useEffect, useMemo, useState } from 'react';
import { dataStore } from '@shared/dataStore.js';
import { PanelActionsPortal } from '../components/ShellProvider.jsx';
import { useDataStore } from '../hooks/useDataStore.js';
import { useRouteMeta } from '../hooks/useRouteMeta.js';
import { useAuthMode } from '../hooks/useAuthMode.js';

export function ProjectsPage() {
  useAuthMode(false);
  useRouteMeta({ title: 'Projects', label: 'Projects', path: '/projects' });
  const snapshot = useDataStore();
  const [editingId, setEditingId] = useState(null);
  const editingProject = useMemo(() => snapshot.projects.find((p) => p.id === editingId) ?? null, [snapshot.projects, editingId]);
  const [formState, setFormState] = useState({ name: '', description: '' });

  useEffect(() => {
    setFormState({
      name: editingProject?.name ?? '',
      description: editingProject?.description ?? ''
    });
  }, [editingProject]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.name.trim()) return;
    if (editingProject) {
      dataStore.updateProject(editingProject.id, {
        name: formState.name.trim(),
        description: formState.description.trim()
      });
      setEditingId(null);
    } else {
      dataStore.createProject({
        name: formState.name.trim(),
        description: formState.description.trim()
      });
      setFormState({ name: '', description: '' });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this project? Tasks attached will also be removed.')) {
      dataStore.deleteProject(id);
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  return (
    <div className="stack">
      <PanelActionsPortal>
        <span className="badge">{snapshot.projects.length} total</span>
      </PanelActionsPortal>
      <form className="stack form" onSubmit={handleSubmit}>
        <div className="form-field">
          <span>Project name</span>
          <input name="name" value={formState.name} onChange={handleChange} required placeholder="e.g. Mobile revamp" />
        </div>
        <div className="form-field">
          <span>Description</span>
          <textarea name="description" rows="3" value={formState.description} onChange={handleChange} placeholder="Optional context" />
        </div>
        <div className="toolbar">
          <div className="spacer" />
          {editingProject && (
            <button type="button" className="btn ghost" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn primary">
            {editingProject ? 'Update project' : 'Create project'}
          </button>
        </div>
      </form>

      {snapshot.projects.length ? (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td className={project.description ? '' : 'form-helper'}>
                    {project.description || 'No description'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn ghost" onClick={() => setEditingId(project.id)}>
                        Edit
                      </button>
                      <button type="button" className="btn ghost" onClick={() => handleDelete(project.id)}>
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
        <div className="empty-state">No projects yet. Create your first one above.</div>
      )}
    </div>
  );
}
