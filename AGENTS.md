# AGENTS.md

## Build & Run

- **Package manager:** Bun only. `bun install`, `bun run build`, `bun dev`, `bun lint`
- `bun dev` starts Next.js dev server on port 3000
- `bun run build` produces an optimized build in `.next/`
- `bun lint` runs ESLint (eslint-config-next) — expect 0 errors, ~42 intentional warnings
- `bun electron:dev` runs Next.js dev server + Electron window concurrently
- `bun electron:build` builds Next.js standalone, then packages with electron-builder

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
  - `app/api/config/` — `GET` returns `{ defaultServerUrl, seerrServerUrl, seerrAuthType }` from env
  - `app/api/seerr/[...slug]/` — server-side proxy for Seerr (Jellyseerr/Overseerr). **Auth-gated:** requires a valid Jellyfin session cookie; SSRF-hardened (private-IP blocklist incl. DNS resolution, fail-closed)
- `src/actions/` — Server Actions for Jellyfin API calls (auth, media, search, utils)
  - `src/actions/store/` — cookie-based persistent storage via `next/headers` cookies
  - `src/actions/get-seerr-config.ts` — server action that reads Seerr env vars (SEERR_*) or falls back to cookies
- `src/components/` — feature components; `src/components/ui/` holds shadcn primitives
- `src/components/scroll-to-top.tsx` — floating "back to top" FAB for infinite-scroll pages
- `src/playback/` — modular playback engine with `HTMLAudioPlayer`, `HTMLVideoPlayer`, context provider
  - `src/playback/components/PostPlayOverlay.tsx` — Netflix-style "Up Next" overlay (appears 45s before episode end)
  - **Two playback contexts:** volatile `PlaybackContext` (full state incl. currentTime — re-renders ~4×/sec during playback) and stable `PlaybackActionsContext` (memoized callbacks only). Leaf components (cards, buttons) MUST use `usePlayback()` from `src/hooks/usePlayback.ts` (actions-backed); never subscribe leaves to the full context.
- `src/contexts/` — Auth, Settings, Seerr React contexts
- `src/hooks/` — custom hooks (`useAuth`, `usePlayback`, `useAppName`, `useSkipSegments`, etc.)
- `src/lib/atoms.ts` — all Jotai atoms: home page cache, hero items, library cache, app name, theme selection
- `src/lib/logger.ts` — dev-only logging utility (gates `console.log`/`console.warn` on `NODE_ENV === "development"`)
- `scripts/copy-static.mjs` — copies `.next/static/` and `public/` into standalone for Electron packaging
- `src/providers/RootProvider/` — wraps ThemeProvider > Toaster > AuthProvider > SettingsProvider

## Import Alias

`@/*` maps to project root (`./*`). Example: `import { cn } from "@/src/lib/utils"`

## Auth Flow

Authentication uses `@jellyfin/sdk`. Credentials stored as cookies via `src/actions/store/server-actions.ts`. `useAuth` reads cookies on mount. The `(main)` layout redirects unauthenticated users to `/login`.

## Branding

- The app is **Mitch-Jelly**. All Aperture/Apertúre references replaced.
- App name precedence: **`APP_NAME` env var** (global, locks the Settings field read-only) → `appNameAtom` in `atoms.ts` (per-browser, admin-editable via **Settings → General**) → default `"Mitch-Jelly"`.
- Consumers must use `useAppName()` from `src/hooks/use-app-name.ts` (resolves env > atom); do NOT read `appNameAtom` directly. The hook caches `/api/config` app-wide (single request).
- Static SSR metadata (`app/layout.tsx` title + apple-web-app-title) reads `process.env.APP_NAME` at server render.
- The atom feeds the sidebar brand text, browser tab title (via `app-title.tsx`), splash loader, and in-app text.
- Jellyfin SDK identifiers (`CLIENT_NAME`, `DEVICE_NAME` in `auth.ts` and `utils.ts`) are static `"Mitch-Jelly"` — not user-configurable.
- All localStorage keys use `mitch-jelly-` prefix (was `aperture-`).

## API Patterns & Gotchas

### Fetching media data
- **Always include `ItemFields.UserData`** when calling `getItems` — watch status (Played, PlayedPercentage, UnplayedItemCount) is not returned by default.
- Example: `fetchMediaDetails`, `fetchEpisodes`, `fetchLibraryItems`, `fetchSeasons`, `searchItems` all request it.
- `fetchLibraryItems` accepts optional `sortBy`, `sortOrder`, and `filters` params (defaults: SortName, Asc, none). Use `ItemFilter.IsUnplayed` to exclude watched items.

### Image URLs
- **Always append `&tag=${imageTag}`** to Jellyfin image URLs — without it, images 404 when server auth is strict.
- For episodes: use `ParentBackdropImageTags?.[0]` for backdrops and `ParentLogoImageTag` for logos (episodes inherit images from their parent series).
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
- `getNextEpisodeForSeries(seriesId)` finds the next episode in a series (priority: resumable → unwatched → first).
- `checkNearEnd(time, duration)` triggers the post-play "Up Next" overlay at 45 seconds before episode end.

### Metadata Refresh
- `scanLibrary(itemId?, mode?)` — triggers Jellyfin refresh. Three modes:
  - `"scan"` — basic file scan (default)
  - `"refresh"` — refresh metadata using saved providers
  - `"replace"` — full refresh + replace all images
- Exported as `scanLibrary` and `type ScanMode` from `src/actions/index.ts`.

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

- ESLint disables `@typescript-eslint/no-explicit-any`, `@next/next/no-img-element`, `react-hooks/set-state-in-effect`, `react-hooks/static-components`. Global ignores cover `desktop/` and `dist-electron/` (Electron CommonJS files are not linted).
- No test suite or test scripts configured.
- The `ignoreScripts` in package.json suppresses native build scripts for `sharp` and `unrs-resolver`.
- `scripts/bump-version.mjs` bumps version via `bun run scripts/bump-version.mjs -- --level=patch|minor|major`.
- The `app/(main)/` home page caches data in localStorage with a 5-minute TTL (`homeLastVisitedTimeAtom`). Always include `handleAuthError` in try/catch for API calls in page `useEffect` blocks, but **do NOT add it to useEffect dependency arrays** — it would cause infinite re-render loops. The linter warns about this (~25 instances), which is intentional.
- **Dev-mode stale builds:** if changes don't appear in `bun dev`, stop the server, delete `.next/turbopack/`, and restart. Turbopack occasionally serves stale chunks after branch switches or large refactors. Browser hard-refresh (Ctrl+Shift+R) may also be needed.
- When using `OptimizedImage`, avoid `loading="lazy"` — it causes cancelled image loads during DOM reordering.

## Docker / CI

- Docker image: `ghcr.io/mitchelljfranklin/mitch-jelly:latest`
- **CI workflow** (`.github/workflows/ci.yml`): runs lint + production build on every PR to `main`
- Release workflow (`.github/workflows/release.yml`): triggers on `v*` tags — builds Docker image (tagged version + `latest`), creates GitHub Release, and matrix-builds Electron installers (Windows NSIS, macOS DMG, Linux AppImage) attached to the release
- Manual dispatch: `workflow_dispatch` in Actions builds arbitrary tags (e.g., `latest`, `beta`)
- No Docker Hub — uses GitHub Container Registry with built-in `GITHUB_TOKEN`

## Electron Desktop Client

- **Dev:** `bun electron:dev` — runs `concurrently` with Next.js dev server + Electron window (requires `wait-on` for port 3000)
- **Build:** `bun electron:build` — builds Next.js (`output: standalone`), then packages with `electron-builder`
- **Platform-specific builds:** `bun electron:build:win`, `bun electron:build:mac`, `bun electron:build:linux`
- **Entry point:** `desktop/main.js` (defined in `"main"` field of `package.json`)
- **Packaging config:** `electron-builder.yml` — outputs installers to `dist-electron/`
- **Architecture:** Electron main process spawns Next.js standalone server on a random port, waits for it, then creates a BrowserWindow pointing at `localhost:<port>`
- **Preload:** `desktop/preload.js` exposes `window.electronAPI` via `contextBridge` (IPC handlers for auto-launch toggle, app version)
- **Auto-launch:** `app.setLoginItemSettings({ openAtLogin: true })` in main process, accessible from renderer via `electronAPI.getAutoLaunch()` / `setAutoLaunch()`
- **next.config.ts settings:** `output: "standalone"` (self-contained Node.js server), `images.unoptimized: true` (skips `sharp` in bundled app, saves ~15 MB)
- **Standalone output at:** `.next/standalone/server.js` with pruned `node_modules`
- **Electron TypeScript types:** `src/types/electron.d.ts` — declares `window.electronAPI` interface
- **Build output:** `dist-electron/` (gitignored) — contains `.exe` (NSIS), `.dmg`, or `.AppImage` depending on platform
- **Supports:** Windows (x64), macOS (x64 + arm64), Linux (x64)

## Repo Info

- Repository: `mitchelljfranklin/mitch-jelly` on GitHub
- Local folder should be named `mitch-jelly` (not `mitch-aperture`)
- Originally forked from `akhilmulpurii/aperture` — no longer linked (upstream remote removed)
- **GitHub CLI:** Always include `--repo mitchelljfranklin/mitch-jelly` with `gh` commands (e.g., `gh pr create --repo mitchelljfranklin/mitch-jelly ...`). Without it, `gh` resolves against the old fork upstream.
- **Branch protection:** `main` requires PR with 1 approving review. Admins can bypass with `gh pr merge N --repo mitchelljfranklin/mitch-jelly --merge --admin --delete-branch`
