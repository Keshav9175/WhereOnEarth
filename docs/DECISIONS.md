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
- **Trade-offs:** no password reset yet (it needs email sending, which now exists: D-021). Email verification was
  added on 2026-10-21 (D-021). Password reset added 2026-10-22 (D-021).
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

## D-017 — Icons: lucide-react
- **Decision:** `lucide-react` 1.61 for UI icons (home menu, shortcuts, profile card).
- **Reasons:** free (ISC licence), the de-facto standard React icon set, tree-shaken (only imported icons ship),
  and icons are React components with `className` sizing (works with Tailwind). It avoids hand-written SVGs.
- **Note:** import `Map` as `MapIcon` to avoid shadowing JavaScript's built-in `Map`.
- **Status:** Accepted (2026-10-21).

## D-018 — Street View via the Maps JavaScript API (supersedes the Embed iframe part of D-014)
- **Context:** the Embed API always shows Google's address card ("31 Champs-Élysées, Paris"), which gives the
  answer away. The Embed API has no option to hide it, and covering it breaks the Google Maps Platform terms
  ("may not remove, alter, or obscure Google provided attribution, links… or notices").
- **Decision (owner: "we can't show the location name"):** `StreetViewPanorama` (client component) uses the Maps
  JavaScript API via `@googlemaps/js-api-loader` 2.x with `addressControl: false` and `showRoadLabels: false`.
  The nearest photo comes from `StreetViewService.getPanorama` (radius 1 km; not billed).
- **Staying free:** "Dynamic Street View" (Pro SKU) has 5,000 free per month and is billed per panorama *created*.
  ONE panorama per game (mounted for the whole game, `setPano()` per round, hidden during results), plus a daily
  quota cap (~160/day) set by the owner, so it can never be billed. Our own UI never covers Google's controls or credits
  (the top bar is centred, and the guess map is bottom-right, inset 4rem from the right edge and above the credit line).
- **Trade-off:** needs the "Maps JavaScript API" enabled on the key (owner action). The location is still visible to a
  determined player in browser tools (unchanged from D-014); scoring stays server-side.
- **Status:** Accepted (2026-10-21).

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

## D-019 — Random location engine: a pre-built pool from a generator script
- **Context:** the game picked 5 of only 20 seeded big-city locations, so games repeated and felt "always cities".
  WorldGuessr (studied as a *reference only*, cloned read-only to `c:/KIKI/worldguessr`, PolyForm Noncommercial —
  no code or data copied) serves random picks from huge pre-built pools (`world-main.json`: 147,453 checked spots).
- **Decision:** an offline script `npm run generate:locations` builds our own pool in MongoDB:
  random point inside a country (Natural Earth borders, public domain, `scripts/data/countries.geojson`) →
  Google's **official** Street View metadata check (free, no quota; `radius=1000`, `source=outdoor`, only
  "© Google" imagery) → reject if the panorama snapped across a border or is < 1 km from an existing location →
  save. Countries get √area-weighted targets (min 3) so small countries appear too; shapes sharing a code (Australia + its island territories) are merged; a country is abandoned after max(150, 25 × its target)
  misses in a row (no coverage), so sparse big countries (Australia) keep trying longer. Pure logic lives in `src/lib/geo/` (tested); the Google call in
  `src/server/services/streetViewMetadata.ts`.
- **Not copied from WorldGuessr:** its coverage check uses Google's internal `GeoPhotoService.SingleImageSearch`
  endpoint (not a public API) — we use the documented metadata API instead.
- **Trade-offs:** needs a second, server-only key (`GOOGLE_MAPS_SERVER_API_KEY`, restricted to the Street View
  Static API). Natural Earth's simplified coastlines can mark coastal roads as "sea" — such panoramas are accepted
  for the country being probed. The daily game limit (Map loads quota) is unchanged.
- **Next:** step 2 = pick 5 different countries per game and skip a player's recent locations; step 3 = a `map` tag.
- **Status:** Accepted (2026-10-21).

## D-021 — Email verification with Gmail + Nodemailer
- **Decision:** email + password accounts must verify their email before they can sign in
  (`requireEmailVerification: true` in `src/server/auth.ts`). Better Auth creates the signed link; we send it with
  **Nodemailer 10.0.16** through the game's Gmail account using an **App Password** (`src/server/email.ts`).
  Links last 1 hour, `autoSignInAfterVerification` signs the player in, and they land on `/email-verified`
  (which also explains expired/invalid links). `sendOnSignIn: true` acts as "resend": a correct password on an
  unverified account emails a fresh link. Google accounts are already verified by Google and are unaffected.
  Without `GMAIL_USER`/`GMAIL_APP_PASSWORD`, emails are printed to the terminal (local development still works).
- **Reasons:** free; no domain needed; Gmail's ~500 emails/day limit is far above our needs. Resending only after a
  correct password means nobody can flood a stranger's inbox. Sign-up returns the same response for new and existing
  emails, so it doesn't reveal who has an account.
- **Alternatives:** Resend / SendGrid / Postmark (better deliverability, but sending to real users needs a verified
  paid domain); our own SMTP server (too complex).
- **Trade-offs:** Gmail-sent mail can land in spam and isn't meant for large volumes; switch to a transactional email
  service with our own domain before a public launch. Users created before this change have `emailVerified: false`
  and get a link the next time they sign in.
- **Status:** Accepted (2026-10-21).

## D-020 — Round picking: different countries, no recent repeats, anonymous guest cookie
- **Context:** step 2 of the location engine (D-019). WorldGuessr's `repeatGuard` remembers each player's last
  5,000 spots (in localStorage for the web). We keep that memory on the server instead.
- **Decision:** `createGame` samples 40 random candidates excluding the locations of the player's last 100 games,
  then `pickRounds` (pure, tested) keeps the first one from each new country → 5 different countries when possible.
  If too few candidates remain (a player who has seen almost everything), it samples again without the exclusion.
  Signed-in players are matched by `userId`; guests get an anonymous random ID in an httpOnly cookie `woe_guest`
  (1 year, `sameSite: lax`), stored on their games as `guestId` (partial index). It is never sent in game data.
- **Why server-side:** answers never reach the browser before guessing (CLAUDE.md §7), so the browser can't know
  which spots it has seen; the database already has every round's `locationId`.
- **Trade-offs:** clearing cookies or switching browsers resets a guest's history (harmless — only repeats).
  Guest games are still open to anyone with the game link (unchanged access rule).
- **Status:** Accepted (2026-10-21).

## D-021 — Guess map background: OpenFreeMap vector map via MapLibre (Google-like style)
- **Context:** the owner wants the bright "Google Maps" look other geography games use (blue sea, green land,
  English names). WorldGuessr gets it from Google's internal tile server `mt{s}.google.com/vt` (not a public API —
  not copied). Google's official map would share the "Map loads per day" quota with Street View (~80 games/day).
  CARTO Voyager (free key) was tried first but is pastel and labels some places in local scripts.
- **Decision (owner approved the 2 packages):** `maplibre-gl` 6.15.0 (BSD-3) draws OpenFreeMap's free vector map
  (no key, no request limits, attribution added automatically) underneath Leaflet via
  `@maplibre/maplibre-gl-leaflet` 0.1.4 (ISC). Clicks, pins, lines and zoom code are unchanged. `toGameStyle`
  (pure, tested) recolours the "Liberty" style and shows labels in Latin letters only. If OpenFreeMap is
  unreachable, `GameBaseMap` falls back to raster tiles (`src/lib/map/tiles.ts`: CARTO with key, else OSM).
- **Worker file:** MapLibre draws in a background worker that Next.js doesn't serve after bundling ("Worker failed to load" →
  white map). `scripts/copy-maplibre-worker.mjs` (postinstall + prebuild) copies it to `public/maplibre/` (git-ignored,
  lint-ignored) and `setWorkerUrl()` points MapLibre there. Liberty's `natural_earth` picture layer is shown stronger
  (opacity 0.85→0.35) for green/beige land like the reference.
- **Trade-offs:** larger browser download (~200 KB gzipped, only on map screens); WebGL needed (all modern browsers).
  `npm audit` shows 5 high issues in `braces` via `eslint-config-next` (dev-only, pre-existing) — revisit in Phase 10.
- **Status:** Accepted (2026-10-22).

## D-022 — Maps: World + one per continent, chosen when a game starts
- **Decision:** a "map" is a named slice of the location pool. The catalogue lives in code
  (`src/lib/maps/catalog.ts`): World (default, every location) + Europe, Asia, Africa, North America,
  South America, Oceania. Each location stores `continent` (from Natural Earth's `CONTINENT`, same borders file
  as D-019; open-ocean island nations get `null` = World only). Games store `mapId`. `POST /api/games` takes an
  optional body `{ "map": "<id>" }` validated with Zod (unknown map, broken JSON or extra fields → 400).
  Existing locations were filled once with `npm run backfill:continents`; the generator now saves `continent`.
- **Reasons:** maps change rarely and both the server and the screens need the list, so a typed constant is simpler
  than a database collection. Continents need no new data source.
- **Alternatives:** a `maps` collection with hand-picked location lists (needed later for custom/community maps);
  country maps (many have too few locations today).
- **UI (2026-10-22):** `/maps` (navbar "Map") shows a wide World card + one card per continent with real flags
  (**flag-icons 7.5.0**, MIT, local SVGs — no outside requests; emoji flags don't render on Windows). Locations also
  store `countryCode` for the flags. In a game, a map button in the top bar switches map by changing `/play?map=…`;
  `PlayGame` is keyed by the map, so a new map = a fresh game. Create Party's picker stays for Phase 9.
- **Country maps (2026-10-22):** any country with ≥ 20 locations (`MIN_COUNTRY_MAP_LOCATIONS`) gets a map, built from the
  database (`listCountryMaps` / `resolveMap` in `src/server/services/mapService.ts`), so more unlock as the pool grows
  (41 today). Id = lowercase country code (`/play?map=fr`); Zod checks the shape, `resolveMap` checks the database
  ("zz" or a country below 20 → 400). `Game.mapId` is now a free string (max 20) instead of a fixed list.
- **Status:** Accepted (2026-10-22).

## D-022 — Guess/result/summary map: official Google map (Maps JavaScript API), one per visit (supersedes D-021 for display)
- **Context:** the owner wants exactly WorldGuessr's map. WorldGuessr loads Google's map and Street View from Google's
  internal servers (`mt{s}.google.com/vt`, `streetviewpixels-pa.googleapis.com`) — free and unlimited only because
  it bypasses Google's official, counted services; against the Google Maps Platform terms and CLAUDE.md §7.
  Declined. The official Map Tiles API would allow only ~7 games/day free (100,000 tiles/month).
- **Decision (owner: "official Google map, keep the 160 cap"):** `GoogleGameMap` (Maps JavaScript API, roadmap,
  advanced markers with our SVG pins from `src/lib/map/pinSvg.ts`, dashed polylines) is created ONCE per visit and
  only moved/resized by PlayGame between guess (bottom-right, grows on hover via JS with a 300 ms shrink delay),
  result (full screen) and summary (beside the panel). Street View is also kept mounted across "Play again".
  So one visit = 2 loads (1 map + 1 panorama) for any number of games → ~80 visits/day with the 160/day cap,
  inside both free allowances (Dynamic Maps 10,000/month, Dynamic Street View 5,000/month). Shared loader:
  `src/lib/google/mapsLoader.ts`.
- **Before launch:** create a free Map ID in Google Cloud and set `NEXT_PUBLIC_GOOGLE_MAP_ID` (dev uses
  `DEMO_MAP_ID`). The Leaflet/MapLibre map files (GuessMap, SummaryMap, GameBaseMap…) and the `leaflet`,
  `react-leaflet`, `maplibre-gl`, `@maplibre/maplibre-gl-leaflet` packages are now unused — remove them once
  no other work depends on them (another session was editing GameBaseMap at the time).
- **Status:** Accepted (2026-10-22).

## D-023 — Hosting: Vercel Hobby (free), deployed early at the owner's request
- **Context:** the owner wants the game online now (Phase 10 deployment pulled forward, 2026-10-22). Cloudflare
  Workers (via `@opennextjs/cloudflare`) was considered and briefly chosen, then compared.
- **Decision:** **Vercel Hobby.** Vercel builds Next.js itself, so Mongoose, Better Auth (scrypt hashing) and
  Nodemailer run unchanged on full Node.js. Cloudflare's free plan has a 10 ms CPU limit per request, a 3 MiB
  compressed Worker limit, and Mongoose/Nodemailer were unverified there (checked 2026-10-22) — too much platform
  debugging for a first deployment. Free address: `<project>.vercel.app`; a custom domain is optional and paid.
- **Trade-offs:** Hobby is for non-commercial use only (fine for a learning project). Vercel functions do not keep
  WebSocket connections open, so Phase 9 multiplayer needs a second host or a move (e.g. Cloudflare Durable Objects)
  — decided in Phase 9.
- **Status:** Accepted (2026-10-22).
