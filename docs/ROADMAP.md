# Roadmap

Status values: **Not started** · **In progress** · **Complete** (only after the acceptance
criteria are verified with the owner). Advance only on `NEXT` (see `CLAUDE.md` §3).

**Build order: backend first, then frontend** (decision D-006). The API and data layer are
built and tested with an HTTP client (a tool that sends requests and shows the JSON reply)
before any game UI exists.

| Phase | Name | Depends on | Status |
|---|---|---|---|
| 0 | Project inspection, workflow, documentation | — | **Complete** |
| 1 | Dev environment, Git, foundational setup | 0 | **Complete** |
| 2 | Next.js project + backend skeleton (first API route) | 1 | **Complete** |
| 3 | Game logic: distance & scoring (pure functions + unit tests) | 2 | **Complete** |
| 4 | MongoDB, Mongoose, data models | 2 | **Complete** |
| 5 | Game API: routes, validation, server-side scoring, history | 3, 4 | **Complete** |
| 6 | Authentication, users, leaderboards (API) | 5 | **Complete** (owner manual test pending) |
| 7 | Frontend fundamentals: game UI calling our API | 5 (6 for accounts UI) | Not started |
| 8 | Google Street View Embed + Leaflet guessing map | 7 | Not started |
| 9 | Multiplayer architecture and WebSockets | 5, 8 | Not started |
| 10 | Testing, security, performance, deployment | all | Not started |

**Why this order:**
- Phase 3 (logic) comes before Phase 4 (database) because it needs nothing installed. It is
  the gentlest introduction to TypeScript and testing, and its results are what the models store.
- Models (4) come before routes (5) so that routes have somewhere to save data.
- Google Maps work moves to Phase 8. The backend can use a small hand-picked list of
  locations until then, so no Google key is needed for Phases 1–7.

---

## Phase 0 — Project inspection, workflow, documentation ✅
- [x] Workspace inspected and existing structure recorded.
- [x] `CLAUDE.md` and all `docs/*.md` files created and mutually consistent.
- [x] Owner reviewed the plan and chose: backend-first order (D-006) and Next.js API routes (D-003).

## Phase 1 — Development environment & Git ✅
**Goal:** a safe, version-controlled starting point.
- [x] Node/npm/Git verified.
- [x] `.gitignore` excludes secrets, dependencies, build output, local tool data (`.claude/data/`, `.rune/`).
- [x] `git init -b main`, repo-local identity `Keshav9175 <keshavdivate86@gmail.com>`.
- [x] First commit `2cc11ad`, pushed to `https://github.com/Keshav9175/WhereOnEarth` (`main`).
- [ ] The owner can explain the working tree → staging area → commit → push flow (self-check).

## Phase 2 — Next.js project + backend skeleton
**Goal:** create the Next.js + TypeScript project and a first API route.
**Includes:** scaffold with the official tool (versions verified), App Router folder tour,
the agreed folder structure (`docs/ARCHITECTURE.md`), `GET /api/health` returning JSON,
testing it with an HTTP client, and how a request reaches a route handler.
**Acceptance:**
- [x] Next.js 16.4.2 scaffolded at the repo root (TypeScript, App Router, `src/`, ESLint, no Tailwind).
- [x] `npm run lint`, `tsc --noEmit` and `npm run build` pass.
- [x] `GET /api/health` returns `200` + `{ "status": "ok", "timestamp": ... }`, fresh per request. `POST` returns `405`.
- [ ] The owner ran `npm run dev` and called the endpoint themselves.
- [ ] The owner can explain request → route handler → response.
- [ ] Committed and pushed.

## Phase 3 — Game logic: distance & scoring ✅
**Goal:** the game's rules as pure, tested TypeScript functions.
- [x] `Coordinates` type; `haversineDistanceKm()`; `calculateScore()` (D-008).
- [x] Vitest set up (D-007), with 12 unit tests passing (distance 6, scoring 6), including edge cases.
- [x] All code written by the owner from chat.
- [ ] Self-check: the owner can explain what makes a function "pure" and why it matters for anti-cheat.
- `RoundResult` type deferred to Phase 5, where rounds are actually modeled.

## Phase 4 — MongoDB, Mongoose, data models ✅
**Goal:** a database and the models the game needs.
- [x] Atlas project "WhereOnEarth", free cluster `whereonearth` (AWS Mumbai), limits verified.
- [x] `.env.local` (git-ignored, standard non-SRV URI) + `.env.example`.
- [x] `src/server/db.ts` (cached connection); `/api/health` reports database status.
- [x] Models `Location` and `Game` (rounds embedded, answer snapshot) (D-009).
- [x] `npm run seed` inserted 20 locations; a second run is skipped (idempotent) (D-010).
- [x] DB URI appears nowhere in Git.
- [ ] Self-check: the owner can explain schema vs model vs document.

## Phase 5 — Game API ✅
**Goal:** a complete single-player game playable through HTTP requests alone.
- [x] `POST /api/games`, `GET /api/games/{id}`, `POST /api/games/{id}/guess` (owner wrote these from chat).
- [x] Service layer, server-held answers, server-computed scores, safe public view (`toPublicGame`).
- [x] Zod validation (400), 404/409/500 handling, atomic guard against double-scoring.
- [x] A full 5-round game played via HTTP. The answer is never exposed early. Tests pass.
- History endpoint moved to Phase 6 (`/api/me/games`), because history needs a signed-in user.

## Phase 6 — Authentication, users, leaderboards ✅ (built by Claude at the owner's request)
**Goal:** accounts, ownership of games, and rankings.
- [x] Better Auth (email + password), stored in MongoDB (`user`, `session`, `account`) (D-011).
- [x] Games are owned by the signed-in player (`userId`). Guests can still play (D-012).
- [x] Other players and guests get 404 on someone else's game (view and guess).
- [x] `GET /api/me` (profile + stats), `GET /api/me/games` (history), `GET /api/leaderboard` (D-013).
- [x] 28 unit tests. Typecheck, lint and production build are clean. A 22-step end-to-end test passed
      on 2026-10-20 (test data deleted afterwards).
- [ ] The owner restarts `npm run dev` and runs the manual test checklist.

## Phase 7 — Frontend fundamentals
**Goal:** a game UI that uses our API.
**Includes:** components, props, state, events, fetching from our API, Tailwind CSS,
responsive layout, loading/error states, basic accessibility, round result + summary
screens, a timer, and placeholder panorama/map areas.
**Acceptance:** a full game can be played in the browser using placeholders, works at mobile and desktop widths, and is committed.

## Phase 8 — Street View Embed + Leaflet
**Goal:** a real panorama and a real guessing map.
**Includes:** re-verify Google docs/pricing/terms; Google Cloud project, billing, and a
restricted key; `PanoramaView` iframe; choose a tile provider; Leaflet `GuessMap` with
marker placement; finalize the location-selection strategy (D-004).
**Acceptance:** real panoramas render, guesses are placed on the map, keys are restricted, and attribution is visible.

## Phase 9 — Multiplayer & WebSockets
**Goal:** real-time rooms.
**Includes:** architecture review, WebSocket service (separate folder, created then), rooms, server
timers, synchronized rounds, reconnection, and Redis only if justified.
**Acceptance:** two browsers can play a synchronized round with server-computed scores.
**Status (2026-10-22):** Party mode built (D-024): create/join with 6-digit codes, lobby, synchronized 5-round games with timers, results, final standings, rejoin. Ranked/Unranked matchmaking still to do.

## Phase 10 — Production readiness
**Goal:** a deployed, tested, secure app.
**Includes:** test coverage review, security review, accessibility audit, performance,
deployment, production env vars, monitoring, cost/limits review.
**Acceptance:** the public deployment works, the checklist passes, and the limits are documented.
