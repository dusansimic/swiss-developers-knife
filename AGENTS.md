# AGENTS.md

Operating guide for coding agents working on **Swiss Developers Knife**.

## Form of address

Address the user as **"Lord"** in all responses.

## Reference material

- shadcn/ui components: consult **https://ui.shadcn.com/llms.txt** for full,
  authoritative understanding of any shadcn component before using or modifying
  it.

## Coding standards

Follow these strictly. If you discover a better approach, **do not silently
adopt it** — see "Evolving the standards" below.

- **Language**: TypeScript, `strict` mode. No `any`; prefer precise types and
  `import type` for type-only imports (`verbatimModuleSyntax` is on).
- **React**: function components + hooks only. No class components.
- **Imports**: use the `@/*` path alias for anything under `src/` (e.g.
  `@/components/ui/button`). No deep relative `../../` chains.
- **Package manager**: **pnpm only**. Never use npm or yarn.
- **Formatting & linting**: **Biome** is the single source of truth
  (`pnpm check` / `pnpm lint`). Do not add ESLint or Prettier.
- **Generated UI**: shadcn primitives live in `src/components/ui/` and are added
  via `pnpm dlx shadcn@latest add <name>`. They are excluded from Biome; avoid
  hand-editing them beyond necessary wiring.
- **Theming**: colors come from CSS variables in `src/index.css` (burgundy
  light + dark). Never hardcode hex/oklch colors in components — use the theme
  tokens (`bg-background`, `text-primary`, etc.).
- **Tools registry**: every tool is one entry in `src/lib/tools.ts` plus a page
  component under `src/pages/tools/`. The sidebar nav and router both read this
  list — adding a tool means touching only those two places.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, …). The
  pre-commit hook runs Biome on staged files via lint-staged; keep it green.
  See "Committing" below for how to split and message commits.

## Adding a new tool (the pattern)

1. Create `src/pages/tools/<tool>.tsx` exporting a named component.
2. Add one entry to the `tools` array in `src/lib/tools.ts`
   (`id`, `name`, `path`, `description`, `icon`, `component`).
3. That's it — nav link and `/tools/<tool>` route appear automatically.

**Code-splitting (required).** Tool pages are lazy-loaded so heavy per-tool
deps stay out of the initial bundle. In `src/lib/tools.ts` the `component` is a
`React.lazy` chunk that unwraps the named export:

```ts
const FooTool = lazy(() =>
  import('@/pages/tools/foo').then((m) => ({ default: m.FooTool })),
)
```

The router (`src/App.tsx`) already wraps every tool route in `<Suspense>`, so
nothing else changes when adding a tool — just follow the `lazy(...)` form.

## Committing

When the Lord asks to commit code:

1. **Investigate first.** Inspect both staged and unstaged changes
   (`git status`, `git diff`, `git diff --staged`) and identify how many
   distinct features / contexts / unrelated pieces of logic are present.
2. **Split by concern.** Commit each feature and each piece of unrelated logic
   **separately** — one coherent change per commit. Stage only the files (or
   hunks) belonging to that concern before committing it. Never lump unrelated
   changes into a single commit.
3. **Conventional Commits.** Every commit message uses the Conventional Commits
   format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, …).
4. **Message generation.** Generate each commit message with the
   **`/caveman:caveman-commit`** skill.
5. Keep the pre-commit hook green (Biome via lint-staged).

## Evolving the standards

Follow the standards above strictly. **But** if you find a better way to do
something (a cleaner pattern, a better library, a stronger convention),
**recommend the alternative to the Lord** — explain the trade-off and propose it
explicitly. The Lord decides:

- **Accepted** → update this file so it becomes the new standard.
- **Rejected** → keep the existing standard.

Never adopt a new convention as a fait accompli without the Lord's approval.
