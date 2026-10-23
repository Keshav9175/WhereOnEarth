import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import { loadContinentByCode } from "./countryBorders";
import { FIRST_GAME_PLACES } from "./data/first-game-places";
import { findOfficialPanoramaNear } from "./officialPanorama";

// Adds the hidden first-game map's locations: 18 hand-picked landmarks for new players (D-023).
//
//   npm run seed:first-game
//
// For each landmark we look for Google's own outdoor panorama within ~250 m and save its exact
// position with the "first-game" tag. Safe to run again: each landmark is updated in place.

const RINGS_METERS = [0, 30, 60, 100, 150, 200, 250];

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing from .env.local (see .env.example).");

  const continentByCode = loadContinentByCode();
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  await connectToDatabase();

  const missing: string[] = [];
  for (const place of FIRST_GAME_PLACES) {
    const result = await findOfficialPanoramaNear({ lat: place.lat, lng: place.lng }, apiKey, RINGS_METERS);
    if (!result.found) {
      missing.push(place.landmark);
      console.log(`✗ ${place.landmark}: no official Street View within ${RINGS_METERS.at(-1)} m — skipped`);
      continue;
    }

    await LocationModel.updateOne(
      { tags: "first-game", landmark: place.landmark },
      {
        $set: {
          lat: result.location.lat,
          lng: result.location.lng,
          country: countryNames.of(place.countryCode) ?? place.countryCode,
          countryCode: place.countryCode,
          continent: continentByCode.get(place.countryCode) ?? null,
          landmark: place.landmark,
        },
        $addToSet: { tags: "first-game" },
      },
      { upsert: true },
    );
    console.log(`✓ ${place.landmark}`);
  }

  const total = await LocationModel.countDocuments({ tags: "first-game" });
  console.log(`\nFirst-game map: ${total} locations.`);
  if (missing.length > 0) console.log(`Skipped (move their point closer to a road): ${missing.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seeding the first-game map failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
