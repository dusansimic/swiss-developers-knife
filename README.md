# Swiss Developers Knife

> a weird tool by a weird guy for weird people

A client-side React SPA hosting small tools useful for developers. Each tool is
a self-contained page; a left sidebar lists them all.

## Stack

- **React 19** + **TypeScript** (strict)
- **Vite** build tooling
- **React Router** (client-side routing)
- **Tailwind CSS v4** + **shadcn/ui** components
- **Biome** for formatting & linting
- **Husky** + **lint-staged** pre-commit hooks
- Burgundy light & dark themes

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command        | Description                     |
| -------------- | ------------------------------- |
| `pnpm dev`     | Start the dev server            |
| `pnpm build`   | Type-check and build to `dist/` |
| `pnpm preview` | Preview the production build    |
| `pnpm lint`    | Biome check (no writes)         |
| `pnpm check`   | Biome check + auto-fix          |
| `pnpm format`  | Biome format (write)            |

## Adding a tool

1. Create `src/pages/tools/<tool>.tsx`.
2. Add one entry to the `tools` array in `src/lib/tools.ts`.

The sidebar nav link and `/tools/<tool>` route appear automatically.

## Deployment (GitHub Pages, custom domain)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and deploys it to GitHub Pages.

One-time repo setup:

1. **Settings → Pages → Build and deployment → Source**: select
   **GitHub Actions**.
2. Put your domain in **`public/CNAME`** (currently a placeholder `example.com`)
   and set the same domain under **Settings → Pages → Custom domain**.
3. Point your domain's DNS at GitHub Pages.

The workflow copies `index.html` to `404.html` so client-side routes resolve on
hard refresh / deep links.

## Contributing / AI agents

See [`AGENTS.md`](./AGENTS.md) for coding standards. `CLAUDE.md` symlinks to it.
