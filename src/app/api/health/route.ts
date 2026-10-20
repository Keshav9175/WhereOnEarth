import { connection } from "next/server";
import { connectToDatabase } from "@/server/db";

export async function GET() {
  await connection();

  try {
    await connectToDatabase();

    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Full details go to the server terminal only — never to the visitor.
    console.error("Health check: database connection failed:", error);

    return Response.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
