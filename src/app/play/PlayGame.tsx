"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { House, LoaderCircle, MapPin, RotateCcw } from "lucide-react";
import { GoogleGameMap, type GameMapView } from "@/components/GoogleGameMap";
import { StreetViewPanorama } from "@/components/StreetViewPanorama";
import type { PublicGame, PublicRound } from "@/server/services/publicGame";
import type { Coordinates } from "@/types/geo";
import logo from "../../../public/WhereOn Earth 3D Logo.png";
import worldMap from "../../../public/Vibrant Cartoon World Map Ocean Background.png";
import type { GameMap } from "@/lib/maps/catalog";
import { ExitGameButton } from "./ExitGameButton";
import { MapSwitcher, type CountryChoice } from "./MapSwitcher";
import { GameSummary } from "./GameSummary";
import { GLASS, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./gameStyles";
import { GuessMapControls } from "./GuessMapControls";
import { useGuessMapExpansion } from "./useGuessMapExpansion";
import { useGuessMapSize } from "./useGuessMapSize";

// How the guess map grows on hover: width and height together over 0.5 s with a soft ease-out curve.
// Phones don't grow the map, so the sizes only change from `sm:` (640px wide) up.
// The map box is always fully opaque: a see-through map makes the browser blend two live 3D scenes
// (map + Street View) on every frame, which makes panning stutter.
// When it grows or shrinks is decided by useGuessMapExpansion.
const GROW_MOTION = "transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

// Reads `{ error }` from a failed API response, with a fallback message.
async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

// Shown while a game is being created, or when something went wrong.
function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-full place-items-center p-4">
      <Image src={worldMap} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
      {children}
    </div>
  );
}

// The full-screen game: the Street View panorama fills the window, the guess map floats in the
// bottom-left corner (it grows on hover), the round and score sit in a top bar. After each guess a
// full-screen result map shows guess vs answer; after round 5, a summary.
type PlayGameProps = {
  // The map this game (and "Play again") uses. Changing it remounts PlayGame (see page.tsx).
  map: GameMap;
  // Country maps the player can switch to (built on the server from the location pool).
  countryMaps: CountryChoice[];
};

export function PlayGame({ map, countryMaps }: PlayGameProps) {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  // The round just scored. While set, the screen shows the result instead of the next panorama.
  const [result, setResult] = useState<PublicRound | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Where Street View points: the latest round's location. Unlike `game`, it is NOT cleared between
  // games, so the panorama stays mounted (see the Street View block below).
  const [panoramaSpot, setPanoramaSpot] = useState<Coordinates | null>(null);
  function showGame(next: PublicGame) {
    setGame(next);
    if (next.currentPanorama) setPanoramaSpot(next.currentPanorama);
  }
  // End screen: the round the map is zoomed on (null = all rounds).
  const [focusedRound, setFocusedRound] = useState<number | null>(null);

  // The guess map box and the Guess button: the map grows while the mouse is over either of them.
  const mapBoxRef = useRef<HTMLElement>(null);
  const guessButtonRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setGuess(null);
    setFocusedRound(null);
    setGame(null);
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map: map.id }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      showGame((await response.json()) as PublicGame);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }, [map.id]);

  // Start a game as soon as the page opens — no "Start" screen. The ref guard makes sure only ONE
  // game is created even though React runs effects twice in development (Strict Mode).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startGame();
  }, [startGame]);

  async function submitGuess() {
    if (!game || !guess) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/games/${game.id}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guess),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as { round: PublicRound; game: PublicGame };
      setResult(data.round);
      showGame(data.game);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  function nextRound() {
    setResult(null);
    setGuess(null);
  }

  const isFinished = game !== null && game.currentPanorama === null;
  const guessing = Boolean(game?.currentPanorama) && result === null;
  const mapHovered = useGuessMapExpansion(guessing, mapBoxRef, guessButtonRef);
  const mapSize = useGuessMapSize(mapHovered);
  const roundLabel = result
    ? `Round ${result.roundNumber} / ${game?.totalRounds ?? 5}`
    : game?.currentRound
      ? `Round ${game.currentRound} / ${game.totalRounds}`
      : "Game over";

  // What the ONE shared Google map shows now, and where its box sits on screen.
  let mapView: GameMapView = { mode: "hidden" };
  let mapBox = "inset-0 invisible";
  if (result?.guess && result.answer) {
    mapView = { mode: "result", guess: result.guess, answer: result.answer };
    mapBox = "inset-0";
  } else if (game && isFinished) {
    const rounds = game.rounds.flatMap(({ roundNumber, guess: g, answer }) =>
      g && answer ? [{ roundNumber, guess: g, answer }] : [],
    );
    mapView = { mode: "summary", rounds, focusedRound };
    // Phones: top part of the screen; wide screens: everything right of the 27rem results panel.
    mapBox = "inset-x-0 top-0 h-[44%] lg:left-[27rem] lg:h-full";
  } else if (game?.currentPanorama) {
    mapView = { mode: "guess", guess, onGuessChange: setGuess };
    // Bottom-right, above the Guess button, 4rem from the right edge where Google's own Street View
    // controls and links live (those must stay visible).
    mapBox = `z-10 right-16 bottom-[5.75rem] left-3 h-48 rounded-2xl shadow-2xl ring-2 ring-white/40 sm:left-auto ${GROW_MOTION} ${mapSize.boxClass}`;
  }

  return (
    <main className="relative isolate h-dvh overflow-hidden bg-[#01275e] text-white">
      {/* ---------- Loading / error before the game exists ---------- */}
      {!game && (
        <CenterScreen>
          {error ? (
            <div className={`${GLASS} flex max-w-sm flex-col items-center gap-4 p-6 text-center`} role="alert">
              <p className="text-lg font-semibold">Couldn&apos;t start a game</p>
              <p className="text-white/75">{error}</p>
              <div className="flex gap-3">
                <button type="button" onClick={startGame} disabled={busy} className={PRIMARY_BUTTON}>
                  <RotateCcw aria-hidden="true" className="size-4" /> Try again
                </button>
                <Link href="/" className={SECONDARY_BUTTON}>
                  <House aria-hidden="true" className="size-4" /> Home
                </Link>
              </div>
            </div>
          ) : (
            <p className={`${GLASS} flex items-center gap-3 px-6 py-4 text-lg`} aria-live="polite">
              <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-amber-300" />
              Finding a place somewhere on Earth…
            </p>
          )}
        </CenterScreen>
      )}

      {/* ---------- Full-screen Street View ----------
          Mounted ONCE per visit and only moved between rounds AND between games ("Play again"),
          because Google counts every panorama created. It stays mounted (hidden) during results,
          the summary and while the next game loads, so a whole visit costs one Street View load. */}
      {panoramaSpot && (
        <div className={`absolute inset-0 ${game?.currentPanorama && !result ? "" : "invisible"}`}>
          <StreetViewPanorama
            location={panoramaSpot}
            paused={!game?.currentPanorama || result !== null}
            className="h-full w-full"
          />
        </div>
      )}

      {/* ---------- The ONE Google map (guess / result / summary) ----------
          Created once per visit and only moved and resized, because Google counts every map created.
          While guessing it opens (towards the left) when hovered or focused, to the size the player chose. */}
      <section
        aria-label={mapView.mode === "guess" ? "Guess map: click to place your pin" : "Map"}
        className={`absolute overflow-hidden ${mapBox}`}
        ref={mapBoxRef}
      >
        <GoogleGameMap view={mapView} />
        {mapView.mode === "guess" && <GuessMapControls size={mapSize} />}
      </section>

      {/* ---------- Guessing: the Guess button under the map (same width, grows with it) ---------- */}
      {mapView.mode === "guess" && (
        <div
          ref={guessButtonRef}
          className={`absolute right-16 bottom-10 left-3 z-10 sm:left-auto ${GROW_MOTION} ${mapSize.widthClass}`}
        >
          <button type="button" onClick={submitGuess} disabled={!guess || busy} className={`${PRIMARY_BUTTON} w-full`}>
            <MapPin aria-hidden="true" className="size-5" />
            {busy ? "Checking…" : guess ? "Guess" : "Place your pin on the map"}
          </button>
        </div>
      )}
      {mapView.mode === "guess" && error && (
        <p
          role="alert"
          className={`${GLASS} absolute top-20 left-1/2 z-[550] -translate-x-1/2 px-4 py-2 text-sm text-red-200`}
        >
          {error}
        </p>
      )}

      {/* ---------- Result of the round: card over the full-screen map ---------- */}
      {result && result.guess && result.answer && (
        <>
          <section
            aria-live="polite"
            className={`${GLASS} absolute bottom-8 left-1/2 z-[500] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 flex-col items-center gap-3 p-5 text-center`}
          >
            <p className="text-sm tracking-[0.2em] text-white/70 uppercase">It was</p>
            <p className="text-3xl font-extrabold">{result.country}</p>
            <p className="text-white/85">
              Your guess was{" "}
              <strong className="text-white">
                {Math.round(result.distanceKm ?? 0).toLocaleString()} km
              </strong>{" "}
              away
            </p>
            <p className="text-4xl font-extrabold text-amber-300">
              +{result.score?.toLocaleString()} <span className="text-lg text-white/80">points</span>
            </p>
            <button type="button" onClick={nextRound} className={`${PRIMARY_BUTTON} w-full`}>
              {isFinished ? "See final score" : "Next round"}
            </button>
          </section>
        </>
      )}

      {/* ---------- Final summary ---------- */}
      {isFinished && !result && game && (
        <GameSummary
          game={game}
          onPlayAgain={startGame}
          busy={busy}
          focusedRound={focusedRound}
          onFocusRound={setFocusedRound}
        />
      )}

      {/* ---------- Top bar (always on top): back + logo on the left, round and score on the right ----------
          The corners are free: Google's address panel is turned off and so is its fullscreen button.
          Google's remaining controls (zoom, compass) and its logo/credits sit lower down, never covered. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <ExitGameButton inProgress={game !== null && !isFinished} />
          <div className={`${GLASS} hidden px-3 py-2 sm:block`}>
            <Image src={logo} alt="WhereOnEarth" className="h-7 w-auto" />
          </div>
          <MapSwitcher current={map} countryMaps={countryMaps} inProgress={game !== null && !isFinished} />
        </div>
        {game && (
          <p
            className={`${GLASS} pointer-events-auto flex items-center gap-3 px-4 py-2.5 text-sm font-semibold sm:text-base`}
            aria-live="polite"
          >
            <span>{roundLabel}</span>
            <span aria-hidden="true" className="h-4 w-px bg-white/30" />
            <span>
              Score <span className="text-amber-300">{game.totalScore.toLocaleString()}</span>
            </span>
          </p>
        )}
      </header>
    </main>
  );
}
