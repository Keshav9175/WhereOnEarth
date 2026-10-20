import { z } from "zod";

// Query string `?limit=N` for list endpoints (history, leaderboard).
// URL values are text, so `coerce` turns "10" into the number 10 before checking it.
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

// Reads and validates `?limit=` from a request URL.
export function parseListQuery(request: Request) {
  const { searchParams } = new URL(request.url);
  return listQuerySchema.safeParse({ limit: searchParams.get("limit") ?? undefined });
}
