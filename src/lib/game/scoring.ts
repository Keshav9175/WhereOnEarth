// Points for a perfect guess. Every round is worth at most this much.
export const MAX_SCORE = 5000;

// Controls how fast points drop. Bigger number = more forgiving.
// At this distance, a guess earns about 37% of the maximum points.
export const SCORE_DECAY_KM = 2000;

// Guesses closer than this (50 metres) count as perfect.
export const PERFECT_GUESS_KM = 0.05;

// Turns a distance in kilometres into round points (0 to MAX_SCORE).
export function calculateScore(distanceKm: number): number {
  // Protect against impossible input, e.g. a bug that passes -5 or NaN.
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new RangeError(`distanceKm must be a non-negative number, got ${distanceKm}`);
  }

  if (distanceKm <= PERFECT_GUESS_KM) {
    return MAX_SCORE;
  }

  return Math.round(MAX_SCORE * Math.exp(-distanceKm / SCORE_DECAY_KM));
}
