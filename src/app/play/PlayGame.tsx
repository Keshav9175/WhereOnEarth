"use client";

import { useState } from "react";
import { GuessMapLoader } from "@/components/GuessMapLoader";
import { StreetViewPanorama } from "@/components/StreetViewPanorama";
import type { PublicGame, PublicRound } from "@/server/services/publicGame";
import type { Coordinates } from "@/types/geo";

// Tailwind class lists reused by several elements below.
const BUTTON =
  "cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-base text-primary-fg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-fg";
const CARD = "flex flex-col gap-3 rounded-xl border border-border bg-card p-4";

// Reads `{ error }` from a failed API response, with a fallback message.
async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

// The game screen: look around the panorama, click the map to guess, see the result, repeat.
export function PlayGame() {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  // The round just scored. While set, the screen shows the result instead of the next panorama.
  const [result, setResult] = useState<PublicRound | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startGame() {
    setBusy(true);
    setError(null);
    setResult(null);
    setGuess(null);
    try {
      const response = await fetch("/api/games", { method: "POST" });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setGame((await response.json()) as PublicGame);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

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
      setGame(data.game);
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

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">WhereOnEarth</h1>
        {game && (
          <p className="text-muted">
            {result
              ? `Round ${result.roundNumber} of ${game.totalRounds}`
              : game.currentRound
                ? `Round ${game.currentRound} of ${game.totalRounds}`
                : "Game over"}{" "}
            · Score {game.totalScore}
          </p>
        )}
      </header>

      {error && (
        <p className="text-error" role="alert">
          {error}
        </p>
      )}

      {!game && (
        <section className="flex max-w-prose flex-col items-start gap-4 leading-relaxed">
          <p>
            You will be dropped somewhere on Earth. Look around the Street View panorama for
            clues, then click the map where you think you are. Five rounds, up to 5,000 points each.
          </p>
          <button className={BUTTON} onClick={startGame} disabled={busy}>
            {busy ? "Starting…" : "Start a game"}
          </button>
        </section>
      )}

      {/* Guessing: panorama + map side by side (stacked on small screens). */}
      {game?.currentPanorama && !result && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="h-[min(60vh,600px)] min-h-80" aria-label="Street View">
            {/* `key` forces a fresh iframe for every round. */}
            <StreetViewPanorama key={game.currentRound} location={game.currentPanorama} />
          </section>
          <section className="flex flex-col gap-3" aria-label="Guess map">
            <div className="h-80 flex-1 lg:h-auto">
              <GuessMapLoader guess={guess} onGuessChange={setGuess} />
            </div>
            <button
              className={BUTTON}
              onClick={submitGuess}
              disabled={!guess || busy}
            >
              {busy ? "Checking…" : guess ? "Guess" : "Click the map to place a guess"}
            </button>
          </section>
        </div>
      )}

      {/* Result of the round just played: guess vs answer on the map. */}
      {result && result.guess && result.answer && (
        <section className={CARD} aria-live="polite">
          <div className="h-[min(55vh,520px)]">
            <GuessMapLoader guess={result.guess} answer={result.answer} />
          </div>
          <p className="text-lg">
            It was <strong>{result.country}</strong>. Your guess was{" "}
            <strong>{Math.round(result.distanceKm ?? 0).toLocaleString()} km</strong> away:{" "}
            <strong>{result.score?.toLocaleString()} points</strong>.
          </p>
          <button className={`${BUTTON} self-start`} onClick={nextRound}>
            {isFinished ? "See final score" : "Next round"}
          </button>
        </section>
      )}

      {isFinished && !result && game && (
        <section className={CARD}>
          <h2 className="text-2xl font-bold">Final score: {game.totalScore.toLocaleString()}</h2>
          <ol className="list-decimal space-y-1 pl-6">
            {game.rounds.map((round) => (
              <li key={round.roundNumber}>
                {round.country}: {Math.round(round.distanceKm ?? 0).toLocaleString()} km,{" "}
                {round.score?.toLocaleString()} points
              </li>
            ))}
          </ol>
          <button className={`${BUTTON} self-start`} onClick={startGame} disabled={busy}>
            Play again
          </button>
        </section>
      )}
    </main>
  );
}
