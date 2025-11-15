import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { history } from './history.js';
import { useAuthStore } from './hooks/useAuthStore.js';
import { useShellRefs } from './components/ShellProvider.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';

function RequireAuth({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function App() {
  const user = useAuthStore();
  const refs = useShellRefs();

  useEffect(() => {
    if (refs.userDisplay) {
      refs.userDisplay.textContent = user ? user.username : 'Guest';
    }
  }, [user, refs.userDisplay]);

  return (
    <HistoryRouter history={history}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth user={user} />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </HistoryRouter>
  );
}
