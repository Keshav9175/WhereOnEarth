import { isObjectIdOrHexString, type Types } from "mongoose";
import { haversineDistanceKm } from "@/lib/game/distance";
import { calculateScore } from "@/lib/game/scoring";
import type { GuessInput } from "@/lib/validation/guess";
import { connectToDatabase } from "@/server/db";
import { GameModel, ROUNDS_PER_GAME } from "@/server/models/Game";
import { LocationModel } from "@/server/models/Location";

// The shape of one location as it comes back from the random-sample query.
type SampledLocation = {
  _id: Types.ObjectId;
  lat: number;
  lng: number;
  country: string;
};

// Starts a new game: picks random locations and saves a game with one round per location.
// `userId` is the signed-in player, or null for a guest.
export async function createGame(userId: string | null) {
  await connectToDatabase();

  // Ask MongoDB for ROUNDS_PER_GAME (5) random locations.
  const locations = await LocationModel.aggregate<SampledLocation>([
    { $sample: { size: ROUNDS_PER_GAME } },
  ]);

  if (locations.length < ROUNDS_PER_GAME) {
    throw new Error(
      `Not enough locations: need ${ROUNDS_PER_GAME}, found ${locations.length}. Run "npm run seed".`,
    );
  }

  // Build one round per location and save the game.
  return GameModel.create({
    userId,
    rounds: locations.map((location) => ({
      locationId: location._id,
      answer: { lat: location.lat, lng: location.lng },
      country: location.country,
    })),
  });
}

// Who may see or play a game: anyone for a guest game, only the owner for a player's game.
export function canAccessGame(gameUserId: string | null | undefined, userId: string | null) {
  return gameUserId == null || gameUserId === userId;
}

// Finds a game the given player is allowed to see. Returns null if the ID is malformed,
// the game does not exist, or it belongs to someone else (we don't reveal which).
export async function getGameForPlayer(id: string, userId: string | null) {
  if (!isObjectIdOrHexString(id)) {
    return null;
  }

  await connectToDatabase();
  const game = await GameModel.findById(id);

  if (!game || !canAccessGame(game.userId, userId)) {
    return null;
  }
  return game;
}

// The result of a guess: success with the updated game, or a reason it was refused.
export type SubmitGuessResult =
  | {
      ok: true;
      game: NonNullable<Awaited<ReturnType<typeof getGameForPlayer>>>;
      roundIndex: number;
    }
  | { ok: false; reason: "not_found" | "game_over" | "already_guessed" };

// Records the player's guess for the current round. The SERVER computes distance and score.
export async function submitGuess(
  gameId: string,
  guess: GuessInput,
  userId: string | null,
): Promise<SubmitGuessResult> {
  const game = await getGameForPlayer(gameId, userId);

  if (!game) {
    return { ok: false, reason: "not_found" };
  }

  if (game.status === "completed") {
    return { ok: false, reason: "game_over" };
  }

  // The current round is the first one without a guess.
  const roundIndex = game.rounds.findIndex((round) => round.guess == null);
  if (roundIndex === -1) {
    return { ok: false, reason: "game_over" };
  }

  const round = game.rounds[roundIndex];
  const distanceKm = haversineDistanceKm(guess, round.answer);
  const score = calculateScore(distanceKm);
  const isLastRound = roundIndex === game.rounds.length - 1;
  const now = new Date();

  // Update atomically, and only if this round is STILL unguessed.
  // This stops a double-click (two requests at once) from scoring the same round twice.
  // `$type: "null"` means "literally null" — plain `null` would also match missing fields.
  const updated = await GameModel.findOneAndUpdate(
    { _id: game._id, status: "in_progress", [`rounds.${roundIndex}.guess`]: { $type: "null" } },
    {
      $set: {
        [`rounds.${roundIndex}.guess`]: guess,
        [`rounds.${roundIndex}.distanceKm`]: distanceKm,
        [`rounds.${roundIndex}.score`]: score,
        [`rounds.${roundIndex}.guessedAt`]: now,
        ...(isLastRound ? { status: "completed", completedAt: now } : {}),
      },
      $inc: { totalScore: score },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) {
    return { ok: false, reason: "already_guessed" };
  }

  return { ok: true, game: updated, roundIndex };
}
