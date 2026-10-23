import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import mongoose from "mongoose";
import { findCountry } from "@/lib/geo/countries";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import { loadContinentByCode, loadCountries } from "./countryBorders";
import type { UnescoSite } from "./fetch-unesco-sites";
import { isTemporaryMetadataError } from "@/server/services/streetViewMetadata";
import { findOfficialPanoramaNear } from "./officialPanorama";

// Builds the Famous places map: one location per UNESCO World Heritage Site that has Google Street View.
//
//   npm run fetch:unesco          → (once) download the site list from Wikidata
//   npm run seed:unesco           → find Street View for every site not saved yet
//   npm run seed:unesco -- --refresh   → check every site again
//
// Remote natural sites (deserts, ice fields, reefs) usually have no Street View and are skipped.
// Safe to stop and re-run: sites already saved are skipped (unless --refresh).

const SITES_FILE = path.join(process.cwd(), "scripts", "data", "unesco-sites.json");
const MAIN_POINT_RINGS = [0, 40, 100, 200]; // the site's main point: search up to ~200 m around it
const COMPONENT_RINGS = [0, 60]; // a serial site's other parts: a quick look only
const MAX_COMPONENTS = 10;
const PARALLEL_SITES = 4;

async function findForSite(site: UnescoSite, apiKey: string) {
  const [main, ...components] = site.points;
  const attempts = [
    { point: main, rings: MAIN_POINT_RINGS },
    ...components.slice(0, MAX_COMPONENTS).map((point) => ({ point, rings: COMPONENT_RINGS })),
  ];
  for (const { point, rings } of attempts) {
    const result = await findOfficialPanoramaNear(point, apiKey, rings);
    if (result.found) return { result, point };
  }
  return null;
}

async function main() {
  const { values } = parseArgs({ options: { refresh: { type: "boolean", default: false } } });
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing from .env.local (see .env.example).");

  const sites = JSON.parse(readFileSync(SITES_FILE, "utf8")) as UnescoSite[];
  const countries = loadCountries();
  const continentByCode = loadContinentByCode();
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

  await connectToDatabase();
  const done = new Set(
    values.refresh ? [] : await LocationModel.distinct("unescoId", { tags: "unesco" }),
  );
  const queue = sites.filter((site) => !done.has(site.whsId));
  console.log(`${sites.length} UNESCO sites, ${done.size} already saved, checking ${queue.length}…\n`);

  let saved = 0;
  let missing = 0;
  let retryLater = 0;
  let next = 0;

  async function worker() {
    while (next < queue.length) {
      const site = queue[next++];
      let found;
      try {
        found = await findForSite(site, apiKey as string);
      } catch (error) {
        // Google's UNKNOWN_ERROR is temporary ("may succeed if you try again"). Skip this site for now:
        // it isn't saved, so the next run tries it again. Any other error (bad key…) still stops the run.
        if (!isTemporaryMetadataError(error)) throw error;
        retryLater++;
        continue;
      }
      if (!found) {
        missing++;
        continue;
      }

      const { result, point } = found;
      // The point's own country; otherwise ask our borders file where the panorama is.
      const code = point.countryCode ?? findCountry(result.location, countries)?.code ?? null;
      if (!code) {
        missing++;
        continue;
      }

      await LocationModel.updateOne(
        { unescoId: site.whsId },
        {
          $set: {
            lat: result.location.lat,
            lng: result.location.lng,
            country: countryNames.of(code) ?? code,
            countryCode: code,
            continent: continentByCode.get(code) ?? null,
            landmark: site.name,
            unescoId: site.whsId,
          },
          $addToSet: { tags: "unesco" },
        },
        { upsert: true },
      );
      saved++;
      if ((saved + missing) % 50 === 0) {
        console.log(`  …${saved + missing}/${queue.length} checked (${saved} saved, ${missing} without Street View)`);
      }
    }
  }

  await Promise.all(Array.from({ length: PARALLEL_SITES }, worker));
  const total = await LocationModel.countDocuments({ tags: "unesco" });
  console.log(`\nDone: saved ${saved}, no Street View for ${missing}. Famous places map: ${total} sites.`);
  if (retryLater > 0) console.log(`${retryLater} sites hit a temporary Google error. Run again to retry them.`);
}

main()
  .catch((error) => {
    console.error("Seeding UNESCO sites failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
