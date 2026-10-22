import { connection } from "next/server";
import { createTicket } from "@/lib/party/ticket";
import { getCurrentUser } from "@/server/session";

// GET /api/party/ticket — a short-lived signed pass for the party server (see src/lib/party/ticket.ts).
// Signed-in players get { ticket }; guests get 401 and simply join the party under the name they type.
export async function GET(request: Request) {
  // Per-user: always run at request time (and before the try/catch — see /api/me).
  await connection();

  const secret = process.env.PARTY_SECRET;
  if (!secret) {
    return Response.json({ error: "Party tickets are not configured (PARTY_SECRET)." }, { status: 503 });
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }
    return Response.json(
      { ticket: createTicket({ id: user.id, name: user.name }, secret) },
      // A personal pass: never cache it anywhere.
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to create party ticket:", error);
    return Response.json({ error: "Could not create a party ticket." }, { status: 500 });
  }
}
