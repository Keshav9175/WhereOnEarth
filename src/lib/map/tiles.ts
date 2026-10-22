// Where the guessing map's background images ("tiles") come from.
//
// With NEXT_PUBLIC_CARTO_API_KEY set: CARTO "Voyager" — a clean, game-friendly map (free key:
// 5M tile requests/month non-commercial; https://carto.com/basemaps/apikey/, terms:
// https://carto.com/legal/basemap-terms/). Without a key CARTO stamps a watermark, so we fall back
// to OpenStreetMap's own tile server — fine for light development only:
// https://operations.osmfoundation.org/policies/tiles/
// NEXT_PUBLIC_MAP_TILE_URL / _ATTRIBUTION override both (e.g. another provider at launch).
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

// {s} = server a/b/c (spreads the load), {r} = "@2x" sharper tiles on high-resolution screens.
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  (cartoKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png");

export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
  (cartoKey
    ? `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`
    : OSM_ATTRIBUTION);
