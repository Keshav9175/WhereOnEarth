import type { Coordinates } from "@/types/geo";

export type RotatedMapRect = {
  top: number;
  right: number;
};

const TILE_SIZE = 256;
const MAX_MERCATOR_LATITUDE = 85.05112878;

// A clockwise-rotated landscape viewport swaps the screen axes. Convert screen touches
// back into the Google map's unrotated landscape pixel coordinates.
export function screenToRotatedMapPixel(
  screenX: number,
  screenY: number,
  rect: RotatedMapRect,
): { x: number; y: number } {
  return { x: screenY - rect.top, y: rect.right - screenX };
}

function toWorldPixel(point: Coordinates, zoom: number) {
  const latitude = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, point.lat));
  const sin = Math.sin((latitude * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    scale,
  };
}

function fromWorldPixel(x: number, y: number, scale: number): Coordinates {
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

// Resolve a tap in map-local pixels to geographic coordinates using Web Mercator.
export function rotatedMapPixelToCoordinates(
  pixel: { x: number; y: number },
  size: { width: number; height: number },
  center: Coordinates,
  zoom: number,
): Coordinates {
  const world = toWorldPixel(center, zoom);
  return fromWorldPixel(
    world.x + pixel.x - size.width / 2,
    world.y + pixel.y - size.height / 2,
    world.scale,
  );
}

// Convert a screen-space finger drag to the corresponding center movement on the unrotated map.
export function panCenterForRotatedDrag(
  center: Coordinates,
  zoom: number,
  screenDelta: { x: number; y: number },
): Coordinates {
  const world = toWorldPixel(center, zoom);
  const localDeltaX = screenDelta.y;
  const localDeltaY = -screenDelta.x;
  return fromWorldPixel(
    world.x - localDeltaX,
    world.y - localDeltaY,
    world.scale,
  );
}
