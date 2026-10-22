# Progress

_Last updated: 2026-10-20_

## Current phase
**The backend is complete (Phases 5 + 6).** Waiting for the owner's manual test (restart `npm run dev`
first, because `.env.local` gained `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`), then `NEXT` → **Phase 7: Frontend**.
Confirm the working mode for the frontend (owner pastes vs Claude builds) at the start of Phase 7.

**Security TODOs (Phase 10):** rotate the DB password (it appeared in a chat screenshot); add password reset (D-011; email verification done, D-021); review rate limits; decide the Atlas IP list for hosting.

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
- ✅ Email verification (2026-10-21, Claude-built, D-021): the owner created a game Gmail with 2-Step Verification
  and an App Password (`GMAIL_USER`/`GMAIL_APP_PASSWORD` in `.env.local`). Nodemailer 10.0.16 + @types/nodemailer
  8.0.2; `src/server/email.ts`; `requireEmailVerification` + `emailVerification` options in `auth.ts`; sign-up
  shows "check your inbox" instead of signing in; sign-in shows "verify first, new link sent"; new page
  `/email-verified` (success / expired / invalid). Verified: Gmail SMTP login OK, tsc + lint clean, 52 tests pass,
  `/email-verified` renders both states. **VERIFIED end-to-end (2026-10-22, Chrome + owner inbox):** sign-up 200 + "check your inbox"; sign-in before verifying → 403 + "verify first" + new email; owner clicked the link → `emailVerified: true`; sign-in then works. Sign-in/sign-up/email-verified pages show only the logo (`PageShell minimal`); 5xx errors show "Our server had a problem".
  Not done yet: password reset (it can reuse `sendEmail`).
- ✅ Leaderboard page (Claude-built, 2026-10-20): `src/components/LeaderboardTable.tsx` (async server
  component calling `getLeaderboard()` directly, `connection()` + empty state), `src/app/leaderboard/page.tsx`
  (`<Suspense>` fallback), plus a "Leaderboard" link in `SiteHeader`. Build shows `◐ /leaderboard` (partial prerender:
  static shell + streamed data). Verified live on the dev server (empty state).
- ✅ New home screen (2026-10-21, Claude-built, design requested by the owner from a WorldGuessr-style mockup):
  full-screen background `public/Twilight Over the Enchanted Castle City.png` (static import → next/image
  optimised, blur placeholder, `loading="eager"` + `fetchPriority="high"`, since `priority` is deprecated in Next 16),
  left game-mode menu (`src/components/home/HomeMenu.tsx` — only Singleplayer works, others "Soon"),
  centre `PlayerCard` (signed-in name + best score + games completed, or a guest invite), top-right `UserChip`,
  `HomeFooter` (community card + icon shortcuts, Leaderboard live), and an "EXPLORE / GUESS / COMPETE" tagline.
  `SiteHeader` is hidden on `/` (the home has its own chip). Added `getSignedInUser()` to `src/server/session.ts`
  for server components. Icons: `lucide-react` (D-017). Verified in Chrome at 1536×735: fits one screen, no console errors.
- ✅ Home screen REDESIGNED (2026-10-21) from a second reference ("GeoQuest"-style), replacing the castle design:
  `public/WhereOn Earth 3D Logo.png` (logo) + `public/Vibrant Cartoon World Map Ocean Background.png` (map; the castle
  image is no longer used but kept). `HomeNavBar` (logo, Home/Map/Leaderboard/Community — Map & Community "soon"),
  `HomeUserArea` (initial, name, best score, `SignOutButton`; or Sign in / Create account), `GameModeCards` (7 small 64px
  cards, one per row, each with a code-drawn SVG landscape from `ModeScenes.tsx`; calmer 3-family palette like the
  reference: blue = solo, purple = competitive, green = friends, navy = daily; only Singleplayer is a link),
  `CompassRose`. The map blends seamlessly: page bg = radial gradient of the image's own ocean colours (#013b7f → #01275e,
  sampled from the image) + a CSS `mask-image` fading all 4 image edges (`mask-composite: intersect`) applied to the image element itself, so the fades start at the picture edges.
  The headline text was removed at the owner's request (a `sr-only` `<h1>` remains for screen readers).
  Not shown on purpose: online-player count, notifications, levels (no fake data). Verified in Chrome at 1536×735.
- ✅ Game modes simplified to 4 cards (2026-10-21, static UI): Singleplayer (link to /play, unchanged), Ranked and
  Unranked (expand to "1 vs 1" / "2 vs 2"), Party (expands to "Create Party" / "Join Party"). Sub-options are
  `aria-disabled` buttons labelled "Coming soon" (no routing or logic yet — Phase 9). Expand in place (grid-rows
  0fr→1fr animation), only one open at a time (`openId` state in `GameModeCards`), close with ✕, Esc, or by clicking
  the card again; focus returns to the card; closed panels are `inert` (not tabbable). `GameModeCards` is now a client
  component. Removed Daily Challenge, the separate 2v2 card, the `DAILY` gradient, and `TeamsScene`/`CabinScene`/
  `SunriseScene`. Verified in Chrome: open/close, one-at-a-time, Esc + focus return, ✕, inert, and 390px mobile (no overflow).
- ✅ Full-screen game screen (2026-10-21): `/play` starts a game automatically (no Start screen; a ref guard stops
  React Strict Mode creating 2 games). The Street View panorama fills the window; the guess map floats bottom-left
  (grows on hover/focus; `ResizeWatcher` calls Leaflet `invalidateSize()` when its box changes); the top bar (logo,
  round, score) is centred; the result is a full-screen map (fitBounds padded for the top bar + result card) with a glass
  card; the summary has Play again / Home. Navy/glass/amber styling matches the home screen. `SiteHeader` is hidden on `/play`.
  `StreetViewPanorama` and `GuessMap` accept `className`. Verified a full round in Chrome.
- ✅ Consistent inner pages (2026-10-21): `/leaderboard`, `/sign-in`, `/sign-up` now use `PageShell` (home's ocean
  background + faint world map + the shared `NavBar`, which replaced `HomeNavBar` and takes `current` to highlight a
  pill). `AuthCard` = shared glass card for both auth pages; `formStyles.ts` restyled (glass inputs, amber button,
  `ERROR_TEXT`/`HINT_TEXT`/`TEXT_LINK`); white Google button; leaderboard has gold/silver/bronze rank badges.
  The old `SiteHeader` was removed from `layout.tsx` and deleted. tsc, lint, 29 tests pass; checked in Chrome.
- 🔄 Random location engine, step 1 of 3 (2026-10-21, D-019): generator script `npm run generate:locations`
  (`scripts/generate-locations.ts`, `scripts/countryBorders.ts`, `scripts/data/countries.geojson` from Natural Earth),
  pure geo logic `src/lib/geo/{countries,spacing}.ts`, Google check `src/server/services/streetViewMetadata.ts`.
  19 new tests (48 total) pass; borders verified (238 countries). **Owner action pending:** enable "Street View
  Static API", create the server-only key, add `GOOGLE_MAPS_SERVER_API_KEY` to `.env.local`
  (DEVELOPMENT_WORKFLOW §9) — DONE: first world run saved 2,347 locations (43,048 free checks). Fixed: Australia split into 3 shapes, and big sparse countries giving up too early; re-run pending for the 111 "no coverage" countries. Steps 2 (5 different countries per game + no recent
  repeats) and 3 (`map` tag) are next.
- ✅ Location engine step 2 (2026-10-21, D-020): `pickRounds` (5 different countries), recent-location exclusion
  (last 100 games) in `createGame`, guest cookie `woe_guest` → `Game.guestId`. 56 tests pass; verified with 3 guest
  games via the API: same guestId, 5/5 different countries each, 0 repeats (pool: 2,499 locations).
- ✅ Game screen polish (2026-10-22, D-021): OpenFreeMap vector map (Google-like colours, Latin labels) via MapLibre;
  SVG pins (blue guess, green flag answer, numbered on the summary); top bar = back button (Stay/Leave confirm) + logo
  left, round/score right (Google fullscreen button off); end screen = results panel (rating title, score %, best
  round, average miss, clickable rounds that fly the map) + full map. 63 tests pass, production build OK.
- ✅ Address card hidden (2026-10-21, D-018): Street View switched from the Embed iframe to the Maps JavaScript API
  (`addressControl: false`, `showRoadLabels: false`), one panorama per game. The guess map moved to bottom-right,
  inset 4rem from Google's control column. **Owner action pending:** enable "Maps JavaScript API", add it to the
  key's API restrictions, set the daily Dynamic Street View quota cap (~160), and optionally add
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (the old Embed key variable is used as a fallback).
  **Done 2026-10-21:** the owner enabled the Maps JavaScript API (it was already ticked on the key). The Maps JS API
  quota page has NO Street View-specific row, so the owner set "Map loads per day" = 160 and "3D Map loads per day" = 0.
  **VERIFIED (owner, 2026-10-21):** one game raised "Map loads per day" Current usage from 0 → 1, so Street View
  panorama loads DO count against that quota → the 160/day cap is a real hard stop (≤ 160 game starts per day,
  ≈ 5,000/month free tier). A server-side cap is not needed for now. Verified in Chrome: the panorama renders via the JS API, no errors, and the address card is hidden
  (Google renders it at 0×0). Also: the dev server got stuck in an HMR full-reload loop on /play after many edits; it was
  fixed by restarting with a clean `.next` cache.
- ✅ Profile page (2026-10-22, Claude-built): `/profile` (`src/app/profile/page.tsx`) with `PlayerProfile` (server component in
  <Suspense>: name, member since, 4 stat tiles, last 20 games via `getPlayerStats` + `listGamesForUser` in parallel) and
  `GameHistoryTable` (date, rounds, score / 25,000, "Unfinished" badge). Guests are redirected to `/sign-in` on the server
  (streamed redirect, because it runs inside Suspense). The name/initial in the top bar now links to `/profile`.
  tsc + lint clean; guest redirect verified. **VERIFIED in Chrome (2026-10-22):** opened from the top-bar name link; stats, history and the Unfinished badge render; no console errors.
- ✅ Password reset (2026-10-22, Claude-built, D-021): "Forgot password?" on sign-in → `/forgot-password` (same reply
  for every email) → email → `/reset-password?token=…` (new password twice) → all sessions revoked. Verified in Chrome:
  link request 200 + generic message, invalid-link page. **Owner click-through of the reset email pending.**
- 🔄 Maps (2026-10-22, D-022). Step 1 done (backend): `src/lib/maps/catalog.ts` (World + 6 continents), `continent` on
  locations (backfilled: europe 627, asia 568, south-america 428, north-america 422, africa 274, oceania 178, World-only 3),
  `mapId` on games, `POST /api/games {"map":…}` with Zod validation (`src/lib/validation/newGame.ts`). 73 tests pass.
  Verified with curl: Europe/Oceania games only draw from that continent; unknown map / bad JSON / extra field → 400.
  ✅ Steps 2–3 (2026-10-22): `/maps` page (`src/app/maps/page.tsx`, `src/components/maps/MapLibrary.tsx`, `getMapStats` in
  `src/server/services/mapService.ts`) with flags (flag-icons 7.5.0) and `countryCode` on locations (`npm run backfill:locations`);
  in-game `MapSwitcher` (`src/app/play/MapSwitcher.tsx`) + `/play?map=…` (`src/app/play/page.tsx`). Fixed a
  maplibre-gl-leaflet 0.1.4 bug ("reading 'getZoom'" after a map is removed) with a guard in `GameBaseMap.tsx`.
  Verified in Chrome: navbar → /maps, Play Europe, switch Europe→Asia and Africa→Oceania, no console errors.
  ✅ Country maps (2026-10-22): 41 countries with ≥ 20 spots, "Countries" section on /maps (grouped by continent, big
  flags) and in the in-game map list. Verified: curl jp/sn → 201 (Japan ×5), zz/FR → 400; Chrome: /maps countries, France
  and Japan games, no console errors (fixed a prerender error with `await connection()` in `src/app/play/page.tsx`).
  Next: map choice on Create Party (static, Phase 9).

## Known issues (2026-10-22)
- Atlas IP list: the owner's network can change (new IP `106.213.87.107` was added on 2026-10-22). Symptom: sign-in shows "server problem" / HTTP 500. Fix: Atlas → Network Access → Add Current IP, then restart `npm run dev`.
- `/api/health` can say "connected" while new database connections are refused (it reports Mongoose's cached state). Improve in Phase 10.
- Local test account: `keshavdivate27@gmail.com`, password in `.env.local` as `E2E_TEST_PASSWORD`.

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
