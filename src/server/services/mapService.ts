import {
  MAPS,
  MIN_COUNTRY_MAP_LOCATIONS,
  countryMap,
  findMap,
  isCountryMapId,
  type Continent,
  type GameMap,
} from "@/lib/maps/catalog";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";

export type MapCountry = {
  code: string; // "FR" — for the flag
  name: string;
  locations: number;
};

export type MapStats = {
  locations: number;
  // Biggest first, so the cards can show the most-played-in countries' flags first.
  countries: MapCountry[];
};

// A playable country map, with what the map library and the in-game picker need.
export type CountryMapEntry = GameMap & { countryCode: string; locations: number; region: Continent | null };

type CountryRow = { _id: { continent: string | null; code: string | null; name: string }; count: number };

async function countryRows(): Promise<CountryRow[]> {
  await connectToDatabase();
  return LocationModel.aggregate<CountryRow>([
    { $group: { _id: { continent: "$continent", code: "$countryCode", name: "$country" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

// For every fixed map (World + continents): how many locations it holds and which countries they are in.
export async function getMapStats(): Promise<Record<string, MapStats>> {
  const rows = await countryRows();

  const toStats = (picked: CountryRow[]): MapStats => ({
    locations: picked.reduce((sum, row) => sum + row.count, 0),
    countries: picked
      .filter((row) => row._id.code)
      .map((row) => ({ code: row._id.code as string, name: row._id.name, locations: row.count })),
  });

  return Object.fromEntries(
    MAPS.map((map) => [map.id, toStats(map.continent ? rows.filter((row) => row._id.continent === map.continent) : rows)]),
  );
}

// Every country with enough locations for its own map, A→Z.
export async function listCountryMaps(): Promise<CountryMapEntry[]> {
  const rows = await countryRows();
  return rows
    .filter((row) => row._id.code && row.count >= MIN_COUNTRY_MAP_LOCATIONS)
    .map((row) => ({
      ...countryMap(row._id.code as string, row._id.name),
      countryCode: (row._id.code as string).toUpperCase(),
      locations: row.count,
      region: row._id.continent as Continent | null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Turns a map id from a request into a real map, or null if there is no such map.
// Fixed maps come from the catalogue; a country map ("fr") must have enough locations in the database.
export async function resolveMap(id: string): Promise<GameMap | null> {
  const fixed = findMap(id);
  if (fixed) return fixed;
  if (!isCountryMapId(id)) return null;

  await connectToDatabase();
  const code = id.toUpperCase();
  const count = await LocationModel.countDocuments({ countryCode: code });
  if (count < MIN_COUNTRY_MAP_LOCATIONS) return null;

  const sample = await LocationModel.findOne({ countryCode: code }, { country: 1 }).lean();
  return sample ? countryMap(code, sample.country) : null;
}
