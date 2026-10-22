import { parseArgs } from "node:util";
import mongoose from "mongoose";
import type { Coordinates } from "@/types/geo";
import { findCountry, planCountryTargets, randomPointInCountry, type Country } from "@/lib/geo/countries";
import { SpacingGrid } from "@/lib/geo/spacing";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import {
  findPanorama,
  isTemporaryMetadataError,
  type MetadataResult,
} from "@/server/services/streetViewMetadata";
import { loadContinentByCode, loadCountries } from "./countryBorders";

// Builds the pool of random Street View locations the game picks from.
//
//   npm run generate:locations                        → about 5,000 locations worldwide
//   npm run generate:locations -- --total 500         → a smaller run
//   npm run generate:locations -- --countries IN,FR   → only these countries
//   npm run generate:locations -- --dry-run           → check everything but save nothing
//
// Safe to run again: new locations are never closer than MIN_SPACING_KM to existing ones.

const SEARCH_RADIUS_METERS = 1000; // look for a panorama up to 1 km from the random point
const MIN_SPACING_KM = 1; // no two locations closer than this
const MIN_PER_COUNTRY = 3; // small countries still appear
const PARALLEL_CHECKS = 8; // how many questions we ask Google at the same time
// A country with no Street View would otherwise be checked forever, so we give up after this many
// misses in a row. Big countries with coverage only along a few roads (Egypt: the Nile) miss most
// of the time, so they get longer: MISSES_PER_TARGET per location wanted, but never below the minimum.
const MIN_MISSES_BEFORE_GIVING_UP = 150;
const MISSES_PER_TARGET = 25;
// Google sometimes fails on one particular spot every time, even after retries: that spot is skipped.
// But this many failures in a row means Google itself is down, so the script stops.
const MAX_FAILURES_IN_A_ROW = 20;
let failuresInARow = 0;

type CountryResult = { saved: Coordinates[]; checks: number };

async function collectForCountry(
  country: Country,
  target: number,
  allCountries: Country[],
  spacing: SpacingGrid,
  apiKey: string,
): Promise<CountryResult> {
  const saved: Coordinates[] = [];
  let checks = 0;
  let missesInARow = 0;
  const giveUpAfterMisses = Math.max(MIN_MISSES_BEFORE_GIVING_UP, target * MISSES_PER_TARGET);

  // One "worker" keeps asking Google until the country is full or we give up.
  // Several run at once (Promise.all below) so the script isn't waiting on one reply at a time.
  async function worker() {
    while (saved.length < target && missesInARow < giveUpAfterMisses) {
      checks++;
      const point = randomPointInCountry(country);
      let result: MetadataResult;
      try {
        result = await findPanorama(point, SEARCH_RADIUS_METERS, apiKey);
        failuresInARow = 0;
      } catch (error) {
        if (!isTemporaryMetadataError(error) || ++failuresInARow >= MAX_FAILURES_IN_A_ROW) {
          throw new Error(`${country.code}: ${error instanceof Error ? error.message : error}`);
        }
        console.warn(`  ${country.code}: Google could not answer for ${point.lat.toFixed(4)},${point.lng.toFixed(4)} — skipped`);
        missesInARow++;
        continue;
      }

      // Rejected if: no panorama nearby; the panorama it snapped to is across a border;
      // or it is too close to a location we already have.
      // (null = the panorama sits just outside our simplified coastline — still this country.)
      const landedIn = result.found ? findCountry(result.location, allCountries) : null;
      if (
        !result.found ||
        (landedIn && landedIn.code !== country.code) ||
        spacing.isTooClose(result.location) ||
        saved.length >= target
      ) {
        missesInARow++;
        continue;
      }

      missesInARow = 0;
      spacing.add(result.location);
      saved.push(result.location);
    }
  }

  await Promise.all(Array.from({ length: PARALLEL_CHECKS }, worker));
  return { saved, checks };
}

async function main() {
  const { values } = parseArgs({
    options: {
      total: { type: "string", default: "5000" },
      countries: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing from .env.local (see .env.example).");
  }

  const total = Number(values.total);
  if (!Number.isInteger(total) || total <= 0) throw new Error("--total must be a positive whole number");
  const dryRun = values["dry-run"];

  const allCountries = loadCountries();
  const continentByCode = loadContinentByCode();
  const onlyCodes = values.countries?.toUpperCase().split(",");
  const chosen = onlyCodes ? allCountries.filter((country) => onlyCodes.includes(country.code)) : allCountries;
  if (chosen.length === 0) throw new Error(`No countries match "${values.countries}"`);

  await connectToDatabase();

  // Start the spacing check with every location already in the database.
  const spacing = new SpacingGrid(MIN_SPACING_KM);
  const existing = await LocationModel.find({}, { lat: 1, lng: 1, _id: 0 }).lean();
  existing.forEach((location) => spacing.add(location));
  // Planned over ALL countries, so `--countries AU` gives Australia its normal world share
  // instead of the whole --total.
  const targets = planCountryTargets(allCountries, total, MIN_PER_COUNTRY);
  const planned = chosen.reduce((sum, country) => sum + (targets.get(country.code) ?? 0), 0);
  console.log(`${existing.length} locations already saved. Generating up to ${planned} more…${dryRun ? " (dry run)" : ""}\n`);
  let savedTotal = 0;
  let checksTotal = 0;
  const noCoverage: string[] = [];

  for (const country of chosen) {
    const target = targets.get(country.code) ?? MIN_PER_COUNTRY;
    const { saved, checks } = await collectForCountry(country, target, allCountries, spacing, apiKey);
    checksTotal += checks;

    if (saved.length === 0) {
      noCoverage.push(country.code);
      continue;
    }

    // Saved after each country, so stopping the script half-way keeps what it found.
    if (!dryRun) {
      const continent = continentByCode.get(country.code) ?? null;
      await LocationModel.insertMany(saved.map((point) => ({ ...point, country: country.name, countryCode: country.code, continent })));
    }
    savedTotal += saved.length;
    console.log(`${country.code} ${country.name}: ${saved.length}/${target} (${checks} checks)`);
  }

  console.log(`\nDone: ${dryRun ? "found" : "saved"} ${savedTotal} locations using ${checksTotal} free metadata checks.`);
  if (noCoverage.length > 0) {
    console.log(`No Street View found in ${noCoverage.length} countries: ${noCoverage.join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error("Generating locations failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
