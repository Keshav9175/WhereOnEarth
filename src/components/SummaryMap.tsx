"use client";

import "leaflet/dist/leaflet.css";
import { Fragment, useEffect } from "react";
import { MapContainer, Marker, Polyline, useMap } from "react-leaflet";
import type { Coordinates } from "@/types/geo";
import { GameBaseMap } from "./GameBaseMap";
import { numberedAnswerPin, numberedGuessPin } from "./mapPins";

export type SummaryRound = { roundNumber: number; guess: Coordinates; answer: Coordinates };

type SummaryMapProps = {
  rounds: SummaryRound[];
  // The round to zoom in on, or null to show every round.
  focusedRound: number | null;
};

// Moves the camera: to one round's guess + answer when a round is picked, otherwise to all rounds.
function FitView({ rounds, focusedRound }: SummaryMapProps) {
  const map = useMap();
  // A text key, so the camera only moves when the rounds or the focus really change.
  const key = JSON.stringify({ rounds, focusedRound });

  useEffect(() => {
    const { rounds: all, focusedRound: focus } = JSON.parse(key) as SummaryMapProps;
    const shown = focus === null ? all : all.filter((round) => round.roundNumber === focus);
    const points = shown.flatMap((round) => [
      [round.guess.lat, round.guess.lng] as [number, number],
      [round.answer.lat, round.answer.lng] as [number, number],
    ]);
    if (points.length === 0) return;

    // Top padding keeps pins clear of the game's top bar; "fly" animates the move.
    map.flyToBounds(points, {
      paddingTopLeft: [40, 90],
      paddingBottomRight: [40, 40],
      maxZoom: focus === null ? 5 : 8,
      duration: 0.8,
    });
  }, [map, key]);
  return null;
}

// End-of-game map: for every round, the guess (blue) and the answer (green), numbered and joined by a line.
// Browser-only like GuessMap (see SummaryMapLoader).
export default function SummaryMap({ rounds, focusedRound }: SummaryMapProps) {
  return (
    <MapContainer
      className="h-full w-full"
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      worldCopyJump
      aria-label="World map of all your guesses and the real locations"
    >
      <GameBaseMap />
      <FitView rounds={rounds} focusedRound={focusedRound} />

      {rounds.map(({ roundNumber, guess, answer }) => {
        // While one round is focused, the others fade back so it stands out.
        const opacity = focusedRound === null || focusedRound === roundNumber ? 1 : 0.35;
        return (
          <Fragment key={roundNumber}>
            <Polyline
              positions={[
                [guess.lat, guess.lng],
                [answer.lat, answer.lng],
              ]}
              pathOptions={{ color: "#1e293b", weight: 3, dashArray: "8 8", opacity: 0.75 * opacity }}
            />
            <Marker
              position={[guess.lat, guess.lng]}
              icon={numberedGuessPin(roundNumber)}
              title={`Round ${roundNumber}: your guess`}
              opacity={opacity}
              keyboard={false}
              interactive={false}
            />
            <Marker
              position={[answer.lat, answer.lng]}
              icon={numberedAnswerPin(roundNumber)}
              title={`Round ${roundNumber}: the real location`}
              opacity={opacity}
              keyboard={false}
              interactive={false}
              zIndexOffset={1000}
            />
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
