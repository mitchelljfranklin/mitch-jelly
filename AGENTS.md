# AGENTS.md

## Build & Run

- **Package manager:** Bun only. `bun install`, `bun dev`, `bun build`, `bun lint`
- `bun dev` starts Next.js dev server on port 3000
- `bun build` produces an optimized build in `.next/`
- `bun lint` runs ESLint (eslint-config-next)

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript ~5.9**
- **Tailwind v4** — uses `@import "tailwindcss"` and `@theme inline { ... }` syntax. NOT v3 `@tailwind` directives.
- **shadcn/ui** components live in `src/components/ui/`
- **Jotai** for state (`src/lib/atoms.ts`), with `atomWithStorage` for persisted atoms
- **next-themes** for theming with custom themes (light, dark, cinematic-theatre-black, neon-grid, etc.)

## Architecture

- `app/` — Next.js App Router pages and API routes
  - `app/(main)/` — grouped route for all authenticated pages (dashboard, library, movie, series, etc.)
  - `app/login/` — standalone login page
  - `app/api/config/` — `GET` returns `{ defaultServerUrl }` from env
  - `app/api/seerr/[...slug]/` — server-side proxy for Seerr (Jellyseerr/Overseerr). Accepts auth headers and proxies to a user-configured Seerr instance.
- `src/actions/` — Server Actions for Jellyfin API calls (auth, media, search, utils, etc.)
  - `src/actions/store/` — cookie-based persistent storage via `next/headers` cookies (auth data, server URL, login preferences, Seerr config)
- `src/components/` — ~65 feature components; `src/components/ui/` holds shadcn primitives
- `src/playback/` — modular playback engine with `HTMLAudioPlayer` and `HTMLVideoPlayer`, context provider, custom hooks
- `src/contexts/` — Auth, Settings, Seerr, UserLayout React contexts
- `src/hooks/` — custom hooks (useAuth, usePlayback, useSkipSegments, etc.)
- `src/lib/atoms.ts` — all Jotai atoms including home page data, theme selection, aurora colors
- `src/providers/RootProvider/` — wraps ThemeProvider (next-themes) > Toaster > AuthProvider > SettingsProvider

## Import Alias

`@/*` maps to project root (`./*`). Example: `import { cn } from "@/src/lib/utils"`

## Auth Flow

Authentication uses the `@jellyfin/sdk`. Credentials stored as cookies via server actions in `src/actions/store/server-actions.ts`. The `useAuth` hook in `src/hooks/useAuth.ts` reads cookies on mount. The `(main)` layout redirects unauthenticated users to `/login`.

## Key Conventions

- ESLint disables `@typescript-eslint/no-explicit-any`, `@next/next/no-img-element`, `react-hooks/set-state-in-effect`, and `react-hooks/static-components`
- No test suite or test scripts configured
- The `ignoreScripts` in package.json suppresses native build scripts for `sharp` and `unrs-resolver`
- `scripts/bump-version.mjs` bumps version in package.json via `bun run scripts/bump-version.mjs -- --level=patch|minor|major`
