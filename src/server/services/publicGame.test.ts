import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  toPublicGame,
  type StoredGame,
  type StoredRound,
} from "@/server/services/publicGame";

// Builds a round that has not been guessed yet.
function unguessedRound(lat: number, lng: number, country: string): StoredRound {
  return { answer: { lat, lng }, country, guess: null, distanceKm: null, score: null };
}

// Builds a pretend game in memory (no database needed).
function makeGame(rounds: StoredRound[], overrides: Partial<StoredGame> = {}): StoredGame {
  return {
    _id: new Types.ObjectId(),
    status: "in_progress",
    totalScore: 0,
    rounds,
    ...overrides,
  };
}

const FIVE_ROUNDS = [
  unguessedRound(48.87, 2.31, "France"),
  unguessedRound(35.66, 139.7, "Japan"),
  unguessedRound(-22.97, -43.18, "Brazil"),
  unguessedRound(64.15, -21.93, "Iceland"),
  unguessedRound(-1.28, 36.82, "Kenya"),
];

describe("toPublicGame", () => {
  it("hides every answer and country in a new game", () => {
    const view = toPublicGame(makeGame(FIVE_ROUNDS));

    expect(view.currentRound).toBe(1);
    for (const round of view.rounds) {
      expect(round.guessed).toBe(false);
      expect(round.answer).toBeNull();
      expect(round.country).toBeNull();
    }
  });

  it("never leaks countries or FUTURE rounds' locations", () => {
    const json = JSON.stringify(toPublicGame(makeGame(FIVE_ROUNDS)));

    for (const country of ["France", "Japan", "Brazil", "Iceland", "Kenya"]) {
      expect(json).not.toContain(country);
    }
    expect(json).not.toContain("139.7"); // round 2 (Tokyo)
    expect(json).not.toContain("-43.18"); // round 3 (Rio)
    expect(json).not.toContain("locationId");
  });

  it("gives the panorama location for the current round only", () => {
    expect(toPublicGame(makeGame(FIVE_ROUNDS)).currentPanorama).toEqual({ lat: 48.87, lng: 2.31 });

    const rounds = [...FIVE_ROUNDS];
    rounds[0] = { ...rounds[0], guess: { lat: 0, lng: 0 }, distanceKm: 5000, score: 410 };
    expect(toPublicGame(makeGame(rounds)).currentPanorama).toEqual({ lat: 35.66, lng: 139.7 });
  });

  it("reveals only the rounds that have been guessed", () => {
    const rounds = [...FIVE_ROUNDS];
    rounds[0] = { ...rounds[0], guess: { lat: 48.85, lng: 2.35 }, distanceKm: 3.1, score: 4992 };

    const view = toPublicGame(makeGame(rounds, { totalScore: 4992 }));

    expect(view.rounds[0]).toMatchObject({
      roundNumber: 1,
      guessed: true,
      answer: { lat: 48.87, lng: 2.31 },
      country: "France",
      score: 4992,
    });
    expect(view.rounds[1].answer).toBeNull();
    expect(view.rounds[1].country).toBeNull();
    expect(view.currentRound).toBe(2);
    expect(view.totalScore).toBe(4992);
  });

  it("has no current round once every round is guessed", () => {
    const rounds = FIVE_ROUNDS.map((round) => ({
      ...round,
      guess: { lat: 0, lng: 0 },
      distanceKm: 100,
      score: 4756,
    }));

    const view = toPublicGame(makeGame(rounds, { status: "completed" }));

    expect(view.currentRound).toBeNull();
    expect(view.currentPanorama).toBeNull();
    expect(view.status).toBe("completed");
  });
});
