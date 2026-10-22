"use client";

import Link from "next/link";
import { Crosshair, House, Maximize2, RotateCcw, Ruler, Star } from "lucide-react";
import { rateGame } from "@/lib/game/rating";
import { MAX_SCORE } from "@/lib/game/scoring";
import type { PublicGame } from "@/server/services/publicGame";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./gameStyles";

type GameSummaryProps = {
  game: PublicGame;
  onPlayAgain: () => void;
  busy: boolean;
  // The round shown on the map (null = all rounds). The map itself is PlayGame's shared Google map.
  focusedRound: number | null;
  onFocusRound: (round: number | null) => void;
};

const km = (value: number | null) => `${Math.round(value ?? 0).toLocaleString()} km`;

// End of the game: the results panel (left on wide screens, bottom on phones). PlayGame places the
// shared Google map next to it. Clicking a round flies the map to it; "Show all" zooms back out.
export function GameSummary({ game, onPlayAgain, busy, focusedRound, onFocusRound }: GameSummaryProps) {
  const maxTotal = MAX_SCORE * game.totalRounds;
  const rating = rateGame(game.totalScore, maxTotal);
  const best = game.rounds.reduce((top, round) => ((round.score ?? 0) > (top.score ?? 0) ? round : top));
  const averageKm = game.rounds.reduce((sum, round) => sum + (round.distanceKm ?? 0), 0) / game.rounds.length;

  return (
    <>
      {/* ---------- Results panel (the map is beside it, placed by PlayGame) ---------- */}
      <section
        aria-label="Game results"
        className="absolute inset-x-0 bottom-0 z-20 flex h-[56%] flex-col gap-5 overflow-y-auto border-white/10 bg-gradient-to-b from-[#062a5f] to-[#020f2b] p-5 shadow-2xl lg:inset-y-0 lg:right-auto lg:h-full lg:w-[27rem] lg:border-r lg:pt-24"
      >
        {/* Headline: rating title, score and how close to perfect */}
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300/90 uppercase">Game complete</p>
          <h2 className="mt-1 text-3xl font-extrabold">{rating.title}</h2>
          <p className="mt-1 text-sm text-white/65">{rating.line}</p>
          <p className="mt-4 text-5xl font-extrabold text-amber-300 tabular-nums">{game.totalScore.toLocaleString()}</p>
          <p className="text-sm text-white/60">
            of {maxTotal.toLocaleString()} points · {rating.percent}%
          </p>
          <div aria-hidden="true" className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${rating.percent}%` }} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-white/5 p-3">
            <dt className="flex items-center gap-1.5 text-white/60">
              <Star aria-hidden="true" className="size-4 text-amber-300" /> Best round
            </dt>
            <dd className="mt-0.5 font-bold">
              #{best.roundNumber} · {(best.score ?? 0).toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <dt className="flex items-center gap-1.5 text-white/60">
              <Ruler aria-hidden="true" className="size-4 text-sky-300" /> Average miss
            </dt>
            <dd className="mt-0.5 font-bold">{km(averageKm)}</dd>
          </div>
        </dl>

        <div className="flex gap-3">
          <button type="button" onClick={onPlayAgain} disabled={busy} className={`${PRIMARY_BUTTON} flex-1`}>
            <RotateCcw aria-hidden="true" className="size-4" /> Play again
          </button>
          <Link href="/" className={SECONDARY_BUTTON}>
            <House aria-hidden="true" className="size-4" /> Home
          </Link>
        </div>

        {/* Round by round. Each row is a button that shows that round on the map. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Rounds</h3>
            {focusedRound !== null && (
              <button
                type="button"
                onClick={() => onFocusRound(null)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-sky-300 ring-1 ring-sky-300/50 hover:bg-sky-300/10 focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <Maximize2 aria-hidden="true" className="size-3.5" /> Show all rounds
              </button>
            )}
          </div>
          <ol className="flex flex-col gap-2">
            {game.rounds.map((round) => {
              const score = round.score ?? 0;
              const focused = focusedRound === round.roundNumber;
              return (
                <li key={round.roundNumber}>
                  <button
                    type="button"
                    aria-pressed={focused}
                    onClick={() => onFocusRound(focused ? null : round.roundNumber)}
                    className={`group w-full cursor-pointer rounded-xl p-3 text-left transition focus-visible:outline-2 focus-visible:outline-amber-300 ${
                      focused ? "bg-white/15 ring-2 ring-amber-300" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-green-600 text-sm font-bold">
                        {round.roundNumber}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{round.country}</span>
                        <span className="block text-xs text-white/60">{km(round.distanceKm)} away</span>
                      </span>
                      <span className="text-right tabular-nums">
                        <strong className="block text-amber-300">{score.toLocaleString()}</strong>
                        <span className="text-xs text-white/50">/ {MAX_SCORE.toLocaleString()}</span>
                      </span>
                      <Crosshair
                        aria-hidden="true"
                        className={`size-4 shrink-0 ${focused ? "text-amber-300" : "text-white/40 group-hover:text-white/80"}`}
                      />
                    </span>
                    <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
                    </span>
                    <span className="sr-only">{focused ? "Shown on the map" : "Show this round on the map"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="flex items-center justify-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-blue-600 ring-2 ring-white" /> Your guess
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-green-600 ring-2 ring-white" /> Real location
          </span>
        </p>
      </section>
    </>
  );
}
