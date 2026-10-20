// Where the guessing map's background images ("tiles") come from.
// Default: OpenStreetMap's free tile server — fine for light development use, but its policy
// is NOT meant for a busy public game. Switch provider via env vars before launch (Phase 10).
// Policy: https://operations.osmfoundation.org/policies/tiles/ (HTTPS, visible attribution, no bulk downloads).
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
