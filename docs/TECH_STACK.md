# Tech Stack

Each technology is introduced **only in the phase where it becomes necessary** (build
order is backend first — see `DECISIONS.md` D-006). See `PROGRESS.md` for what is installed.

Status: **Planned** = agreed, not installed · **In use** = installed and working ·
**Candidate** = likely, to be compared and approved in its phase.

## Already on the machine (verified 2026-10-19)

| Tool | Version | Purpose |
|---|---|---|
| Node.js | v24.15.0 | Runs JavaScript/TypeScript outside the browser (Next.js server, tools). |
| npm | 11.12.1 | Installs packages and runs project scripts. |
| Git | 2.54.0 | Version control: tracks every change so we can undo safely. |

## Core framework

| Technology | What it does | Why we chose it | Phase | Status |
|---|---|---|---|---|
| **Next.js (App Router)** | Framework that serves both pages *and* API routes from one project. | One project for backend and frontend, with simple deployment (D-002, D-003). | 2 | Planned |
| **TypeScript** | JavaScript plus types, so mistakes such as passing text where a number is expected are caught before running. | Catches bugs early and documents data shapes (`Game`, `Round`). | 2 | Planned |
| **HTTP client** (Thunder Client VS Code extension, or `curl`) | Sends requests to our API and shows the response. | Backend-first means there is no UI to click yet, so this is how we test. | 2 | Planned |

## Backend

| Technology | What it does | Why | Phase | Status |
|---|---|---|---|---|
| **Next.js Route Handlers** (`app/api/**/route.ts`) | Server code that answers HTTP requests, e.g. `POST /api/games`. | Built into Next.js, runs only on the server, so secrets stay safe. | 2, 5 | Planned |
| **Test runner** (likely Vitest) | Runs automated tests of our functions and routes. | Proves game logic is correct. Chosen and approved in Phase 3. | 3 | Candidate |
| **Validation library** (likely Zod) | Checks that incoming request data has the right shape and ranges. | Never trust the client. Approved in Phase 5. | 5 | Candidate |
| **Separate Node.js service (`Server/` folder)** | A long-running process. | Only for real-time WebSockets (Phase 9), because serverless hosting does not keep connections open. | 9 | Reserved |

## Database

| Technology | What it does | Why | Phase | Status |
|---|---|---|---|---|
| **MongoDB** | Document database that stores JSON-like records (games, rounds, users). | Flexible shape that fits game data naturally. | 4 | Planned |
| **Mongoose** | Defines schemas/models in code and validates data before saving. | Adds structure on top of a schemaless database. | 4 | Planned |
| **MongoDB Atlas** | Hosted MongoDB in the cloud. | Has a free tier. Its current limits are re-checked in Phase 4. | 4 | Planned |

## Accounts

| Technology | Purpose | Phase | Status |
|---|---|---|---|
| Auth solution (e.g. Auth.js or another maintained option) | Sign-in, sessions, profiles. Compared and chosen in Phase 6. | 6 | Candidate |

## Frontend

| Technology | What it does | Why | Phase | Status |
|---|---|---|---|---|
| **React** | Builds the UI from components that re-render when their data (state) changes. | Next.js is built on it, and it is the industry standard. | 7 | Planned |
| **CSS (CSS Modules + one global stylesheet)** | Styling. CSS Modules scope class names to one component. | Built into Next.js, no extra library, and teaches real CSS. | 7 | Planned |

*Trade-off worth knowing:* Tailwind CSS styles with utility classes. We skip it so you
learn plain CSS first. It could be adopted later through `DECISIONS.md`.

## Maps and Street View (Phase 8)

| Technology | What it does | Why | Status |
|---|---|---|---|
| **Google Maps Embed API (Street View mode)** | An `<iframe>` showing an interactive panorama. | Google documents it as **no charge, unlimited requests**. It still needs a Google Cloud project with a **billing account** and an API key. | Planned |
| **Leaflet** | Interactive map: pan, zoom, click to place a marker, draw lines. | Free, open source, simple, and independent of Google. | Planned |
| **OSM-compatible tile provider** | Supplies the map images ("tiles") Leaflet displays. | Not chosen yet. The public `tile.openstreetmap.org` server has a usage policy for light use, so we compare providers in Phase 8. | Planned (provider TBD) |
| **Street View Image Metadata endpoint** | Server-side check that a panorama exists near a coordinate. | Documented as **not charged / no quota**. Used only to validate locations (D-004). | Candidate |

**Billable Google products we must NOT use by accident:** Street View Static API image
requests, Dynamic Street View in the Maps JavaScript API, and the Map Tiles API.
Re-verify all pricing pages at the start of Phase 8.

## Later

| Technology | Purpose | Phase | Status |
|---|---|---|---|
| WebSockets (library chosen then, e.g. Socket.IO or `ws`) | Real-time messages for multiplayer rooms | 9 | Candidate |
| Redis | Shared state across server instances, **only if needed** | 9–10 | Only if needed |
| End-to-end testing (e.g. Playwright) | Tests the app through a real browser | 10 | Candidate |
| GitHub | Remote backup and collaboration | 1 (optional) | Planned |
| Deployment platform (e.g. Vercel, plus a host for any WebSocket service) | Public hosting | 10 | Candidate |

## Cost and limits (read before assuming "free")

- **Google:** the Embed API is documented as free and unlimited, but a billing account is
  required and other Maps products cost money. An unrestricted leaked key could be abused,
  so keys are always restricted.
- **Map tiles:** free tile servers have fair-use policies. Heavy traffic may need a paid plan.
- **MongoDB Atlas free tier:** limited storage and performance, and not meant for production load.
- **Hosting:** free hobby tiers have usage limits, and some prohibit commercial use.
- **Scale:** if the game becomes popular, some of these will cost money. Limits are
  documented as each service is introduced.
