import { describe, expect, it } from "vitest";
import { EARTH_RADIUS_KM, haversineDistanceKm } from "./distance";

// Real places we will use in the tests.
const LONDON = { lat: 51.5074, lng: -0.1278 };
const PARIS = { lat: 48.8566, lng: 2.3522 };
const NEW_YORK = { lat: 40.7128, lng: -74.006 };
const SYDNEY = { lat: -33.8688, lng: 151.2093 };

// Half the Earth's circumference: the farthest two points can ever be (about 20,015 km).
const HALF_CIRCUMFERENCE_KM = Math.PI * EARTH_RADIUS_KM;

describe("haversineDistanceKm", () => {
  it("returns 0 when the guess is exactly on the location", () => {
    expect(haversineDistanceKm(LONDON, LONDON)).toBe(0);
  });

  it("matches known real-world distances", () => {
    expect(haversineDistanceKm(LONDON, PARIS)).toBeCloseTo(343.6, 0);
    expect(haversineDistanceKm(LONDON, NEW_YORK)).toBeCloseTo(5570.2, 0);
    expect(haversineDistanceKm(LONDON, SYDNEY)).toBeCloseTo(16993.9, 0);
  });

  it("gives the same answer in both directions", () => {
    expect(haversineDistanceKm(PARIS, SYDNEY)).toBe(haversineDistanceKm(SYDNEY, PARIS));
  });

  it("goes the short way across the 180° line, not around the whole planet", () => {
    // 179°E and 179°W are only 2° apart (~222 km), not 358° apart.
    const distance = haversineDistanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 });
    expect(distance).toBeCloseTo(222.4, 0);
  });

  it("handles points on opposite sides of the Earth without returning NaN", () => {
    expect(haversineDistanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(
      HALF_CIRCUMFERENCE_KM,
      6,
    );
    expect(haversineDistanceKm({ lat: 90, lng: 0 }, { lat: -90, lng: 0 })).toBeCloseTo(
      HALF_CIRCUMFERENCE_KM,
      6,
    );
  });

  it("never exceeds half the Earth's circumference", () => {
    expect(haversineDistanceKm(NEW_YORK, SYDNEY)).toBeLessThanOrEqual(HALF_CIRCUMFERENCE_KM);
  });
});
