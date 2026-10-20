import { z } from "zod";

// The ONLY data a player may send when guessing: a point on Earth.
// Anything else (missing fields, wrong types, extra fields like "score") is rejected.
export const guessSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// The TypeScript type of a valid guess, created from the rules above.
export type GuessInput = z.infer<typeof guessSchema>;
