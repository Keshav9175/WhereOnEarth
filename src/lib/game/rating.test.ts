import { describe, expect, it } from "vitest";
import { rateGame } from "./rating";

describe("rateGame", () => {
  it("gives the top title to near-perfect games", () => {
    expect(rateGame(24_000, 25_000)).toMatchObject({ title: "Geo Legend", percent: 96 });
  });

  it("uses the share of the maximum score", () => {
    expect(rateGame(16_681, 25_000)).toMatchObject({ title: "Seasoned Traveller", percent: 67 });
    expect(rateGame(17_500, 25_000).title).toBe("World Explorer"); // exactly 70%
  });

  it("never fails on a zero score", () => {
    expect(rateGame(0, 25_000)).toMatchObject({ title: "Tourist", percent: 0 });
    expect(rateGame(0, 0).title).toBe("Tourist");
  });
});
