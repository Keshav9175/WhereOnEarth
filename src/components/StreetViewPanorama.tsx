import type { Coordinates } from "@/types/geo";

// Public, browser-visible key. It MUST be restricted in Google Cloud to our website
// (HTTP referrers) and to the "Maps Embed API" only — see docs/DEVELOPMENT_WORKFLOW.md.
const EMBED_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

type StreetViewPanoramaProps = {
  location: Coordinates;
  // Compass direction the camera faces (0 = north). Default: north.
  heading?: number;
};

// Shows an interactive Google Street View panorama using the free Maps Embed API (an iframe).
export function StreetViewPanorama({ location, heading = 0 }: StreetViewPanoramaProps) {
  if (!EMBED_API_KEY) {
    return (
      <div
        className="grid h-full min-h-80 w-full place-items-center rounded-xl bg-slate-800 p-6 text-center leading-relaxed text-slate-100"
        role="alert"
      >
        <p>
          Street View is not configured. Add <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY</code> to{" "}
          <code>.env.local</code> and restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  const params = new URLSearchParams({
    key: EMBED_API_KEY,
    location: `${location.lat},${location.lng}`,
    heading: String(heading),
    pitch: "0",
    fov: "90",
  });

  return (
    <iframe
      className="block h-full min-h-80 w-full rounded-xl border-0 bg-slate-800"
      title="Street View panorama — look around for clues"
      src={`https://www.google.com/maps/embed/v1/streetview?${params.toString()}`}
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
