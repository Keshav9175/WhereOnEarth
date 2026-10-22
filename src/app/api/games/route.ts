import { z } from "zod";
import { newGameSchema } from "@/lib/validation/newGame";
import { getOrCreateGuestId } from "@/server/guestId";
import { createGame } from "@/server/services/gameService";
import { resolveMap } from "@/server/services/mapService";
import { toPublicGame } from "@/server/services/publicGame";
import { getCurrentUser } from "@/server/session";

// POST /api/games — start a new game.
// Signed-in players own their game (it counts for history and the leaderboard); guests can play too.
// Guests get an anonymous cookie ID so they aren't shown the same locations again.
// Returns the same safe view as GET /api/games/{id}, so the screen can show round 1 straight away.
// Optional JSON body: { "map": "europe" }. No body = the World map.
export async function POST(request: Request) {
  // Read the body ourselves: an empty body is allowed, broken JSON is not.
  const text = await request.text();
  let body: unknown = {};
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: "The request body must be valid JSON." }, { status: 400 });
    }
  }

  const input = newGameSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: "Invalid new game request.", details: z.flattenError(input.error) },
      { status: 400 },
    );
  }

  try {
    // A well-formed id can still name a country without enough locations (or none at all).
    const map = await resolveMap(input.data.map);
    if (!map) {
      return Response.json({ error: `There is no "${input.data.map}" map.` }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    const guestId = user ? null : await getOrCreateGuestId();

    const game = await createGame({ userId: user?.id ?? null, guestId }, map);

    return Response.json(
      { ...toPublicGame(game), owner: user ? "player" : "guest" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create game:", error);
    return Response.json(
      { error: "Could not start a new game. Please try again." },
      { status: 500 },
    );
  }
}
