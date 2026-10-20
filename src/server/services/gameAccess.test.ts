import { describe, expect, it } from "vitest";
import { canAccessGame } from "@/server/services/gameService";

describe("canAccessGame", () => {
  it("lets anyone open a guest game", () => {
    expect(canAccessGame(null, null)).toBe(true);
    expect(canAccessGame(null, "user-1")).toBe(true);
    expect(canAccessGame(undefined, null)).toBe(true);
  });

  it("lets the owner open their own game", () => {
    expect(canAccessGame("user-1", "user-1")).toBe(true);
  });

  it("blocks other players and guests from a player's game", () => {
    expect(canAccessGame("user-1", "user-2")).toBe(false);
    expect(canAccessGame("user-1", null)).toBe(false);
  });
});
