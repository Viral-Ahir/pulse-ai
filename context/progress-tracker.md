# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 12: Shape Panel — Complete

## Current Goal

- Begin next feature (check `context/feature-specs/` for next spec). Users can now drag shapes from the bottom panel onto the canvas to create new nodes rendered via the custom `canvasNode` type. Shape-specific visuals (diamond/hexagon/cylinder SVGs, etc.) are still rendered as bordered rectangles — likely targets for the next spec.

## Completed

- **Feature 12 — Shape Panel**
  - Extended `types/canvas.ts` with `NODE_SHAPE_DEFAULT_SIZES` (per-shape default `{ width, height }` — rectangles 180×80, diamonds 180×140, circles 120×120, pills 180×64, cylinders 140×100, hexagons 160×100), `SHAPE_DRAG_MIME = "application/x-pulse-shape"`, and the `ShapeDragPayload` interface (`{ shape, width, height }`)
  - Created `components/editor/shape-panel.tsx` (client): a floating pill-shaped toolbar absolutely positioned at `bottom-6 left-1/2 -translate-x-1/2` with `rounded-full border border-surface-border bg-surface/90 backdrop-blur`. Renders a draggable icon button per shape (`RectangleHorizontal`, `Diamond`, `Circle`, `Pill`, `Cylinder`, `Hexagon` from lucide-react). `onDragStart` writes `JSON.stringify({ shape, width, height })` from `NODE_SHAPE_DEFAULT_SIZES` to `dataTransfer` under the `SHAPE_DRAG_MIME` type and sets `effectAllowed = "copy"`. Buttons use `cursor-grab` / `active:cursor-grabbing`
  - Created `components/editor/canvas-node.tsx` (client): basic renderer for the `canvasNode` type — a bordered rounded card filling the node bounds, with `Handle`s at top/bottom, the label centered inside, and the palette fill/text colors pulled from `NODE_COLORS` via `data.color`. Selection ring uses `ring-2 ring-brand`. All shape values render the same way for now (shape-specific visuals deferred per spec)
  - Updated `components/editor/canvas.tsx`: wrapped the canvas surface in `<ReactFlowProvider>` so `useReactFlow()` (and therefore `screenToFlowPosition`) is available at the same level as the drop handlers. Added a wrapper `<div>` around `<ReactFlow>` that handles `onDragOver` (preventDefault + `dropEffect = "copy"` only when the payload MIME is present) and `onDrop` (parses the JSON payload, converts `clientX/clientY` to flow coordinates via `screenToFlowPosition`, centers the node on the cursor by subtracting half the dragged width/height, generates `id = `${shape}-${Date.now()}-${counter}``, and dispatches a `{ type: "add", item: newNode }` change through `onNodesChange` so Liveblocks syncs the addition). New nodes use `type: "canvasNode"`, empty label, `DEFAULT_NODE_COLOR`, and the dragged shape. Registered `NODE_TYPES = { canvasNode: CanvasNodeRenderer }` and rendered `<ShapePanel />` inside the wrapper as a floating overlay
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 11 — Base Canvas**
  - Created `types/canvas.ts`: `NODE_COLORS` (8 fill/text pairs from `ui-context.md`, ids: `neutral` default, `blue`, `purple`, `orange`, `red`, `pink`, `green`, `teal`), `NodeColorId`, `DEFAULT_NODE_COLOR`, `NODE_SHAPES` (`rectangle`, `diamond`, `circle`, `pill`, `cylinder`, `hexagon`), `NodeShape`, `DEFAULT_NODE_SHAPE`, `DEFAULT_EDGE_COLOR`, `CanvasNodeData` (`label`, `color`, `shape`), and the custom React Flow types `CanvasNode = Node<CanvasNodeData, "canvasNode">` and `CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">`
  - Created `components/editor/canvas-wrapper.tsx` (client): wraps the canvas with `LiveblocksProvider authEndpoint="/api/liveblocks-auth"` and `RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}`. Inside, `<CanvasRoom>` uses `useErrorListener` to map `ROOM_CONNECTION_ERROR` codes (`-1` auth, `4001` forbidden, `4005` full, `4006` changed, default) to a friendly message and renders a `<CanvasError>` fallback when set. Otherwise it renders `<ClientSideSuspense fallback={<CanvasLoading />}>` around `<Canvas />`. Loading and error fallbacks use app tokens (`bg-base`, `bg-elevated`, `text-copy-*`, `text-error`)
  - Created `components/editor/canvas.tsx` (client): calls `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })` and renders `<ReactFlow>` with synced `nodes`/`edges`/`onNodesChange`/`onEdgesChange`/`onConnect`/`onDelete`, `connectionMode={ConnectionMode.Loose}`, `fitView`, and `proOptions={{ hideAttribution: true }}`. Children: `<Background variant={BackgroundVariant.Dots} gap={20} size={1} />` and `<MiniMap pannable zoomable />`. Imports `@xyflow/react/dist/style.css`
  - Updated `components/editor/workspace-shell.tsx`: replaced the "Canvas coming soon" placeholder with `<CanvasWrapper roomId={projectId} />` inside the `pt-12 h-full` main region
  - Build verified: `npm run build` compiles and type-checks cleanly

- **Feature 10 — Liveblocks Setup**
  - Installed `@liveblocks/node` (spec claimed all packages were installed, but only the client-side packages were present). Requires `LIVEBLOCKS_SECRET_KEY` in `.env.local`
  - Updated `liveblocks.config.ts`: `Presence` carries `cursor: { x: number; y: number } | null` and `isThinking: boolean`; `UserMeta` defines `id` and `info: { name, avatar, color }` so user identity surfaces via `useSelf`/`useOthers`
  - Created `lib/liveblocks.ts` (`import "server-only"`): `getLiveblocks()` returns a singleton `Liveblocks` node client cached on `globalThis` (lazy so `npm run build` does not require the secret at build time); `getCursorColorForUser(userId)` deterministically maps the user ID to one of 10 palette colors via a simple polynomial hash
  - Created `app/api/liveblocks-auth/route.ts` (`POST`): requires Clerk auth (`401`), parses `{ room }` from the request body (`400` if missing), resolves the caller via `getCurrentIdentity()`, and gates access through `getProjectIfAccessible(roomId, identity)` — returns `403` if the user is neither owner nor collaborator. Calls `liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] })` to ensure the room exists (private — access is granted per-session via access tokens, not room-level permissions). Builds `userInfo = { name, avatar, color }` from Clerk's `currentUser()` (`firstName + lastName` → fallback to email/username/"Anonymous"; `imageUrl` for avatar; deterministic palette color) and returns `session.authorize()` from `prepareSession(userId, { userInfo }).allow(roomId, FULL_ACCESS)`
  - Build verified: `npm run build` compiles and type-checks cleanly; `/api/liveblocks-auth` registers as a dynamic route

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

- Begin next feature (check `context/feature-specs/` for next spec). With drag-to-create and a basic `canvasNode` renderer in place, the natural next steps are shape-specific visuals (SVG-based diamond/hexagon/cylinder per `ui-context.md`), selection/edit affordances (label editing, color picker), or a custom `canvasEdge` renderer.

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
- Liveblocks node client lives in `lib/liveblocks.ts` (`import "server-only"`) and is exposed via `getLiveblocks()` rather than a top-level singleton — lazy so missing `LIVEBLOCKS_SECRET_KEY` doesn't break `next build` (only request-time evaluation needs the secret). Auth uses access tokens (`prepareSession` + `session.allow(roomId, FULL_ACCESS)`) because access is gated at the auth route via `getProjectIfAccessible`; rooms are created with `defaultAccesses: []` so unauthorized ID tokens can never join. `userInfo` carries `name`, `avatar`, and a deterministic `color` derived from the Clerk user ID through `getCursorColorForUser`.
- Client-side canvas wiring lives in `components/editor/canvas-wrapper.tsx` and `components/editor/canvas.tsx`. The wrapper owns the `LiveblocksProvider` + `RoomProvider` and surfaces `ROOM_CONNECTION_ERROR` codes via `useErrorListener` as a single `<CanvasError>` fallback (no `react-error-boundary` dependency). Inside, `<ClientSideSuspense>` waits on `useLiveblocksFlow({ suspense: true })`, which is why suspense hooks are imported from `@liveblocks/react/suspense`. The room ID is the project ID — the wrapper takes a `roomId` prop and the workspace shell passes `projectId`.
- Shared canvas types live in `types/canvas.ts` (`NODE_COLORS`, `NodeColorId`, `NODE_SHAPES`, `NodeShape`, `NODE_SHAPE_DEFAULT_SIZES`, `SHAPE_DRAG_MIME`, `ShapeDragPayload`, `CanvasNodeData`, `CanvasNode`, `CanvasEdge`). The custom React Flow node/edge type names are `canvasNode` and `canvasEdge` — wire `nodeTypes`/`edgeTypes` against these strings when custom rendering ships. `canvasNode` already has a basic bordered renderer in `components/editor/canvas-node.tsx`; shape-specific visuals are deferred.
- Drag-to-create flow: `components/editor/shape-panel.tsx` writes a `ShapeDragPayload` JSON blob to `dataTransfer` under the `SHAPE_DRAG_MIME` type (`application/x-pulse-shape`). `components/editor/canvas.tsx` wraps its surface in `<ReactFlowProvider>` (required so the drop handler outside `<ReactFlow>` can call `useReactFlow().screenToFlowPosition`), handles `onDragOver`/`onDrop` on a wrapper `<div>`, and dispatches the new node through `onNodesChange([{ type: "add", item }])` so Liveblocks syncs it. Node IDs are `${shape}-${Date.now()}-${counter}`. Drop position is centered on the cursor by subtracting half of the dragged width/height from the converted flow position.
