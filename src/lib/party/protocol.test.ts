import { describe, expect, it } from "vitest";
import { clientMessageSchema } from "./protocol";

const settings = { type: "settings", mapId: "world", rounds: 5, roundSeconds: 60 } as const;

describe("party settings message", () => {
  it("accepts the three movement modes and a road-names switch", () => {
    for (const movement of ["moving", "no-move", "nmpz"]) {
      expect(clientMessageSchema.safeParse({ ...settings, movement, roadNames: false }).success).toBe(true);
    }
  });

  it("rejects an unknown movement mode or a missing road-names choice", () => {
    expect(clientMessageSchema.safeParse({ ...settings, movement: "fly", roadNames: false }).success).toBe(false);
    expect(clientMessageSchema.safeParse({ ...settings, movement: "nmpz" }).success).toBe(false);
  });
});
