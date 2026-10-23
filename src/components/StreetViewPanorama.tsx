"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleLibrary, MAPS_API_KEY } from "@/lib/google/mapsLoader";
import { screenDeltaToRotatedMapDelta } from "@/lib/map/rotatedMapInteraction";
import type { Movement } from "@/lib/party/protocol";
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
  // What the player may do (party setting, like WorldGuessr): walk ("moving", default), only look
  // around ("no-move"), or nothing but the starting view ("nmpz" = no move, no pan, no zoom).
  movement?: Movement;
  // Show street names painted on the roads (a big hint). Off by default.
  roadNames?: boolean;
};

// Google's Street View options for each movement mode. Keyboard keys have no option, so they are
// blocked separately (see blockKeys below).
function movementOptions(movement: Movement): google.maps.StreetViewPanoramaOptions {
  const canMove = movement === "moving";
  const canLook = movement !== "nmpz";
  return {
    clickToGo: canMove, // click on the road to walk there
    linksControl: canMove, // the arrows on the road
    zoomControl: canLook,
    scrollwheel: canLook,
    disableDoubleClickZoom: !canLook,
    panControl: canLook, // the compass (turning by dragging is blocked by the overlay in NMPZ)
  };
}

// Street View walks with ↑ ↓ (and W S); in NMPZ the arrows/keys also turn and zoom. Swallow those keys
// before Google sees them ("capture" phase).
const WALK_KEYS = new Set(["ArrowUp", "ArrowDown", "w", "W", "s", "S"]);

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
  movement = "moving",
  roadNames = false,
}: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const serviceRef = useRef<google.maps.StreetViewService | null>(null);
  const pointerAdapterCleanupRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The latest `paused`, readable from the async code below (which may finish later).
  const pausedRef = useRef(paused);

  // Pause or resume drawing. (Also applied right after the panorama is created, below.)
  useEffect(() => {
    pausedRef.current = paused;
    panoramaRef.current?.setVisible(!paused);
  }, [paused]);

  // The latest rules, readable from the async creation code below.
  const rulesRef = useRef({ movement, roadNames });

  // Apply the rules (also right after the panorama is created, below).
  useEffect(() => {
    rulesRef.current = { movement, roadNames };
    panoramaRef.current?.setOptions({ ...movementOptions(movement), showRoadLabels: roadNames });
  }, [movement, roadNames]);

  // Block walking keys (no-move) or every key (NMPZ) inside the panorama.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || movement === "moving") return;
    const blockKeys = (event: KeyboardEvent) => {
      if (movement === "nmpz" || WALK_KEYS.has(event.key)) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    container.addEventListener("keydown", blockKeys, true);
    return () => container.removeEventListener("keydown", blockKeys, true);
  }, [movement]);

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
            // Street names painted on the roads are a big giveaway: hidden unless the party allows them.
            showRoadLabels: rulesRef.current.roadNames,
            ...movementOptions(rulesRef.current.movement),
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

        const forcedLandscape = window.matchMedia(
          "(max-width: 600px) and (max-aspect-ratio: 9/16) and (pointer: coarse) and (orientation: portrait)",
        );
        type ActivePointer = { id: number; startX: number; startY: number; lastX: number; lastY: number; dragging: boolean };
        let activePointer: ActivePointer | null = null;
        const updateGestureMode = () => {
          container.style.touchAction = forcedLandscape.matches ? "none" : "";
          activePointer = null;
        };
        const isGoogleControl = (target: EventTarget | null) =>
          target instanceof Element &&
          Boolean(target.closest("button, a, [role='button'], .gm-control-active, .gm-svpc, .gm-fullscreen-control"));
        const stopGoogleDrag = (event: PointerEvent) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        };
        const onPointerDown = (event: PointerEvent) => {
          if (!forcedLandscape.matches || rulesRef.current.movement === "nmpz" || isGoogleControl(event.target)) return;
          if (event.pointerType === "mouse" && event.button !== 0) return;
          // Let taps reach Google unchanged (including click-to-go); only take over once this becomes a drag.
          activePointer = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            dragging: false,
          };
        };
        const onPointerMove = (event: PointerEvent) => {
          if (!forcedLandscape.matches || activePointer?.id !== event.pointerId) return;
          const pointer = activePointer;
          if (!pointer.dragging && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5) {
            pointer.dragging = true;
            try {
              container.setPointerCapture(event.pointerId);
            } catch {
              // Continue handling drags that remain within the panorama if capture is unavailable.
            }
          }
          if (!pointer.dragging) return;
          stopGoogleDrag(event);

          const screenDelta = { x: event.clientX - pointer.lastX, y: event.clientY - pointer.lastY };
          pointer.lastX = event.clientX;
          pointer.lastY = event.clientY;
          const panorama = panoramaRef.current;
          const size = { width: container.clientWidth, height: container.clientHeight };
          const zoom = panorama?.getZoom() ?? 0;
          if (!panorama || size.width <= 0 || size.height <= 0) return;

          // Google Street View's default horizontal field of view is about 180° at zoom 0,
          // halving for each zoom step. The viewport is landscape-sized inside this rotated stage.
          const horizontalFov = Math.min(179, 180 / 2 ** zoom);
          const verticalFov =
            (2 * Math.atan(Math.tan((horizontalFov * Math.PI) / 360) * (size.height / size.width)) * 180) /
            Math.PI;
          const localDelta = screenDeltaToRotatedMapDelta(screenDelta);
          const pov = panorama.getPov();
          panorama.setPov({
            heading: pov.heading - (localDelta.x * horizontalFov) / size.width,
            pitch: Math.max(-90, Math.min(90, pov.pitch - (localDelta.y * verticalFov) / size.height)),
          });
        };
        const finishPointer = (event: PointerEvent) => {
          if (activePointer?.id !== event.pointerId) return;
          if (activePointer.dragging) stopGoogleDrag(event);
          activePointer = null;
          if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
        };

        forcedLandscape.addEventListener("change", updateGestureMode);
        updateGestureMode();
        container.addEventListener("pointerdown", onPointerDown, true);
        container.addEventListener("pointermove", onPointerMove, true);
        container.addEventListener("pointerup", finishPointer, true);
        container.addEventListener("pointercancel", finishPointer, true);
        container.addEventListener("lostpointercapture", finishPointer, true);
        pointerAdapterCleanupRef.current = () => {
          forcedLandscape.removeEventListener("change", updateGestureMode);
          container.removeEventListener("pointerdown", onPointerDown, true);
          container.removeEventListener("pointermove", onPointerMove, true);
          container.removeEventListener("pointerup", finishPointer, true);
          container.removeEventListener("pointercancel", finishPointer, true);
          container.removeEventListener("lostpointercapture", finishPointer, true);
          container.style.touchAction = "";
        };
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
      pointerAdapterCleanupRef.current?.();
      pointerAdapterCleanupRef.current = null;
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
        // "isolate" keeps Google's own stacking (its z-indexes) inside this box, so the NMPZ layer
        // below can sit on top of it.
        className="isolate h-full w-full"
        role="region"
        aria-label="Street View panorama — look around for clues"
      />
      {/* NMPZ: Google has no "don't turn" option, so a see-through layer catches the drags. It stops short
          of the bottom edge, where Google's logo, Terms and "Report a problem" links must stay usable. */}
      {movement === "nmpz" && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-7 z-10 cursor-default" />
      )}
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
