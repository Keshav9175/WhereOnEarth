# Progress

_Last updated: 2026-10-19_

## Current phase
**Phase 1: Development environment & Git. Status: in progress (step 1 of 3).**

No Next.js app, dependencies, API routes, database or map integration exist yet.

## Phase 1 steps
1. Explain Git, create `.gitignore`, owner runs `git init`. ← **current**
2. Check Git identity, first commit of the docs.
3. (Optional) Connect a GitHub remote. Owner decides.

## Completed

### Phase 0 ✅ (2026-10-19)
- Inspected the workspace: an empty `Server/` folder (capital "S") and a `.claude/` folder with an
  empty `data/healthcare/documents` subfolder created by Claude Code plugin tooling.
- Tools: Node.js v24.15.0, npm 11.12.1, Git 2.54.0 (Windows 11).
- Verified Google docs: the Maps Embed API is no-charge/unlimited but needs a billing account; Street
  View metadata requests are not charged; Static API images and Dynamic Street View are billed.
- Created `CLAUDE.md` and `docs/` (overview, tech stack, architecture, roadmap, learning
  guide, decisions, progress, workflow).
- Owner decisions: **backend-first order (D-006)**, **Next.js API routes (D-003)**.

## Open questions
1. App folder: `web/` subfolder (recommended) or repo root? Rename `Server/` → `server/`?
   Decide at the start of Phase 2.
2. ~~GitHub remote~~ Decided: yes, `https://github.com/Keshav9175/WhereOnEarth.git`
   (empty repo, verified 2026-10-19).

## Unresolved issues
None.

## Exact next step
The owner reviews `.gitignore`, runs `git init` and `git status` in `C:\KIKI\WhereOnEarth`,
and reports the output.
