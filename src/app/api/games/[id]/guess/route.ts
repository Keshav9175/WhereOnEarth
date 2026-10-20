import { z } from "zod";
import { guessSchema } from "@/lib/validation/guess";
import { submitGuess } from "@/server/services/gameService";
import { toPublicGame } from "@/server/services/publicGame";
import { getCurrentUser } from "@/server/session";

// How each refusal from the game service is answered over HTTP.
const REFUSALS = {
  not_found: { status: 404, message: "Game not found." },
  game_over: { status: 409, message: "This game is already finished." },
  already_guessed: { status: 409, message: "This round was already guessed." },
} as const;

// POST /api/games/{id}/guess — submit a guess for the current round.
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/guess">) {
  const { id } = await ctx.params;

  // 1. Read the body. Broken JSON is the player's mistake → 400.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // 2. Check it with Zod. Never trust what the player sends.
  const parsed = guessSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid guess.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    // 3. Let the referee (the game service) score it. Only the game's owner may guess.
    const user = await getCurrentUser(request);
    const result = await submitGuess(id, parsed.data, user?.id ?? null);

    if (!result.ok) {
      const refusal = REFUSALS[result.reason];
      return Response.json({ error: refusal.message }, { status: refusal.status });
    }

    const game = toPublicGame(result.game);
    return Response.json({ round: game.rounds[result.roundIndex], game });
  } catch (error) {
    // 4. Anything unexpected is OUR fault → 500, details stay in the server terminal.
    console.error("Failed to submit guess:", error);
    return Response.json(
      { error: "Could not submit the guess. Please try again." },
      { status: 500 },
    );
  }
}
