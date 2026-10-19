# Architecture

> **Status: nothing is implemented yet.** Everything below is **planned** unless it appears
> in *Implemented architecture*. Update both sections as phases are completed.

## Implemented architecture

```
WhereOnEarth/
├── CLAUDE.md          ← instructions for Claude Code
├── docs/              ← project documentation
├── Server/            ← empty; reserved (see "The Server/ folder")
└── .claude/           ← created automatically by Claude Code tooling; not part of the game
```

No application code, dependencies, Git repository, or environment variables exist yet.

## Planned architecture — big picture

```
 Browser (React UI)                      Next.js server (same project)           External
 ┌──────────────────────────┐   HTTP    ┌────────────────────────────┐
 │ Pages & components       │ ───────▶  │ Route handlers (/api/...)  │
 │  - PanoramaView (iframe) │ ◀───────  │  - validate input          │──▶ MongoDB Atlas (Phase 4)
 │  - GuessMap (Leaflet)    │   JSON    │  - call game services      │
 │  - HUD, timer, results   │           │ Game services (pure logic) │──▶ Google Street View
 └──────────┬───────────────┘           │ Data access (Mongoose)     │    metadata (validation only)
            │                           └────────────────────────────┘
            ├──iframe──▶ Google Maps Embed API (panorama)
            └──tiles───▶ OSM-compatible tile provider (guess map)

 Phase 9: Browser ⇄ WebSocket service (Server/ folder) for real-time multiplayer
```

## Planned folder layout (proposed — confirmed in Phase 2)

```
WhereOnEarth/
├── web/                     # the Next.js app: UI + API routes (folder name pending, D-003)
│   ├── src/app/             # routes: pages (page.tsx) and API (api/**/route.ts)
│   ├── src/components/      # React UI components (PanoramaView, GuessMap, ...)
│   ├── src/hooks/           # reusable React hooks (useTimer, ...)
│   ├── src/lib/game/        # pure game logic: distance, scoring (no React, no I/O)
│   ├── src/lib/validation/  # request schemas
│   ├── src/server/          # server-only code: services, DB connection, models
│   └── src/types/           # shared TypeScript types (Location, Guess, Round, Game)
├── Server/                  # reserved for a separate real-time service (Phase 9)
└── docs/
```

**Why separate these folders?** Each folder answers one question. *Where is the UI?*
`components/`. *Where are the rules?* `lib/game/`. *What may touch the database?* Only
`server/`. Because the game rules contain no React or network code, the browser can use them
for instant feedback and the server can re-run them to decide the official score. That one
implementation serves both and cannot drift.

## Responsibilities

### Frontend (browser)
- Renders the UI: panorama iframe, guessing map, timer, results, summary.
- Holds **temporary UI state** such as the current marker position and time remaining.
- Sends the player's *guess* (coordinates) to the server. It never decides the official score.

### Backend (Next.js route handlers, server-only modules)
- **Route handler:** parses the HTTP request, calls validation, calls a service, and returns JSON.
  It contains no game rules.
- **Validation:** rejects malformed or out-of-range input (lat outside −90..90, unknown game id, etc.).
- **Services:** game flow such as creating a game, picking locations, recording a guess, and computing
  distance and score with `lib/game` functions.
- **Data access:** the only layer that talks to MongoDB.
- Owns the truth: the correct location for a round is stored server-side and revealed only
  after the guess is accepted.

### API boundaries (initial sketch, finalized in Phase 5)

| Method & path | Purpose | Phase |
|---|---|---|
| `GET /api/health` | Confirms the server is running. Our first route. | 2 |
| `POST /api/games` | Start a game, returning the game id and current round's panorama info (not the answer). | 5 |
| `GET /api/games/{id}` | Game state and summary. Answers appear only for completed rounds. | 5 |
| `POST /api/games/{id}/guess` | Submit `{lat, lng}` for the current round, returning the true location, distance and score. | 5 |
| `GET /api/games` | Game history. | 5 |
| `/api/users/...`, `/api/leaderboard`, auth routes | Accounts and rankings. | 6 |

Until the frontend exists (Phase 7), we test these with an HTTP client.

*Known limitation:* the panorama iframe URL contains the location or panorama id, so a
determined player can inspect it. Server validation prevents score tampering, but not
looking at the iframe URL. We will document this honestly rather than claim perfect anti-cheat.

### Database (Phase 4)
Planned collections:
- `locations`: the curated location pool (lat, lng, country, optional difficulty).
- `games`: status, timestamps, and embedded rounds, where each round has its location, guess, distance and score.
- `users`: added in Phase 6.
Leaderboards are queries over `games`.

## External services

### Google Maps Embed API (panorama)
- Rendered as an `<iframe>` whose URL includes our API key. **The key is therefore visible
  in the browser.** It cannot be hidden, so it must be restricted:
  - *Application restriction:* HTTP referrers (our localhost and production domains only).
  - *API restriction:* Maps Embed API only.
- This is a **browser-restricted public key**. It is different from a **server-only
  secret** (for example a key used for metadata checks, or the DB password), which is never
  sent to the browser and lives only in server environment variables.
- The iframe is cross-origin. Our code **cannot read inside it**, so it cannot detect
  whether a panorama loaded. This is why locations must be validated *before* use.
- Google attribution and controls shown in the embed must stay visible. Covering them to
  hide hints would violate the terms. If the embed reveals place names, we treat that as a
  gameplay trade-off and evaluate it in Phase 8.

### Location selection (why "random" is hard)
- About 70% of Earth is ocean, and most land has **no Street View coverage**. A uniformly
  random coordinate almost never has a panorama.
- The Embed API looks for a nearby panorama but does not tell our code when it fails. The
  player would just see an error inside the frame.
- Options:
  1. **Pure random coordinates:** rejected. They usually show an empty frame.
  2. **Random + live check** with the Street View Image Metadata endpoint (server-side,
     documented as no charge and no quota, but needing a key with billing and subject to
     rate limits): this works but needs many retries per round, which makes it slow.
  3. **Curated, pre-validated location pool:** a list of coordinates checked in advance,
     with random selection from that list at game time. Fast and reliable, and the approach
     most guessing games use. **Likely choice.** Phase 4 seeds a small hand-picked list,
     and Phase 8 adds Google-based validation (D-004).
- **To verify before implementing:** Google Maps Platform terms on storing or caching data
  returned by Google (such as snapped coordinates or panorama IDs). Coordinates we choose
  ourselves are our data, but what we may store from Google responses must be checked.

### Map tiles (Leaflet)
- Leaflet only draws the map. A tile provider supplies the images. Each provider has a usage
  policy and attribution requirements, and the provider is chosen in Phase 8.

## Future multiplayer architecture (Phase 9, planned)
- Multiplayer needs the server to **push** updates such as "round started" or "opponent guessed".
  Ordinary HTTP only answers requests, so we need **WebSockets**, which keep a persistent
  two-way connection.
- Serverless hosting (a common way Next.js is deployed) does not keep long-lived
  connections. So the likely design is a **separate Node.js WebSocket service** in
  `Server/`, sharing game logic and types with the web app.
- Room state (players, current round, timers) lives in that service's memory. **Redis**
  only becomes necessary if we run several instances that must share room state.
- The server stays authoritative: it runs timers, holds answers, and computes scores.

## The `Server/` folder
The owner created `Server/` before the project started. It is **kept empty for now**.
Decision D-003: the backend uses Next.js API routes, so `Server/` is reserved for the
Phase 9 real-time service.
The capital "S" may matter on case-sensitive systems (Linux hosting, some Git setups). A
rename to lowercase `server/` is proposed but **will not happen without approval**.
