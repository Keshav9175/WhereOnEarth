import { describe, expect, it } from "vitest";
import { MAX_SCORE, PERFECT_GUESS_KM, calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("gives full points for a perfect guess", () => {
    expect(calculateScore(0)).toBe(MAX_SCORE);
    expect(calculateScore(PERFECT_GUESS_KM)).toBe(MAX_SCORE);
  });

  it("matches the expected points at known distances", () => {
    expect(calculateScore(100)).toBe(4756);
    expect(calculateScore(500)).toBe(3894);
    expect(calculateScore(1000)).toBe(3033);
    expect(calculateScore(2000)).toBe(1839);
    expect(calculateScore(5000)).toBe(410);
    expect(calculateScore(10000)).toBe(34);
  });

  it("gives 0 points for the other side of the world", () => {
    expect(calculateScore(20015)).toBe(0);
  });

  it("never gives more points for a worse guess", () => {
    const distances = [0, 1, 10, 100, 1000, 5000, 10000, 20015];
    const scores = distances.map(calculateScore);

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("always returns a whole number between 0 and MAX_SCORE", () => {
    for (const km of [0.3, 42.7, 777.7, 3333.3, 19999.9]) {
      const score = calculateScore(km);
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it("rejects impossible distances", () => {
    expect(() => calculateScore(-5)).toThrow(RangeError);
    expect(() => calculateScore(Number.NaN)).toThrow(RangeError);
    expect(() => calculateScore(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
