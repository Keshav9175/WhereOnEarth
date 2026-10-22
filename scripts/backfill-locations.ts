import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import { loadContinentByCode, loadCountries } from "./countryBorders";

// One-time fix for locations saved before maps existed: gives each one its continent and
// country code (for flags).
//
//   npm run backfill:locations
//
// Locations only store the country NAME ("France"), so we go name → code → continent using the
// same Natural Earth borders file the generator uses. Safe to run again (it just sets the same values).

async function main() {
  const codeByName = new Map(loadCountries().map((country) => [country.name, country.code]));
  const continentByCode = loadContinentByCode();

  await connectToDatabase();
  const names = await LocationModel.distinct("country");
  const unknown: string[] = [];
  let updated = 0;

  for (const name of names) {
    const code = codeByName.get(name);
    if (!code) {
      unknown.push(name);
      continue;
    }
    const continent = continentByCode.get(code) ?? null;
    const result = await LocationModel.updateMany({ country: name }, { $set: { continent, countryCode: code } });
    updated += result.modifiedCount;
  }

  const counts = await LocationModel.aggregate<{ _id: string | null; n: number }>([
    { $group: { _id: "$continent", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log(`Updated ${updated} locations across ${names.length} countries.`);
  console.table(counts.map(({ _id, n }) => ({ continent: _id ?? "(World only)", locations: n })));
  if (unknown.length > 0) {
    console.log(`Not matched (left on World only): ${unknown.join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
