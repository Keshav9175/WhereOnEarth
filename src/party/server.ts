import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { clientMessageSchema, type ClientMessage, type ServerMessage } from "@/lib/party/protocol";
import { PartyError, PartyRoom } from "@/lib/party/room";
import { readTicket } from "@/lib/party/ticket";
import { pickGameLocations } from "@/server/services/gameService";
import { resolveMap } from "@/server/services/mapService";

// The party server: a small Node program, separate from the Next.js website, that keeps a LIVE connection
// (WebSocket) to every party player, so lobbies and rounds update instantly for everyone.
// The game rules live in src/lib/party/room.ts; this file handles connections, timers and safety.
//
// Run it next to the website:  npm run party   (port 3001 by default)

// Hosts like Render tell us which port to use through PORT; locally it's PARTY_PORT or 3001.
const PORT = Number(process.env.PORT ?? process.env.PARTY_PORT ?? 3001);
// Shared with the website: checks the signed passes of signed-in players. Without it, everyone plays as a guest.
const PARTY_SECRET = process.env.PARTY_SECRET ?? "";
// The website: the only page allowed to connect (plus any extra addresses in PARTY_ALLOWED_ORIGINS).
const APP_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ALLOWED_ORIGINS = new Set(
  [APP_URL, ...(process.env.PARTY_ALLOWED_ORIGINS?.split(",") ?? [])].map((origin) => origin.trim().replace(/\/$/, "")),
);

const REJOIN_GRACE_MS = 60_000; // a dropped player keeps their seat this long
const EMPTY_ROOM_TTL_MS = 5 * 60_000; // a party with nobody connected is closed after this
const MESSAGES_PER_10S = 40; // flood protection per connection

type Connection = {
  socket: WebSocket;
  code: string | null;
  playerId: string | null;
  alive: boolean;
  recentMessages: number[];
};

type Party = {
  room: PartyRoom;
  sockets: Map<string, Connection>;
  roundTimer: NodeJS.Timeout | null;
  leaveTimers: Map<string, NodeJS.Timeout>;
  closeTimer: NodeJS.Timeout | null;
  busy: boolean; // picking locations (async) — ignore a double "start"
};

const parties = new Map<string, Party>();
const connections = new Map<WebSocket, Connection>();

// ---------- Helpers ----------

function send(connection: Connection, message: ServerMessage) {
  if (connection.socket.readyState === connection.socket.OPEN) connection.socket.send(JSON.stringify(message));
}

// Everyone gets their OWN view (the room hides what each player isn't allowed to see yet).
function broadcast(party: Party) {
  const serverNow = Date.now();
  for (const [playerId, connection] of party.sockets) {
    send(connection, { type: "state", view: party.room.viewFor(playerId), serverNow });
  }
}

function newCode() {
  for (;;) {
    const code = String(randomInt(100_000, 1_000_000));
    if (!parties.has(code)) return code;
  }
}

function clearRoundTimer(party: Party) {
  if (party.roundTimer) clearTimeout(party.roundTimer);
  party.roundTimer = null;
}

// ONE timer per party for whatever happens next on its own: the round ending (time's up — including the
// shortened 20 s for the last player), or the next round starting after the 10 s results.
// Call it after every change, so a new deadline replaces the old one.
function schedule(party: Party) {
  clearRoundTimer(party);
  const { room } = party;
  const at = room.phase === "round" ? room.currentRound?.endsAt : room.phase === "results" ? room.resultsUntil : null;
  if (!at) return;
  party.roundTimer = setTimeout(() => {
    if (room.phase === "round") room.endRound(Date.now());
    else if (room.phase === "results") room.advance(Date.now());
    schedule(party);
    broadcast(party);
  }, Math.max(0, at - Date.now()));
}

function endRoundIfEveryoneGuessed(party: Party) {
  if (party.room.everyoneGuessed()) party.room.endRound(Date.now());
  schedule(party);
}

function closeParty(code: string) {
  const party = parties.get(code);
  if (!party) return;
  clearRoundTimer(party);
  party.leaveTimers.forEach(clearTimeout);
  if (party.closeTimer) clearTimeout(party.closeTimer);
  parties.delete(code);
}

// The host left (or never came back): the party ends for everyone (like WorldGuessr). Each player gets a
// message and goes back to the join screen; to play again, someone creates a new party.
function disbandParty(party: Party, message: string) {
  for (const connection of party.sockets.values()) {
    send(connection, { type: "closed", message });
    detach(connection);
  }
  closeParty(party.room.code);
}

// Nobody connected any more → close the party after a while (they might all just be refreshing).
function maybeScheduleClose(code: string) {
  const party = parties.get(code);
  if (!party) return;
  if (party.closeTimer) clearTimeout(party.closeTimer);
  party.closeTimer = null;
  if (party.room.playerCount === 0) return closeParty(code);
  if (party.room.connectedCount === 0) party.closeTimer = setTimeout(() => closeParty(code), EMPTY_ROOM_TTL_MS);
}

function detach(connection: Connection) {
  connection.code = null;
  connection.playerId = null;
}

// Puts this connection into a party as a (new) player and tells them their rejoin token.
function seat(connection: Connection, party: Party, playerId: string, token: string) {
  connection.code = party.room.code;
  connection.playerId = playerId;
  party.sockets.set(playerId, connection);
  send(connection, { type: "joined", code: party.room.code, token });
}

// ---------- Handling messages ----------

async function handle(connection: Connection, message: ClientMessage) {
  const party = connection.code ? parties.get(connection.code) : undefined;
  const me = connection.playerId;

  switch (message.type) {
    case "create":
    case "join": {
      if (connection.code) throw new PartyError("Leave your current party first.");
      const target = message.type === "create" ? null : parties.get(message.code);
      if (message.type === "join" && !target) throw new PartyError("No party with that code. Check the 6 digits.");

      // Signed-in players prove who they are with the website's signed pass; anyone else is a guest.
      const user = message.ticket && PARTY_SECRET ? readTicket(message.ticket, PARTY_SECRET) : null;
      const joining: Party = target ?? {
        room: new PartyRoom(newCode()),
        sockets: new Map(),
        roundTimer: null,
        leaveTimers: new Map(),
        closeTimer: null,
        busy: false,
      };
      const id = randomUUID();
      const token = randomBytes(24).toString("base64url");
      // Signed-in players appear under their account name; guests under the name they typed.
      joining.room.addPlayer({ id, token, name: user?.name ?? message.name, userId: user?.id ?? null, now: Date.now() });
      if (!target) parties.set(joining.room.code, joining);
      seat(connection, joining, id, token);
      maybeScheduleClose(joining.room.code);
      return broadcast(joining);
    }

    case "rejoin": {
      const target = parties.get(message.code);
      const playerId = target?.room.playerForToken(message.token);
      if (!target || !playerId) {
        return send(connection, { type: "closed", message: "That party has ended." });
      }
      // The old connection (e.g. the tab before a refresh) is replaced by this one.
      const old = target.sockets.get(playerId);
      if (old && old !== connection) {
        detach(old);
        old.socket.close();
      }
      clearTimeout(target.leaveTimers.get(playerId));
      target.leaveTimers.delete(playerId);
      target.room.setConnected(playerId, true);
      seat(connection, target, playerId, message.token);
      maybeScheduleClose(target.room.code);
      return broadcast(target);
    }
  }

  // Everything below needs you to be in a party.
  if (!party || !me) throw new PartyError("You're not in a party.");

  switch (message.type) {
    case "leave": {
      const wasHost = party.room.removePlayer(me);
      party.sockets.delete(me);
      detach(connection);
      if (wasHost) return disbandParty(party, "The host left, so the party has ended.");
      endRoundIfEveryoneGuessed(party);
      maybeScheduleClose(party.room.code);
      return broadcast(party);
    }
    case "settings": {
      const map = await resolveMap(message.mapId);
      if (!map) throw new PartyError("That map doesn't exist.");
      party.room.updateSettings(me, {
        mapId: map.id,
        mapName: map.name,
        rounds: message.rounds,
        roundSeconds: message.roundSeconds,
        movement: message.movement,
        roadNames: message.roadNames,
      });
      return broadcast(party);
    }
    case "lock":
      party.room.setLocked(me, message.locked);
      return broadcast(party);
    case "kick": {
      party.room.kick(me, message.playerId);
      const kicked = party.sockets.get(message.playerId);
      party.sockets.delete(message.playerId);
      if (kicked) {
        send(kicked, { type: "closed", message: "The host removed you from the party." });
        detach(kicked);
      }
      endRoundIfEveryoneGuessed(party);
      return broadcast(party);
    }
    case "start": {
      if (party.busy) return;
      if (me !== party.room.hostId) throw new PartyError("Only the host can do that.");
      party.busy = true;
      try {
        const map = await resolveMap(party.room.settings.mapId);
        if (!map) throw new PartyError("That map doesn't exist any more.");
        const locations = await pickGameLocations(map, [], party.room.settings.rounds);
        party.room.start(me, locations, Date.now());
      } finally {
        party.busy = false;
      }
      schedule(party);
      return broadcast(party);
    }
    case "pin":
      // Only remembered on the server; nobody else sees it, so there's nothing to broadcast.
      party.room.pin(me, { lat: message.lat, lng: message.lng });
      return;
    case "guess":
      party.room.guess(me, { lat: message.lat, lng: message.lng }, Date.now());
      endRoundIfEveryoneGuessed(party);
      return broadcast(party);
    case "next":
      party.room.next(me, Date.now());
      schedule(party);
      return broadcast(party);
    case "backToLobby":
      clearRoundTimer(party);
      party.room.backToLobby(me);
      return broadcast(party);
  }
}

// ---------- Connections ----------

// Only our own website may open connections (other sites can't embed or abuse our party server).
function originAllowed(request: IncomingMessage) {
  const origin = request.headers.origin;
  return typeof origin === "string" && ALLOWED_ORIGINS.has(origin);
}

// A plain web server underneath: answers GET /health (hosting checks and optional wake-up pings);
// WebSocket connections are "upgraded" from it.
const httpServer = createServer((request, response) => {
  const healthy = request.url === "/health";
  response.writeHead(healthy ? 200 : 404, { "Content-Type": "text/plain" });
  response.end(healthy ? "ok" : "Not found");
});

const server = new WebSocketServer({
  server: httpServer,
  maxPayload: 4 * 1024, // our messages are tiny; refuse anything bigger
  verifyClient: ({ req }: { req: IncomingMessage }) => originAllowed(req),
});

server.on("connection", (socket) => {
  const connection: Connection = {
    socket,
    code: null,
    playerId: null,
    alive: true,
    recentMessages: [],
  };
  connections.set(socket, connection);

  socket.on("pong", () => (connection.alive = true));

  socket.on("message", async (raw) => {
    // Flood protection: too many messages in 10 seconds → ignore the extra ones.
    const now = Date.now();
    connection.recentMessages = connection.recentMessages.filter((t) => now - t < 10_000);
    if (connection.recentMessages.length >= MESSAGES_PER_10S) return;
    connection.recentMessages.push(now);

    let parsed;
    try {
      parsed = clientMessageSchema.safeParse(JSON.parse(String(raw)));
    } catch {
      return send(connection, { type: "error", message: "Invalid message." });
    }
    if (!parsed.success) {
      return send(connection, { type: "error", message: parsed.error.issues[0]?.message ?? "Invalid message." });
    }

    try {
      await handle(connection, parsed.data);
    } catch (error) {
      if (error instanceof PartyError) return send(connection, { type: "error", message: error.message });
      console.error("Party server error:", error);
      send(connection, { type: "error", message: "Something went wrong. Please try again." });
    }
  });

  socket.on("close", () => {
    connections.delete(socket);
    const party = connection.code ? parties.get(connection.code) : undefined;
    const playerId = connection.playerId;
    if (!party || !playerId || party.sockets.get(playerId) !== connection) return;

    // Keep the seat for a minute (they may be refreshing), then remove them — for the host, that ends the party.
    party.sockets.delete(playerId);
    party.room.setConnected(playerId, false);
    endRoundIfEveryoneGuessed(party);
    party.leaveTimers.set(
      playerId,
      setTimeout(() => {
        party.leaveTimers.delete(playerId);
        if (party.room.removePlayer(playerId)) {
          return disbandParty(party, "The host lost connection, so the party has ended.");
        }
        endRoundIfEveryoneGuessed(party);
        maybeScheduleClose(party.room.code);
        broadcast(party);
      }, REJOIN_GRACE_MS),
    );
    maybeScheduleClose(party.room.code);
    broadcast(party);
  });
});

// Every 30 s, drop connections that stopped answering (e.g. a laptop that went to sleep).
const heartbeat = setInterval(() => {
  for (const [socket, connection] of connections) {
    if (!connection.alive) {
      socket.terminate(); // fires "close" → seat kept for the rejoin grace period
      continue;
    }
    connection.alive = false;
    socket.ping();
  }
}, 30_000);
server.on("close", () => clearInterval(heartbeat));

httpServer.listen(PORT, () => {
  console.log(`Party server listening on port ${PORT} (allowed websites: ${[...ALLOWED_ORIGINS].join(", ")})`);
  if (!PARTY_SECRET) console.warn("PARTY_SECRET is not set: signed-in players will join as guests.");
});
