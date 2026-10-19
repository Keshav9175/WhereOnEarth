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

### Separate backend vs framework API routes
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
