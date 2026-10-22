import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCountry, type Country, type PolygonRings } from "@/lib/geo/countries";
import { continentFromNaturalEarth, type Continent } from "@/lib/maps/catalog";

// Country borders from Natural Earth (public domain — free for any use):
// https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
export const BORDERS_FILE = path.join(process.cwd(), "scripts", "data", "countries.geojson");

// Antarctica: enormous area but only a handful of panoramas — it would waste thousands of checks.
const SKIPPED_CODES = new Set(["AQ"]);

type Feature = {
  properties: { ISO_A2_EH?: string; NAME?: string };
  geometry:
    | { type: "Polygon"; coordinates: PolygonRings }
    | { type: "MultiPolygon"; coordinates: PolygonRings[] };
};

// English country names from the code, e.g. "US" → "United States" (built into Node, no data needed).
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function loadCountries(): Country[] {
  const { features } = JSON.parse(readFileSync(BORDERS_FILE, "utf8")) as { features: Feature[] };
  // Some countries come in several pieces that share one code (Australia + its small island
  // territories are all "AU"), so collect every piece under its code first.
  const piecesByCode = new Map<string, { name: string; polygons: PolygonRings[] }>();

  for (const { properties, geometry } of features) {
    // ISO_A2_EH is Natural Earth's cleaned-up code ("FR" for France, where plain ISO_A2 says "-99").
    const code = properties.ISO_A2_EH;
    if (!code || code === "-99" || SKIPPED_CODES.has(code)) continue;

    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const entry = piecesByCode.get(code);
    if (entry) entry.polygons.push(...polygons);
    else piecesByCode.set(code, { name: displayNames.of(code) ?? properties.NAME ?? code, polygons });
  }

  return [...piecesByCode].map(([code, { name, polygons }]) => buildCountry(code, name, polygons));
}

// Each country's continent (our map ids), from Natural Earth's CONTINENT property.
// Island territories sharing a code keep the continent of the first piece listed.
export function loadContinentByCode(): Map<string, Continent | null> {
  const { features } = JSON.parse(readFileSync(BORDERS_FILE, "utf8")) as {
    features: { properties: { ISO_A2_EH?: string; CONTINENT?: string } }[];
  };
  const continents = new Map<string, Continent | null>();
  for (const { properties } of features) {
    const code = properties.ISO_A2_EH;
    if (code && code !== "-99" && !continents.has(code)) {
      continents.set(code, continentFromNaturalEarth(properties.CONTINENT));
    }
  }
  return continents;
}
