<?php
require_once __DIR__ . '/../src/Storage.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Renderer.php';

$storage = new Storage(__DIR__ . '/../../data/store.json');
$auth = new Auth();
$renderer = new Renderer(__DIR__ . '/../../design/html/layout.html');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/home';
$path = rtrim($path, '/') ?: '/home';

$loginError = '';

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    switch ($action) {
        case 'login':
            $username = trim($_POST['username'] ?? '');
            $password = $_POST['password'] ?? '';
            if ($auth->login($username, $password)) {
                header('Location: /home');
                exit;
            }
            $loginError = 'Invalid credentials';
            break;
        case 'logout':
            $auth->logout();
            header('Location: /login');
            exit;
        case 'create_project':
        case 'update_project':
            requireAuth($auth);
            $storage->update(function ($data) use ($action) {
                $payload = [
                    'name' => trim($_POST['project_name'] ?? ''),
                    'description' => trim($_POST['project_description'] ?? ''),
                ];
                if (!$payload['name']) {
                    return $data;
                }
                if ($action === 'create_project') {
                    $payload['id'] = uniqid('proj_', true);
                    $data['projects'][] = $payload;
                } else {
                    $id = $_POST['project_id'] ?? '';
                    $data['projects'] = array_map(function ($project) use ($id, $payload) {
                        if ($project['id'] === $id) {
                            return array_merge($project, $payload);
                        }
                        return $project;
                    }, $data['projects']);
                }
                return $data;
            });
            header('Location: /projects');
            exit;
        case 'delete_project':
            requireAuth($auth);
            $storage->update(function ($data) {
                $id = $_POST['project_id'] ?? '';
                $data['projects'] = array_filter($data['projects'], fn($project) => $project['id'] !== $id);
                $data['tasks'] = array_filter($data['tasks'], fn($task) => $task['projectId'] !== $id);
                return $data;
            });
            header('Location: /projects');
            exit;
        case 'create_task':
        case 'update_task':
            requireAuth($auth);
            $storage->update(function ($data) use ($action) {
                $payload = [
                    'projectId' => $_POST['task_project'] ?? '',
                    'title' => trim($_POST['task_title'] ?? ''),
                    'description' => trim($_POST['task_description'] ?? ''),
                    'priority' => $_POST['task_priority'] ?? 'medium',
                    'status' => $_POST['task_status'] ?? 'new',
                    'deadline' => $_POST['task_deadline'] ?? ''
                ];
                if (!$payload['projectId'] || !$payload['title']) {
                    return $data;
                }
                if ($action === 'create_task') {
                    $payload['id'] = uniqid('task_', true);
                    $payload['createdAt'] = date(DATE_ATOM);
                    $data['tasks'][] = $payload;
                } else {
                    $id = $_POST['task_id'] ?? '';
                    $data['tasks'] = array_map(function ($task) use ($id, $payload) {
                        if ($task['id'] === $id) {
                            return array_merge($task, $payload);
                        }
                        return $task;
                    }, $data['tasks']);
                }
                return $data;
            });
            header('Location: /tasks');
            exit;
        case 'delete_task':
            requireAuth($auth);
            $storage->update(function ($data) {
                $id = $_POST['task_id'] ?? '';
                $data['tasks'] = array_filter($data['tasks'], fn($task) => $task['id'] !== $id);
                return $data;
            });
            header('Location: /tasks');
            exit;
        case 'change_status':
            requireAuth($auth);
            $storage->update(function ($data) {
                $id = $_POST['task_id'] ?? '';
                $status = $_POST['task_status'] ?? 'new';
                $data['tasks'] = array_map(function ($task) use ($id, $status) {
                    if ($task['id'] === $id) {
                        $task['status'] = $status;
                    }
                    return $task;
                }, $data['tasks']);
                return $data;
            });
            header('Location: /tasks');
            exit;
    }
}

$user = $auth->check();
if (!$user && $path !== '/login') {
    header('Location: /login');
    exit;
}

$data = $storage->read();

switch ($path) {
    case '/login':
        echo $renderer->render([
            'routeLabel' => 'Login',
            'panelTitle' => 'Sign in',
            'authMode' => true,
            'userLabel' => 'Guest'
        ], renderLogin($loginError));
        break;
    case '/projects':
        echo $renderer->render([
            'routeLabel' => 'Projects',
            'panelTitle' => 'Projects',
            'userLabel' => $user['username']
        ], renderProjects($data, $_GET), '<span class="badge">' . count($data['projects']) . ' total</span>', logoutScript());
        break;
    case '/tasks':
        echo $renderer->render([
            'routeLabel' => 'Tasks',
            'panelTitle' => 'Tasks',
            'userLabel' => $user['username']
        ], renderTasks($data, $_GET), '<span class="badge">' . count($data['tasks']) . ' shown</span>', logoutScript());
        break;
    case '/home':
    default:
        echo $renderer->render([
            'routeLabel' => 'Home',
            'panelTitle' => 'Welcome back',
            'userLabel' => $user['username']
        ], renderHome($data), '<span class="badge">' . date('Y-m-d') . '</span>', logoutScript());
        break;
}

function requireAuth(Auth $auth): void
{
    if (!$auth->check()) {
        header('Location: /login');
        exit;
    }
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function renderLogin(string $error): string
{
    return '<section class="auth-panel">
      <form class="form auth-form" method="post" action="/login">
        <input type="hidden" name="action" value="login" />
        <h1>Welcome back</h1>
        <p class="form-helper">Use admin / 1234 to continue.</p>
        <label class="form-field">
          <span>Username</span>
          <input type="text" name="username" required />
        </label>
        <label class="form-field">
          <span>Password</span>
          <input type="password" name="password" required />
        </label>
        ' . ($error ? '<p class="form-error">' . e($error) . '</p>' : '<p class="form-error"></p>') . '
        <button type="submit" class="btn primary w-full">Sign in</button>
      </form>
    </section>';
}

function renderHome(array $data): string
{
    $projects = $data['projects'];
    $tasks = $data['tasks'];
    $open = array_filter($tasks, fn($task) => $task['status'] !== 'done');
    $urgent = array_filter($tasks, fn($task) => $task['priority'] === 'urgent');
    $doneRate = count($tasks) ? round((count(array_filter($tasks, fn($task) => $task['status'] === 'done')) / count($tasks)) * 100) : 0;
    usort($tasks, fn($a, $b) => strtotime($a['deadline'] ?? '') <=> strtotime($b['deadline'] ?? ''));
    $upcoming = array_slice(array_filter($tasks, fn($task) => !empty($task['deadline'])), 0, 4);

    $rows = '';
    foreach ($upcoming as $task) {
        $projectName = 'Unknown';
        foreach ($projects as $project) {
            if ($project['id'] === $task['projectId']) {
                $projectName = $project['name'];
                break;
            }
        }
        $rows .= '<article class="stack">
          <strong>' . e($task['title']) . '</strong>
          <span class="form-helper">' . e($projectName) . ' • ' . e($task['deadline']) . '</span>
        </article>';
    }

    if (!$rows) {
        $rows = '<p class="form-helper">No upcoming deadlines. Enjoy the calm!</p>';
    }

    return '<div class="stack">
      <div class="tag-grid">
        <article class="stat-card stack">
          <div class="stat-value">' . count($projects) . '</div>
          <div class="stat-label">Projects</div>
          <span class="form-helper">Total initiatives</span>
        </article>
        <article class="stat-card stack">
          <div class="stat-value">' . count($tasks) . '</div>
          <div class="stat-label">Tasks</div>
          <span class="form-helper">' . count($open) . ' open</span>
        </article>
        <article class="stat-card stack">
          <div class="stat-value">' . count($urgent) . '</div>
          <div class="stat-label">Urgent tasks</div>
        </article>
        <article class="stat-card stack">
          <div class="stat-value">' . $doneRate . '%</div>
          <div class="stat-label">Done rate</div>
          <span class="form-helper">All-time completion</span>
        </article>
      </div>
      <div class="panel">
        <header class="panel-header"><h2 class="panel-title">Upcoming deadlines</h2></header>
        <div class="panel-body">' . $rows . '</div>
      </div>
    </div>';
}

function renderProjects(array $data, array $query): string
{
    $projects = $data['projects'];
    $editId = $query['edit_project'] ?? '';
    $editing = null;
    foreach ($projects as $project) {
        if ($project['id'] === $editId) {
            $editing = $project;
            break;
        }
    }
    $form = '<form class="stack form" method="post" action="/projects">
      <input type="hidden" name="action" value="' . ($editing ? 'update_project' : 'create_project') . '" />
      ' . ($editing ? '<input type="hidden" name="project_id" value="' . e($editing['id']) . '">' : '') . '
      <div class="form-field"><span>Project name</span><input type="text" name="project_name" required value="' . e($editing['name'] ?? '') . '"></div>
      <div class="form-field"><span>Description</span><textarea name="project_description" rows="3">' . e($editing['description'] ?? '') . '</textarea></div>
      <div class="toolbar"><div class="spacer"></div>' . ($editing ? '<button class="btn ghost" type="button" onclick="window.location.href=\'/projects\'">Cancel</button>' : '') . '<button class="btn primary" type="submit">' . ($editing ? 'Update project' : 'Create project') . '</button></div>
    </form>';

    $rows = '';
    foreach ($projects as $project) {
        $rows .= '<tr>
          <td>' . e($project['name']) . '</td>
          <td class="' . ($project['description'] ? '' : 'form-helper') . '">' . e($project['description'] ?: 'No description') . '</td>
          <td>
            <div class="table-actions">
              <a class="btn ghost" href="/projects?edit_project=' . e($project['id']) . '">Edit</a>
              <form method="post" action="/projects" style="display:inline">
                <input type="hidden" name="action" value="delete_project" />
                <input type="hidden" name="project_id" value="' . e($project['id']) . '" />
                <button type="submit" class="btn ghost" onclick="return confirm('Delete this project?')">Delete</button>
              </form>
            </div>
          </td>
        </tr>';
    }

    if (!$rows) {
        $rows = '<tr><td colspan="3" class="empty-state">No projects saved.</td></tr>';
    }

    return '<div class="stack">
      ' . $form . '
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
      </div>
    </div>';
}

function renderTasks(array $data, array $query): string
{
    $projects = $data['projects'];
    $tasks = $data['tasks'];
    $filters = [
        'project' => $query['project'] ?? 'all',
        'status' => $query['status'] ?? 'all',
        'priority' => $query['priority'] ?? 'all'
    ];
    $filtered = array_filter($tasks, function ($task) use ($filters) {
        if ($filters['project'] !== 'all' && $task['projectId'] !== $filters['project']) return false;
        if ($filters['status'] !== 'all' && $task['status'] !== $filters['status']) return false;
        if ($filters['priority'] !== 'all' && $task['priority'] !== $filters['priority']) return false;
        return true;
    });
    $editId = $query['edit_task'] ?? '';
    $editing = null;
    foreach ($tasks as $task) {
        if ($task['id'] === $editId) {
            $editing = $task;
            break;
        }
    }

    $projectOptions = '';
    foreach ($projects as $project) {
        $selected = $editing ? ($editing['projectId'] === $project['id'] ? 'selected' : '') : '';
        $projectOptions .= '<option value="' . e($project['id']) . '" ' . $selected . '>' . e($project['name']) . '</option>';
    }

    $form = '<form class="stack form" method="post" action="/tasks">
      <input type="hidden" name="action" value="' . ($editing ? 'update_task' : 'create_task') . '" />
      ' . ($editing ? '<input type="hidden" name="task_id" value="' . e($editing['id']) . '">' : '') . '
      <div class="form-field"><span>Project</span><select name="task_project" required>' . $projectOptions . '</select></div>
      <div class="form-field"><span>Title</span><input type="text" name="task_title" required value="' . e($editing['title'] ?? '') . '"></div>
      <div class="form-field"><span>Description</span><textarea rows="3" name="task_description">' . e($editing['description'] ?? '') . '</textarea></div>
      <div class="toolbar">
        <label class="form-field"><span>Priority</span>
          <select name="task_priority">' . priorityOptions($editing['priority'] ?? 'medium') . '</select>
        </label>
        <label class="form-field"><span>Status</span>
          <select name="task_status">' . statusOptions($editing['status'] ?? 'new') . '</select>
        </label>
        <label class="form-field"><span>Deadline</span>
          <input type="date" name="task_deadline" value="' . e($editing['deadline'] ?? '') . '">
        </label>
      </div>
      <div class="toolbar"><div class="spacer"></div>' . ($editing ? '<button class="btn ghost" type="button" onclick="window.location.href=\'/tasks\'">Cancel</button>' : '') . '<button class="btn primary" type="submit">' . ($editing ? 'Update task' : 'Create task') . '</button></div>
    </form>';

    $filterForm = '<form class="toolbar" method="get" action="/tasks">
      <select name="project"><option value="all">All projects</option>' . buildProjectFilter($projects, $filters['project']) . '</select>
      <select name="status"><option value="all">All status values</option>' . statusOptions($filters['status']) . '</select>
      <select name="priority"><option value="all">All priorities</option>' . priorityOptions($filters['priority']) . '</select>
      <button class="btn ghost" type="submit">Apply</button>
    </form>';

    $rows = '';
    foreach ($filtered as $task) {
        $projectName = 'Unknown';
        foreach ($projects as $project) {
            if ($project['id'] === $task['projectId']) {
                $projectName = $project['name'];
                break;
            }
        }
        $rows .= '<tr>
          <td><strong>' . e($task['title']) . '</strong><br><span class="form-helper">' . e($task['description'] ?: 'No details') . '</span></td>
          <td>' . e($projectName) . '</td>
          <td><span class="pill ' . priorityTone($task['priority']) . '">' . e($task['priority']) . '</span></td>
          <td>
            <form method="post" action="/tasks">
              <input type="hidden" name="action" value="change_status">
              <input type="hidden" name="task_id" value="' . e($task['id']) . '">
              <select name="task_status" class="status-select" onchange="this.form.submit()">' . statusOptions($task['status']) . '</select>
            </form>
          </td>
          <td>' . e(substr($task['createdAt'] ?? '', 0, 10)) . '</td>
          <td>' . e($task['deadline'] ?? '—') . '</td>
          <td>
            <div class="table-actions">
              <a class="btn ghost" href="/tasks?edit_task=' . e($task['id']) . '">Edit</a>
              <form method="post" action="/tasks" style="display:inline">
                <input type="hidden" name="action" value="delete_task">
                <input type="hidden" name="task_id" value="' . e($task['id']) . '">
                <button type="submit" class="btn ghost" onclick="return confirm('Delete this task?')">Delete</button>
              </form>
            </div>
          </td>
        </tr>';
    }

    if (!$rows) {
        $rows = '<tr><td colspan="7" class="empty-state">No tasks match the current filters.</td></tr>';
    }

    return '<div class="stack">' . $filterForm . ($projects ? $form : '<div class="empty-state">Create a project to add tasks.</div>') . '
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Created</th><th>Deadline</th><th></th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
      </div>
    </div>';
}

function buildProjectFilter(array $projects, string $selected): string
{
    $options = '';
    foreach ($projects as $project) {
        $options .= '<option value="' . e($project['id']) . '"' . ($selected === $project['id'] ? ' selected' : '') . '>' . e($project['name']) . '</option>';
    }
    return $options;
}

function statusOptions(string $selected): string
{
    $options = ['new' => 'New', 'in_progress' => 'In progress', 'done' => 'Done'];
    $result = '';
    foreach ($options as $value => $label) {
        $result .= '<option value="' . e($value) . '"' . ($selected === $value ? ' selected' : '') . '>' . e($label) . '</option>';
    }
    return $result;
}

function priorityOptions(string $selected): string
{
    $options = ['low' => 'Low', 'medium' => 'Medium', 'high' => 'High', 'urgent' => 'Urgent'];
    $result = '';
    foreach ($options as $value => $label) {
        $result .= '<option value="' . e($value) . '"' . ($selected === $value ? ' selected' : '') . '>' . e($label) . '</option>';
    }
    return $result;
}

function priorityTone(string $priority): string
{
    return match ($priority) {
        'urgent', 'high' => 'danger',
        'medium' => 'warning',
        default => 'success'
    };
}

function logoutScript(): string
{
      return '<script>
        document.addEventListener("DOMContentLoaded", function () {
          const btn = document.querySelector("[data-action=\\\"logout\\\"]");
          if (btn) {
            btn.addEventListener("click", function (event) {
              event.preventDefault();
              const form = document.createElement("form");
              form.method = "post";
              form.action = window.location.pathname || "/home";
              form.style.display = "none";
              const actionField = document.createElement("input");
              actionField.type = "hidden";
              actionField.name = "action";
              actionField.value = "logout";
              form.appendChild(actionField);
              document.body.appendChild(form);
              form.submit();
            });
          }
        });
      </script>';
}
