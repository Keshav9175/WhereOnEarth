import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { MAX_SCORE } from "@/lib/game/scoring";
import { DEFAULT_MAP_ID } from "@/lib/maps/catalog";

export const ROUNDS_PER_GAME = 5;

// A point on Earth. Reused for both the true answer and the player's guess.
const coordinatesSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

// One round. Guess, distance and score stay empty (null) until the player guesses.
const roundSchema = new Schema(
  {
    locationId: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    answer: { type: coordinatesSchema, required: true },
    country: { type: String, required: true },
    guess: { type: coordinatesSchema, default: null },
    distanceKm: { type: Number, min: 0, default: null },
    score: { type: Number, min: 0, max: MAX_SCORE, default: null },
    guessedAt: { type: Date, default: null },
  },
  { _id: false },
);

// One whole game: its status, its rounds, and the running total.
const gameSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      required: true,
    },
    rounds: {
      type: [roundSchema],
      required: true,
      validate: {
        validator: (rounds: unknown[]) => rounds.length === ROUNDS_PER_GAME,
        message: `A game must have exactly ${ROUNDS_PER_GAME} rounds.`,
      },
    },
    totalScore: { type: Number, min: 0, default: 0, required: true },
    // The signed-in player who owns this game (Better Auth user id), or null for a guest game.
    userId: { type: String, default: null },
    // For guest games: the browser's anonymous ID (see src/server/guestId.ts), so we can avoid
    // showing a guest the same locations again. Null for signed-in players' games.
    guestId: { type: String, default: null },
    // Which map the rounds were drawn from: "world", a continent ("europe") or a country ("fr").
    // Older games are "world".
    mapId: { type: String, maxlength: 20, default: DEFAULT_MAP_ID, required: true },
    // When the last round was guessed. Null while the game is still in progress.
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes make the common lookups fast: a player's history, and the leaderboard.
gameSchema.index({ userId: 1, createdAt: -1 });
gameSchema.index({ status: 1, userId: 1, totalScore: -1 });
// A guest's recent games. "partial" = only guest games are in this index, keeping it small.
gameSchema.index(
  { guestId: 1, createdAt: -1 },
  { partialFilterExpression: { guestId: { $type: "string" } } },
);

export type Game = InferSchemaType<typeof gameSchema>;

export const GameModel: Model<Game> =
  (models.Game as Model<Game> | undefined) ?? model<Game>("Game", gameSchema);
