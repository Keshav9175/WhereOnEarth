import type { Coordinates } from "@/types/geo";
import { EARTH_RADIUS_KM, haversineDistanceKm } from "@/lib/game/distance";

// Remembers saved locations and answers "is this new point too close to one we already have?"
// so the pool is spread out instead of 10 spots on the same street.
//
// Checking every saved point would be slow with thousands of them, so space is cut into
// cubes ("cells") as wide as the minimum distance. A point closer than that can only be in
// the same cell or one of its 26 neighbours, so only those few are checked.
export class SpacingGrid {
  private readonly cells = new Map<string, Coordinates[]>();

  constructor(private readonly minDistanceKm: number) {}

  // Position of the point in 3D (km from the Earth's centre), divided into cell numbers.
  // 3D avoids problems at the poles and at the ±180° line where lat/lng boxes break down.
  private cellOf({ lat, lng }: Coordinates): [number, number, number] {
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const size = this.minDistanceKm;
    return [
      Math.floor((EARTH_RADIUS_KM * Math.cos(latRad) * Math.cos(lngRad)) / size),
      Math.floor((EARTH_RADIUS_KM * Math.cos(latRad) * Math.sin(lngRad)) / size),
      Math.floor((EARTH_RADIUS_KM * Math.sin(latRad)) / size),
    ];
  }

  isTooClose(point: Coordinates): boolean {
    const [x, y, z] = this.cellOf(point);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighbours = this.cells.get(`${x + dx},${y + dy},${z + dz}`) ?? [];
          if (neighbours.some((other) => haversineDistanceKm(point, other) < this.minDistanceKm)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  add(point: Coordinates): void {
    const key = this.cellOf(point).join(",");
    const bucket = this.cells.get(key);
    if (bucket) bucket.push(point);
    else this.cells.set(key, [point]);
  }
}
