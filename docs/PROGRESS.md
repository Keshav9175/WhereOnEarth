# Progress

_Last updated: 2026-10-20_

## Current phase
**The backend is complete (Phases 5 + 6).** Waiting for the owner's manual test (restart `npm run dev`
first, because `.env.local` gained `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`), then `NEXT` → **Phase 7: Frontend**.
Confirm the working mode for the frontend (owner pastes vs Claude builds) at the start of Phase 7.

**Security TODOs (Phase 10):** rotate the DB password (it appeared in a chat screenshot); add email
verification and password reset (D-011); review rate limits; decide the Atlas IP list for hosting.

**Working style:** see `CLAUDE.md` §4. Phases 1–5 code was written by the owner from chat. Phase 5's
end (test fix) and Phase 6 were built by Claude at the owner's request, and the owner tests manually.

**Git:** local commits up to `6119752` (Phase 4). Uncommitted: all of Phases 5–6. Nothing has been pushed
since `759bc48`. The owner pushes later.

## In progress: Street View (Phase 8 work, pulled forward at the owner's request, 2026-10-20)
- Built: `currentPanorama` in `PublicGame` (D-014), `POST /api/games` returns the full safe view,
  `src/components/StreetViewPanorama.tsx` (+ CSS), `src/app/globals.css`, and a **temporary** `/play` page
  (`src/app/play/PlayGame.tsx`) with typed lat/lng guesses until the Leaflet map exists.
- 29 tests; tsc, lint and build are clean. Smoke test: `/play` loads and only round 1's location is exposed.
- **Waiting on the owner:** create a restricted Maps Embed API key (docs/DEVELOPMENT_WORKFLOW.md §8),
  add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` to `.env.local`, restart dev, and test `/play`.
- ✅ The owner played a full 5-round game on `/play` with Street View (score 404).
- ✅ Leaflet guessing map built (D-015): `GuessMap.tsx`, `GuessMapLoader.tsx`, `src/lib/map/tiles.ts`;
  `/play` now has panorama + click-to-guess map, a result view (guess vs answer with a line), "Next round",
  and a final summary. tsc, lint, 29 tests and build are clean. **Owner browser test pending.**
- Next: remaining Phase 7 UI: home page, sign-up/sign-in pages, profile/history, leaderboard page, timer.

## In progress: accounts UI (Phase 7, 2026-10-20) — owner writing code from chat
- Styling switched to Tailwind CSS v4 (D-016). Hydration warning from Grammarly fixed with
  `suppressHydrationWarning` on `<body>`.
- Done: `src/lib/auth-client.ts` (Better Auth React client); `/sign-up` (SignUpForm + page);
  `/sign-in` (SignInForm + page); shared `src/components/formStyles.ts`;
  **Google sign-in** (OAuth client in Google Cloud, Testing mode with the owner as test user;
  `GOOGLE_CLIENT_ID/SECRET` in `.env.local`; `socialProviders.google` in `auth.ts`;
  `GoogleSignInButton.tsx`). Verified: a Google user was created with `emailVerified: true`.
- Done: `SiteHeader.tsx` in `layout.tsx` (signed-in name + Sign out, or Sign in / Create account);
  pages use `flex-1` under the header.
- Next: **email verification for email+password accounts — FREE option: Gmail + Nodemailer
  (App Password)**, not Resend (real recipients would need a paid domain). Owner requirement: everything free.

## Completed

### Phase 6 ✅ (2026-10-20, built by Claude)
- Better Auth 1.7.11 (`src/server/auth.ts`, `/api/auth/[...all]`) with the MongoDB adapter, email + password (D-011).
- `.env.local` + `.env.example`: `BETTER_AUTH_SECRET` (generated, 44 chars, never displayed), `BETTER_AUTH_URL`.
- `Game.userId` + `completedAt`, plus indexes. Ownership rules (D-012): `getGameForPlayer`, `canAccessGame`.
- New endpoints: `GET /api/me`, `GET /api/me/games`, `GET /api/leaderboard` (D-013).
- `connection()` placed before try/catch in per-request GET routes (otherwise the prerender bail-out gets caught).
- Tests: 28 unit tests. tsc, lint and `npm run build` are clean. A 22-step E2E test on port 3100 passed (sign-up/in/out,
  short/wrong password, 404 for others' games, guest games, history, stats, leaderboard, `limit` validation,
  CSRF origin rejection). The test users, sessions, accounts and games were deleted afterwards.

### Phase 5 ✅ (2026-10-20)
- Owner wrote from chat: `gameService.ts` (createGame, getGameById→now getGameForPlayer, submitGuess),
  `publicGame.ts`, the `games` routes, `guess.ts` (Zod), `guess.test.ts`. Zod 4.6.7 installed.
- Bug found before shipping: a race condition (double-click scoring twice). Fixed with an atomic
  `findOneAndUpdate` plus a `$type: "null"` guard (plain `null` also matches missing fields).
- `publicGame.test.ts` initially failed typecheck (a Mongoose subdocument type). Fixed by making
  `toPublicGame` take plain `StoredGame` data.
- The owner played a full game via the API (465 points). Refusals verified: 400/404/409.

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
