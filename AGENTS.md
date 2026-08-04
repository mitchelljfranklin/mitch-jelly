# AGENTS.md

## Build & Run

- **Package manager:** Bun only. `bun install`, `bun dev`, `bun build`, `bun lint`
- `bun dev` starts Next.js dev server on port 3000
- `bun build` produces an optimized build in `.next/`
- `bun lint` runs ESLint (eslint-config-next) — expect 0 errors, ~39 intentional warnings

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript ~5.9**
- **Tailwind v4** — uses `@import "tailwindcss"` and `@theme inline { ... }` syntax. NOT v3 `@tailwind` directives.
- **shadcn/ui** components live in `src/components/ui/`
- **Jotai** for state (`src/lib/atoms.ts`), with `atomWithStorage` for persisted atoms
- **next-themes** for theming with custom themes (light, dark, cinematic-theatre-black, neon-grid, etc.)
- **Jellyfin SDK** (`@jellyfin/sdk`) for all media API calls

## Architecture

- `app/` — Next.js App Router pages and API routes
  - `app/(main)/` — grouped route for all authenticated pages (dashboard, library, movie, series, etc.)
  - `app/login/` — standalone login page
  - `app/api/config/` — `GET` returns `{ defaultServerUrl }` from env
  - `app/api/seerr/[...slug]/` — server-side proxy for Seerr (Jellyseerr/Overseerr)
- `src/actions/` — Server Actions for Jellyfin API calls (auth, media, search, utils)
  - `src/actions/store/` — cookie-based persistent storage via `next/headers` cookies
- `src/components/` — feature components; `src/components/ui/` holds shadcn primitives
- `src/playback/` — modular playback engine with `HTMLAudioPlayer`, `HTMLVideoPlayer`, context provider
- `src/contexts/` — Auth, Settings, Seerr React contexts
- `src/hooks/` — custom hooks (useAuth, usePlayback, useSkipSegments, etc.)
- `src/lib/atoms.ts` — all Jotai atoms: home page cache, hero items, library cache, app name, theme selection
- `src/providers/RootProvider/` — wraps ThemeProvider > Toaster > AuthProvider > SettingsProvider

## Import Alias

`@/*` maps to project root (`./*`). Example: `import { cn } from "@/src/lib/utils"`

## Auth Flow

Authentication uses `@jellyfin/sdk`. Credentials stored as cookies via `src/actions/store/server-actions.ts`. `useAuth` reads cookies on mount. The `(main)` layout redirects unauthenticated users to `/login`.

## Branding

- The app is **Mitch-Jelly**. All Aperture/Apertúre references replaced.
- Admins can customize the name via **Settings → General** (uses `appNameAtom` in `atoms.ts`, an `atomWithStorage`).
- The atom feeds the sidebar brand text, browser tab title (via `useEffect` in `app-sidebar.tsx`), splash loader, and in-app text.
- Jellyfin SDK identifiers (`CLIENT_NAME`, `DEVICE_NAME` in `auth.ts` and `utils.ts`) are static `"Mitch-Jelly"` — not user-configurable.
- All localStorage keys use `mitch-jelly-` prefix (was `aperture-`).

## API Patterns & Gotchas

### Fetching media data
- **Always include `ItemFields.UserData`** when calling `getItems` — watch status (Played, PlayedPercentage, UnplayedItemCount) is not returned by default.
- Example: `fetchMediaDetails`, `fetchEpisodes`, `fetchLibraryItems`, `fetchSeasons`, `searchItems` all request it.
- `fetchLibraryItems` accepts optional `sortBy`, `sortOrder`, and `filters` params (defaults: SortName, Asc, none). Use `ItemFilter.IsUnplayed` to exclude watched items.

### Image URLs
- **Always append `&tag=${imageTag}`** to Jellyfin image URLs — without it, images 404 when server auth is strict.
- For continue-watching Episode cards: use `ParentThumbImageTag` on `ParentThumbItemId || SeriesId`. Fall back to Primary when no thumb tag exists (via `hasThumb` logic in `media-card.tsx`).

### Mark as watched/unwatched
- Server actions: `markAsPlayed(itemId)` → `POST /Users/{id}/PlayedItems/{itemId}`, `markAsUnplayed(itemId)` → `DELETE`.
- Both exported from `src/actions/media.ts` and re-exported in `src/actions/index.ts`.
- Use optimistic state updates with rollback (see `MediaCard.handleToggleWatched` for pattern).
- Toggles exist on: `MediaCard` (hover overlay), inline `EpisodeCard` (season scroller), `MediaActions` (detail pages), `HeroSlide`.
- Playback engine auto-marks at >= 90% completion via `usePlaybackManager.stop()`.

### ScrollArea viewport refs
- **Do NOT cache the viewport ref** in a `useEffect` with `[]` deps — the ScrollArea viewport may not exist on mount. Instead, query live in each scroll handler: `scrollRef.current.closest('[data-slot="scroll-area"]').querySelector('[data-slot="scroll-area-viewport"]')`.

### Continue Watching / Next Up
- `fetchResumeItems()` and `fetchNextUpItems()` return episodes. They need `ParentThumbItemId` and `ParentThumbImageTag` for images — these are base properties, not field-dependent.

## Caching

| Page | Cache | TTL | Storage |
|------|-------|-----|---------|
| Home page | `homeResumeItemsAtom`, `homeLibrariesAtom`, etc. | 5 min | `atomWithStorage` (localStorage) |
| Hero section | `heroItemsAtom` | 5 min | `atomWithStorage` |
| Library page | `libraryCacheAtom` (keyed by `libraryId`) | 5 min | In-memory only (too large for localStorage) |

- Home page checks cache before fetching, renders cached data instantly, fetches fresh in background.
- Home page libraries show 20 most recently added **unwatched** items (`ItemFilter.IsUnplayed`).
- Library page paginates in batches of 200, renders incrementally via IntersectionObserver infinite scroll in `LibraryMediaList`.

## Key Conventions

- ESLint disables `@typescript-eslint/no-explicit-any`, `@next/next/no-img-element`, `react-hooks/set-state-in-effect`, `react-hooks/static-components`.
- No test suite or test scripts configured.
- The `ignoreScripts` in package.json suppresses native build scripts for `sharp` and `unrs-resolver`.
- `scripts/bump-version.mjs` bumps version via `bun run scripts/bump-version.mjs -- --level=patch|minor|major`.
- The `app/(main)/` layout has a 60-second home page cache window that was extended to 5 minutes. Always include `handleAuthError` in try/catch for API calls in page `useEffect` blocks, but **do NOT add it to useEffect dependency arrays** — it would cause infinite re-render loops. The linter warns about this (~25 instances), which is intentional.
- When using `OptimizedImage`, avoid `loading="lazy"` — it causes cancelled image loads during DOM reordering.

## Docker / CI

- Docker image: `ghcr.io/mitchelljfranklin/mitch-jelly:latest`
- Release workflow: triggers on `v*` tags — builds, tags as version + `latest`, creates GitHub Release
- Manual dispatch: `workflow_dispatch` in Actions builds arbitrary tags (e.g., `latest`, `beta`)
- No Docker Hub — uses GitHub Container Registry with built-in `GITHUB_TOKEN`
