import { describe, expect, it } from "vitest";
import { pickRounds } from "./pickRounds";

const spot = (id: number, country: string) => ({ id, country });

describe("pickRounds", () => {
  it("takes one location per country, in the given (random) order", () => {
    const candidates = [spot(1, "France"), spot(2, "France"), spot(3, "Japan"), spot(4, "Kenya")];
    expect(pickRounds(candidates, 3).map((s) => s.id)).toEqual([1, 3, 4]);
  });

  it("stops at the requested number of rounds", () => {
    const candidates = ["A", "B", "C", "D", "E", "F", "G"].map((country, i) => spot(i, country));
    expect(pickRounds(candidates, 5)).toHaveLength(5);
  });

  it("repeats a country only when there are not enough different ones", () => {
    const candidates = [spot(1, "India"), spot(2, "India"), spot(3, "Peru"), spot(4, "India")];
    const ids = pickRounds(candidates, 3).map((s) => s.id);
    expect(ids.slice(0, 2)).toEqual([1, 3]); // the 2 different countries come first
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3); // never the same location twice
  });

  it("returns fewer rounds when there are not enough candidates at all", () => {
    expect(pickRounds([spot(1, "Chile")], 5)).toHaveLength(1);
  });
});
