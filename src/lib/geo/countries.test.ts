import { describe, expect, it } from "vitest";
import {
  buildCountry,
  findCountry,
  isInCountry,
  planCountryTargets,
  randomPointInCountry,
  ringAreaKm2,
  type Ring,
} from "./countries";

// A square from (lng 0, lat 0) to (lng 10, lat 10).
const square = (minLng: number, minLat: number, size: number): Ring => [
  [minLng, minLat],
  [minLng + size, minLat],
  [minLng + size, minLat + size],
  [minLng, minLat + size],
  [minLng, minLat],
];

// "Ringland" is a 10° square with a 2° hole cut out of its middle ("Holeland" lives in the hole).
const ringland = buildCountry("RL", "Ringland", [[square(0, 0, 10), square(4, 4, 2)]]);
const holeland = buildCountry("HL", "Holeland", [[square(4, 4, 2)]]);
const islands = buildCountry("IS", "Islands", [[square(20, 0, 1)], [square(30, 0, 1)]]);

describe("ringAreaKm2", () => {
  it("measures a 1° square at the equator as about 111 km × 111 km", () => {
    expect(ringAreaKm2(square(0, 0, 1))).toBeCloseTo(111.32 * 111.32, -2);
  });

  it("shrinks the same square near the poles (longitude lines get closer)", () => {
    expect(ringAreaKm2(square(0, 60, 1))).toBeLessThan(ringAreaKm2(square(0, 0, 1)) * 0.55);
  });
});

describe("isInCountry / findCountry", () => {
  it("finds points inside the outline", () => {
    expect(isInCountry({ lat: 1, lng: 1 }, ringland)).toBe(true);
  });

  it("treats a hole as outside the country", () => {
    expect(isInCountry({ lat: 5, lng: 5 }, ringland)).toBe(false);
    expect(findCountry({ lat: 5, lng: 5 }, [ringland, holeland])?.code).toBe("HL");
  });

  it("returns null for the sea", () => {
    expect(findCountry({ lat: -20, lng: -20 }, [ringland, holeland])).toBeNull();
  });

  it("checks every island of a country", () => {
    expect(findCountry({ lat: 0.5, lng: 30.5 }, [islands])?.code).toBe("IS");
  });
});

describe("randomPointInCountry", () => {
  it("always lands on the country's land, never in its hole", () => {
    for (let i = 0; i < 500; i++) {
      expect(isInCountry(randomPointInCountry(ringland), ringland)).toBe(true);
    }
  });

  it("uses every island", () => {
    const longitudes = Array.from({ length: 200 }, () => randomPointInCountry(islands).lng);
    expect(longitudes.some((lng) => lng < 25)).toBe(true);
    expect(longitudes.some((lng) => lng > 25)).toBe(true);
  });
});

describe("planCountryTargets", () => {
  const big = buildCountry("BG", "Big", [[square(0, 0, 16)]]);
  const small = buildCountry("SM", "Small", [[square(40, 0, 1)]]);

  it("gives bigger countries more locations, but not in proportion to area", () => {
    const targets = planCountryTargets([big, small], 100, 1);
    // Big has 256× the area of Small, but only √256 = 16× the share.
    expect(targets.get("BG")).toBe(94);
    expect(targets.get("SM")).toBe(6);
  });

  it("gives every country at least the minimum", () => {
    expect(planCountryTargets([big, small], 10, 3).get("SM")).toBe(3);
  });
});
