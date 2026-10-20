import { createGame } from "@/server/services/gameService";
import { toPublicGame } from "@/server/services/publicGame";
import { getCurrentUser } from "@/server/session";

// POST /api/games — start a new game.
// Signed-in players own their game (it counts for history and the leaderboard); guests can play too.
// Returns the same safe view as GET /api/games/{id}, so the screen can show round 1 straight away.
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const game = await createGame(user?.id ?? null);

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
