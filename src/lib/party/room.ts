import { haversineDistanceKm } from "@/lib/game/distance";
import { calculateScore } from "@/lib/game/scoring";
import type { Coordinates } from "@/types/geo";
import {
  DEFAULT_ROUND_SECONDS,
  MAX_PARTY_PLAYERS,
  DEFAULT_ROUNDS,
  type PartyPhase,
  type PartySettings,
  type PartyView,
  type RoundGuess,
} from "./protocol";

// The rules of one party, as plain code: no network, no database, no timers. The party server feeds it
// events ("Ana joined", "Ben guessed", "time is up") and sends everyone the views it produces.
// Because it's plain code, every rule is covered by automated tests (room.test.ts).

export type PartyLocation = Coordinates & { country: string };

type Player = {
  id: string;
  token: string; // secret, lets this player rejoin after a refresh
  name: string;
  color: string;
  userId: string | null; // signed-in account, or null for a guest
  score: number;
  connected: boolean;
  joinedAt: number;
};

type Round = {
  location: PartyLocation;
  startedAt: number;
  endsAt: number | null; // null = no time limit
  guesses: Map<string, RoundGuess>;
};

// Pin colours, one per player (in join order).
// Round pacing, like WorldGuessr: results stay up this long before the next round starts by itself,
// and the last player still guessing gets at most this long once everyone else has guessed.
export const RESULTS_SECONDS = 3;
export const LAST_GUESSER_SECONDS = 20;

export const PLAYER_COLORS = ["#2563eb", "#dc2626", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#ea580c"];

export class PartyError extends Error {}

export class PartyRoom {
  readonly code: string;
  hostId = "";
  phase: PartyPhase = "lobby";
  locked = false;
  settings: PartySettings = { mapId: "world", mapName: "World", rounds: DEFAULT_ROUNDS, roundSeconds: DEFAULT_ROUND_SECONDS };
  private players = new Map<string, Player>();
  private locations: PartyLocation[] = [];
  private rounds: Round[] = [];
  // When the results screen ends and the next round starts automatically (server clock, ms).
  resultsUntil: number | null = null;

  constructor(code: string) {
    this.code = code;
  }

  get playerCount() {
    return this.players.size;
  }

  get connectedCount() {
    return [...this.players.values()].filter((player) => player.connected).length;
  }

  playerIds() {
    return [...this.players.keys()];
  }

  // ---------- Joining and leaving ----------

  addPlayer(input: { id: string; token: string; name: string; userId: string | null; now: number }): void {
    if (this.locked) throw new PartyError("This party is locked.");
    if (this.players.size >= MAX_PARTY_PLAYERS) throw new PartyError(`This party is full (${MAX_PARTY_PLAYERS} players).`);
    // The same account can't take two seats.
    if (input.userId && [...this.players.values()].some((player) => player.userId === input.userId)) {
      throw new PartyError("You're already in this party (another tab?).");
    }
    const usedColors = new Set([...this.players.values()].map((player) => player.color));
    const color = PLAYER_COLORS.find((c) => !usedColors.has(c)) ?? PLAYER_COLORS[0];
    this.players.set(input.id, { ...input, color, score: 0, connected: true, joinedAt: input.now });
    if (!this.hostId) this.hostId = input.id;
  }

  // Returns the player id if the token matches someone in this party.
  playerForToken(token: string): string | null {
    for (const player of this.players.values()) if (player.token === token) return player.id;
    return null;
  }

  // A dropped connection keeps the seat (and the host role) for a while, so a refresh costs nothing.
  setConnected(playerId: string, connected: boolean) {
    const player = this.players.get(playerId);
    if (player) player.connected = connected;
  }

  // Removing the HOST ends the party (like WorldGuessr: the party belongs to whoever created it) —
  // the server then sends everyone back to the join screen. Returns true when that happened.
  removePlayer(playerId: string): boolean {
    this.players.delete(playerId);
    return playerId === this.hostId;
  }

  // ---------- Host controls ----------

  private requireHost(playerId: string) {
    if (playerId !== this.hostId) throw new PartyError("Only the host can do that.");
  }

  updateSettings(playerId: string, settings: PartySettings) {
    this.requireHost(playerId);
    if (this.phase !== "lobby") throw new PartyError("Settings can only change in the lobby.");
    this.settings = settings;
  }

  setLocked(playerId: string, locked: boolean) {
    this.requireHost(playerId);
    this.locked = locked;
  }

  kick(playerId: string, targetId: string) {
    this.requireHost(playerId);
    if (targetId === playerId) throw new PartyError("You can't remove yourself.");
    if (!this.players.has(targetId)) throw new PartyError("That player isn't in the party.");
    this.removePlayer(targetId);
  }

  // ---------- The game ----------

  // `locations` are picked by the server (same location engine as single player).
  start(playerId: string, locations: PartyLocation[], now: number) {
    this.requireHost(playerId);
    if (this.phase !== "lobby") throw new PartyError("The game has already started.");
    if (locations.length < this.settings.rounds) throw new PartyError("Not enough locations on this map.");
    this.locations = locations.slice(0, this.settings.rounds);
    this.rounds = [];
    for (const player of this.players.values()) player.score = 0;
    this.beginRound(now);
  }

  private beginRound(now: number) {
    const seconds = this.settings.roundSeconds;
    this.rounds.push({
      location: this.locations[this.rounds.length],
      startedAt: now,
      endsAt: seconds > 0 ? now + seconds * 1000 : null,
      guesses: new Map(),
    });
    this.phase = "round";
  }

  get currentRound(): Round | null {
    return this.rounds.at(-1) ?? null;
  }

  // The SERVER works out distance and score from the true location (the browser only sends a point).
  guess(playerId: string, point: Coordinates, now: number) {
    const round = this.currentRound;
    if (this.phase !== "round" || !round) throw new PartyError("There's no round to guess in.");
    if (!this.players.has(playerId)) throw new PartyError("You're not in this party.");
    if (round.guesses.has(playerId)) throw new PartyError("You've already guessed this round.");

    const distanceKm = haversineDistanceKm(point, round.location);
    round.guesses.set(playerId, { playerId, lat: point.lat, lng: point.lng, distanceKm, score: calculateScore(distanceKm) });

    // Hurry up the last one (like WorldGuessr): when only ONE connected player still has to guess, they get
    // at most LAST_GUESSER_SECONDS more — also in "no time limit" rounds, so nobody waits on an idle player.
    const stillGuessing = [...this.players.values()].filter((player) => player.connected && !round.guesses.has(player.id));
    const hurryUntil = now + LAST_GUESSER_SECONDS * 1000;
    if (stillGuessing.length === 1 && this.players.size > 1 && (round.endsAt === null || round.endsAt > hurryUntil)) {
      round.endsAt = hurryUntil;
    }
  }

  // True when every connected player has guessed — the round can end early.
  everyoneGuessed() {
    const round = this.currentRound;
    if (!round || this.phase !== "round") return false;
    const waitingOn = [...this.players.values()].filter((player) => player.connected && !round.guesses.has(player.id));
    return waitingOn.length === 0;
  }

  // Ends the round (everyone guessed, or time ran out): adds the scores and reveals the answer.
  // The results stay on screen for RESULTS_SECONDS; then the server calls advance() by itself.
  endRound(now: number) {
    const round = this.currentRound;
    if (this.phase !== "round" || !round) return;
    for (const guess of round.guesses.values()) {
      const player = this.players.get(guess.playerId);
      if (player) player.score += guess.score;
    }
    this.phase = "results";
    this.resultsUntil = now + RESULTS_SECONDS * 1000;
  }

  // From the results to the next round — or to the final standings after the last round.
  advance(now: number) {
    if (this.phase !== "results") return;
    this.resultsUntil = null;
    if (this.rounds.length >= this.locations.length) this.phase = "final";
    else this.beginRound(now);
  }

  // Host: skip the rest of the results countdown.
  next(playerId: string, now: number) {
    this.requireHost(playerId);
    if (this.phase !== "results") throw new PartyError("Finish the round first.");
    this.advance(now);
  }

  backToLobby(playerId: string) {
    this.requireHost(playerId);
    this.resultsUntil = null;
    this.phase = "lobby";
    this.rounds = [];
    this.locations = [];
    for (const player of this.players.values()) player.score = 0;
  }

  // ---------- What each player sees ----------

  viewFor(playerId: string): PartyView {
    const round = this.currentRound;
    const roundOver = this.phase === "results" || this.phase === "final";
    const reveal = (r: Round) => ({
      answer: { lat: r.location.lat, lng: r.location.lng },
      country: r.location.country,
      guesses: [...r.guesses.values()],
    });
    // Finished rounds: all of them once the game is over, all but the current one during results.
    const finished = this.rounds.filter((r, index) => index < this.rounds.length - 1 || roundOver);

    return {
      code: this.code,
      you: playerId,
      hostId: this.hostId,
      phase: this.phase,
      locked: this.locked,
      settings: this.settings,
      players: [...this.players.values()]
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((player) => ({
          id: player.id,
          name: player.name,
          color: player.color,
          score: player.score,
          connected: player.connected,
          guessed: Boolean(round && this.phase === "round" && round.guesses.has(player.id)),
          signedIn: player.userId !== null,
        })),
      roundNumber: this.phase === "lobby" ? 0 : this.rounds.length,
      totalRounds: this.settings.rounds,
      // The location is only sent while that round is being played (Street View needs it) — never the country.
      panorama: this.phase === "round" && round ? { lat: round.location.lat, lng: round.location.lng } : null,
      endsAt: this.phase === "round" && round ? round.endsAt : null,
      nextAt: this.phase === "results" ? this.resultsUntil : null,
      // Only WHERE you guessed — not the distance or score, which would hint at the answer.
      yourGuess: (() => {
        const own = round && this.phase === "round" ? round.guesses.get(playerId) : undefined;
        return own ? { lat: own.lat, lng: own.lng } : null;
      })(),
      // Other players' guesses and the answer stay hidden until the round is over.
      result: roundOver && round ? reveal(round) : null,
      history: finished.map((r, index) => ({ roundNumber: index + 1, ...reveal(r) })),
    };
  }
}
