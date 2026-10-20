# Progress

_Last updated: 2026-10-20_

## Current phase
**Phase 4 is complete.** Waiting for `NEXT` → **Phase 5: Game API** (start game, guess, results,
validation, server-side scoring).

**Security TODO (Phase 10):** the DB password appeared in a chat screenshot, so rotate it before going public.

**Working style (from `CLAUDE.md` §4):** the owner writes every code file by pasting from chat,
one small file at a time, and runs all commands. Claude explains "what we're doing now" first,
uses `/` in paths, and checks file locations and saves on disk (the owner has twice left a file unsaved/empty),
and updates `docs/`. When the owner explicitly asks Claude to make a specific change, Claude does it.

**Git:** local commit `41439dd` includes the app, tests, `db.ts` and both models. Uncommitted:
`scripts/`, the `package.json` (tsx + seed script), and docs. Nothing has been pushed since `759bc48`. The owner pushes later.

## Completed

### Phase 4 ✅ (2026-10-20)
- Atlas: project "WhereOnEarth", free cluster `whereonearth` (AWS Mumbai, M0 limits verified:
  512 MB, 100 ops/s, 500 connections, pauses after 30 days idle). DB user `keshavdivate86_db_user`.
- IP access list: `103.167.184.90` **and** `14.96.211.202` (the office network uses both).
- `.env.local`: **standard** `mongodb://` URI (the `+srv` form fails locally, see Known issues), with
  database `whereonearth`. `.env.example` with placeholders.
- mongoose 9.11.2 (dependency), tsx 4.23 (dev). `src/server/db.ts`, and `/api/health` reports database status.
- Models: `src/server/models/Location.ts`, `src/server/models/Game.ts` (D-009).
- `scripts/locations-data.ts` (20 locations, 6 continents), `scripts/seed-locations.ts`,
  `npm run seed` (D-010). Seeded 20, and a re-run was skipped. Claude wrote `seed-locations.ts` and
  the `package.json` script at the owner's request.
- Errors fixed along the way: db name typo (`/clear`), SRV DNS refusal, password `0`/`O`, second office IP.

### Phase 3 ✅ (2026-10-19)
Written by the owner from chat:
- `src/app/api/health/route.ts`: `GET /api/health` (re-created after the rebuild).
- `src/types/geo.ts`: `Coordinates`.
- `src/lib/game/distance.ts`: `haversineDistanceKm()`, with 6 tests in `distance.test.ts`.
- `src/lib/game/scoring.ts`: `calculateScore()` (D-008), with 6 tests in `scoring.test.ts`.
- `vitest.config.mts`.
- Result: `npm test` shows 12/12 passing. `npx tsc --noEmit` is clean.

Other changes:
- Vitest 5.0.5 installed, `@types/node` raised to ^24 (D-007).
- `.vscode/settings.json` turns off compact folders, so `src` and `app` show separately.
- Issues hit and fixed: `geo.ts` was first created in `src/app/types` (moved to `src/types`), and
  it was empty because it was not saved (TS2306 "is not a module").

### Phase 2 ✅ (2026-10-19)
- Next.js 16.4.2 scaffolded with `create-next-app` (TypeScript, App Router, `src/`, ESLint,
  no Tailwind, `--empty`) in a temp folder, then copied to the repo root.
- Versions: next 16.4.2, react 19.3.0, typescript 5.9.3, eslint 9.39.5.
- Cache Components + Partial Prefetching are on (Next.js 16 defaults). GET handlers that must run per
  request call `await connection()`.
- `AGENTS.md` added and referenced from `CLAUDE.md`, plus a project `README.md`.
- The owner verified `/api/health` in the browser.

### Phase 1 ✅ (2026-10-19)
- Git repo on `main`, local identity `Keshav9175 <keshavdivate86@gmail.com>`, remote
  `https://Keshav9175@github.com/Keshav9175/WhereOnEarth.git`, last pushed commit `759bc48`.

### Phase 0 ✅ (2026-10-19)
- Docs and `CLAUDE.md` created. Decisions: backend-first (D-006), Next.js API routes at the
  repo root (D-003). Claude makes technical decisions and explains them.

## Known issues (accepted, revisit in Phase 10)
- **`mongodb+srv://` fails on the owner's machine** (`querySrv ECONNREFUSED`): Node's DNS
  server is `127.0.0.1` (a local DNS proxy, likely security/VPN software), which refuses SRV/TXT
  lookups, although Windows `nslookup`, 8.8.8.8 and 1.1.1.1 resolve them fine. The fix is to use Atlas's
  **standard (non-SRV) connection string** (`mongodb://host1,host2,host3/whereonearth?ssl=true&
  authSource=admin&replicaSet=atlas-hgpkvb-shard-0&...`). Verified with ping `{ok:1}` on 2026-10-20.
  Hosting platforms usually support `+srv`, so the production URI may differ.
- `npm audit`: 5 high-severity issues, all in dev-only ESLint tooling (`braces` via
  `eslint-config-next`). Production dependencies: 0. Do **not** run `npm audit fix --force`.
- npm warns that eslint 9 is deprecated. Kept, because it is the version the official generator chose.
- `tsc --noEmit` before the first `dev`/`build` reports `Cannot find name 'LayoutProps'`.
  This is expected, because Next.js generates that type. Run `npm run dev` or `npx next typegen` first.

## Exact next step
The owner commits locally (`git add .` + `git commit`). Then `NEXT` → Phase 4, step 1:
explain databases/MongoDB, then the owner creates a free MongoDB Atlas account and cluster
(verify current free-tier limits first).
