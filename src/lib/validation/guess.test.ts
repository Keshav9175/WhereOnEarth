import { describe, expect, it } from "vitest";
import { guessSchema } from "@/lib/validation/guess";

describe("guessSchema", () => {
  it("accepts a valid guess", () => {
    const result = guessSchema.safeParse({ lat: 48.85, lng: 2.35 });
    expect(result.success).toBe(true);
  });

  it("accepts the extreme edges of the map", () => {
    expect(guessSchema.safeParse({ lat: 90, lng: 180 }).success).toBe(true);
    expect(guessSchema.safeParse({ lat: -90, lng: -180 }).success).toBe(true);
  });

  it("rejects coordinates outside the Earth", () => {
    expect(guessSchema.safeParse({ lat: 999, lng: 0 }).success).toBe(false);
    expect(guessSchema.safeParse({ lat: 0, lng: -181 }).success).toBe(false);
  });

  it("rejects values that are not real numbers", () => {
    expect(guessSchema.safeParse({ lat: "48", lng: 2 }).success).toBe(false);
    expect(guessSchema.safeParse({ lat: Number.NaN, lng: 2 }).success).toBe(false);
    expect(guessSchema.safeParse({ lat: Number.POSITIVE_INFINITY, lng: 2 }).success).toBe(false);
  });

  it("rejects missing fields and non-objects", () => {
    expect(guessSchema.safeParse({ lat: 1 }).success).toBe(false);
    expect(guessSchema.safeParse({}).success).toBe(false);
    expect(guessSchema.safeParse("hello").success).toBe(false);
    expect(guessSchema.safeParse(null).success).toBe(false);
  });

  it("rejects extra fields, so a player cannot send their own score", () => {
    const result = guessSchema.safeParse({ lat: 1, lng: 2, score: 5000 });
    expect(result.success).toBe(false);
  });
});
