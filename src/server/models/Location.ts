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
  },
  { timestamps: true },
);

// Continent maps filter on this field.
locationSchema.index({ continent: 1 });

// A TypeScript type created automatically from the schema above.
export type Location = InferSchemaType<typeof locationSchema>;

// Reuse the model if it already exists (Next.js reloads files during development).
export const LocationModel: Model<Location> =
  (models.Location as Model<Location> | undefined) ?? model<Location>("Location", locationSchema);
