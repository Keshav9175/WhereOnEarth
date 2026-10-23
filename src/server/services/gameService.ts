import { isObjectIdOrHexString, type Types } from "mongoose";
import { haversineDistanceKm } from "@/lib/game/distance";
import { pickRounds } from "@/lib/game/pickRounds";
import { calculateScore } from "@/lib/game/scoring";
import { DEFAULT_MAP_ID, findMap, type GameMap } from "@/lib/maps/catalog";
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

// Who is starting the game: a signed-in player (userId) or a guest browser (guestId).
export type GameOwner = { userId: string | null; guestId: string | null };

// How many of the player's latest games count as "recent" (100 games = 500 locations not repeated).
const RECENT_GAMES = 100;
// How many random locations we fetch to choose 5 rounds from different countries.
const CANDIDATES = 40;

// The locations this player (or guest browser) saw in their recent games.
async function recentLocationIds({ userId, guestId }: GameOwner): Promise<Types.ObjectId[]> {
  const filter = userId ? { userId } : guestId ? { guestId } : null;
  if (!filter) return [];

  // Only the location IDs are loaded (not whole games), so we tell TypeScript that shape.
  const games = await GameModel.find(filter, { "rounds.locationId": 1 })
    .sort({ createdAt: -1 })
    .limit(RECENT_GAMES)
    .lean<{ rounds: { locationId: Types.ObjectId }[] }[]>();
  return games.flatMap((game) => game.rounds.map((round) => round.locationId));
}

function sampleLocations(map: GameMap, excludeIds: Types.ObjectId[]) {
  // A tag map (Famous places, first game) → tagged locations; a country map → that country;
  // a continent → that continent; World → everything.
  const onMap = map.tag
    ? { tags: map.tag }
    : map.countryCode
      ? { countryCode: map.countryCode }
      : map.continent
        ? { continent: map.continent }
        : {};
  return LocationModel.aggregate<SampledLocation>([
    { $match: { ...onMap, _id: { $nin: excludeIds } } },
    { $sample: { size: CANDIDATES } },
  ]);
}

// `count` random locations on a map (5 for single player; parties choose 3–10), each in a different
// country when possible, avoiding `excludeIds` (falls back to allowing them if too few are left).
export async function pickGameLocations(
  map: GameMap,
  excludeIds: Types.ObjectId[] = [],
  count: number = ROUNDS_PER_GAME,
) {
  await connectToDatabase();

  let candidates = await sampleLocations(map, excludeIds);
  // A heavy player may have seen almost the whole map: then allow repeats rather than fail.
  if (candidates.length < count && excludeIds.length > 0) {
    candidates = await sampleLocations(map, []);
  }

  const locations = pickRounds(candidates, count);
  if (locations.length < count) {
    throw new Error(`Not enough locations on map "${map.id}": need ${count}, found ${locations.length}.`);
  }
  return locations;
}

// Starts a new game on the chosen map, skipping locations this player saw in their recent games.
// `map` is already checked by the caller (resolveMap in mapService); it defaults to World.
export async function createGame(owner: GameOwner, map: GameMap = findMap(DEFAULT_MAP_ID)!) {
  await connectToDatabase();
  const locations = await pickGameLocations(map, await recentLocationIds(owner));

  // Build one round per location and save the game.
  return GameModel.create({
    mapId: map.id,
    userId: owner.userId,
    guestId: owner.userId ? null : owner.guestId,
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
