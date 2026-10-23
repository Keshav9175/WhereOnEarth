import { describe, expect, it } from "vitest";
import {
  CONTINENTS,
  DEFAULT_MAP_ID,
  MAPS,
  continentFromNaturalEarth,
  countryMap,
  findMap,
  isMapIdShape,
} from "./catalog";

describe("map catalog", () => {
  it("has World as the default map, covering every location", () => {
    expect(findMap(DEFAULT_MAP_ID)).toMatchObject({ name: "World", continent: null, countryCode: null });
  });

  it("has exactly one map per continent", () => {
    const continents = MAPS.map((map) => map.continent).filter((continent) => continent !== null);
    expect([...continents].sort()).toEqual([...CONTINENTS].sort());
  });

  it("uses unique ids", () => {
    expect(new Set(MAPS.map((map) => map.id)).size).toBe(MAPS.length);
  });

  it("returns undefined for an unknown fixed map", () => {
    expect(findMap("mars")).toBeUndefined();
  });
});

describe("country maps", () => {
  it("builds a map whose id is the lowercase country code", () => {
    expect(countryMap("FR", "France")).toMatchObject({ id: "fr", name: "France", countryCode: "FR", continent: null });
  });

  it("recognises map-id shapes: fixed ids and two-letter codes only", () => {
    expect(isMapIdShape("europe")).toBe(true);
    expect(isMapIdShape("fr")).toBe(true);
    expect(isMapIdShape("FR")).toBe(false);
    expect(isMapIdShape("fra")).toBe(false);
    expect(isMapIdShape("mars")).toBe(false);
  });
});

describe("continentFromNaturalEarth", () => {
  it("maps Natural Earth continent names to our ids", () => {
    expect(continentFromNaturalEarth("North America")).toBe("north-america");
    expect(continentFromNaturalEarth("Europe")).toBe("europe");
  });

  it("gives null for open-ocean islands, Antarctica and missing values", () => {
    expect(continentFromNaturalEarth("Seven seas (open ocean)")).toBeNull();
    expect(continentFromNaturalEarth("Antarctica")).toBeNull();
    expect(continentFromNaturalEarth(undefined)).toBeNull();
  });
});

describe("tag maps", () => {
  it("Famous places draws from UNESCO sites and is listed", async () => {
    const { FAMOUS_MAP_ID, LISTED_MAPS } = await import("./catalog");
    expect(findMap(FAMOUS_MAP_ID)).toMatchObject({ tag: "unesco", hidden: false });
    expect(LISTED_MAPS.some((map) => map.id === FAMOUS_MAP_ID)).toBe(true);
  });

  it("the first-game map is hidden and is where FIRST_GAME_URL points", async () => {
    const { FIRST_GAME_MAP_ID, FIRST_GAME_URL, LISTED_MAPS } = await import("./catalog");
    expect(findMap(FIRST_GAME_MAP_ID)).toMatchObject({ tag: "first-game", hidden: true });
    expect(LISTED_MAPS.some((map) => map.id === FIRST_GAME_MAP_ID)).toBe(false);
    expect(FIRST_GAME_URL).toBe(`/play?map=${FIRST_GAME_MAP_ID}`);
  });
});
