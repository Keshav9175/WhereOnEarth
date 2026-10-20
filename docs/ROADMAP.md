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
| 4 | MongoDB, Mongoose, data models | 2 | Not started |
| 5 | Game API: routes, validation, server-side scoring, history | 3, 4 | Not started |
| 6 | Authentication, users, leaderboards (API) | 5 | Not started |
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

## Phase 4 — MongoDB, Mongoose, data models
**Goal:** a database and the models the game needs.
**Includes:** Atlas account and free cluster (verify current limits), `.env.local` +
`.env.example`, a reusable connection module, Mongoose models `Location` and `Game` (rounds
embedded), a seed script with a small hand-picked location list.
**Acceptance:** the app connects, seed data is visible in Atlas, the DB URI appears nowhere in Git, and the
owner can explain schema vs model vs document.

## Phase 5 — Game API
**Goal:** a complete single-player game playable through HTTP requests alone.
**Includes:** `POST /api/games`, `GET /api/games/{id}`, `POST /api/games/{id}/guess`,
request validation, service layer, server-held answers, server-computed scores, consistent
error responses, game history endpoint, and API tests.
**Acceptance:** a 5-round game can be played with an HTTP client, the answer is never exposed before the guess,
invalid input is rejected with clear errors, and tests pass.

## Phase 6 — Authentication, users, leaderboards
**Goal:** accounts, ownership of games, and rankings.
**Includes:** compare and choose an auth solution, `User` model, sign-in/out, protecting
routes, linking games to users, leaderboard queries.
**Acceptance:** users can only access their own private data, and the leaderboard endpoint is correct.

## Phase 7 — Frontend fundamentals
**Goal:** a game UI that uses our API.
**Includes:** components, props, state, events, fetching from our API, CSS Modules,
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

## Phase 10 — Production readiness
**Goal:** a deployed, tested, secure app.
**Includes:** test coverage review, security review, accessibility audit, performance,
deployment, production env vars, monitoring, cost/limits review.
**Acceptance:** the public deployment works, the checklist passes, and the limits are documented.
