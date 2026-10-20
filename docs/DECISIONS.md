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
- **Decision:** Next.js (App Router) + React + TypeScript; plain CSS (CSS Modules);
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
