import { describe, expect, it } from "vitest";
import { newGameSchema } from "./newGame";

describe("newGameSchema", () => {
  it("defaults to the World map when no map is given", () => {
    expect(newGameSchema.parse({})).toEqual({ map: "world" });
  });

  it("accepts a known map", () => {
    expect(newGameSchema.parse({ map: "europe" })).toEqual({ map: "europe" });
  });

  it("accepts a country map id (two lowercase letters)", () => {
    expect(newGameSchema.parse({ map: "fr" })).toEqual({ map: "fr" });
  });

  it("rejects an unknown map", () => {
    expect(newGameSchema.safeParse({ map: "mars" }).success).toBe(false);
  });

  it("rejects extra fields (a client can't sneak in its own locations)", () => {
    expect(newGameSchema.safeParse({ map: "world", rounds: [] }).success).toBe(false);
  });
});
