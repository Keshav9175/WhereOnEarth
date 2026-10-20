import { connection } from "next/server";
import { z } from "zod";
import { parseListQuery } from "@/lib/validation/list";
import { getLeaderboard } from "@/server/services/leaderboardService";

// GET /api/leaderboard?limit=10 — top players by their best completed game. Public.
export async function GET(request: Request) {
  // Scores change constantly, so always answer fresh (never prerender).
  await connection();

  const query = parseListQuery(request);
  if (!query.success) {
    return Response.json(
      { error: "Invalid query.", details: z.flattenError(query.error) },
      { status: 400 },
    );
  }

  try {
    const entries = await getLeaderboard(query.data.limit);
    return Response.json({ entries });
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
    return Response.json(
      { error: "Could not load the leaderboard. Please try again." },
      { status: 500 },
    );
  }
}
