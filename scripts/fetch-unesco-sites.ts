import { writeFileSync } from "node:fs";
import path from "node:path";

// Downloads every UNESCO World Heritage Site from Wikidata into scripts/data/unesco-sites.json.
//
//   npm run fetch:unesco
//
// Wikidata's data is CC0 (public domain), so we may store and use it freely. Each site has its
// official UNESCO id (property P757). Big "serial" sites list each component separately
// (ids like "1234-001"), each with its own coordinates; we group them under the main id, so the
// seed script has several starting points per site when looking for Street View.

const OUTPUT = path.join(process.cwd(), "scripts", "data", "unesco-sites.json");
const ENDPOINT = "https://query.wikidata.org/sparql";
// Wikimedia asks every automated client to identify itself.
const USER_AGENT = "WhereOnEarth/0.1 (geography guessing game; learning project)";

const QUERY = `
SELECT ?item ?itemLabel ?whsId ?coord ?countryCode WHERE {
  ?item wdt:P757 ?whsId ;
        wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P17 ?country . ?country wdt:P297 ?countryCode . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

type Binding = Record<string, { value: string } | undefined>;

export type UnescoSite = {
  whsId: string; // the main UNESCO id, e.g. "600" (Paris, Banks of the Seine)
  name: string;
  // Every known point of the site (main entry first). countryCode can differ per point
  // for sites that cross borders.
  points: { lat: number; lng: number; countryCode: string | null }[];
};

// "1234-001", "1234bis", "1234rev" → "1234"
function mainId(whsId: string): string {
  return whsId.split("-")[0].replace(/(bis|ter|rev)$/i, "");
}

// "Point(2.2945 48.8583)" → { lat, lng }
function parsePoint(wkt: string) {
  const match = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(wkt);
  return match ? { lng: Number(match[1]), lat: Number(match[2]) } : null;
}

async function main() {
  const response = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(QUERY)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!response.ok) throw new Error(`Wikidata answered HTTP ${response.status}`);
  const { results } = (await response.json()) as { results: { bindings: Binding[] } };

  const sites = new Map<string, UnescoSite & { mainName: string | null; seen: Set<string> }>();
  for (const row of results.bindings) {
    const whsId = row.whsId?.value;
    const point = row.coord ? parsePoint(row.coord.value) : null;
    const label = row.itemLabel?.value;
    if (!whsId || !point || !label) continue;

    const id = mainId(whsId);
    const site = sites.get(id) ?? { whsId: id, name: label, mainName: null, points: [], seen: new Set() };
    // The entry whose id IS the main id names the whole site; components only name themselves.
    if (whsId === id && !/^Q\d+$/.test(label)) site.mainName = label;

    const key = `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
    if (!site.seen.has(key)) {
      site.seen.add(key);
      const entry = { ...point, countryCode: row.countryCode?.value ?? null };
      // Main entry's point first: it is usually the site's best-known spot.
      if (whsId === id) site.points.unshift(entry);
      else site.points.push(entry);
    }
    sites.set(id, site);
  }

  const output: UnescoSite[] = [...sites.values()]
    .map(({ whsId, name, mainName, points }) => ({ whsId, name: mainName ?? name, points }))
    .sort((a, b) => Number(a.whsId) - Number(b.whsId));

  writeFileSync(OUTPUT, JSON.stringify(output, null, 1) + "\n");
  const points = output.reduce((sum, site) => sum + site.points.length, 0);
  console.log(`Saved ${output.length} UNESCO sites (${points} points) to scripts/data/unesco-sites.json`);
}

main().catch((error) => {
  console.error("Fetching UNESCO sites failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
