# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:4321
npm run build     # production build
npm run preview   # preview production build
```

No test, lint, or format commands are configured.

## Environment Variables

Copy `.env.example` and populate all four variables (the example file is incomplete):

```
SUPABASE_URL=
SUPABASE_KEY=         # service/secret key — used by supabaseServer.ts (API routes)
SUPABASE_ANON_KEY=    # public anon key — used by supabase.ts (Svelte components)
JWT_SECRET=           # defaults to 'id-flow-secret-key-change-in-production' if unset
```

## Architecture

"Kasku" (branded "ID Flow") — personal/household finance tracking app. Mobile-first; `/` redirects to `/mobile`.

**Stack**: Astro 6 (SSR, Netlify adapter) + Svelte 5 + Tailwind CSS 4 + Supabase (PostgreSQL) + custom JWT auth (bcryptjs).

### Routing

- **Pages** (`src/pages/`): `/login`, `/mobile`, `/transactions`, `/types`, `/users`, `/stats`, `/recap`
- **API** (`src/pages/api/`): REST endpoints for auth, users, transactions, types, stats, recap, grafik

### Auth & Middleware

`src/middleware.ts` protects all page routes except `/login` and `/api/*`. Authenticated user is in `context.locals.user`.

Custom JWT auth (not Supabase Auth) — tokens stored in `auth_token` cookie or `Authorization: Bearer` header, expire in 365 days.

Use `getAuthUser(request)` from `src/lib/auth.ts` inside API routes to verify the caller.

### Two Supabase Clients

- `src/lib/supabaseServer.ts` — uses `SUPABASE_KEY` (service role); use in API routes (`src/pages/api/`)
- `src/lib/supabase.ts` — uses `SUPABASE_ANON_KEY` (public); use in Svelte components

### Client API Layer

`src/lib/api.ts` is the browser-side fetch wrapper used in Svelte components. It auto-attaches the JWT token from cookies as a `Bearer` header. Exports: `userApi`, `transactionApi`, `typeApi`, `statsApi`, `recapApi`, `grafikApi`.

### Database Conventions

- **Tables**: `user`, `transaction`, `type`
- **IDs**: Transaction IDs are `string` (uuidv7); User and Type IDs are `number`
- **Soft deletes**: Transactions use `deleted_at`/`deleted_by` — never hard-delete
- **Audit fields**: `created_by`, `updated_by`, `created_at`, `updated_at` on transactions
- `supabase-setup.sql` is outdated (creates a `todos` table) — do not use as schema reference

### Shared Types

`src/lib/types.ts` contains all shared TypeScript interfaces.

## Gotchas

- `TodoList.svelte` and `Counter.svelte` are leftover Astro scaffolding — not part of the app
- `src/pages/api/transactions/index.ts` handles both GET (paginated list with filters) and POST (create, or update if `id` is present in the body)
- `src/lib/grafik/` routes (`/api/grafik` and `/api/grafik/tipes`) exist but are not in the pages list — they power chart data for the mobile dashboard
