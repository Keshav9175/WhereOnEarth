import { describe, expect, it } from "vitest";
import { MAX_PARTY_PLAYERS } from "./protocol";
import { PartyError, PartyRoom, type PartyLocation } from "./room";

const PARIS: PartyLocation = { lat: 48.8566, lng: 2.3522, country: "France" };
const FIVE_ROUNDS: PartyLocation[] = Array.from({ length: 5 }, () => PARIS);

function roomWith(...names: string[]) {
  const room = new PartyRoom("123456");
  names.forEach((name, i) => room.addPlayer({ id: name, token: `token-${name}-xxxxxx`, name, userId: null, now: i }));
  return room;
}

describe("PartyRoom: joining", () => {
  it("makes the first player the host and gives everyone a different colour", () => {
    const room = roomWith("ana", "ben");
    expect(room.hostId).toBe("ana");
    const [a, b] = room.viewFor("ana").players;
    expect(a.color).not.toBe(b.color);
  });

  it("refuses players when full or locked", () => {
    const room = roomWith(...Array.from({ length: MAX_PARTY_PLAYERS }, (_, i) => `p${i}`));
    expect(() => room.addPlayer({ id: "late", token: "token-late-xxxxx", name: "Late", userId: null, now: 99 })).toThrow("full");

    const small = roomWith("ana");
    small.setLocked("ana", true);
    expect(() => small.addPlayer({ id: "ben", token: "token-ben-xxxxxx", name: "Ben", userId: null, now: 1 })).toThrow("locked");
  });

  it("doesn't let one account take two seats", () => {
    const room = new PartyRoom("123456");
    room.addPlayer({ id: "a", token: "token-a-xxxxxxxx", name: "Ana", userId: "user-1", now: 0 });
    expect(() => room.addPlayer({ id: "b", token: "token-b-xxxxxxxx", name: "Ana", userId: "user-1", now: 1 })).toThrow(PartyError);
  });

  it("hands the host role to the next player when the host leaves", () => {
    const room = roomWith("ana", "ben", "cai");
    room.removePlayer("ana");
    expect(room.hostId).toBe("ben");
  });

  it("keeps the host role through a refresh, and passes it on only if the host stays away", () => {
    const room = roomWith("ana", "ben");
    room.setConnected("ana", false);
    expect(room.hostId).toBe("ana"); // a refresh mustn't cost the crown
    room.setConnected("ana", true);
    room.passHostIfStillAway("ana");
    expect(room.hostId).toBe("ana"); // came back in time

    room.setConnected("ana", false);
    room.passHostIfStillAway("ana");
    expect(room.hostId).toBe("ben"); // still away → Ben takes over
  });

  it("finds a player by their rejoin token", () => {
    const room = roomWith("ana");
    expect(room.playerForToken("token-ana-xxxxxx")).toBe("ana");
    expect(room.playerForToken("wrong-token-xxx")).toBeNull();
  });
});

describe("PartyRoom: host-only actions", () => {
  it("only lets the host start, change settings, kick or lock", () => {
    const room = roomWith("ana", "ben");
    expect(() => room.start("ben", FIVE_ROUNDS, 0)).toThrow("Only the host");
    expect(() => room.kick("ben", "ana")).toThrow("Only the host");
    expect(() => room.setLocked("ben", true)).toThrow("Only the host");
    room.kick("ana", "ben");
    expect(room.playerCount).toBe(1);
  });
});

describe("PartyRoom: playing", () => {
  it("hides the answer and other guesses until the round ends", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 48.86, lng: 2.35 });

    const benSees = room.viewFor("ben");
    expect(benSees.phase).toBe("round");
    expect(benSees.result).toBeNull();
    expect(benSees.players.find((p) => p.id === "ana")?.guessed).toBe(true);
    // Your own guess comes back as a point only — no distance or score that would hint at the answer.
    expect(room.viewFor("ana").yourGuess).toEqual({ lat: 48.86, lng: 2.35 });
  });

  it("scores on the server and ends the round when everyone has guessed", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: PARIS.lat, lng: PARIS.lng });
    expect(room.everyoneGuessed()).toBe(false);
    room.guess("ben", { lat: 0, lng: 0 });
    expect(room.everyoneGuessed()).toBe(true);

    room.endRound();
    const view = room.viewFor("ben");
    expect(view.phase).toBe("results");
    expect(view.result?.country).toBe("France");
    const ana = view.players.find((p) => p.id === "ana")!;
    const ben = view.players.find((p) => p.id === "ben")!;
    expect(ana.score).toBe(5000); // perfect guess
    expect(ben.score).toBeLessThan(ana.score);
  });

  it("doesn't wait for players who disconnected", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0);
    room.setConnected("ben", false);
    room.guess("ana", { lat: 1, lng: 1 });
    expect(room.everyoneGuessed()).toBe(true);
  });

  it("refuses a second guess in the same round", () => {
    const room = roomWith("ana");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 1, lng: 1 });
    expect(() => room.guess("ana", { lat: 2, lng: 2 })).toThrow("already guessed");
  });

  it("sets a deadline from the round time, or none for 'no limit'", () => {
    const room = roomWith("ana");
    room.updateSettings("ana", { mapId: "world", mapName: "World", rounds: 5, roundSeconds: 30 });
    room.start("ana", FIVE_ROUNDS, 1000);
    expect(room.viewFor("ana").endsAt).toBe(31_000);

    const relaxed = roomWith("ana");
    relaxed.updateSettings("ana", { mapId: "world", mapName: "World", rounds: 5, roundSeconds: 0 });
    relaxed.start("ana", FIVE_ROUNDS, 1000);
    expect(relaxed.viewFor("ana").endsAt).toBeNull();
  });

  it("plays the number of rounds the host chose", () => {
    const room = roomWith("ana");
    room.updateSettings("ana", { mapId: "world", mapName: "World", rounds: 3, roundSeconds: 60 });
    room.start("ana", FIVE_ROUNDS, 0); // more locations than needed: only 3 are used
    expect(room.viewFor("ana").totalRounds).toBe(3);
    for (let round = 1; round <= 3; round++) {
      room.guess("ana", { lat: 0, lng: 0 });
      room.endRound();
      room.next("ana", round);
    }
    expect(room.viewFor("ana").phase).toBe("final");
    expect(room.viewFor("ana").history).toHaveLength(3);
  });

  it("refuses to start with fewer locations than rounds", () => {
    const room = roomWith("ana");
    room.updateSettings("ana", { mapId: "world", mapName: "World", rounds: 10, roundSeconds: 60 });
    expect(() => room.start("ana", FIVE_ROUNDS, 0)).toThrow("Not enough locations");
  });

  it("plays 5 rounds, then shows the final standings, then can go back to the lobby", () => {
    const room = roomWith("ana");
    room.start("ana", FIVE_ROUNDS, 0);
    for (let round = 1; round <= 5; round++) {
      expect(room.viewFor("ana").roundNumber).toBe(round);
      room.guess("ana", { lat: PARIS.lat, lng: PARIS.lng });
      room.endRound();
      room.next("ana", round);
    }
    const final = room.viewFor("ana");
    expect(final.phase).toBe("final");
    expect(final.history).toHaveLength(5);
    expect(final.players[0].score).toBe(25_000);

    room.backToLobby("ana");
    expect(room.viewFor("ana").phase).toBe("lobby");
    expect(room.viewFor("ana").players[0].score).toBe(0);
  });
});
