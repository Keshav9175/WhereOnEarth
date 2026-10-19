# Project Overview — WhereOnEarth

## Purpose

WhereOnEarth is a browser-based geography guessing game inspired by WorldGuessr. The player
is dropped into a Street View panorama somewhere in the world, explores it for clues
(signs, vegetation, road markings, architecture), and places a guess on a world map. The
closer the guess, the higher the score.

The project has **two goals of equal importance**:

1. Ship a complete, playable game.
2. Teach the owner full-stack development (frontend, backend, APIs, databases,
   architecture) well enough to build similar applications independently.

When these goals conflict (for example, a shortcut that works but hides a concept), the
learning goal wins.

## How a game works (target experience)

1. Player starts a game (for example, 5 rounds).
2. Each round shows a Street View panorama and an interactive world map.
3. A timer counts down while the player explores and places a marker on the map.
4. On submit (or when time runs out), the game reveals the true location, draws a line
   between guess and answer, and shows distance and points for that round.
5. After the final round, a summary shows total score and per-round results.

## Intended features

| Area | Feature | Phase (see `ROADMAP.md`) |
|---|---|---|
| Gameplay | Distance calculation and scoring (pure logic) | 3 |
| Data | Location pool and game records (MongoDB) | 4 |
| Backend | Game API: rounds, guesses, server-side scoring, validation, history | 5 |
| Accounts | Authentication, profiles, leaderboards | 6 |
| Gameplay | Game UI: timer, round results, final summary | 7 |
| Gameplay | Street View panorama (Google Maps Embed API) | 8 |
| Gameplay | Interactive guessing map (Leaflet + OSM-compatible tiles) | 8 |
| Multiplayer | Rooms and real-time play (WebSockets) | 9 |
| Quality | Responsive layout, accessibility, error handling | 7 onward, audited in 10 |
| Quality | Testing, security hardening, performance, deployment | 10 (testing starts in 3) |

Build order is **backend first** (see `DECISIONS.md` D-006).

## Scope

**In scope:** single-player game, accounts, history, leaderboards, multiplayer rooms,
deployment of a working public version.

**Out of scope (unless agreed later):** native mobile apps, payments, user-generated
maps, custom Street View imagery, and anti-cheat beyond server-side validation.

## Constraints

- **Learning-first pace:** small phases, each explained and verified before moving on.
- **Cost:** prefer free tiers and avoid paid services. Free tiers have limits; nothing
  guarantees the app stays free at every scale (see `TECH_STACK.md` → *Cost and limits*).
- **Google Maps terms:** use only the Maps Embed API for panoramas unless an approved
  decision says otherwise. Do not scrape imagery or hide required attribution.
- **Street View coverage is uneven:** not every coordinate has a panorama (see
  `ARCHITECTURE.md` → *Location selection*).
- **Originality:** our own implementation. WorldGuessr is a functional reference only.

## Long-term vision

A polished, accessible, responsive game with persistent profiles, fair server-validated
scoring, global leaderboards and real-time multiplayer rooms, deployed publicly. The owner
should be able to explain every part of it.
