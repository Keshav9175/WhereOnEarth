import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

// Public, browser-visible key for the Maps JavaScript API (Street View + the guess map). Restrict it in
// Google Cloud to our website (HTTP referrers) and to the "Maps JavaScript API" — see
// docs/DEVELOPMENT_WORKFLOW.md §8. (Falls back to the older Embed key variable.)
export const MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

// Google's loader must be configured exactly once per page, before the first library is loaded,
// so every Google component goes through this one function.
let configured = false;

export function loadGoogleLibrary<Name extends Parameters<typeof importLibrary>[0]>(name: Name) {
  if (!MAPS_API_KEY) throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
  if (!configured) {
    setOptions({ key: MAPS_API_KEY, v: "weekly" });
    configured = true;
  }
  return importLibrary(name);
}
