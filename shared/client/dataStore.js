import { createId } from './id.js';

const STORAGE_KEY = 'mst.todo.data';

const seedData = {
  projects: [
    {
      id: 'proj_1',
      name: 'Sample Project',
      description: 'Example description'
    }
  ],
  tasks: [
    {
      id: 'task_1',
      projectId: 'proj_1',
      title: 'Example Task',
      description: 'Something to do',
      createdAt: '2025-01-01T10:00:00.000Z',
      deadline: '2025-01-15',
      priority: 'high',
      status: 'new'
    }
  ]
};

function readState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse state, resetting', error);
    localStorage.removeItem(STORAGE_KEY);
    return readState();
  }
}

function writeState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

let cached = readState();

const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb(structuredClone(cached)));
}

export const dataStore = {
  subscribe(callback) {
    listeners.add(callback);
    callback(structuredClone(cached));
    return () => listeners.delete(callback);
  },
  getSnapshot() {
    return structuredClone(cached);
  },
  listProjects() {
    return structuredClone(cached.projects);
  },
  listTasks() {
    return structuredClone(cached.tasks);
  },
  createProject(payload) {
    cached = writeState({
      ...cached,
      projects: [
        ...cached.projects,
        { id: createId('proj'), ...payload }
      ]
    });
    notify();
  },
  updateProject(id, updates) {
    cached = writeState({
      ...cached,
      projects: cached.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      ),
      tasks: cached.tasks.map((task) =>
        task.projectId === id && updates.name
          ? { ...task, projectName: updates.name }
          : task
      )
    });
    notify();
  },
  deleteProject(id) {
    cached = writeState({
      ...cached,
      projects: cached.projects.filter((project) => project.id !== id),
      tasks: cached.tasks.filter((task) => task.projectId !== id)
    });
    notify();
  },
  createTask(payload) {
    const { status = 'new', ...rest } = payload;
    cached = writeState({
      ...cached,
      tasks: [
        ...cached.tasks,
        {
          id: createId('task'),
          createdAt: new Date().toISOString(),
          status,
          ...rest
        }
      ]
    });
    notify();
  },
  updateTask(id, updates) {
    cached = writeState({
      ...cached,
      tasks: cached.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    });
    notify();
  },
  deleteTask(id) {
    cached = writeState({
      ...cached,
      tasks: cached.tasks.filter((task) => task.id !== id)
    });
    notify();
  }
};
