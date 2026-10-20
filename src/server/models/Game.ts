import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { MAX_SCORE } from "@/lib/game/scoring";

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
  },
  { timestamps: true },
);

export type Game = InferSchemaType<typeof gameSchema>;

export const GameModel: Model<Game> =
  (models.Game as Model<Game> | undefined) ?? model<Game>("Game", gameSchema);
