import { connection } from "next/server";
import { z } from "zod";
import { parseListQuery } from "@/lib/validation/list";
import { listGamesForUser } from "@/server/services/playerService";
import { getCurrentUser } from "@/server/session";

// GET /api/me/games?limit=10 — the signed-in player's game history, newest first.
export async function GET(request: Request) {
  // Per-user data: always run at request time (before any try/catch).
  await connection();

  const query = parseListQuery(request);
  if (!query.success) {
    return Response.json(
      { error: "Invalid query.", details: z.flattenError(query.error) },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "You must be signed in." }, { status: 401 });
    }

    const games = await listGamesForUser(user.id, query.data.limit);
    return Response.json({ games });
  } catch (error) {
    console.error("Failed to load game history:", error);
    return Response.json(
      { error: "Could not load your games. Please try again." },
      { status: 500 },
    );
  }
}
