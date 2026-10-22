import { createHmac, timingSafeEqual } from "node:crypto";

// A "party ticket": a short-lived pass that proves "this browser belongs to signed-in player X".
//
// Why: online, the website (vercel.app) and the party server (onrender.com) are different sites, so the
// browser doesn't send the website's login cookie to the party server. Instead the website gives the browser
// this ticket, signed with a secret that only the two servers know (PARTY_SECRET). The party server checks the
// signature — nobody can forge or edit a ticket without the secret — and the expiry.
//
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).

export type TicketPlayer = { id: string; name: string };
type Payload = TicketPlayer & { exp: number };

const TICKET_LIFETIME_MS = 5 * 60_000; // only needed for the moment of creating/joining

const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

export function createTicket(player: TicketPlayer, secret: string, now = Date.now()): string {
  const payload: Payload = { id: player.id, name: player.name, exp: now + TICKET_LIFETIME_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

// The player inside a valid, unexpired ticket — or null for anything else (forged, edited, expired, junk).
export function readTicket(ticket: string, secret: string, now = Date.now()): TicketPlayer | null {
  const [data, signature, ...rest] = ticket.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(signature);
  // timingSafeEqual: compares in constant time, so an attacker can't learn the signature byte by byte.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (typeof payload.id !== "string" || typeof payload.name !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < now) return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}
