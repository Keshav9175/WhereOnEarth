import type { Coordinates } from "@/types/geo";

// GeoJSON stores points as [longitude, latitude] — longitude FIRST (the opposite of how we write them).
export type Position = [lng: number, lat: number];

// A ring is a closed outline. A polygon is one outer ring plus optional holes
// (e.g. Lesotho is a hole inside South Africa).
export type Ring = Position[];
export type PolygonRings = Ring[];

type BoundingBox = { minLng: number; maxLng: number; minLat: number; maxLat: number };

// One piece of land (an island, a mainland…) with the numbers we need to sample it quickly.
type CountryPart = {
  rings: PolygonRings;
  box: BoundingBox;
  areaKm2: number;
};

export type Country = {
  code: string; // ISO two-letter code, e.g. "IN"
  name: string; // shown to players, e.g. "India"
  parts: CountryPart[];
  areaKm2: number;
};

const KM_PER_DEGREE = 111.32;

function boundingBox(ring: Ring): BoundingBox {
  const box = { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity };
  for (const [lng, lat] of ring) {
    box.minLng = Math.min(box.minLng, lng);
    box.maxLng = Math.max(box.maxLng, lng);
    box.minLat = Math.min(box.minLat, lat);
    box.maxLat = Math.max(box.maxLat, lat);
  }
  return box;
}

// Area of a ring in km². Degrees of longitude shrink towards the poles, so each point's longitude
// is scaled by cos(latitude) first (a "sinusoidal projection", which keeps areas correct).
export function ringAreaKm2(ring: Ring): number {
  let doubled = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    const x1 = lng1 * Math.cos((lat1 * Math.PI) / 180);
    const x2 = lng2 * Math.cos((lat2 * Math.PI) / 180);
    doubled += x1 * lat2 - x2 * lat1;
  }
  return (Math.abs(doubled) / 2) * KM_PER_DEGREE * KM_PER_DEGREE;
}

// "Ray casting": walk right from the point and count how many edges we cross.
// An odd number of crossings means the point is inside.
function isInsideRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function isInsidePart(lng: number, lat: number, part: CountryPart): boolean {
  const { box } = part;
  // Cheap rectangle test first — skips the slow outline test for almost every country.
  if (lng < box.minLng || lng > box.maxLng || lat < box.minLat || lat > box.maxLat) return false;

  const [outer, ...holes] = part.rings;
  return isInsideRing(lng, lat, outer) && !holes.some((hole) => isInsideRing(lng, lat, hole));
}

// Turns raw border outlines into a Country with its sizes worked out once, up front.
export function buildCountry(code: string, name: string, polygons: PolygonRings[]): Country {
  const parts = polygons.map((rings) => ({
    rings,
    box: boundingBox(rings[0]),
    areaKm2: ringAreaKm2(rings[0]),
  }));
  return { code, name, parts, areaKm2: parts.reduce((sum, part) => sum + part.areaKm2, 0) };
}

export function isInCountry(point: Coordinates, country: Country): boolean {
  return country.parts.some((part) => isInsidePart(point.lng, point.lat, part));
}

// Which country is this point in? null = none of them (usually the sea).
export function findCountry(point: Coordinates, countries: Country[]): Country | null {
  return countries.find((country) => isInCountry(point, country)) ?? null;
}

// A uniformly random point on the country's land. `random` is swappable so tests are repeatable.
export function randomPointInCountry(country: Country, random: () => number = Math.random): Coordinates {
  // Pick a piece of land, bigger pieces more often (so a mainland beats a tiny island).
  let ticket = random() * country.areaKm2;
  const part = country.parts.find((candidate) => (ticket -= candidate.areaKm2) < 0) ?? country.parts[0];

  // Throw darts at the piece's rectangle until one lands on the land itself.
  const { box } = part;
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const lng = box.minLng + random() * (box.maxLng - box.minLng);
    const lat = box.minLat + random() * (box.maxLat - box.minLat);
    if (isInsidePart(lng, lat, part)) return { lat, lng };
  }
  throw new Error(`Could not find a point inside ${country.name}`);
}

// How many locations each country should get out of `total`.
// Weighted by the square root of area: Russia still gets more than Belgium, but not 560× more,
// so small countries show up too. Every country gets at least `minimum`.
export function planCountryTargets(
  countries: Country[],
  total: number,
  minimum: number,
): Map<string, number> {
  const weights = countries.map((country) => Math.sqrt(country.areaKm2));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  return new Map(
    countries.map((country, index) => [
      country.code,
      Math.max(minimum, Math.round((total * weights[index]) / weightSum)),
    ]),
  );
}
