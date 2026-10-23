import { z } from "zod";

// The messages the browser and the party server send each other over the WebSocket connection.
// Shared by both sides, so they always agree. The server checks EVERY incoming message with these
// schemas (never trust the client); anything that doesn't match is rejected.

export const PARTY_CODE_LENGTH = 6;
// Each player uses their own Google Street View + map loads, so a big party eats the free daily quota fast
// (20 players ≈ 40 of the 160 loads/day). The screens work with any number; raise this if quota allows.
export const MAX_PARTY_PLAYERS = 20;
// What the host can choose in the lobby. Only these exact values are accepted by the server.
export const ROUND_COUNT_CHOICES = [3, 5, 7, 10] as const;
export const DEFAULT_ROUNDS = 5;
export const ROUND_TIME_CHOICES = [30, 60, 90, 120, 0] as const; // seconds; 0 = no time limit
export const DEFAULT_ROUND_SECONDS = 60;

export type PartySettings = { mapId: string; mapName: string; rounds: number; roundSeconds: number };

const name = z.string().trim().min(1, "Enter a name").max(20, "Max 20 characters");
const code = z.string().regex(/^\d{6}$/, "A party code is 6 digits");
// Signed-in players send a signed pass from the website (src/lib/party/ticket.ts); guests leave it out.
const ticket = z.string().max(1000).optional();

// ----- Browser → server -----
export const clientMessageSchema = z.discriminatedUnion("type", [
  // Start a new party (you become the host).
  z.object({ type: z.literal("create"), name, ticket }),
  // Join a friend's party with its 6-digit code.
  z.object({ type: z.literal("join"), code, name, ticket }),
  // Come back after a refresh or lost connection (the secret token proves it's you).
  z.object({ type: z.literal("rejoin"), code, token: z.string().min(10).max(100) }),
  z.object({ type: z.literal("leave") }),
  // Host only:
  z.object({
    type: z.literal("settings"),
    mapId: z.string().min(1).max(40),
    rounds: z.literal(ROUND_COUNT_CHOICES),
    roundSeconds: z.literal(ROUND_TIME_CHOICES),
  }),
  z.object({ type: z.literal("lock"), locked: z.boolean() }),
  z.object({ type: z.literal("kick"), playerId: z.string().min(1).max(40) }),
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("next") }), // results → next round (or the final standings)
  z.object({ type: z.literal("backToLobby") }),
  // Everyone:
  z.object({ type: z.literal("guess"), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

// ----- Server → browser -----
export type PartyPhase = "lobby" | "round" | "results" | "final";

export type PartyPlayer = {
  id: string;
  name: string;
  color: string; // each player's pin colour
  score: number; // total so far
  connected: boolean;
  guessed: boolean; // in the current round
  signedIn: boolean;
};

export type RoundGuess = { playerId: string; lat: number; lng: number; distanceKm: number; score: number };

// What ONE player is allowed to see. The answer is only included after the round ends.
export type PartyView = {
  code: string;
  you: string; // your player id
  hostId: string;
  phase: PartyPhase;
  locked: boolean;
  settings: PartySettings;
  players: PartyPlayer[];
  roundNumber: number; // 1-based; 0 in the lobby
  totalRounds: number;
  // While a round is being played: where Street View points, and when time runs out (server clock, ms).
  panorama: { lat: number; lng: number } | null;
  endsAt: number | null;
  // On the results screen: when the next round (or the final standings) starts by itself (server clock, ms).
  nextAt: number | null;
  yourGuess: { lat: number; lng: number } | null;
  // After a round: the answer and everybody's guesses.
  result: { answer: { lat: number; lng: number }; country: string; guesses: RoundGuess[] } | null;
  // Every finished round (for the final map).
  history: { roundNumber: number; answer: { lat: number; lng: number }; country: string; guesses: RoundGuess[] }[];
};

export type ServerMessage =
  | { type: "state"; view: PartyView; serverNow: number }
  // Sent once when you create/join: keep it to rejoin after a refresh.
  | { type: "joined"; code: string; token: string }
  | { type: "error"; message: string }
  // You were removed (kicked, or the party closed).
  | { type: "closed"; message: string };
