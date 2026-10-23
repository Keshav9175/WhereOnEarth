import type { Coordinates } from "@/types/geo";
import { findPanorama, type MetadataResult } from "@/server/services/streetViewMetadata";

// Google's metadata check only answers with the NEAREST panorama, and at famous places that is often
// a visitor's own photo sphere (which we reject — D-019). So we also try points in rings around the
// spot, each with a small search radius, until one lands on Google's own imagery.
// The documented API has no "Google imagery only" filter (only source=default/outdoor), hence this.
// All metadata checks are free.

const PROBE_RADIUS_METERS = 30;
const BEARINGS_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];

// A point `meters` away from `origin` in direction `bearing` (accurate enough for these short distances).
function offset(origin: Coordinates, meters: number, bearing: number): Coordinates {
  const radians = (bearing * Math.PI) / 180;
  const dLat = (meters * Math.cos(radians)) / 111_320;
  const dLng = (meters * Math.sin(radians)) / (111_320 * Math.cos((origin.lat * Math.PI) / 180));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

// Searches outwards from `origin` ring by ring (`ringDistances` in metres; 0 = the point itself).
export async function findOfficialPanoramaNear(
  origin: Coordinates,
  apiKey: string,
  ringDistances: number[],
): Promise<MetadataResult> {
  for (const distance of ringDistances) {
    for (const bearing of distance === 0 ? [0] : BEARINGS_DEGREES) {
      const result = await findPanorama(offset(origin, distance, bearing), PROBE_RADIUS_METERS, apiKey);
      if (result.found) return result;
    }
  }
  return { found: false };
}
