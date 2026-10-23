import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { CONTINENTS } from "@/lib/maps/catalog";

// The rules every location must follow before it can be saved.
const locationSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    country: { type: String, required: true, trim: true },
    // ISO two-letter code ("FR"), used for flags. Filled for old locations by `npm run backfill:locations`.
    countryCode: { type: String, uppercase: true, minlength: 2, maxlength: 2, default: null },
    // Which continent map this location belongs to (see src/lib/maps/catalog.ts).
    // null = only on the World map (open-ocean island nations).
    continent: { type: String, enum: [...CONTINENTS, null], default: null },
    // Special collections this location belongs to: "unesco" (Famous places map, scripts/seed-unesco.ts)
    // and "first-game" (new players' first game, scripts/seed-first-game.ts). Most locations have none.
    tags: { type: [String], default: [] },
    // The landmark's or World Heritage Site's name ("Eiffel Tower"); only set on tagged locations.
    landmark: { type: String, trim: true, default: null },
    // UNESCO World Heritage id (e.g. "600"), so re-running the UNESCO seed updates instead of duplicating.
    unescoId: { type: String, default: null },
  },
  { timestamps: true },
);

// Continent maps filter on continent, country maps on countryCode, tag maps on tags.
locationSchema.index({ continent: 1 });
locationSchema.index({ countryCode: 1 });
locationSchema.index({ tags: 1 });

// A TypeScript type created automatically from the schema above.
export type Location = InferSchemaType<typeof locationSchema>;

// Reuse the model if it already exists (Next.js reloads files during development).
export const LocationModel: Model<Location> =
  (models.Location as Model<Location> | undefined) ?? model<Location>("Location", locationSchema);
