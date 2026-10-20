import { describe, expect, it } from "vitest";
import { parseListQuery } from "@/lib/validation/list";

function limitFrom(url: string) {
  const result = parseListQuery(new Request(url));
  return result.success ? result.data.limit : "invalid";
}

describe("parseListQuery", () => {
  it("defaults to 10 when no limit is given", () => {
    expect(limitFrom("http://localhost/api/leaderboard")).toBe(10);
  });

  it("reads a valid limit from the query string", () => {
    expect(limitFrom("http://localhost/api/leaderboard?limit=25")).toBe(25);
    expect(limitFrom("http://localhost/api/leaderboard?limit=1")).toBe(1);
    expect(limitFrom("http://localhost/api/leaderboard?limit=50")).toBe(50);
  });

  it("rejects limits that are out of range or not whole numbers", () => {
    expect(limitFrom("http://localhost/api/leaderboard?limit=0")).toBe("invalid");
    expect(limitFrom("http://localhost/api/leaderboard?limit=51")).toBe("invalid");
    expect(limitFrom("http://localhost/api/leaderboard?limit=2.5")).toBe("invalid");
    expect(limitFrom("http://localhost/api/leaderboard?limit=abc")).toBe("invalid");
  });
});
