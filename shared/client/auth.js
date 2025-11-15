const AUTH_KEY = 'mst.todo.auth';
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = '1234';

let user = readAuth();
const listeners = new Set();

function readAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Invalid auth cache, clearing', error);
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

function persist(nextUser) {
  if (nextUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
  user = nextUser;
  listeners.forEach((cb) => cb(user));
}

export const authService = {
  getUser() {
    return user;
  },
  isAuthenticated() {
    return Boolean(user);
  },
  login(username, password) {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const account = { username, loggedInAt: new Date().toISOString() };
      persist(account);
      return { ok: true, account };
    }
    return { ok: false, error: 'Invalid credentials' };
  },
  logout() {
    persist(null);
  },
  subscribe(callback) {
    listeners.add(callback);
    callback(user);
    return () => listeners.delete(callback);
  }
};
