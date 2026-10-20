import { connection } from "next/server";
import { getPlayerStats } from "@/server/services/playerService";
import { getCurrentUser } from "@/server/session";

// GET /api/me — the signed-in player's profile and statistics.
export async function GET(request: Request) {
  // Per-user data: always run at request time. This must come BEFORE the try/catch,
  // so Next.js's "stop prerendering here" signal is never caught as an error.
  await connection();

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "You must be signed in." }, { status: 401 });
    }

    const stats = await getPlayerStats(user.id);
    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberSince: user.createdAt.toISOString(),
      },
      stats,
    });
  } catch (error) {
    console.error("Failed to load profile:", error);
    return Response.json(
      { error: "Could not load your profile. Please try again." },
      { status: 500 },
    );
  }
}
