import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import { findPanorama } from "@/server/services/streetViewMetadata";
import { loadContinentByCode } from "./countryBorders";
import { FAMOUS_PLACES } from "./data/famous-places";

// Adds the Famous places map's locations (the first game for new players).
//
//   npm run seed:famous
//
// For each landmark we ask Google's free Street View metadata check for the nearest OFFICIAL outdoor
// panorama (same rule as the location generator, D-019) and save its exact position with
// `featured: true`. Safe to run again: each landmark is updated in place, never duplicated.

// Google only answers with the NEAREST panorama, and at famous spots that is often a visitor's own
// photo sphere (which we reject — D-019). So we also try points in rings around the landmark, each
// with a small search radius, until one lands on Google's own imagery. Stays within ~250 m, so the
// landmark is still in view. All metadata checks are free.
const PROBE_RADIUS_METERS = 30;
const RING_DISTANCES_METERS = [0, 30, 60, 100, 150, 200, 250];
const BEARINGS_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];

// A point `meters` away from `origin` in direction `bearing` (fine for these short distances).
function offset(origin: { lat: number; lng: number }, meters: number, bearing: number) {
  const radians = (bearing * Math.PI) / 180;
  const dLat = (meters * Math.cos(radians)) / 111_320;
  const dLng = (meters * Math.sin(radians)) / (111_320 * Math.cos((origin.lat * Math.PI) / 180));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

async function findOfficialPanoramaNear(origin: { lat: number; lng: number }, apiKey: string) {
  for (const distance of RING_DISTANCES_METERS) {
    for (const bearing of distance === 0 ? [0] : BEARINGS_DEGREES) {
      const result = await findPanorama(offset(origin, distance, bearing), PROBE_RADIUS_METERS, apiKey);
      if (result.found) return result;
    }
  }
  return { found: false } as const;
}

const SEARCH_RADIUS_METERS = RING_DISTANCES_METERS.at(-1)! + PROBE_RADIUS_METERS;

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing from .env.local (see .env.example).");

  const continentByCode = loadContinentByCode();
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  await connectToDatabase();

  const missing: string[] = [];
  for (const place of FAMOUS_PLACES) {
    const result = await findOfficialPanoramaNear({ lat: place.lat, lng: place.lng }, apiKey);
    if (!result.found) {
      missing.push(place.landmark);
      console.log(`✗ ${place.landmark}: no official Street View within ${SEARCH_RADIUS_METERS} m — skipped`);
      continue;
    }

    await LocationModel.updateOne(
      { featured: true, landmark: place.landmark },
      {
        $set: {
          lat: result.location.lat,
          lng: result.location.lng,
          country: countryNames.of(place.countryCode) ?? place.countryCode,
          countryCode: place.countryCode,
          continent: continentByCode.get(place.countryCode) ?? null,
          featured: true,
          landmark: place.landmark,
        },
      },
      { upsert: true },
    );
    console.log(`✓ ${place.landmark}`);
  }

  const total = await LocationModel.countDocuments({ featured: true });
  console.log(`\nFamous places map: ${total} locations.`);
  if (missing.length > 0) console.log(`Skipped (move their point closer to a road): ${missing.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seeding famous places failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
