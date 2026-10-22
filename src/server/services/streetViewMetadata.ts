import { z } from "zod";
import type { Coordinates } from "@/types/geo";

// Google's official "is there Street View here?" check (Street View Static API, metadata).
// It is FREE and uses no quota — Google only charges for loading images, which we never do here.
// Docs: https://developers.google.com/maps/documentation/streetview/metadata
const METADATA_URL = "https://maps.googleapis.com/maps/api/streetview/metadata";

const metadataSchema = z.object({
  status: z.string(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  copyright: z.string().optional(),
  error_message: z.string().optional(),
});

export type MetadataResult =
  | { found: true; location: Coordinates }
  | { found: false };

// A temporary hiccup on Google's side (or a dropped connection): worth asking again.
export class TemporaryMetadataError extends Error {}

// fetch() throws a TypeError when the internet connection drops.
export function isTemporaryMetadataError(error: unknown): boolean {
  return error instanceof TemporaryMetadataError || error instanceof TypeError;
}

const MAX_ATTEMPTS = 4;

// Turns Google's reply into a simple yes/no. Kept separate from the network call so it can be tested.
export function parseMetadata(body: unknown): MetadataResult {
  const reply = metadataSchema.parse(body);

  if (reply.status === "ZERO_RESULTS" || reply.status === "NOT_FOUND") return { found: false };

  // Google's docs: UNKNOWN_ERROR is a server error, and the request "may succeed if you try again".
  if (reply.status === "UNKNOWN_ERROR") {
    throw new TemporaryMetadataError("Street View metadata: UNKNOWN_ERROR");
  }

  if (reply.status !== "OK") {
    // REQUEST_DENIED (bad key / API not enabled), OVER_QUERY_LIMIT, INVALID_REQUEST…
    // These are setup problems, not "no coverage", so stop loudly instead of skipping.
    throw new Error(`Street View metadata: ${reply.status} ${reply.error_message ?? ""}`.trim());
  }

  // Only Google's own car/trekker imagery. Photos uploaded by the public ("© Some Person")
  // are often indoors, blurry, or in the wrong place.
  if (!reply.location || !reply.copyright?.includes("Google")) return { found: false };

  return { found: true, location: reply.location };
}

// Asks Google for the nearest outdoor panorama within `radiusMeters` of the point.
// Returns the panorama's exact position (snapped onto the road), not the point we asked about.
// Temporary failures are retried up to MAX_ATTEMPTS times, waiting a little longer each time.
export async function findPanorama(
  point: Coordinates,
  radiusMeters: number,
  apiKey: string,
  retryDelayMs = 1000,
): Promise<MetadataResult> {
  const params = new URLSearchParams({
    location: `${point.lat},${point.lng}`,
    radius: String(radiusMeters),
    source: "outdoor",
    key: apiKey,
  });

  for (let attempt = 1; ; attempt++) {
    try {
      return await askGoogle(params);
    } catch (error) {
      if (!isTemporaryMetadataError(error) || attempt >= MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * retryDelayMs));
    }
  }
}

async function askGoogle(params: URLSearchParams): Promise<MetadataResult> {
  // Never log this URL: it contains the secret key.
  const response = await fetch(`${METADATA_URL}?${params}`);
  if (response.status >= 500) throw new TemporaryMetadataError(`Street View metadata: HTTP ${response.status}`);
  if (!response.ok) throw new Error(`Street View metadata: HTTP ${response.status}`);

  return parseMetadata(await response.json());
}
