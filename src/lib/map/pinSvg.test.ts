import { describe, expect, it } from "vitest";
import { playerPinSvg } from "./pinSvg";

describe("playerPinSvg", () => {
  it("shows the player's first letter, upper-cased", () => {
    expect(playerPinSvg("#dc2626", "keshav", "p1")).toContain(">K</text>");
    expect(playerPinSvg("#dc2626", "Émile", "p2")).toContain(">É</text>");
  });

  it("never puts markup from a name or colour into the SVG", () => {
    const svg = playerPinSvg('red" onload="alert(1)', "<script>", "p3");
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("onload");
    expect(svg).toContain(">S</text>");
  });

  it("uses a question mark when the name has no letters", () => {
    expect(playerPinSvg("#dc2626", "!!!", "p4")).toContain(">?</text>");
  });
});
