import { describe, expect, it } from "vitest";
import {
  panCenterForRotatedDrag,
  rotatedMapPixelToCoordinates,
  screenDeltaToRotatedMapDelta,
  screenToRotatedMapPixel,
} from "./rotatedMapInteraction";

describe("rotated map touch coordinates", () => {
  it("maps screen coordinates back to landscape map pixels after clockwise rotation", () => {
    expect(screenToRotatedMapPixel(270, 140, { top: 40, right: 310 })).toEqual({ x: 100, y: 40 });
  });

  it("maps screen drag deltas back to landscape axes", () => {
    expect(screenDeltaToRotatedMapDelta({ x: 12, y: -8 })).toEqual({ x: -8, y: -12 });
  });

  it("resolves the center pixel to the map center", () => {
    expect(rotatedMapPixelToCoordinates({ x: 200, y: 100 }, { width: 400, height: 200 }, { lat: 0, lng: 0 }, 2)).toEqual({
      lat: 0,
      lng: 0,
    });
  });

  it("pans the map opposite the finger movement after axis rotation", () => {
    const center = panCenterForRotatedDrag({ lat: 0, lng: 0 }, 2, { x: 0, y: 20 });
    expect(center.lng).toBeLessThan(0);
    expect(center.lat).toBeCloseTo(0);
  });
});
