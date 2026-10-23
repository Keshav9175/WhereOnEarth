import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  it("keeps paths on our own site", () => {
    expect(safeNextPath("/party")).toBe("/party");
    expect(safeNextPath("/play?map=first-game")).toBe("/play?map=first-game");
  });

  it("refuses other websites (open redirect)", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    // Browsers treat "/\evil.example" like "//evil.example" (another website).
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });

  it("uses the fallback when there is nothing", () => {
    expect(safeNextPath(null, "/home")).toBe("/home");
  });
});
