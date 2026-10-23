import { describe, expect, it } from "vitest";
import { MAX_PARTY_PLAYERS } from "./protocol";
import { LAST_GUESSER_SECONDS, PartyError, PartyRoom, RESULTS_SECONDS, type PartyLocation } from "./room";

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


  it("keeps the host role through a refresh, and passes it on only if the host stays away", () => {
    const room = roomWith("ana", "ben");
    room.setConnected("ana", false);
    expect(room.hostId).toBe("ana"); // a refresh mustn't cost the crown
    room.setConnected("ana", true);
    expect(room.hostId).toBe("ana");
  });

  it("says the party is over when the HOST is removed, but not when anyone else is", () => {
    const room = roomWith("ana", "ben", "cai");
    expect(room.removePlayer("ben")).toBe(false);
    expect(room.removePlayer("ana")).toBe(true);
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

describe("PartyRoom: pacing (like WorldGuessr)", () => {
  it("gives the last player still guessing only 20 seconds", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0); // 60 s round → ends at 60,000
    room.guess("ana", { lat: 1, lng: 1 }, 5_000);
    expect(room.viewFor("ben").endsAt).toBe(5_000 + LAST_GUESSER_SECONDS * 1000);
  });

  it("never lengthens a round that has less than 20 seconds left", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 1, lng: 1 }, 50_000); // only 10 s left
    expect(room.viewFor("ben").endsAt).toBe(60_000);
  });

  it("only hurries when ONE player is left (3 players: after the first guess, nothing changes)", () => {
    const room = roomWith("ana", "ben", "cai");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 1, lng: 1 }, 5_000);
    expect(room.viewFor("ana").endsAt).toBe(60_000);
    room.guess("ben", { lat: 1, lng: 1 }, 6_000);
    expect(room.viewFor("ana").endsAt).toBe(6_000 + LAST_GUESSER_SECONDS * 1000);
  });

  it("also hurries the last player in a 'no time limit' round", () => {
    const room = roomWith("ana", "ben");
    room.updateSettings("ana", { mapId: "world", mapName: "World", rounds: 5, roundSeconds: 0 });
    room.start("ana", FIVE_ROUNDS, 0);
    expect(room.viewFor("ben").endsAt).toBeNull();
    room.guess("ana", { lat: 1, lng: 1 }, 5_000);
    expect(room.viewFor("ben").endsAt).toBe(5_000 + LAST_GUESSER_SECONDS * 1000);
  });

  it("shows the results for RESULTS_SECONDS, then moves on by itself", () => {
    const room = roomWith("ana");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 1, lng: 1 }, 1_000);
    room.endRound(1_000);
    expect(room.viewFor("ana").nextAt).toBe(1_000 + RESULTS_SECONDS * 1000);
    room.advance(11_000);
    expect(room.viewFor("ana").phase).toBe("round");
    expect(room.viewFor("ana").roundNumber).toBe(2);
    expect(room.viewFor("ana").nextAt).toBeNull();
  });
});

describe("PartyRoom: playing", () => {
  it("hides the answer and other guesses until the round ends", () => {
    const room = roomWith("ana", "ben");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 48.86, lng: 2.35 }, 0);

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
    room.guess("ana", { lat: PARIS.lat, lng: PARIS.lng }, 0);
    expect(room.everyoneGuessed()).toBe(false);
    room.guess("ben", { lat: 0, lng: 0 }, 0);
    expect(room.everyoneGuessed()).toBe(true);

    room.endRound(0);
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
    room.guess("ana", { lat: 1, lng: 1 }, 0);
    expect(room.everyoneGuessed()).toBe(true);
  });

  it("refuses a second guess in the same round", () => {
    const room = roomWith("ana");
    room.start("ana", FIVE_ROUNDS, 0);
    room.guess("ana", { lat: 1, lng: 1 }, 0);
    expect(() => room.guess("ana", { lat: 2, lng: 2 }, 0)).toThrow("already guessed");
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
      room.guess("ana", { lat: 0, lng: 0 }, 0);
      room.endRound(0);
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
      room.guess("ana", { lat: PARIS.lat, lng: PARIS.lng }, 0);
      room.endRound(0);
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
