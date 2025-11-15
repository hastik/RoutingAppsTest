# Multi-Stack TODO Routing Showcase

A comparative playground that implements the same authenticated TODO manager across multiple technology stacks inside a single repository. Every implementation renders the identical HTML skeleton from `design/html/layout.html`, consumes the shared styles in `design/css`, and fulfils the same functional contract:

- Mandatory login at `/login` (`admin` / `1234`).
- Authenticated routes for `/home`, `/projects`, `/tasks` with real URL changes.
- Sidebar navigation that keeps URLs in sync.
- Projects CRUD and tasks CRUD (with filtering, sorting, and status changes).
- Persistence via JSON files for server stacks and `localStorage` for client stacks.

## Repository Structure

```
/design
  /html/layout.html        <-- canonical markup (header, sidebar, main slot)
  /css/base.css
  /css/components.css
  /css/responsive.css
/js-vanilla                <-- History API router + localStorage state
/alpine                    <-- Alpine.js SPA binding to shared DOM
/svelte                    <-- Svelte SPA compiled via Vite
/react                     <-- React + Vite SPA
/kwik                      <-- Qwik City style file-based routing
/php-vanilla               <-- PHP router serving layout + JSON persistence
/nette                     <-- Nette Framework mini app sharing JSON store
```

Each folder exposes its own README (or `package.json`/`composer.json`) with framework-specific setup commands, yet they all:

1. Import the shared layout and CSS (never duplicate structure).
2. Extend the `<main id="app-main">` slot with stack-specific render logic.
3. Conform to the shared data schema:

```json
{
  "projects": [
    { "id": "proj_1", "name": "Sample Project", "description": "Example" }
  ],
  "tasks": [
    {
      "id": "task_1",
      "projectId": "proj_1",
      "title": "Example Task",
      "description": "Something to do",
      "createdAt": "2025-01-01T10:00:00Z",
      "deadline": "2025-01-15",
      "priority": "high",
      "status": "new"
    }
  ]
}
```

## Development Workflow

1. **Install dependencies per stack**
   - Front-end stacks rely on `pnpm` (preferred), `npm`, or `yarn`.
   - PHP / Nette stacks rely on Composer and PHP 8.2+.

2. **Serve from repository root** so absolute references like `/design/css/base.css` resolve for every implementation. When using Vite / PHP built-in servers, configure the public root to `/workspace`.

3. **Shared authentication helper** – every stack should import `admin` / `1234` credentials and redirect unauthenticated visitors to `/login`.

4. **Data persistence**
   - Client stacks: wrapper over `window.localStorage` that seeds with the JSON above when empty.
   - Server stacks: JSON lives at `data/store.json`. Requests mutate the file atomically.

5. **Routing**
   - SPA stacks use History API (or framework router) to map `/login`, `/home`, `/projects`, `/tasks`.
   - Server stacks register equivalent routes and render the shared layout with SSR templates.

## Running stacks

| Stack         | Dev command                                | Notes |
| ------------- | ------------------------------------------ | ----- |
| JS Vanilla    | `cd js-vanilla && pnpm install && pnpm dev` | Uses Vite for convenience |
| Alpine        | `cd alpine && pnpm install && pnpm dev`     | Alpine + Vite |
| React         | `cd react && pnpm install && pnpm dev`      | React Router |
| Svelte        | `cd svelte && pnpm install && pnpm dev`     | Svelte SPA mounted into shared layout |
| PHP Vanilla   | `cd php-vanilla && php -S localhost:8080 -t public` | Uses `data/store.json` for persistence |
| Kwik (TODO)   | –                                          | Pending Qwik implementation |
| Nette (TODO)  | –                                          | Pending Nette application |

> **Tip:** Keep the repository root mounted as the document root (or Vite `publicDir`) so `/design` is accessible without copying assets.

## Testing checklist

- [ ] Visiting `/login` shows the shared auth form.
- [ ] Incorrect credentials surface inline error.
- [ ] Successful login redirects to `/home` with stats cards.
- [ ] `/projects` supports create/edit/delete and persists data.
- [ ] `/tasks` list supports CRUD, status changes, filtering, sorting.
- [ ] Reload keeps state (localStorage or JSON file).
- [ ] Layout stays pixel-consistent across viewports (inspect at 375px, 768px, 1280px).

## Contributing

1. Update shared assets in `design/` if the visual system changes.
2. Propagate data model or routing updates across every stack to keep parity.
3. When adding another stack, document setup steps and ensure it consumes the canonical layout/CSS assets.
