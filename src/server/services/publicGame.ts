import type { Coordinates } from "@/types/geo";

// The stored data toPublicGame needs. Plain shapes (not Mongoose types), so both real
// database games and simple test objects fit.
export type StoredRound = {
  answer: Coordinates;
  country: string;
  guess?: Coordinates | null;
  distanceKm?: number | null;
  score?: number | null;
};

export type StoredGame = {
  _id: { toString(): string };
  status: "in_progress" | "completed";
  totalScore: number;
  rounds: readonly StoredRound[];
};

// What the player is allowed to see about one round.
export type PublicRound = {
  roundNumber: number;
  guessed: boolean;
  guess: Coordinates | null;
  // The true answer is revealed ONLY after the round has been guessed.
  answer: Coordinates | null;
  country: string | null;
  distanceKm: number | null;
  score: number | null;
};

// What the player is allowed to see about the whole game.
export type PublicGame = {
  id: string;
  status: "in_progress" | "completed";
  totalScore: number;
  totalRounds: number;
  // The round to play next (1–5), or null when the game is finished.
  currentRound: number | null;
  // Where to point the Street View panorama for the CURRENT round only (null when finished).
  // The Embed iframe cannot work without it, so it is unavoidably visible to the browser —
  // but the country is still hidden and the score is always computed on the server (D-014).
  currentPanorama: Coordinates | null;
  rounds: PublicRound[];
};

// Turns a game from the database into the safe version we send to the player.
export function toPublicGame(game: StoredGame): PublicGame {
  const rounds: PublicRound[] = game.rounds.map((round, index) => {
    const guessed = round.guess != null;

    return {
      roundNumber: index + 1,
      guessed,
      guess: round.guess ? { lat: round.guess.lat, lng: round.guess.lng } : null,
      answer: guessed ? { lat: round.answer.lat, lng: round.answer.lng } : null,
      country: guessed ? round.country : null,
      distanceKm: round.distanceKm ?? null,
      score: round.score ?? null,
    };
  });

  const nextRound = rounds.find((round) => !round.guessed);
  const nextStoredRound = nextRound ? game.rounds[nextRound.roundNumber - 1] : null;

  return {
    id: game._id.toString(),
    status: game.status,
    totalScore: game.totalScore,
    totalRounds: rounds.length,
    currentRound: nextRound ? nextRound.roundNumber : null,
    currentPanorama: nextStoredRound
      ? { lat: nextStoredRound.answer.lat, lng: nextStoredRound.answer.lng }
      : null,
    rounds,
  };
}
