"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map/tiles";
import type { Coordinates } from "@/types/geo";

// Shared by the map and its loading placeholder (GuessMapLoader), so both have the same size.
export const MAP_BOX_CLASSES = "h-full min-h-70 w-full rounded-xl";

type GuessMapProps = {
  // Where the player's marker is (null = not placed yet).
  guess: Coordinates | null;
  // Called when the player clicks the map. Omit it to make the map read-only (result view).
  onGuessChange?: (guess: Coordinates) => void;
  // The true location, shown only after the round is scored.
  answer?: Coordinates | null;
};

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
      { padding: [40, 40], maxZoom: 6 },
    );
  }, [map, guessLat, guessLng, answerLat, answerLng]);
  return null;
}

// The world map where the player clicks to place a guess (Leaflet + OpenStreetMap-style tiles).
// Leaflet needs the browser's `window`, so this component must never render on the server —
// it is loaded with `next/dynamic` and `ssr: false` (see GuessMapLoader).
export default function GuessMap({ guess, onGuessChange, answer = null }: GuessMapProps) {
  return (
    <MapContainer
      className={`${MAP_BOX_CLASSES} cursor-crosshair`}
      center={[20, 0]}
      zoom={1}
      minZoom={1}
      worldCopyJump
      aria-label="World map: click to place your guess"
    >
      <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />

      {onGuessChange && <ClickToGuess onGuessChange={onGuessChange} />}

      {guess && (
        <CircleMarker
          center={[guess.lat, guess.lng]}
          radius={8}
          pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9 }}
        />
      )}

      {guess && answer && (
        <>
          <CircleMarker
            center={[answer.lat, answer.lng]}
            radius={8}
            pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.9 }}
          />
          <Polyline
            positions={[
              [guess.lat, guess.lng],
              [answer.lat, answer.lng],
            ]}
            pathOptions={{ color: "#111827", weight: 2, dashArray: "6 6" }}
          />
          <FitResult guess={guess} answer={answer} />
        </>
      )}
    </MapContainer>
  );
}
