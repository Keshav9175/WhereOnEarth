import { connection } from "next/server";
import { getGameForPlayer } from "@/server/services/gameService";
import { toPublicGame } from "@/server/services/publicGame";
import { getCurrentUser } from "@/server/session";

// GET /api/games/{id} — view a game. Answers appear only for rounds already guessed.
// A player's game is visible only to that player; guest games to anyone with the ID.
export async function GET(request: Request, ctx: RouteContext<"/api/games/[id]">) {
  // Game data changes as the player guesses, so always answer fresh (before any try/catch).
  await connection();

  const { id } = await ctx.params;

  try {
    const user = await getCurrentUser(request);
    const game = await getGameForPlayer(id, user?.id ?? null);

    if (!game) {
      return Response.json({ error: "Game not found." }, { status: 404 });
    }

    return Response.json(toPublicGame(game));
  } catch (error) {
    console.error("Failed to load game:", error);
    return Response.json(
      { error: "Could not load the game. Please try again." },
      { status: 500 },
    );
  }
}
