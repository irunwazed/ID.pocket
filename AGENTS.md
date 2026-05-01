# AGENTS.md

## Project Overview

"Kasku" (branded "ID Flow") — a personal/household finance tracking app.

## Tech Stack

- **Framework**: Astro 6 (SSR mode, `output: 'server'`) with Svelte 5 integration
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Database**: Supabase (PostgreSQL) — migrated from MySQL (see `data.sql` for original schema)
- **Auth**: Custom JWT + bcryptjs (not Supabase Auth). Tokens stored in cookies or Bearer headers.
- **Deploy**: Netlify (`@astrojs/netlify` adapter)
- **Node**: >= 22.12.0 required

## Commands

- `npm run dev` — dev server (default port 4321)
- `npm run build` — production build
- `npm run preview` — preview production build locally

No test, lint, or format commands are configured.

## Environment Variables

Copy `.env.example` and set all of these (the example file is incomplete):

```
SUPABASE_URL=
SUPABASE_KEY=         # service/secret key — used by supabaseServer.ts
SUPABASE_ANON_KEY=    # public anon key — used by supabase.ts (client-side)
JWT_SECRET=           # defaults to 'id-flow-secret-key-change-in-production' if unset
```

**Two separate Supabase clients exist** — `src/lib/supabaseServer.ts` uses `SUPABASE_KEY` (service role), `src/lib/supabase.ts` uses `SUPABASE_ANON_KEY` (public). Use the server client in API routes and the client in Svelte components.

## Architecture

### Routing

- **Pages** (`src/pages/`): Astro file-based routing
  - `/` — dashboard, `/login`, `/users`, `/transactions`, `/types`, `/stats`, `/recap`
  - `/mobile` — mobile view with bottom tab navbar (home, rekap, transaksi, pengaturan)
- **API** (`src/pages/api/`): REST endpoints
  - `/api/auth/login`, `/api/auth/logout`
  - `/api/users`, `/api/users/[id]`
  - `/api/transactions`, `/api/transactions/[id]`, `/api/transactions/years`
  - `/api/types`, `/api/types/[id]`
  - `/api/stats`, `/api/recap`

### Middleware

`src/middleware.ts` protects all page routes except `/login` and `/api/*`. Unauthenticated users are redirected to `/login`. Authenticated user data is available in `context.locals.user`.

### Key Conventions

- **Soft delete**: Transactions use `deleted_at`/`deleted_by` fields, not hard deletes
- **Audit fields**: `created_by`, `updated_by`, `created_at`, `updated_at` on transactions
- **Auth helpers**: `src/lib/auth.ts` provides `getAuthUser()`, `verifyToken()`, `getTokenFromCookie()`, `getTokenFromHeader()` — use `getAuthUser()` in API routes
- **Client API layer**: `src/lib/api.ts` is the browser-side fetch wrapper that auto-attaches JWT from cookies
- **Types**: Shared interfaces in `src/lib/types.ts`

### Database Tables

`user`, `transaction`, `type`. The `supabase-setup.sql` is **outdated** (creates a `todos` table) — do not use it as a schema reference. See `data.sql` for the actual MySQL schema or check Supabase directly.

## Gotchas

- The `todo` components (`TodoList.svelte`, `Counter.svelte`) appear to be leftover scaffolding, not part of the core app
- `src/pages/mobile/index.astro` now has a full mobile view with bottom tab navigation (uses `MobileLayout.astro` and `MobileApp.svelte`)
- API routes in `src/pages/api/transactions/index.ts` handle both GET (paginated list with filters) and POST (create or update if `id` present)
- Transaction IDs in Supabase are strings (uuidv7), but User and Type IDs are numbers