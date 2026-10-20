# Architecture Decision Log

Each entry: **context → decision → reasons → alternatives → trade-offs → status**.
Status values: **Accepted**, **Proposed** (awaiting the owner's approval), **Superseded**.
Never edit an accepted decision silently. Add a new entry that supersedes it.

---

## D-001 — Learning-first, phase-based development
- **Context:** the owner is learning full-stack development while building the game.
- **Decision:** build in small ordered phases (`ROADMAP.md`). Every step follows the
  A–H teaching format in `CLAUDE.md`, and we advance only on `NEXT`.
- **Reasons:** small steps are easier to understand, verify and commit.
- **Alternatives:** generate the whole app at once (fast, but teaches nothing and is hard to debug).
- **Trade-offs:** slower progress, but in exchange you understand everything that gets built.
- **Status:** Accepted (2026-10-19).

## D-002 — Initial technology stack
- **Decision:** Next.js (App Router) + React + TypeScript; plain CSS (CSS Modules) — *superseded by D-016: Tailwind CSS*;
  Google Maps Embed API for panoramas; Leaflet + OSM-compatible tiles for the guessing map;
  Next.js route handlers for the backend; MongoDB + Mongoose on Atlas. Auth, WebSockets and
  Redis are deferred to later phases. Details: `TECH_STACK.md`.
- **Reasons:** one project for frontend and backend reduces setup while still teaching the
  client/server split. The Embed API is documented by Google as no-charge.
- **Alternatives:** see D-003. Maps JavaScript API Street View gives more control but is billed.
- **Trade-offs:** Next.js hides some HTTP details, which we explain explicitly. The Embed API gives limited
  control and no load-failure signal.
- **Status:** Accepted (2026-10-19).

## D-003 — Backend lives in Next.js API routes; app at the repo root
- **Context:** the owner considered a separate Express + TypeScript backend versus Next.js
  API routes. The original empty `Server/` folder was later deleted by the owner.
- **Decision:** use **Next.js API routes** (route handlers) for the backend. The Next.js
  app lives at the **repository root** (`WhereOnEarth/`), not in a subfolder.
- **Why root:** this is the standard layout for a single application. Commands run from the
  project folder with no extra `cd`, and it matches official docs and most tutorials. If Phase 9
  needs a separate WebSocket service, it gets its own folder then.
- **Reasons:** one project and one deployment. Frontend and backend share TypeScript types
  directly, and there is no CORS configuration (rules that allow one website to call another's API).
- **Alternatives:** a separate Express backend. This is very common in industry, makes HTTP fully
  explicit, and would double as the WebSocket server. It was rejected for now in favor of simplicity.
  For placement, a `web/` subfolder (a "monorepo" layout) was the alternative. It is only useful once
  there are several apps, and we can restructure then if needed.
- **Trade-offs:** Next.js abstracts some HTTP plumbing, which we compensate for by explaining it in
  Phase 2 and Phase 5. Multiplayer will still likely need a separate service.
- **Status:** Accepted (2026-10-19).

## D-004 — Location selection strategy
- **Context:** random coordinates rarely have Street View coverage, and the Embed iframe gives
  our code no success or failure signal.
- **Proposal:** use a curated pool of pre-validated locations stored in a `Location`
  collection. Phase 4 seeds a small hand-picked list. Phase 8 adds validation through the
  Street View Image Metadata endpoint (documented as not charged), run server-side.
- **Alternatives:** pure random (fails most of the time) or random + live check per round (slow, rate-limited).
- **Open item:** verify Google terms on storing data returned by Google before storing it.
- **Status:** **Proposed.** Finalized in Phase 8.

## D-005 — Server-authoritative scoring
- **Decision:** the server stores the true locations and computes distance and score. The client
  sends only guesses. Scoring logic lives in pure functions (`lib/game/`).
- **Reasons:** prevents score tampering, and the pure functions are easy to test.
- **Trade-offs:** none significant now that the backend is built first. The server owns scoring from the start.
- **Status:** Accepted.

## D-007 — Vitest for unit tests; tests live next to the code
- **Decision:** use Vitest (`npm test` runs once, `npm run test:watch` re-runs on save).
  Test files sit beside the file they test (`distance.ts` + `distance.test.ts`).
- **Reasons:** Vitest is recommended in the bundled Next.js docs, understands TypeScript with no
  build step, and is fast. Keeping tests next to the code makes missing tests obvious.
- **Alternatives:** Jest (older and very common, but needs extra TypeScript setup); a separate
  `tests/` folder (also common, but it hides which files lack tests).
- **Details:** installed only `vitest` for now. React testing packages wait until Phase 7.
  We use Vite's built-in `resolve.tsconfigPaths` instead of the `vite-tsconfig-paths` plugin
  the docs mention, because Vite now supports it natively, which means one dependency fewer.
  `@types/node` was raised from ^20 to ^24 to match the installed Node 24 (Vitest 5 requires ≥22).
- **Status:** Accepted (2026-10-19).

## D-008 — Scoring formula: exponential decay, max 5000
- **Decision:** `score = round(5000 × e^(−distanceKm / 2000))`, with full 5000 within 50 m.
  Constants `MAX_SCORE`, `SCORE_DECAY_KM`, `PERFECT_GUESS_KM` live in `src/lib/game/scoring.ts`.
  Invalid input (negative, NaN, Infinity) throws `RangeError`.
- **Reasons:** 5000 per round is the genre standard. Exponential decay rewards close guesses
  strongly, never goes negative, and is smooth (farther is never better). The named constants make
  balancing a one-line change.
- **Alternatives:** a linear drop (every km is worth the same, which feels wrong at both ends); a
  decay scaled to map size (useful later for country-only maps, so revisit then).
- **Status:** Accepted (2026-10-19).

## D-009 — Game data model: embedded rounds with an answer snapshot
- **Decision:** a `Game` document embeds exactly 5 `rounds`. Each round stores `locationId`
  (ref) **plus a copy** of the answer (`answer {lat,lng}`, `country`). `guess`/`distanceKm`/
  `score`/`guessedAt` stay `null` until the player guesses. `status` is an enum (`in_progress`/`completed`).
- **Reasons:** rounds never exist without their game and are always read together, so embedding
  means one read and one write. The snapshot keeps history correct even if a location is later edited.
  The answer lives only on the server (anti-cheat, D-005).
- **Alternatives:** a separate `rounds` collection (more queries, no benefit); storing only
  `locationId` (history breaks if the location changes).
- **Status:** Accepted (2026-10-20). A `userId` will be added in Phase 6.

## D-010 — Seeding via a local `tsx` script, idempotent
- **Decision:** `npm run seed` = `tsx --env-file=.env.local scripts/seed-locations.ts`. It inserts
  `scripts/locations-data.ts` only if `locations` is empty.
- **Reasons:** seeding is an admin task, and a script cannot be triggered from the internet (an API route could).
  `tsx` runs TypeScript and resolves `@/` paths. Node's built-in `--env-file` loads secrets. The empty-check
  makes re-runs safe.
- **Alternatives:** Node's native type stripping (cannot resolve `@/` aliases); an admin API route (security risk).
- **Status:** Accepted (2026-10-20).

## D-011 — Authentication: Better Auth with email + password
- **Decision:** Better Auth 1.7 (`src/server/auth.ts`), MongoDB adapter (reusing Mongoose's
  driver via `mongoose.mongo.MongoClient`), email + password (min 8 chars), `nextCookies` plugin.
  Mounted at `/api/auth/[...all]`. Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- **Reasons:** stable (1.x), officially supports Next.js 16 and MongoDB, no schema migrations for
  MongoDB, hashes passwords and manages sessions/cookies for us, and has built-in CSRF origin checks
  and rate limiting. Email + password needs no third-party accounts.
- **Alternatives:** Auth.js / next-auth v5 (still beta; discourages credentials login); writing auth ourselves
  (high security risk); Google/GitHub login (needs OAuth app setup, which can be added later as a Better Auth provider).
- **Trade-offs:** no email verification or password reset yet (both need an email-sending service). Revisit before
  launch (Phase 10).
- **Status:** Accepted (2026-10-20).

## D-012 — Game ownership and guest play
- **Decision:** `Game.userId` = the signed-in player's id, or `null` for guests. A player's game is visible
  and playable only by that player. Others get **404**, not 403, so we don't reveal that it exists. Guest games
  stay accessible to anyone holding the id. Guest games never appear in history or the leaderboard.
- **Reasons:** keeps the game playable without an account, while protecting players' games.
- **Status:** Accepted (2026-10-20).

## D-013 — Leaderboard = best completed game per player
- **Decision:** rank players by their single best completed game (ties: earlier `completedAt` wins).
  Show display name, best score, games completed, and date. **Never e-mail.** `?limit=` 1–50.
  Added `Game.completedAt` and indexes `{userId, createdAt}` and `{status, userId, totalScore}`.
- **Alternatives:** sum of all scores (rewards playing more, not playing better); average (noisy with few games).
- **Status:** Accepted (2026-10-20).

## D-014 — Street View via the Embed iframe; the current round's location is sent to the browser
- **Decision:** `PublicGame.currentPanorama` = the coordinates of the **current** round only (null when
  finished). `src/components/StreetViewPanorama.tsx` renders
  `https://www.google.com/maps/embed/v1/streetview?key=…&location=lat,lng`. The key is the public
  `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`, restricted by HTTP referrer and to the Maps Embed API.
- **Reasons:** the Embed API is documented as no-charge and unlimited. The iframe cannot work without a location.
- **Trade-off (accepted, documented):** a determined player can read the current round's coordinates
  in the browser's developer tools. Countries and future rounds stay hidden, and scoring stays server-side.
  Possible improvement: send a panorama ID (via the server-side Street View metadata endpoint) instead of coordinates.
- **Alternatives:** Maps JavaScript API Street View (billed; still exposes the location to the browser).
- **Status:** Accepted (2026-10-20). Done ahead of Phase 7 at the owner's request.

## D-015 — Guessing map: Leaflet + OpenStreetMap tiles (dev), configurable provider
- **Decision:** `src/components/GuessMap.tsx` (react-leaflet 5 / Leaflet 1.9.4), loaded client-only via
  `next/dynamic({ ssr: false })` in `GuessMapLoader.tsx`. Markers are `CircleMarker`s (no image assets).
  Clicks use `latlng.wrap()` so longitude stays in −180..180. Tiles are `tile.openstreetmap.org`, overridable with
  `NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` (`src/lib/map/tiles.ts`).
- **Reasons:** free, open source, independent of Google. The OSM tile policy allows light interactive use with
  visible attribution, HTTPS and no bulk downloads, but has no SLA and is not meant for production traffic.
- **Before launch (Phase 10):** switch to a production tile provider or self-hosting.
- **Status:** Accepted (2026-10-20).

## D-016 — Styling with Tailwind CSS v4 (supersedes the "plain CSS / CSS Modules" part of D-002)
- **Decision:** Tailwind CSS 4.3.3 via `@tailwindcss/postcss` (`postcss.config.mjs`) and `@import "tailwindcss"`
  in `src/app/globals.css`. Our palette lives in CSS variables (light + dark), exposed to Tailwind with
  `@theme inline` as `bg`, `fg`, `muted`, `primary`, `primary-fg`, `card`, `border`, `error`
  (e.g. `bg-primary`, `text-muted`). No CSS Module files remain. Leaflet keeps its own `leaflet.css`.
- **Reasons:** the owner's choice. Tailwind is the industry standard for React/Next.js, keeps styles next to the markup,
  and ships only the classes we use.
- **Trade-offs:** long `className` strings. Repeated lists are kept in constants (e.g. `BUTTON`, `CARD` in `PlayGame.tsx`).
- **Status:** Accepted (owner, 2026-10-20).

## D-006 — Backend-first build order
- **Context:** the owner wants to build the backend (models, API) before the frontend.
- **Decision:** reorder the roadmap: logic → database/models → game API → auth → frontend →
  maps → multiplayer. Test the backend with an HTTP client until the UI exists.
- **Reasons:** you learn data modeling, APIs and validation first, and server-authoritative scoring
  exists from day one. No Google key is needed until Phase 8.
- **Alternatives:** the original frontend-first order (visual progress sooner).
- **Trade-offs:** no visual game for several phases, and API design happens before we see how the
  UI uses it, so small API adjustments may be needed in Phase 7.
- **Status:** Accepted (owner, 2026-10-19).
