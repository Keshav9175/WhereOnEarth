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
    // Hand-picked landmarks for the Famous places map (scripts/seed-famous-places.ts).
    featured: { type: Boolean, default: false },
    // The landmark's name ("Eiffel Tower"); only set on featured locations.
    landmark: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

// Continent maps filter on continent, country maps on countryCode, Famous places on featured.
locationSchema.index({ continent: 1 });
locationSchema.index({ countryCode: 1 });
locationSchema.index({ featured: 1 }, { partialFilterExpression: { featured: true } });

// A TypeScript type created automatically from the schema above.
export type Location = InferSchemaType<typeof locationSchema>;

// Reuse the model if it already exists (Next.js reloads files during development).
export const LocationModel: Model<Location> =
  (models.Location as Model<Location> | undefined) ?? model<Location>("Location", locationSchema);
