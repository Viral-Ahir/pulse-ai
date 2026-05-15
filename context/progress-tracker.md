# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05: Prisma Schema And Data Layer — Complete

## Current Goal

- Begin Feature 06 (check `context/feature-specs/` for next spec).

## Completed

- **Feature 05 — Prisma Schema And Data Layer**
  - Added `prisma/models/project.prisma`: `Project` (id, ownerId mapped to Clerk user, name, optional description, `ProjectStatus` enum [`DRAFT`, `ARCHIVED`] defaulting to `DRAFT`, nullable `canvasJsonPath` for future blob URL, `createdAt`/`updatedAt`, indexes on `ownerId` and `createdAt`) and `ProjectCollaborator` (id, projectId with `onDelete: Cascade`, email, createdAt, `@@unique([projectId, email])`, indexes on `email` and `[projectId, createdAt]`)
  - Installed `@prisma/extension-accelerate` for the `prisma+postgres://` branch
  - Created `lib/prisma.ts`: cached singleton on `globalThis` in non-production; factory reads `DATABASE_URL` and branches — `prisma+postgres://` → `new PrismaClient({ accelerateUrl }).$extends(withAccelerate())`, otherwise → `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
  - Ran initial migration `20260515171402_init` against Prisma Postgres (`db.prisma.io`); generated client to `app/generated/prisma/` (gitignored)
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 04 — Project Dialogs & Editor Home**
  - Created `lib/mock-projects.ts`: `MockProject` interface + 2 owned / 1 shared mock records
  - Created `hooks/use-project-dialogs.ts`: manages dialog type, selected project, name form state, slug derivation, open/close helpers
  - Created `components/editor/project-dialogs.tsx`: `CreateProjectDialog` (name input + live slug preview), `RenameProjectDialog` (prefilled, auto-focus, Enter submits), `DeleteProjectDialog` (destructive confirm, no input)
  - Updated `components/editor/project-sidebar.tsx`: project list from mock data, rename/delete hover actions on owned projects only, shared tab shows no actions, mobile backdrop scrim (z-30, `lg:hidden`, tap closes sidebar), "New Project" button wired to `onCreateProject`
  - Updated `components/editor/editor-shell.tsx`: editor home content (heading, description, New Project button), `useProjectDialogs` hook wired to sidebar + all three dialogs
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 03 — Auth**
  - Installed `@clerk/ui`; added `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` to `.env.local`
  - Created `proxy.ts` at project root: `clerkMiddleware` with `createRouteMatcher` protecting all routes except sign-in/sign-up paths; exports `proxy` (Next.js 16 rename of `middleware`)
  - Updated `app/layout.tsx`: wrapped with `ClerkProvider`, `appearance={{ theme: dark, variables: { ... } }}` — all color values reference CSS variables, no hardcoded colors
  - Updated `app/page.tsx`: server component that redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`
  - Created `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx`: two-panel layout on `lg+` (left: logo/tagline/feature list; right: Clerk form); form-only on small screens
  - Created `components/editor/editor-shell.tsx`: client component managing `sidebarOpen` state; wires `EditorNavbar` + `ProjectSidebar`
  - Created `app/editor/page.tsx`: renders `EditorShell`
  - Updated `components/editor/editor-navbar.tsx`: added `UserButton` to right section
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 02 — Editor Chrome**
  - Created `components/editor/editor-navbar.tsx`: fixed `h-12` top navbar, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose` icons, left/center/right layout sections, `bg-surface` + `border-surface-border` styling
  - Created `components/editor/project-sidebar.tsx`: fixed overlay sidebar (`z-40`, `top-12`, `w-72`), CSS `translate-x` slide-in from left, `isOpen`/`onClose` props, `Projects` header with close button, shadcn Tabs (My Projects / Shared) with empty placeholder states, full-width `New Project` button with `Plus` icon
  - Dialog pattern: uses existing shadcn Dialog + CSS token infrastructure from Feature 01; no new dialog built per spec
  - Build verified: `npx next build` compiles cleanly with no TypeScript errors

- **Feature 01 — Design System**
  - Initialized shadcn/ui (Next.js + Tailwind v4, `components.json` configured)
  - Installed lucide-react (via shadcn dependency chain)
  - Added shadcn components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
  - Created `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
  - Updated `app/globals.css`: dark-only palette, custom CSS variables (`--bg-base`, `--accent-primary`, etc.), Tailwind v4 `@theme inline` token mappings (`bg-base`, `bg-surface`, `text-copy-primary`, `text-brand`, `border-surface-border`, etc.)
  - Added `dark` class to `<html>` in `app/layout.tsx` for shadcn dark-mode activation
  - Build verified: `npx next build` compiles cleanly with no TypeScript errors

## In Progress

- None.

## Next Up

- Feature 06 (check `context/feature-specs/` for next spec).

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: shadcn variables defined once in `:root` at dark values; `dark` class always present on `<html>` so shadcn dark-mode selectors activate. No light mode toggle needed.
- Tailwind v4 `@theme inline` maps app palette custom properties to utility tokens (e.g. `--color-base: var(--bg-base)` → `bg-base` utility).

## Session Notes

- `components/ui/*` files are generated by shadcn — do not modify them.
- App palette CSS vars (`--bg-*`, `--text-*`, `--accent-*`, `--border-*`, `--state-*`) are defined in `:root` in `globals.css`.
- Prisma uses multi-file schemas (`prisma.config.ts` → `schema: "prisma/"`); add new models as `prisma/models/*.prisma`. Generator output `app/generated/prisma/` is gitignored — import client via `@/app/generated/prisma/client`.
