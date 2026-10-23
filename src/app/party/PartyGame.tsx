"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LogOut, MapPin, Timer, Trophy } from "lucide-react";
import { GoogleGameMap, type GameMapView, type PartyMapRound } from "@/components/GoogleGameMap";
import { StreetViewPanorama } from "@/components/StreetViewPanorama";
import { MAX_SCORE } from "@/lib/game/scoring";
import type { ClientMessage, PartyView } from "@/lib/party/protocol";
import type { Coordinates } from "@/types/geo";
import { GLASS, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../play/gameStyles";
import { GuessMapControls } from "../play/GuessMapControls";
import { useGuessMapExpansion } from "../play/useGuessMapExpansion";
import { useGuessMapSize } from "../play/useGuessMapSize";
import { LAST_GUESSER_SECONDS, RESULTS_SECONDS } from "@/lib/party/room";
import { PartyHud } from "./PartyHud";

const GROW_MOTION = "transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
const km = (value: number) => `${Math.round(value).toLocaleString()} km`;

// Seconds left in the round, using the SERVER's clock (clockOffset = server time − this computer's time),
// so every player sees the same countdown.
// (`undefined` too: an older party server doesn't send every time — never show "NaN".)
function useSecondsLeft(endsAt: number | null | undefined, clockOffset: number) {
  const known = typeof endsAt === "number" && Number.isFinite(endsAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!known) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [known, endsAt]);
  if (!known) return null;
  return Math.max(0, Math.ceil((endsAt - (now + clockOffset)) / 1000));
}

const NOTICE_MS = 4000;

// Pops in, stays NOTICE_MS, then fades out. The message is fixed when it appears (e.g. "20 seconds left").
function HurryNotice({ message }: { message: string }) {
  const [text] = useState(message);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <p
      role="alert"
      className={`pointer-events-none absolute top-28 left-1/2 z-[550] flex -translate-x-1/2 items-center gap-2 rounded-full border border-rose-200/40 bg-rose-600/95 px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-2xl shadow-rose-950/60 transition-[opacity,transform] duration-500 sm:text-base ${
        visible ? "opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <Timer aria-hidden="true" className="size-5" />
      {text}
    </p>
  );
}

type PartyGameProps = {
  view: PartyView;
  send: (message: ClientMessage) => void;
  onLeave: () => void;
  clockOffset: number;
  error: string | null;
};

// The party game: rounds (Street View + guess map), round results (everyone's pins) and the final standings.
// Like single player, the panorama and the Google map are created ONCE and only moved (Google counts every
// one created), so a whole party game costs each player 1 Street View + 1 map load.
export function PartyGame({ view, send, onLeave, clockOffset, error }: PartyGameProps) {
  const isHost = view.you === view.hostId;
  const players = new Map(view.players.map((player) => [player.id, player]));
  const [draft, setDraft] = useState<Coordinates | null>(null);
  // Where Street View points. Kept between rounds so the panorama stays mounted.
  const [panoramaSpot, setPanoramaSpot] = useState<Coordinates | null>(view.panorama);
  if (view.panorama && (view.panorama.lat !== panoramaSpot?.lat || view.panorama.lng !== panoramaSpot?.lng)) {
    setPanoramaSpot(view.panorama);
  }
  // A new round starts with an empty guess.
  const [draftRound, setDraftRound] = useState(view.roundNumber);
  if (draftRound !== view.roundNumber) {
    setDraftRound(view.roundNumber);
    setDraft(null);
  }

  const guessing = view.phase === "round" && view.yourGuess === null;
  const mapBoxRef = useRef<HTMLElement>(null);
  const guessButtonRef = useRef<HTMLDivElement>(null);
  const mapHovered = useGuessMapExpansion(guessing, mapBoxRef, guessButtonRef);
  const mapSize = useGuessMapSize(mapHovered);
  const secondsLeft = useSecondsLeft(view.endsAt, clockOffset);
  const nextIn = useSecondsLeft(view.nextAt, clockOffset);

  const toMapRound = (round: PartyView["history"][number]): PartyMapRound => ({
    roundNumber: round.roundNumber,
    answer: round.answer,
    guesses: round.guesses.map((guess) => ({
      lat: guess.lat,
      lng: guess.lng,
      playerId: guess.playerId,
      name: players.get(guess.playerId)?.name ?? "?",
      color: players.get(guess.playerId)?.color ?? "#64748b",
    })),
  });

  // Every click moves the pin AND tells the server: if time runs out before the player presses Guess,
  // the server counts this last pin as their guess (like WorldGuessr). Pressing Guess locks it.
  function movePin(point: Coordinates) {
    setDraft(point);
    send({ type: "pin", lat: point.lat, lng: point.lng });
  }

  // What the ONE map shows, and where its box sits.
  let mapView: GameMapView;
  let mapBox: string;
  if (view.phase === "round") {
    mapView = { mode: "guess", guess: view.yourGuess ?? draft, onGuessChange: guessing ? movePin : () => {} };
    mapBox = `z-10 right-16 bottom-[5.75rem] left-3 h-48 rounded-2xl shadow-2xl ring-2 ring-white/40 sm:left-auto ${GROW_MOTION} ${mapSize.boxClass}`;
  } else {
    const rounds = view.phase === "final" ? view.history.map(toMapRound) : view.result ? [toMapRound({ roundNumber: view.roundNumber, ...view.result })] : [];
    mapView = { mode: "party", rounds };
    // Round results: the whole screen is map (like WorldGuessr). Final standings: map beside the panel.
    mapBox = view.phase === "final" ? "inset-x-0 top-0 h-[45%] lg:right-[24rem] lg:h-full" : "inset-0";
  }

  const waitingFor = view.players.filter((player) => player.connected && !player.guessed).length;
  const standings = [...view.players].sort((a, b) => b.score - a.score);
  const roundRanking = [...(view.result?.guesses ?? [])].sort((a, b) => b.score - a.score);
  const roundBest = roundRanking[0];
  const myRoundGuess = view.result?.guesses.find((guess) => guess.playerId === view.you);

  return (
    <main className="relative isolate h-dvh overflow-hidden bg-[#01275e] text-white">
      {panoramaSpot && (
        <div className={`absolute inset-0 ${view.phase === "round" ? "" : "invisible"}`}>
          <StreetViewPanorama
            location={panoramaSpot}
            paused={view.phase !== "round"}
            movement={view.settings.movement}
            roadNames={view.settings.roadNames}
            className="h-full w-full"
          />
        </div>
      )}

      <section ref={mapBoxRef} aria-label={view.phase === "round" ? "Guess map: click to place your pin" : "Map"} className={`absolute overflow-hidden ${mapBox}`}>
        <GoogleGameMap view={mapView} />
        {view.phase === "round" && <GuessMapControls size={mapSize} />}
      </section>

      {/* ---------- Round: Guess button ---------- */}
      {view.phase === "round" && (
        <div ref={guessButtonRef} className={`absolute right-16 bottom-10 left-3 z-10 sm:left-auto ${GROW_MOTION} ${mapSize.widthClass}`}>
          {view.yourGuess ? (
            <p className={`${GLASS} flex items-center justify-center gap-2 px-4 py-2.5 font-semibold`} aria-live="polite">
              <Check aria-hidden="true" className="size-5 text-emerald-300" />
              Guessed! Waiting for {waitingFor} {waitingFor === 1 ? "player" : "players"}…
            </p>
          ) : (
            <button
              type="button"
              disabled={!draft}
              onClick={() => draft && send({ type: "guess", lat: draft.lat, lng: draft.lng })}
              className={`${PRIMARY_BUTTON} w-full`}
            >
              <MapPin aria-hidden="true" className="size-5" />
              {draft ? "Guess" : "Place your pin on the map"}
            </button>
          )}
        </div>
      )}

      {/* ---------- Final standings: side panel ---------- */}
      {view.phase === "final" && (
        <section
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 z-20 flex h-[55%] flex-col gap-4 overflow-y-auto border-white/10 bg-gradient-to-b from-[#062a5f] to-[#020f2b] p-5 shadow-2xl lg:inset-y-0 lg:left-auto lg:h-full lg:w-[24rem] lg:border-l lg:pt-24"
        >
          {view.phase === "final" && (
            <>
              <div className="text-center">
                <Trophy aria-hidden="true" className="mx-auto size-10 text-amber-300" />
                <p className="mt-1 text-xs font-semibold tracking-[0.25em] text-amber-300/90 uppercase">Final standings</p>
                <h2 className="mt-1 text-2xl font-extrabold">{standings[0]?.name} wins!</h2>
              </div>
              <ol className="flex flex-col gap-1.5">
                {standings.map((player, index) => (
                  <li
                    key={player.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${index === 0 ? "bg-amber-300/15 ring-1 ring-amber-300/50" : "bg-white/5"}`}
                  >
                    <span className="w-5 text-center font-bold text-white/70">{index + 1}</span>
                    <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: player.color }} />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {player.name}
                      {player.id === view.you && <span className="font-normal text-white/55"> (you)</span>}
                    </span>
                    <span className="text-right tabular-nums">
                      <strong className="block text-amber-300">{player.score.toLocaleString()}</strong>
                      <span className="text-xs text-white/50">/ {(MAX_SCORE * view.totalRounds).toLocaleString()}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {isHost ? (
                <button type="button" onClick={() => send({ type: "backToLobby" })} className={PRIMARY_BUTTON}>
                  Play again (back to lobby)
                </button>
              ) : (
                <p className="rounded-xl bg-white/5 px-4 py-2.5 text-center text-white/70">The host can start another game.</p>
              )}
            </>
          )}

          <button type="button" onClick={onLeave} className={SECONDARY_BUTTON}>
            <LogOut aria-hidden="true" className="size-4" /> Leave party
          </button>
        </section>
      )}

      {/* ---------- Round results: ONE small card on the full-screen map (like WorldGuessr) ---------- */}
      {view.phase === "results" && view.result && (
        <section
          aria-live="polite"
          className={`${GLASS} absolute bottom-6 left-1/2 z-[500] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 flex-col items-center gap-1.5 px-5 py-4 text-center`}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/90 uppercase">
            Round {view.roundNumber} of {view.totalRounds}
          </p>
          <h2 className="text-2xl font-extrabold">It was {view.result.country}</h2>
          <p className="text-white/85">
            {myRoundGuess ? (
              <>
                Your guess was <strong className="text-white">{km(myRoundGuess.distanceKm)}</strong> away ·{" "}
                <strong className="text-amber-300">+{myRoundGuess.score.toLocaleString()}</strong>
              </>
            ) : (
              <>
                You didn&apos;t guess · <strong className="text-amber-300">+0</strong>
              </>
            )}
          </p>
          {roundBest && roundBest.playerId !== view.you && (
            <p className="flex items-center gap-1.5 text-sm text-white/65">
              Best:
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: players.get(roundBest.playerId)?.color }} />
              <span className="font-semibold text-white">{players.get(roundBest.playerId)?.name ?? "?"}</span>· {km(roundBest.distanceKm)} · +
              {roundBest.score.toLocaleString()}
            </p>
          )}
          {/* Next round in a few seconds — a thin bar that empties. */}
          <div aria-hidden="true" className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, ((nextIn ?? 0) / RESULTS_SECONDS) * 100)}%` }}
            />
          </div>
        </section>
      )}

      {/* ---------- Top: the score HUD while playing and on the results; a small label on the final ---------- */}
      {view.phase === "round" ? (
        <PartyHud view={view} secondsLeft={secondsLeft} onLeave={onLeave} />
      ) : view.phase === "results" ? (
        <PartyHud
          view={view}
          secondsLeft={nextIn}
          centerLabel={view.roundNumber >= view.totalRounds ? "Final standings in" : "Next round in"}
          calm
          onLeave={onLeave}
        />
      ) : (
        <header className="pointer-events-none absolute top-0 left-0 z-[600] p-3 sm:p-4">
          <p className={`${GLASS} flex items-center gap-3 px-4 py-2.5 text-sm font-semibold sm:text-base`}>
            <span>
              Round {view.roundNumber} / {view.totalRounds}
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-white/30" />
            <span className="text-white/70">Party {view.code}</span>
          </p>
        </header>
      )}

      {/* The last player still guessing: everyone else is done, so the clock dropped to 20 s (like WorldGuessr).
          A short notice (4 s, once per round) — the round box keeps counting down after it fades. */}
      {view.phase === "round" && !view.yourGuess && waitingFor === 1 && view.players.length > 1 && (
        <HurryNotice
          key={view.roundNumber}
          message={`${
            view.players.length === 2
              ? `${view.players.find((player) => player.id !== view.you)?.name ?? "Your opponent"} guessed!`
              : "Everyone else has guessed —"
          } ${secondsLeft !== null ? `${Math.min(secondsLeft, LAST_GUESSER_SECONDS)} seconds left` : "hurry!"}`}
        />
      )}

      {error && (
        <p role="alert" className={`${GLASS} absolute top-20 left-1/2 z-[650] -translate-x-1/2 px-4 py-2 text-sm text-rose-200`}>
          {error}
        </p>
      )}
    </main>
  );
}
