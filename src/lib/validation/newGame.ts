import { z } from "zod";
import { DEFAULT_MAP_ID, isMapIdShape } from "@/lib/maps/catalog";

// Body of POST /api/games. Everything is optional: an empty body starts a World game.
// This only checks the SHAPE of the map id; the route then asks the database whether a
// country map really exists (enough locations).
export const newGameSchema = z
  .object({
    map: z.string().refine(isMapIdShape, "Unknown map.").default(DEFAULT_MAP_ID),
  })
  .strict();

export type NewGameInput = z.infer<typeof newGameSchema>;
