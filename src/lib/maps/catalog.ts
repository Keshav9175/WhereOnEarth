// The maps a player can choose from. A "map" is a named set of locations from our pool:
// the whole world, or one continent. Kept in code (not the database) because it changes
// rarely and both the server (filtering) and the screens (cards, pickers) need it.

export const CONTINENTS = [
  "africa",
  "asia",
  "europe",
  "north-america",
  "south-america",
  "oceania",
] as const;

export type Continent = (typeof CONTINENTS)[number];

export type GameMap = {
  id: string;
  name: string;
  description: string;
  // A continent map uses `continent`, a country map uses `countryCode` ("FR"); World uses neither.
  continent: Continent | null;
  countryCode: string | null;
  // The Famous places map: only hand-picked landmark locations (Location.featured).
  featured: boolean;
};

export const DEFAULT_MAP_ID = "world";

// A brand-new player's first game: a warm-up on world-famous landmarks (like WorldGuessr's onboarding).
export const FAMOUS_MAP_ID = "famous";
export const FIRST_GAME_URL = `/play?map=${FAMOUS_MAP_ID}`;

// The fixed maps: World + one per continent. Country maps are built from the database instead
// (any country with enough locations — see MIN_COUNTRY_MAP_LOCATIONS), so they grow with the pool.
const FIXED_MAPS: Omit<GameMap, "countryCode" | "featured">[] = [
  {
    id: DEFAULT_MAP_ID,
    name: "World",
    description: "Anywhere on Earth with Street View.",
    continent: null,
  },
  { id: "europe", name: "Europe", description: "From Lisbon to the Urals.", continent: "europe" },
  { id: "asia", name: "Asia", description: "Deserts, megacities and rice terraces.", continent: "asia" },
  { id: "africa", name: "Africa", description: "Savannas, coasts and the Sahara's edge.", continent: "africa" },
  {
    id: "north-america",
    name: "North America",
    description: "Canada, the USA, Mexico and the Caribbean.",
    continent: "north-america",
  },
  {
    id: "south-america",
    name: "South America",
    description: "The Andes, the Amazon and Patagonia.",
    continent: "south-america",
  },
  { id: "oceania", name: "Oceania", description: "Australia, New Zealand and the Pacific.", continent: "oceania" },
];

const FAMOUS_MAP: GameMap = {
  id: FAMOUS_MAP_ID,
  name: "Famous places",
  description: "World-famous landmarks. The perfect first game.",
  continent: null,
  countryCode: null,
  featured: true,
};

// World first, then Famous places, then the continents.
export const MAPS: GameMap[] = [
  ...FIXED_MAPS.slice(0, 1),
  FAMOUS_MAP,
  ...FIXED_MAPS.slice(1),
].map((map) => ({ countryCode: null, featured: false, ...map }));

// A country needs this many locations to get its own map, so games don't repeat the same few spots.
export const MIN_COUNTRY_MAP_LOCATIONS = 20;

export function findMap(id: string): GameMap | undefined {
  return MAPS.find((map) => map.id === id);
}

// Country maps use the lowercase country code as their id: "fr" → France.
export function isCountryMapId(id: string): boolean {
  return /^[a-z]{2}$/.test(id);
}

export function countryMap(code: string, name: string): GameMap {
  return {
    id: code.toLowerCase(),
    name,
    description: `Every round somewhere in ${name}.`,
    continent: null,
    countryCode: code.toUpperCase(),
    featured: false,
  };
}

// Is this text shaped like a map id at all? (Whether a country map really exists is checked
// against the database by resolveMap in src/server/services/mapService.ts.)
export function isMapIdShape(id: string): boolean {
  return findMap(id) !== undefined || isCountryMapId(id);
}

// Natural Earth's CONTINENT names → our ids. "Seven seas (open ocean)" (small island nations such as
// the Maldives or Mauritius) and Antarctica belong to no continent map; they still appear on World.
const NATURAL_EARTH_CONTINENTS: Record<string, Continent> = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  "South America": "south-america",
  Oceania: "oceania",
};

export function continentFromNaturalEarth(name: string | undefined): Continent | null {
  return (name && NATURAL_EARTH_CONTINENTS[name]) || null;
}
