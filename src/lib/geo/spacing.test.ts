import { describe, expect, it } from "vitest";
import { SpacingGrid } from "./spacing";

describe("SpacingGrid", () => {
  it("rejects a point closer than the minimum distance", () => {
    const grid = new SpacingGrid(1);
    grid.add({ lat: 48.8584, lng: 2.2945 });
    // About 500 m away.
    expect(grid.isTooClose({ lat: 48.8629, lng: 2.2945 })).toBe(true);
  });

  it("accepts a point further away than the minimum distance", () => {
    const grid = new SpacingGrid(1);
    grid.add({ lat: 48.8584, lng: 2.2945 });
    // About 2 km away.
    expect(grid.isTooClose({ lat: 48.8764, lng: 2.2945 })).toBe(false);
  });

  it("works across the ±180° line, where longitude jumps", () => {
    const grid = new SpacingGrid(1);
    grid.add({ lat: -16.5, lng: 179.999 });
    expect(grid.isTooClose({ lat: -16.5, lng: -179.999 })).toBe(true);
  });

  it("is empty at the start", () => {
    expect(new SpacingGrid(1).isTooClose({ lat: 0, lng: 0 })).toBe(false);
  });
});
