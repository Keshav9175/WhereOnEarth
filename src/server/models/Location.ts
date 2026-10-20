import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// The rules every location must follow before it can be saved.
const locationSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    country: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// A TypeScript type created automatically from the schema above.
export type Location = InferSchemaType<typeof locationSchema>;

// Reuse the model if it already exists (Next.js reloads files during development).
export const LocationModel: Model<Location> =
  (models.Location as Model<Location> | undefined) ?? model<Location>("Location", locationSchema);
