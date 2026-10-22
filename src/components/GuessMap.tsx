"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import { GameBaseMap } from "./GameBaseMap";
import { ANSWER_PIN, GUESS_PIN } from "./mapPins";
import type { Coordinates } from "@/types/geo";

// Default size/shape. Callers can pass their own `className` (e.g. a full-screen result map).
const DEFAULT_MAP_CLASSES = "h-full min-h-70 w-full rounded-xl";

type GuessMapProps = {
  // Where the player's marker is (null = not placed yet).
  guess: Coordinates | null;
  // Called when the player clicks the map. Omit it to make the map read-only (result view).
  onGuessChange?: (guess: Coordinates) => void;
  // The true location, shown only after the round is scored.
  answer?: Coordinates | null;
  // Size/shape classes for the map box (defaults to DEFAULT_MAP_CLASSES).
  className?: string;
};

// Leaflet only notices WINDOW resizes. When the map's own box changes size (e.g. the guess map
// growing on hover), tell Leaflet to re-measure, or it shows grey gaps where tiles are missing.
function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

// Listens for clicks and reports them as a guess.
function ClickToGuess({ onGuessChange }: { onGuessChange: (guess: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      // `wrap()` keeps longitude within -180..180 even if the player clicks a repeated world copy.
      const point = event.latlng.wrap();
      onGuessChange({ lat: point.lat, lng: point.lng });
    },
  });
  return null;
}

// After scoring, zooms the map so both the guess and the answer are visible.
function FitResult({ guess, answer }: { guess: Coordinates; answer: Coordinates }) {
  const map = useMap();
  // Depend on the numbers, not the objects: a new object with the same values must NOT re-zoom,
  // or the map would jump back every time the page re-renders while the player is panning.
  const { lat: guessLat, lng: guessLng } = guess;
  const { lat: answerLat, lng: answerLng } = answer;

  useEffect(() => {
    map.fitBounds(
      [
        [guessLat, guessLng],
        [answerLat, answerLng],
      ],
      // Extra room at the top (game top bar) and bottom (result card), so neither pin hides behind them.
      { paddingTopLeft: [50, 100], paddingBottomRight: [50, 320], maxZoom: 6 },
    );
  }, [map, guessLat, guessLng, answerLat, answerLng]);
  return null;
}

// The world map where the player clicks to place a guess (Leaflet + OpenStreetMap-style tiles).
// Leaflet needs the browser's `window`, so this component must never render on the server —
// it is loaded with `next/dynamic` and `ssr: false` (see GuessMapLoader).
export default function GuessMap({
  guess,
  onGuessChange,
  answer = null,
  className = DEFAULT_MAP_CLASSES,
}: GuessMapProps) {
  return (
    <MapContainer
      className={`${className} ${onGuessChange ? "cursor-crosshair" : ""}`}
      center={[20, 0]}
      zoom={1}
      minZoom={1}
      worldCopyJump
      aria-label="World map: click to place your guess"
    >
      <GameBaseMap />
      <ResizeWatcher />

      {onGuessChange && <ClickToGuess onGuessChange={onGuessChange} />}

      {/* The dashed line is drawn first so the pins sit on top of it. */}
      {guess && answer && (
        <Polyline
          positions={[
            [guess.lat, guess.lng],
            [answer.lat, answer.lng],
          ]}
          pathOptions={{ color: "#1e293b", weight: 3, dashArray: "8 8", opacity: 0.8 }}
        />
      )}

      {guess && (
        <Marker
          position={[guess.lat, guess.lng]}
          icon={GUESS_PIN}
          title="Your guess"
          keyboard={false}
          interactive={false}
        />
      )}

      {guess && answer && (
        <>
          <Marker
            position={[answer.lat, answer.lng]}
            icon={ANSWER_PIN}
            title="The real location"
            keyboard={false}
            interactive={false}
            zIndexOffset={1000}
          />
          <FitResult guess={guess} answer={answer} />
        </>
      )}
    </MapContainer>
  );
}
