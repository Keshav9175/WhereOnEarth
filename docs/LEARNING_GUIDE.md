# Learning Guide

A growing glossary of concepts, in plain English, linked to where they appear in *our* game.
Add entries at the end of each phase. Do not repeat explanations that already exist here.

**How to use this guide:** before saying `NEXT`, check that you could explain each concept
from the finished phase to a friend without looking.

---

## Phase 0 — Planning and project workflow

### Repository ("repo")
The project folder whose history is tracked by Git. `WhereOnEarth/` becomes a repo in Phase 1.

### Documentation as project memory
Code shows *what* the app does. Docs record *why* it was built that way, which decisions were made,
and where we are. Claude Code starts each session without remembering previous chats, so
`CLAUDE.md` and `docs/PROGRESS.md` are how it "remembers". → `CLAUDE.md`, `docs/`

### Phases and acceptance criteria
A phase is a small chunk of work with a clear goal. Acceptance criteria are the checks that
prove it is done, such as "the app runs locally with `npm run dev`". They prevent "mostly done"
work from piling up. → `docs/ROADMAP.md`

### Frontend vs backend
- **Frontend:** code that runs in the player's browser. It draws the screen and reacts to clicks.
  Anyone can read and modify it, so it is *untrusted*.
- **Backend (server):** code that runs on our machine or hosting. It is trusted, holds secrets,
  and makes official decisions (such as the score).
In WhereOnEarth both live in one Next.js project, but they run in different places.
→ `docs/ARCHITECTURE.md` → *Responsibilities*

### "Never trust the client"
Anything sent from a browser can be faked. If the browser sent "my score is 5000", a cheater
could send any number. So the browser sends only the *guess*, and the server calculates the score.

### API (Application Programming Interface)
A defined way for two programs to talk. Our browser talks to our server through **API
routes** such as `POST /api/games`. We also use Google's **Embed API** to display Street View.

### API key: public (browser-restricted) vs secret (server-only)
- A **public key** must appear in the browser (the Google Embed iframe URL), so we
  *restrict* it. It only works from our website and only for the Embed API.
- A **secret** (database password, server-only keys) must never reach the browser. It lives
  in **environment variables** on the server.

### Environment variables (preview, used from Phase 4)
Settings provided to the app from outside the code, such as `MONGODB_URI=...`. They keep secrets
out of Git and let the same code run with different settings locally and in production.
`.env.example` lists the names with fake values so others know what to set.

### Backend-first development
Building the server (rules, data, API) before the screens. Without a UI, we test by sending
HTTP requests directly with a tool and reading the JSON reply. That makes it obvious which
work belongs to the server (rules, truth, saving) and which to the client (display).
→ `docs/DECISIONS.md` D-006

### Separate backend vs framework API routes (Phase 0)
Many companies run a standalone API server (e.g. Express) that websites and mobile apps
share. Next.js API routes instead put the API inside the web app's project: one codebase
and one deployment. The core ideas (routes, requests, responses, validation, databases)
are identical, so the skills transfer. → `docs/DECISIONS.md` D-003

### Why random Street View locations are hard
Most of the globe is ocean or has no Street View coverage, and our code cannot see inside
Google's iframe to tell whether a panorama loaded. So we plan to use a pre-validated location
pool. → `docs/ARCHITECTURE.md` → *Location selection*

### Architecture decision record
A short note saying what we decided, why, and what we rejected. It lets future-you understand
past choices. → `docs/DECISIONS.md`

---

## Phase 1 — Git and GitHub

### Working tree → staging area → commit → push
- **Working tree:** your files on disk right now.
- **Staging area:** the changes you picked for the next snapshot (`git add`).
- **Commit:** a saved snapshot with a message (`git commit -m "..."`). Stored locally only.
- **Push:** uploads your commits to a remote (`git push`).
`git status` tells you where every changed file currently is in that flow.

### `.gitignore`
Lists files Git must never track: secrets (`.env*`), downloaded packages (`node_modules/`),
generated output (`.next/`), and local tool data (`.rune/`). It is created **before** the first commit
because anything committed stays in history even after deletion. → `.gitignore`

### Branch (`main`)
A named line of history. We work on `main` for now. `git init -b main` names it to match GitHub.

### Remote (`origin`)
A copy of the repository elsewhere, here on GitHub. `origin` is the conventional nickname.
`git remote -v` shows it. `push -u` links local `main` to `origin/main` once, so later just
`git push` works.

### Commit identity vs login
Two different things that are easy to confuse:
- `git config user.name/user.email` is the **label** written on each commit, and it is public on GitHub.
- The **login** (Git Credential Manager) proves you may push. A 403 "denied to <other user>"
  means the login is wrong, not the commit identity. Local config (no `--global`) applies to one
  repository only.

### Amend: only before pushing
`git commit --amend` replaces the latest commit. It is safe only if that commit has not been pushed,
because rewriting shared history breaks other copies. After pushing, fix things with a new commit.

### Line endings (LF vs CRLF warnings)
Windows ends text lines with CRLF, while Linux and macOS use LF. Git converts automatically, and the
warning is informational.

---

## Phase 2 — Next.js project and first API route

### `package.json` and `node_modules/`
`package.json` lists the packages the project needs (`dependencies` for running the app,
`devDependencies` for tools like TypeScript and ESLint) and **scripts** (`npm run dev`).
`npm install` downloads them into `node_modules/`, which is never committed because anyone can
re-create it. `package-lock.json` records the exact versions installed, so it *is* committed.

### npm scripts
- `npm run dev`: development server with live reload at http://localhost:3000.
- `npm run build`: production build. It also type-checks, so it catches errors.
- `npm run start`: runs the production build.
- `npm run lint`: ESLint checks code for common mistakes.

### App Router: folders become URLs
Inside `src/app/`, the folder path becomes the URL path:
- `src/app/page.tsx` → the page at `/`
- `src/app/api/health/route.ts` → the API endpoint at `/api/health`
A `page.tsx` returns UI (HTML). A `route.ts` returns data (usually JSON).

### HTTP request and response
A **request** has a *method* (`GET` = read something, `POST` = create/submit something) and a
URL. A **response** has a *status code* (`200` OK, `400` bad input, `404` not found,
`405` method not allowed, `500` server error), *headers* (e.g. `content-type: application/json`),
and a *body* (the JSON). → `src/app/api/health/route.ts`

### Route handler
An exported function named after the HTTP method (`export async function GET()`). Next.js
calls it when a matching request arrives and sends back the `Response` it returns. Methods
you do not export are rejected automatically with `405`.

### JSON
A text format for data: `{"status":"ok"}`. `Response.json(obj)` converts a JavaScript object
to JSON and sets the `content-type` header.

### `async` / `await`
`async` marks a function that may wait for something slow (network, database).
`await` pauses that function until the slow thing finishes, without freezing the server.

### Prerendering vs per-request (Cache Components)
Next.js 16 tries to compute responses once at build time when they cannot change. Our health check
must be live, so `await connection()` says "wait for a real request". In the build output,
`○` means static and `ƒ` means dynamic (per request).

### Health check endpoint
A tiny endpoint that proves the server is running. Hosting platforms and monitors call it
automatically. It is the "hello world" of backends.

---

## Phase 3 — Game logic and testing

### Pure function
A function whose output depends **only** on its inputs and which changes nothing outside
itself (no database, no network, no clock, no randomness). `haversineDistanceKm(a, b)` always
gives the same answer for the same `a` and `b`. Why it matters here:
- **Easy to test:** call it and compare the result. No setup is needed.
- **Anti-cheat:** the server can re-run the exact same rule the browser uses, so a faked score is
  caught. → `src/lib/game/distance.ts`

### Type (`type Coordinates = { lat: number; lng: number }`)
Describes the *shape* of data. TypeScript then refuses code that passes `{ latitude: ... }`
or a string where a number is expected. It catches typos before the code runs. → `src/types/geo.ts`

### Haversine formula / great-circle distance
The Earth is (nearly) a sphere, so the shortest route between two points curves over its
surface. Haversine computes that distance from latitudes and longitudes. Flat-map math would be
badly wrong for long distances and near the poles.

### Degrees vs radians
Coordinates are in degrees (0–360 for a full turn), but JavaScript's `Math.sin`/`Math.cos`
expect radians (0–2π). Forgetting to convert is a classic bug, and the tests would catch it.

### Floating-point numbers
Computers store decimals approximately (`0.1 + 0.2` is `0.30000000000000004`). That is why tests
use `toBeCloseTo` instead of exact equality, and why the code clamps a value that can drift slightly
above 1.

### Unit test (Vitest)
Code that checks other code automatically. `describe` groups tests, `it("...")` is one test case,
and `expect(actual).toBe(expected)` is an assertion. `npm test` runs them all. A good test suite
covers normal cases, **edge cases** (same point, the 180° line, opposite sides of the Earth), and
properties that must always hold (symmetry, maximum distance). → `src/lib/game/distance.test.ts`

### Dev dependency (`npm install -D`)
A package needed only while developing (tests, type checking, linting), not when the app runs
for players. These are listed under `devDependencies` in `package.json`.

### Constants (`export const MAX_SCORE = 5000`)
A named value that never changes. Naming it (instead of writing `5000` in many places)
explains what the number means and lets you rebalance the game by changing one line.
→ `src/lib/game/scoring.ts`

### Exponential decay (`Math.exp(-x)`)
Starts at 1 and slides smoothly toward 0 without ever going below it. Used for scoring: points
drop fast for the first few hundred km, then flatten out. → `docs/DECISIONS.md` D-008

### Throwing errors (`throw new RangeError(...)`)
Stops the function immediately with a clear message when the input is impossible. This is better than
quietly returning a wrong value like `NaN`, which would cause a confusing bug somewhere else.
Tests check it with `expect(() => fn(bad)).toThrow(...)`. The `() =>` lets Vitest call it.

### `.map` and loops
`list.map(fn)` runs `fn` on every item and returns a new list. `for (const x of list)` repeats
code for each item. Tests use them to check many values at once.

### Separation of responsibilities
`distance.ts` only measures, and `scoring.ts` only converts km to points. Neither knows about the
other. The API (Phase 5) will connect them: distance first, then score. Small single-purpose
pieces are easier to understand, test and change.

---

## Phase 4 — Database (MongoDB + Mongoose)

### Database, collection, document
A **database** stores data permanently. MongoDB groups records into **collections**
(`locations`, `games`). Each record is a **document**, a JSON-like object with a unique `_id`.

### Schema, model, document (Mongoose)
- **Schema:** the rules (fields, types, required, min/max, enum).
- **Model:** the tool built from a schema to save and find data (`LocationModel.find()`).
- **Document:** one saved record.
→ `src/server/models/Location.ts`, `src/server/models/Game.ts`

### Validation in the model
Mongoose checks every document against the schema **before** saving (e.g. `lat` must be
from −90 to 90, a game must have exactly 5 rounds). It is the last safety net in front of the database.

### Embedding
Putting related data inside one document (rounds inside a game) when the parts always belong to
one parent and are read together. → `docs/DECISIONS.md` D-009

### Environment variables and `.env.local`
Secrets live in `.env.local` (git-ignored) and are read in code as `process.env.MONGODB_URI`.
Next.js loads the file **only at startup**, so restart `npm run dev` after editing it. Scripts load it
with `--env-file=.env.local`.

### Connection string
`mongodb://user:password@host1,host2,host3/whereonearth?ssl=true&...` = who signs in, which
servers (a 3-server **replica set**), which database, and options. `ssl=true` encrypts traffic.

### Connection caching
Opening a DB connection is slow, so `connectToDatabase()` connects once and reuses it. It stores the
connection on `globalThis` so development reloads don't open new connections. → `src/server/db.ts`

### Atlas security: IP access list + database user
Atlas lets a connection in only if (1) the computer's public IP is on the access list **and**
(2) the username and password are correct. Never allow `0.0.0.0/0` (everyone).

### Debugging by layer (lessons from this phase)
| Error | Layer | Real cause here |
|---|---|---|
| `querySrv ECONNREFUSED` | DNS | Local DNS refused `+srv` lookups. Fixed with the standard URI. |
| `bad auth : authentication failed` | Login | Password typo (`0` vs `O`) |
| `SSL alert number 80` / `MongoNetworkError` | Network access | The office uses 2 public IPs, and one was not allowlisted |
Read the error, find the layer, and fix only that layer.

### Seeding and idempotency
**Seeding** fills a database with starting data via a script. **Idempotent** means it is safe to run
again: our script inserts only if the collection is empty. → `scripts/seed-locations.ts`

### `async`/`.catch`/`.finally` in scripts
`.catch` handles failure (prints the error and sets exit code 1), and `.finally` always runs (disconnects,
so the script can exit).
