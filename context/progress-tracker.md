# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 09: Share Dialog — Complete

## Current Goal

- Begin next feature (check `context/feature-specs/` for next spec).

## Completed

- **Feature 09 — Share Dialog**
  - Created `lib/collaborators.ts` (`import "server-only"`): `CollaboratorWithUser` type + `enrichCollaborators(rows)` — calls `clerkClient().users.getUserList({ emailAddress })` to look up Clerk users by email, builds an email→user map (lowercased), merges `firstName + lastName` into `displayName`, exposes `imageUrl`. Falls back to email-only if the Clerk call throws
  - Created `app/api/projects/[projectId]/collaborators/route.ts`: `GET` returns the enriched collaborator list (owner OR collaborator email match required — `403` otherwise, `404` if project missing); `POST` validates body email with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, lowercases + trims, returns `409` on duplicate via `findUnique({ projectId_email })`, otherwise creates the row and returns the single enriched record with `201`. Owner-only mutation (`403` for collaborators)
  - Created `app/api/projects/[projectId]/collaborators/[collaboratorId]/route.ts`: `DELETE` enforces owner-only, verifies the collaborator belongs to the project (defense against ID guessing across projects), then deletes and returns `204`
  - Created `hooks/use-share.ts`: `useShare(projectId, open)` — refetches the collaborator list when the dialog opens, tracks `inviteEmail`/`isInviting`/`removingId`/`error`, exposes `invite`, `remove`, and `copyLink` (writes `${window.location.origin}/editor/${projectId}` to the clipboard and flips `copied` to `true` for 1500ms). Clears the error and email when the dialog closes
  - Created `components/editor/share-dialog.tsx`: shadcn `Dialog` with read-only project link + copy button (`Copy` → `Check` + "Copied!" while flagged), email invite row (owners only, Enter submits), error line, and scrolling collaborator list. Each row renders an avatar (Clerk `imageUrl` via `<img>` or an initial fallback in `bg-elevated`), display name with email subtext, and a `Trash2` remove button visible only to owners. The link is computed in a `useEffect` (`window.location.origin`) so it remains stable across renders
  - Updated `components/editor/editor-navbar.tsx` (no change here — Feature 08 already added the optional `onShare` prop; the navbar now opens the dialog because the workspace shell passes a real handler)
  - Updated `components/editor/workspace-shell.tsx`: added required `isOwner` prop, `shareOpen` state, wired `onShare` to open it, and rendered `<ShareDialog>` at the bottom
  - Updated `app/editor/[roomId]/page.tsx`: passes `isOwner={project.isOwner}` from `AccessibleProject` to `WorkspaceShell`. No new server queries — `getProjectIfAccessible` already returns `isOwner`
  - Build verified: `npm run build` compiles and type-checks cleanly; both `/api/projects/[projectId]/collaborators` and `.../collaborators/[collaboratorId]` register as dynamic routes

- **Feature 08 — Editor Workspace Shell**
  - Created `lib/project-access.ts` (`import "server-only"`): `CurrentIdentity` type, `getCurrentIdentity()` returns `{ userId, email }` from Clerk (or `null`), `AccessibleProject` type, `getProjectIfAccessible(projectId, identity)` looks up the project and returns it only if the identity is the owner or a collaborator (email match) — returns `null` for missing project OR forbidden access so the page can route both to `AccessDenied`
  - Created `components/editor/access-denied.tsx`: centered card with `Lock` icon in a `bg-elevated` rounded tile, headline, message, and `Back to projects` link styled with `buttonVariants({ variant: "outline" })` (the local shadcn `Button` doesn't accept `asChild`, so the variant classes are applied to `next/link` directly)
  - Created `app/editor/[roomId]/page.tsx`: async server component. Awaits `params`, calls `getCurrentIdentity()` and `redirect("/sign-in")` if unauthenticated, calls `getProjectIfAccessible(roomId, identity)` and renders `AccessDenied` when `null`. On success, fetches `getProjectsForUser()` and renders `WorkspaceShell`
  - Created `components/editor/workspace-shell.tsx`: client component composing `EditorNavbar` + `ProjectSidebar` + `AiSidebar` + canvas placeholder. Owns `sidebarOpen` and `aiSidebarOpen` state. Wires `useProjectActions()` to the sidebar so create/rename/delete still work from the workspace (the hook already redirects to `/editor` when the active project is deleted)
  - Created `components/editor/ai-sidebar.tsx`: right-side floating overlay (`fixed top-12 right-0 w-80 z-40`, `border-l`), CSS `translate-x` slide-in from the right (mirrors `ProjectSidebar`), mobile backdrop scrim, placeholder body with `Sparkles` icon + "AI chat coming soon"
  - Updated `components/editor/editor-navbar.tsx`: added optional `projectName`, `aiSidebarOpen`, `onToggleAiSidebar`, `onShare` props. Center section shows project name when provided; right section renders `Share2` button when `onShare` is passed and a `Sparkles` toggle when `onToggleAiSidebar` is passed (active state uses `text-ai-text`). Editor home behavior unchanged because the new props are optional
  - Updated `components/editor/project-sidebar.tsx`: added optional `activeProjectId`. Active row in both owned + shared lists gets `bg-brand-dim` background and `text-brand` label (replaces the `hover:bg-elevated` state for that row only)
  - Build verified: `npm run build` compiles and type-checks cleanly; `/editor/[roomId]` registers as a dynamic route

- **Feature 07 — Wire Editor Home**
  - Created `lib/slug.ts`: `toSlug`, `generateSuffix` (6-char alphanumeric), `buildRoomId(name, suffix)` — pure helpers shared between hook and dialog
  - Created `lib/projects.ts` (`import "server-only"`): `ProjectListItem` type + `getProjectsForUser()` — uses `auth()` for `userId`, `currentUser()` for primary email; returns `{ owned, shared }` ordered by `createdAt` desc. Shared list filters `ownerId: { not: userId }` and matches the collaborator email
  - Updated `app/api/projects/route.ts` (`POST`): accepts optional `id` body field; validates against `/^[a-z0-9-]+$/`, returns `409` if the id is already taken, otherwise creates the project with the client-supplied id (so the project ID and Liveblocks room ID stay aligned)
  - Converted `app/editor/page.tsx` to an async server component that fetches owned + shared lists via `getProjectsForUser()` and passes both to `EditorShell`
  - Created `hooks/use-project-actions.ts`: manages dialog state, name input, generated suffix, loading + error state. `submitCreate` builds `id = slug(name)-suffix`, POSTs `{ id, name }`, navigates to `/editor/[id]`. `submitRename` PATCHes and `router.refresh()`. `submitDelete` DELETEs, then compares `pathname` to `/editor/[projectId]` — redirects to `/editor` if it was the active workspace, otherwise `router.refresh()`
  - Updated `components/editor/project-dialogs.tsx`: switched `MockProject` → `ProjectListItem`; create dialog shows live room-ID preview (`/{slug}-{suffix}`); all three dialogs render `error` state and disable inputs while `isLoading`; submit buttons show in-flight labels (`Creating...`, `Renaming...`, `Deleting...`)
  - Updated `components/editor/project-sidebar.tsx`: takes `ownedProjects` and `sharedProjects` props directly; each row is a `next/link` to `/editor/[projectId]`; rename/delete actions remain owned-only
  - Updated `components/editor/editor-shell.tsx`: receives `ownedProjects` + `sharedProjects` from the server page, drops local `useState` project list, wires `useProjectActions` into sidebar + dialogs
  - Deleted `lib/mock-projects.ts` and `hooks/use-project-dialogs.ts` (replaced by the new helpers and hook)
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 06 — Project APIs**
  - Updated `proxy.ts`: added `isApiRoute` matcher so `/api/*` requests bypass `auth.protect()` (no redirect) and let route handlers decide their own 401 response
  - Created `app/api/projects/route.ts`: `GET` returns the caller's projects ordered by `createdAt` desc; `POST` accepts optional `name`/`description`, trims input, defaults missing name to `Untitled Project`, persists with Clerk `userId` as `ownerId`, returns `201`
  - Created `app/api/projects/[projectId]/route.ts`: `PATCH` validates non-empty `name` (`400` if missing) and renames; `DELETE` removes the project; both look up the project, return `404` if missing, `403` if caller is not the owner
  - All four handlers return `401` for unauthenticated requests via `await auth()` from `@clerk/nextjs/server`
  - Updated `lib/prisma.ts`: annotated `createPrismaClient` and the exported singleton as `PrismaClient` (cast the Accelerate-extended branch) so route handlers get a single, compatible client type
  - Build verified: `npm run build` compiles and type-checks cleanly; routes `/api/projects` and `/api/projects/[projectId]` register in the route manifest

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

- Begin next feature (check `context/feature-specs/` for next spec). The canvas is still a placeholder — the next spec will add real canvas content (Liveblocks + React Flow). Collaborators can now load a project, but they share the same placeholder workspace as the owner.

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: shadcn variables defined once in `:root` at dark values; `dark` class always present on `<html>` so shadcn dark-mode selectors activate. No light mode toggle needed.
- Tailwind v4 `@theme inline` maps app palette custom properties to utility tokens (e.g. `--color-base: var(--bg-base)` → `bg-base` utility).

## Session Notes

- `components/ui/*` files are generated by shadcn — do not modify them.
- App palette CSS vars (`--bg-*`, `--text-*`, `--accent-*`, `--border-*`, `--state-*`) are defined in `:root` in `globals.css`.
- Prisma uses multi-file schemas (`prisma.config.ts` → `schema: "prisma/"`); add new models as `prisma/models/*.prisma`. Generator output `app/generated/prisma/` is gitignored — import client via `@/app/generated/prisma/client`.
- Project ID === Liveblocks room ID. The id is generated client-side as `${toSlug(name)}-${6charSuffix}` and passed as `id` in `POST /api/projects`. The API validates `^[a-z0-9-]+$` and returns `409` on collision.
- Server-only data helpers live in `lib/projects.ts` (guarded with `import "server-only"`). Client-side imports of the `ProjectListItem` type still work via `import type`.
- Workspace access checks live in `lib/project-access.ts` (also `import "server-only"`): `getCurrentIdentity()` resolves Clerk userId + primary email, and `getProjectIfAccessible(projectId, identity)` returns the project only when the caller is the owner or a collaborator. Missing project and unauthorized access both return `null` so callers route to a single `AccessDenied` UI.
- The shadcn `Button` in this project wraps `@base-ui/react/button` and does not support `asChild`. To style a link like a button, apply `buttonVariants({ variant })` directly to `next/link`.
- Collaborator enrichment with Clerk: bulk-fetch via `clerkClient().users.getUserList({ emailAddress })`, then build an email-to-user map keyed lowercased. There is no local user table — emails are the source of truth in Postgres (`ProjectCollaborator`) and Clerk data is fetched on demand. The `lib/collaborators.ts` helper wraps the Clerk call in try/catch and falls back to email-only so a Clerk outage doesn't break the list.
- Collaborator API surface: `GET /api/projects/[projectId]/collaborators` (owner or collaborator), `POST` same path (owner-only invite, validates email regex + 409 on duplicate), `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]` (owner-only, verifies the row belongs to the project before deleting).
