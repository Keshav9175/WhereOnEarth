# Development Workflow

Sections marked *(from Phase N)* describe things that do not exist yet. Exact commands are
added when that phase is implemented.

## 1. Starting a work session
1. Open `C:\KIKI\WhereOnEarth` in VS Code.
2. Start Claude Code. It reads `CLAUDE.md` automatically.
3. Ask Claude to read `docs/PROGRESS.md` and summarize where we are, or just type `NEXT`
   if the previous phase or step is verified.
4. *(from Phase 1)* Run `git status` to make sure you know what has changed since the last commit.

## 2. Terminals and working directories
- Commands are always given with a working directory, e.g. *"Terminal, in
  `C:\KIKI\WhereOnEarth\web`"*. Running a command in the wrong folder is the most common
  beginner error.
- The VS Code terminal on Windows defaults to PowerShell. Commands will be given in a form that works there.

## 3. Running the app *(from Phase 2)*
- `npm run dev` starts the development server with live reload (usually at http://localhost:3000).
- `npm run build` builds the production version and catches type and build errors.
- `npm run start` runs the production build locally.
Exact folder and scripts are confirmed in Phase 2.

## 4. Testing changes
- Every phase ends with a **manual checklist** (Claude provides it, and you run it).
- *(from Phase 2)* **HTTP client testing:** the backend is built before the UI, so we call API routes
  with Thunder Client (a VS Code extension) or `curl` and read the JSON responses.
- *(from Phase 3)* Unit tests for game logic, run with an `npm test` script defined then.
- *(from Phase 5)* API tests for valid and invalid requests.
- If something fails, stop and debug with Claude before continuing. Never skip a failing check.

## 5. Environment variables *(from Phase 4)*
- Real values go in a local env file (Next.js uses `.env.local`), which is **never committed**.
- `.env.example` is committed with placeholder values and lists every variable needed.
- Variables prefixed `NEXT_PUBLIC_` are bundled into browser code, so they are **visible to
  everyone**. Use the prefix only for restricted public keys (e.g. the Embed API key in Phase 8).
- The first real variable is the MongoDB connection string in Phase 4. It must never get the prefix.
- Everything else (DB URI, auth secret, server-only keys) has no prefix and is read only in server code.
- After changing env files, restart `npm run dev`.
- If a secret is ever committed: tell Claude immediately, **rotate (replace) the key** in
  the provider's console, then clean up. Deleting the file alone does not remove it from Git history.

## 6. Git workflow *(from Phase 1)*
- Commit at the end of each phase (or meaningful step) with a clear message describing what changed.
- Before committing: `git status` (what changed?) → `git diff` (how?) → stage → commit.
- Claude explains every Git command before you run it and never commits or pushes unless you ask.
- Destructive commands (`git reset --hard`, `git push --force`, deleting branches) require
  an explanation of the impact and your explicit confirmation.

## 7. Working safely with Claude Code
- **Read before approving.** When Claude asks permission to run a command or edit a file,
  read what it does. Ask "why?" whenever you are unsure.
- **One phase at a time.** Claude must not build future-phase features. If it starts to,
  say "stop: that's Phase X".
- **Ask for explanations.** "Explain this line" or "what breaks if I remove this?" are always
  valid requests.
- **Type it yourself sometimes.** Retyping a small file by hand is one of the best ways to learn it.
- **Docs stay current.** At the end of each phase Claude updates `ROADMAP.md`,
  `PROGRESS.md` and `LEARNING_GUIDE.md`. Check that they match reality.
- **Never paste real secrets into chat** unless necessary. Prefer placing them directly in `.env.local` yourself.

## 8. Google Maps key (Street View — Maps JavaScript API)
We use the **Maps JavaScript API** Street View (not the Embed iframe) because only it can hide the
address card that reveals the answer (D-018).
1. Google Cloud Console → project "WhereOnEarth" (billing account linked; required by Google).
2. APIs & Services → Library → **Maps JavaScript API** → Enable.
3. APIs & Services → Credentials → your key → **API restrictions** → tick **Maps JavaScript API**
   (keep Maps Embed API too if listed). **Application restrictions:** Websites → `http://localhost:3000/*`.
4. **Stay free:** APIs & Services → Maps JavaScript API → **Quotas & System Limits** → find the
   *Dynamic Street View* per-day quota → set it to **160** (≈ 5,000 free/month ÷ 31). Above the cap
   Google refuses requests instead of billing. Also keep a Billing → Budgets & alerts email alert.
5. `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...` (the old `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` still
   works as a fallback, so one key can serve both). Restart `npm run dev`.
The key is visible in the browser by design; the restrictions are what protect it.

## 9. Server-only Google key (building the location pool)
`npm run generate:locations` asks Google "is there Street View near this point?" thousands of times. That check
(Street View Static API **metadata**) is free and uses no quota. It needs its own key, because the browser key
only works from `http://localhost:3000/*` pages and a script has no web page.
1. Google Cloud console → **APIs & Services → Library** → search **"Street View Static API"** → **Enable**.
2. **APIs & Services → Credentials → + Create credentials → API key**. Rename it "WhereOnEarth server".
3. Edit the key → **Application restrictions: None** (or "IP addresses" with your office IPs) →
   **API restrictions: Restrict key → only "Street View Static API"** → Save.
4. Add it to `.env.local` (never commit it, never add `NEXT_PUBLIC_`): `GOOGLE_MAPS_SERVER_API_KEY=...`
5. Try a small run first: `npm run generate:locations -- --total 50 --countries IN,FR --dry-run`
   (checks everything, saves nothing). Then a real run: `npm run generate:locations`.

## 10. Party (multiplayer) server
Party mode needs a second program running next to the website. Use two terminals in `c:/KIKI/WhereOnEarth`:
1. `npm run dev` — the website (http://localhost:3000)
2. `npm run party` — the party server (ws://localhost:3001). It does NOT reload by itself: after changing
   `src/party/` or `src/lib/party/`, stop it (Ctrl+C) and start it again.
To test alone: one normal window and one **Incognito** window (different login), or a guest in each.

## 11. Putting party mode online (free): website on Vercel + party server on Render
The website stays on Vercel. The party server runs on Render's free plan (sleeps after 15 min without players;
the first party after that waits ~1 minute while it wakes — the page shows "Connecting…" and retries by itself).
1. **Push the code to GitHub** (both Vercel and Render build from it).
2. **Create a secret** (same value everywhere):
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   It's already in `.env.local` as `PARTY_SECRET` — you can reuse that value.
3. **Render** (https://render.com, sign up with GitHub, no card needed for free):
   **New → Blueprint** → pick the `WhereOnEarth` repository → Render reads `render.yaml` → fill in:
   - `MONGODB_URI` = the same value as in `.env.local`
   - `PARTY_SECRET` = the secret from step 2
   - `BETTER_AUTH_URL` = your website's address, e.g. `https://whereonearth.vercel.app` (no slash at the end)
   → **Apply**. Wait for "Live", then open `https://<service>.onrender.com/health` → it must say `ok`.
4. **MongoDB Atlas → Network Access**: Render's free servers have changing addresses. If `0.0.0.0/0` is already
   there (needed for Vercel too), nothing to do; otherwise add Render's outbound IPs (Render → service → Connect → Outbound).
5. **Vercel** → Project → Settings → Environment Variables (Production), then **Redeploy**:
   - `NEXT_PUBLIC_PARTY_URL` = `wss://<service>.onrender.com`  (wss = encrypted)
   - `PARTY_SECRET` = the same secret
6. Test: open the Vercel site → Party → Create; open the invite link on your phone (mobile data) → join.
Optional: a free uptime pinger (e.g. UptimeRobot) calling `https://<service>.onrender.com/health` every 10 min keeps
it awake (one always-on free service ≈ 744 of Render's 750 free hours/month).
