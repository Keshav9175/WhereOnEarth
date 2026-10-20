import type { Coordinates } from "@/types/geo";

// Average radius of the Earth in kilometres.
export const EARTH_RADIUS_KM = 6371;

// Converts degrees (used by maps) to radians (used by JavaScript's math functions).
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Returns the distance in kilometres between two points on Earth.
export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2;

  // Math.max(0, ...) prevents a tiny rounding error from producing NaN ("not a number")
  // when the two points are on exactly opposite sides of the Earth.
  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return EARTH_RADIUS_KM * centralAngle;
}
