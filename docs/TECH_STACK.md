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
| **Next.js Route Handlers** (`app/api/**/route.ts`) | Server code that answers HTTP requests, e.g. `POST /api/games`. | Built into Next.js, runs only on the server, so secrets stay safe. | 2, 5 | In use |
| **Vitest** 5.0.5 | Runs automated tests of our functions and routes. | Recommended in the Next.js docs, fast, native TypeScript. `npm test`. | 3 | In use |
| **Zod** 4.6.7 | Checks that incoming request data has the right shape and ranges. | Never trust the client. Industry standard, and its types are inferred from the rules. | 5 | In use |
| **Separate Node.js service** (own folder, created in Phase 9) | A long-running process. | Only for real-time WebSockets (Phase 9), because serverless hosting does not keep connections open. | 9 | Only if needed |

## Database

| Technology | What it does | Why | Phase | Status |
|---|---|---|---|---|
| **MongoDB** | Document database that stores JSON-like records (games, rounds, users). | Flexible shape that fits game data naturally. | 4 | In use |
| **Mongoose** 9.11.2 | Defines schemas/models in code and validates data before saving. | Adds structure on top of a schemaless database. | 4 | In use |
| **MongoDB Atlas** (free cluster, Mumbai) | Hosted MongoDB in the cloud. | Has a free tier. Its current limits are re-checked in Phase 4. | 4 | In use |

## Accounts

| Technology | Purpose | Phase | Status |
|---|---|---|---|
| **Better Auth** 1.7.11 | Email and password sign-up/sign-in, sessions (cookies), MongoDB storage (D-011). | 6 | In use |

## Frontend

| Technology | What it does | Why | Phase | Status |
|---|---|---|---|---|
| **React** | Builds the UI from components that re-render when their data (state) changes. | Next.js is built on it, and it is the industry standard. | 7 | Planned |
| **Tailwind CSS** 4.3.3 | Utility classes in `className` (e.g. `flex p-4 bg-primary`), compiled by PostCSS. Our colours are defined once in `globals.css` (D-016). | The owner's choice. Industry standard, and only used classes are shipped. | 7 | In use |

*Note:* plain CSS Modules were the original plan (D-002). Switched to Tailwind (D-016).
learn plain CSS first. It could be adopted later through `DECISIONS.md`.

## Maps and Street View (Phase 8)

| Technology | What it does | Why | Status |
|---|---|---|---|
| **Google Maps Embed API (Street View mode)** | An `<iframe>` showing an interactive panorama. | Google documents it as **no charge, unlimited requests**. It still needs a Google Cloud project with a **billing account** and an API key. | In use (D-014) |
| **Leaflet** 1.9.4 + react-leaflet 5.0.0 | Interactive map: pan, zoom, click to place a marker, draw lines. | Free, open source, simple, and independent of Google. | In use |
| **OSM-compatible tile provider** | Supplies the map images ("tiles") Leaflet displays. | Not chosen yet. The public `tile.openstreetmap.org` server has a usage policy for light use, so we compare providers in Phase 8. | In use (dev): tile.openstreetmap.org, configurable (D-015) |
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
