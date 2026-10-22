"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleLibrary, MAPS_API_KEY } from "@/lib/google/mapsLoader";
import type { Coordinates } from "@/types/geo";

// How far (metres) to look for the nearest Street View photo around a location.
const SEARCH_RADIUS_M = 1000;

type StreetViewPanoramaProps = {
  // Where to show. When it changes, the SAME panorama moves there (see "billing" below).
  location: Coordinates;
  // Size/shape of the panorama box. Default: a rounded card that fills its parent.
  className?: string;
  // True while the panorama is hidden behind other screens (results, summary): Google stops drawing
  // it, so the map on top can pan smoothly. It stays created (no new billable use).
  paused?: boolean;
};

const DEFAULT_PANORAMA_CLASSES = "h-full min-h-80 w-full rounded-xl";

// Interactive Google Street View using the Maps JavaScript API (not the Embed iframe), because only
// this API can HIDE the address card ("31 Champs-Élysées, Paris") that would give the answer away —
// covering it ourselves would break Google's terms.
//
// Billing: Google charges per panorama CREATED (Dynamic Street View, 5,000 free per month). So we
// create ONE panorama when this component mounts and only move it for later rounds. Looking up the
// nearest photo (StreetViewService) is not billed.
export function StreetViewPanorama({
  location,
  className = DEFAULT_PANORAMA_CLASSES,
  paused = false,
}: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const serviceRef = useRef<google.maps.StreetViewService | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The latest `paused`, readable from the async code below (which may finish later).
  const pausedRef = useRef(paused);

  // Pause or resume drawing. (Also applied right after the panorama is created, below.)
  useEffect(() => {
    pausedRef.current = paused;
    panoramaRef.current?.setVisible(!paused);
  }, [paused]);

  const { lat, lng } = location;

  useEffect(() => {
    if (!MAPS_API_KEY || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    async function show() {
      try {
        const { StreetViewPanorama, StreetViewService, StreetViewPreference } =
          await loadGoogleLibrary("streetView");
        if (cancelled) return;

        // Find the photo nearest to this round's location.
        serviceRef.current ??= new StreetViewService();
        const { data } = await serviceRef.current.getPanorama({
          location: { lat, lng },
          radius: SEARCH_RADIUS_M,
          preference: StreetViewPreference.NEAREST,
        });
        const panoId = data.location?.pano;
        if (cancelled || !panoId) {
          if (!panoId) setError("No Street View imagery here. Try the next round.");
          return;
        }

        if (!panoramaRef.current) {
          // Created once per mount (= once per game) → one billable use.
          panoramaRef.current = new StreetViewPanorama(container, {
            pano: panoId,
            pov: { heading: 0, pitch: 0 },
            zoom: 0,
            addressControl: false, // ← hides the location name card (the whole point)
            showRoadLabels: false, // ← hides street names painted on the roads, also a giveaway
            enableCloseButton: false,
            motionTracking: false,
            // The game already fills the window; turning this optional button off frees the top-right
            // corner for our score. (Google's logo, credits and legal links are never hidden.)
            fullscreenControl: false,
            visible: !pausedRef.current,
          });
        } else {
          // Later rounds: move the existing panorama (no new billable use).
          panoramaRef.current.setPano(panoId);
          panoramaRef.current.setPov({ heading: 0, pitch: 0 });
          panoramaRef.current.setZoom(0);
        }
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        console.error("Street View failed to load:", cause);
        setError(
          "Street View could not load. Check that the Maps JavaScript API is enabled for your key.",
        );
      }
    }

    void show();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (!MAPS_API_KEY) {
    return (
      <div
        className={`${className} grid place-items-center bg-slate-800 p-6 text-center leading-relaxed text-slate-100`}
        role="alert"
      >
        <p>
          Street View is not configured. Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code>.env.local</code> and restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-slate-800`}>
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Street View panorama — look around for clues"
      />
      {error && (
        <p
          role="alert"
          className="absolute inset-x-0 top-1/2 mx-auto w-fit max-w-sm -translate-y-1/2 rounded-xl bg-slate-950/80 px-4 py-3 text-center text-white"
        >
          {error}
        </p>
      )}
    </div>
  );
}
