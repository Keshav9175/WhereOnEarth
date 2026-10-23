import { describe, expect, it } from "vitest";
import { USERNAME_RULES, usernameErrorMessage } from "./username";

describe("username rules", () => {
  it("allows letters, numbers, underscore and dot", () => {
    expect(USERNAME_RULES.pattern.test("Kiki_6.geo")).toBe(true);
  });

  it("rejects spaces and symbols", () => {
    expect(USERNAME_RULES.pattern.test("kiki 6")).toBe(false);
    expect(USERNAME_RULES.pattern.test("kiki@6")).toBe(false);
  });

  it("explains a taken username in plain words", () => {
    expect(usernameErrorMessage("USERNAME_IS_ALREADY_TAKEN", "x")).toMatch(/already taken/);
    expect(usernameErrorMessage("SOMETHING_ELSE", "fallback")).toBe("fallback");
  });
});
