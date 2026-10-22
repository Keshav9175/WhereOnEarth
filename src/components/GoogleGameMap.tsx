"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleLibrary } from "@/lib/google/mapsLoader";
import {
  ANSWER_PIN_SVG,
  GUESS_PIN_SVG,
  numberedAnswerPinSvg,
  numberedGuessPinSvg,
  PIN_HEIGHT,
  PIN_TIP_Y,
  playerPinSvg,
} from "@/lib/map/pinSvg";
import type { Coordinates } from "@/types/geo";

export type SummaryRound = { roundNumber: number; guess: Coordinates; answer: Coordinates };

// Party games: one or more rounds, each with the answer and every player's guess in their colour.
export type PartyMapRound = {
  roundNumber: number;
  answer: Coordinates;
  guesses: (Coordinates & { playerId: string; name: string; color: string })[];
};

// What the map should show right now. The SAME map is reused for all of these (see "billing" below).
export type GameMapView =
  | { mode: "hidden" }
  | { mode: "guess"; guess: Coordinates | null; onGuessChange: (guess: Coordinates) => void }
  | { mode: "result"; guess: Coordinates; answer: Coordinates }
  | { mode: "summary"; rounds: SummaryRound[]; focusedRound: number | null }
  | { mode: "party"; rounds: PartyMapRound[] };

// Advanced markers need a "Map ID". DEMO_MAP_ID is Google's ready-made one for development; create a
// free Map ID in Google Cloud and set NEXT_PUBLIC_GOOGLE_MAP_ID before launch (Phase 10).
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";
const WORLD_VIEW = { center: { lat: 20, lng: 0 }, zoom: 1 };
const LINE_COLOR = "#1e293b";

type Libraries = {
  Polyline: typeof google.maps.Polyline;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  LatLngBounds: typeof google.maps.LatLngBounds;
  event: typeof google.maps.event;
};
type Overlay = { remove(): void };

function pinElement(svg: string, opacity = 1) {
  const element = document.createElement("div");
  element.innerHTML = svg;
  element.style.opacity = String(opacity);
  // Google anchors a marker at the bottom of its picture; ours has the ground shadow below the tip,
  // so shift it down by that much and the TIP lands exactly on the point.
  element.style.transform = `translateY(${PIN_HEIGHT - PIN_TIP_Y}px)`;
  return element;
}

// Zooms so all points are visible inside the padding, but never closer than `maxZoom`.
function fitPoints(map: google.maps.Map, libs: Libraries, points: Coordinates[], padding: google.maps.Padding, maxZoom: number) {
  if (points.length === 0) return;
  const bounds = new libs.LatLngBounds();
  points.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, padding);
  libs.event.addListenerOnce(map, "idle", () => {
    if ((map.getZoom() ?? 0) > maxZoom) map.setZoom(maxZoom);
  });
}

// The official Google map (Maps JavaScript API) used for guessing, round results and the final summary.
//
// Billing: Google counts a map load each time a map is CREATED ("Dynamic Maps": 10,000 free per month;
// it also counts toward our "Map loads per day" cap, shared with Street View). So this component creates
// ONE map when it mounts and only changes its pins, lines and camera afterwards. PlayGame keeps it
// mounted for the whole visit and just moves/resizes the box around it.
export function GoogleGameMap({ view, className = "" }: { view: GameMapView; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const libsRef = useRef<Libraries | null>(null);
  const overlaysRef = useRef<Overlay[]>([]);
  const previousModeRef = useRef<GameMapView["mode"]>("hidden");
  // Google's click listener is added once, so it reads the LATEST view through this ref.
  const viewRef = useRef(view);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    viewRef.current = view;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;

    async function create() {
      try {
        const [{ Map, Polyline }, { AdvancedMarkerElement }, { LatLngBounds, event }] = await Promise.all([
          loadGoogleLibrary("maps"),
          loadGoogleLibrary("marker"),
          loadGoogleLibrary("core"),
        ]);
        // React runs effects twice in development; only the surviving run creates the map.
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = new Map(containerRef.current, {
          ...WORLD_VIEW,
          minZoom: 1,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false, // clicking a shop or landmark mustn't open Google's info box
          gestureHandling: "greedy", // scroll wheel zooms without holding Ctrl
          // Show ONE world only: in a wide or tall map box Google would otherwise repeat the world sideways
          // and add grey bands above and below. Google won't zoom out further than this fills the box.
          restriction: { latLngBounds: { north: 85, south: -85, west: -180, east: 180 }, strictBounds: true },
        });
        map.addListener("click", (clicked: google.maps.MapMouseEvent) => {
          const current = viewRef.current;
          if (current.mode === "guess" && clicked.latLng) {
            current.onGuessChange({ lat: clicked.latLng.lat(), lng: clicked.latLng.lng() });
          }
        });

        mapRef.current = map;
        libsRef.current = { Polyline, AdvancedMarkerElement, LatLngBounds, event };
        setReady(true);
      } catch {
        if (!cancelled) setError("The map could not load. Check your connection and refresh.");
      }
    }

    void create();
    return () => {
      cancelled = true;
    };
  }, []);

  // Everything the overlays depend on, as text (the callback in guess mode isn't data, so it's left out).
  const overlayKey = JSON.stringify(view.mode === "guess" ? { mode: view.mode, guess: view.guess } : view);

  // Redraw pins and lines, and move the camera, whenever what we show changes.
  useEffect(() => {
    const map = mapRef.current;
    const libs = libsRef.current;
    if (!ready || !map || !libs) return;

    const shown = JSON.parse(overlayKey) as Exclude<GameMapView, { mode: "guess" }> | { mode: "guess"; guess: Coordinates | null };
    const previousMode = previousModeRef.current;
    previousModeRef.current = shown.mode;

    overlaysRef.current.forEach((overlay) => overlay.remove());
    overlaysRef.current = [];

    const addPin = (position: Coordinates, svg: string, title: string, zIndex: number, opacity = 1) => {
      const marker = new libs.AdvancedMarkerElement({ map, position, content: pinElement(svg, opacity), title, zIndex });
      overlaysRef.current.push({ remove: () => (marker.map = null) });
    };
    // A dashed line: an invisible line decorated with short repeated dashes.
    const addLine = (from: Coordinates, to: Coordinates, opacity = 1) => {
      const line = new libs.Polyline({
        map,
        path: [from, to],
        strokeOpacity: 0,
        clickable: false,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8 * opacity, strokeColor: LINE_COLOR, scale: 3 },
            offset: "0",
            repeat: "14px",
          },
        ],
      });
      overlaysRef.current.push({ remove: () => line.setMap(null) });
    };

    map.setOptions({ draggableCursor: shown.mode === "guess" ? "crosshair" : null });

    if (shown.mode === "guess") {
      // A new round starts from the whole world again.
      if (previousMode !== "guess") map.moveCamera(WORLD_VIEW);
      if (shown.guess) addPin(shown.guess, GUESS_PIN_SVG, "Your guess", 1);
    }

    if (shown.mode === "result") {
      addLine(shown.guess, shown.answer);
      addPin(shown.guess, GUESS_PIN_SVG, "Your guess", 1);
      addPin(shown.answer, ANSWER_PIN_SVG, "The real location", 2);
      // Extra room at the top (top bar) and bottom (result card) so no pin hides behind them.
      fitPoints(map, libs, [shown.guess, shown.answer], { top: 110, bottom: 340, left: 60, right: 60 }, 8);
    }

    if (shown.mode === "summary") {
      const { rounds, focusedRound } = shown;
      for (const round of rounds) {
        // While one round is focused, the others fade back so it stands out.
        const opacity = focusedRound === null || focusedRound === round.roundNumber ? 1 : 0.35;
        addLine(round.guess, round.answer, opacity);
        addPin(round.guess, numberedGuessPinSvg(round.roundNumber), `Round ${round.roundNumber}: your guess`, 1, opacity);
        addPin(round.answer, numberedAnswerPinSvg(round.roundNumber), `Round ${round.roundNumber}: the real location`, 2, opacity);
      }
      const visible = focusedRound === null ? rounds : rounds.filter((round) => round.roundNumber === focusedRound);
      fitPoints(
        map,
        libs,
        visible.flatMap((round) => [round.guess, round.answer]),
        { top: 90, bottom: 40, left: 40, right: 40 },
        focusedRound === null ? 5 : 8,
      );
    }

    if (shown.mode === "party") {
      for (const round of shown.rounds) {
        // Each player's pin, joined to the answer by a dashed line. (The name goes into `title`, a plain
        // property — never into HTML, since players type their own names.)
        for (const guess of round.guesses) {
          addLine(guess, round.answer, 0.8);
          addPin(guess, playerPinSvg(guess.color, guess.name, guess.playerId), `${guess.name}`, 1);
        }
        const answerPin = shown.rounds.length > 1 ? numberedAnswerPinSvg(round.roundNumber) : ANSWER_PIN_SVG;
        addPin(round.answer, answerPin, `Round ${round.roundNumber}: the real location`, 2);
      }
      fitPoints(
        map,
        libs,
        shown.rounds.flatMap((round) => [round.answer, ...round.guesses]),
        { top: 90, bottom: 50, left: 50, right: 50 },
        shown.rounds.length > 1 ? 5 : 8,
      );
    }
  }, [ready, overlayKey]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={containerRef} className="h-full w-full" aria-label="World map" />
      {error && (
        <p role="alert" className="absolute inset-0 grid place-items-center bg-slate-900/80 p-4 text-center text-sm text-white">
          {error}
        </p>
      )}
    </div>
  );
}
