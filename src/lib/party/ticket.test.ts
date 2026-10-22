import { describe, expect, it } from "vitest";
import { createTicket, readTicket } from "./ticket";

const SECRET = "test-secret-at-least-32-characters-long";
const ana = { id: "user-1", name: "Ana" };

describe("party tickets", () => {
  it("round-trips a signed-in player", () => {
    expect(readTicket(createTicket(ana, SECRET), SECRET)).toEqual(ana);
  });

  it("rejects a ticket signed with another secret", () => {
    expect(readTicket(createTicket(ana, "some-other-secret-xxxxxxxxxxxxxxxx"), SECRET)).toBeNull();
  });

  it("rejects an edited ticket (e.g. someone changing the name or id)", () => {
    const [, signature] = createTicket(ana, SECRET).split(".");
    const forgedData = Buffer.from(JSON.stringify({ id: "admin", name: "Admin", exp: Date.now() + 60_000 })).toString("base64url");
    expect(readTicket(`${forgedData}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects an expired ticket", () => {
    const old = createTicket(ana, SECRET, Date.now() - 10 * 60_000);
    expect(readTicket(old, SECRET)).toBeNull();
  });

  it("rejects junk", () => {
    expect(readTicket("not-a-ticket", SECRET)).toBeNull();
    expect(readTicket("a.b.c", SECRET)).toBeNull();
  });
});
