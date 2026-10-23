"use client";

import Link from "next/link";
import { House, RotateCcw } from "lucide-react";
import { rateGame } from "@/lib/game/rating";
import { MAX_SCORE } from "@/lib/game/scoring";
import type { PublicGame } from "@/server/services/publicGame";
import { PRIMARY_BUTTON } from "./gameStyles";

type GameSummaryProps = {
  game: PublicGame;
  onPlayAgain: () => void;
  busy: boolean;
  // The round shown on the map (null = all rounds). The map itself is PlayGame's shared Google map.
  focusedRound: number | null;
  onFocusRound: (round: number | null) => void;
};

const km = (value: number | null) =>
  `${Math.round(value ?? 0).toLocaleString()} km`;

// A plain outline button: white focus ring so nothing on this panel uses the yellow accent.
const QUIET_BUTTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white ring-1 ring-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// End of the game: the results panel (left on wide screens, bottom on phones). PlayGame places the
// shared Google map next to it. Clicking a round flies the map to it; clicking it again shows all rounds.
// Styled like a printed scorecard — type, thin rules and one accent colour — rather than stacked cards.
export function GameSummary({
  game,
  onPlayAgain,
  busy,
  focusedRound,
  onFocusRound,
}: GameSummaryProps) {
  const maxTotal = MAX_SCORE * game.totalRounds;
  const rating = rateGame(game.totalScore, maxTotal);
  const best = game.rounds.reduce((top, round) =>
    (round.score ?? 0) > (top.score ?? 0) ? round : top,
  );
  const averageKm =
    game.rounds.reduce((sum, round) => sum + (round.distanceKm ?? 0), 0) /
    game.rounds.length;

  const stats = [
    {
      label: "Best round",
      value: `#${best.roundNumber} · ${(best.score ?? 0).toLocaleString()}`,
    },
    { label: "Average miss", value: km(averageKm) },
    { label: "Accuracy", value: `${rating.percent}%` },
  ];

  return (
    <section
      aria-label="Game results"
      className="absolute inset-x-0 bottom-0 z-20 flex h-[56%] flex-col gap-6 overflow-y-auto border-white/10 bg-[#061a3d] px-6 pt-6 pb-8 shadow-2xl lg:inset-y-0 lg:right-auto lg:h-full lg:w-[27rem] lg:border-r lg:pt-24"
    >
      {/* Headline: the score first, then what it means */}
      <header>
        <p className="text-sm text-white/55">Final score</p>
        <p className="mt-1 flex items-baseline gap-2 tabular-nums">
          <span className="text-6xl leading-none font-extrabold tracking-tight">
            {game.totalScore.toLocaleString()}
          </span>
          <span className="text-lg font-semibold text-white/40">
            / {maxTotal.toLocaleString()}
          </span>
        </p>
        <p className="mt-4 text-white/70">
          <strong className="font-bold text-white">{rating.title}.</strong>{" "}
          {rating.line}
        </p>
      </header>

      <dl className="grid grid-cols-3 border-y border-white/10 py-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={index > 0 ? "border-l border-white/10 pl-3" : ""}
          >
            <dt className="text-xs text-white/50">{stat.label}</dt>
            <dd className="mt-0.5 font-bold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={busy}
          className={`${PRIMARY_BUTTON} flex-1`}
        >
          <RotateCcw aria-hidden="true" className="size-4" /> Play again
        </button>
        <Link href="/" className={QUIET_BUTTON}>
          <House aria-hidden="true" className="size-4" /> Home
        </Link>
      </div>

      {/* Round by round. Each row is a button that shows that round on the map. */}
      <div>
        <div className="flex items-baseline justify-between pb-2">
          <h3 className="font-bold">Rounds</h3>
          <p className="text-xs text-white/45">
            {focusedRound === null ? (
              "Tap a round to see it on the map"
            ) : (
              <button
                type="button"
                onClick={() => onFocusRound(null)}
                className="cursor-pointer text-sky-300 underline-offset-2 hover:underline"
              >
                Show all rounds
              </button>
            )}
          </p>
        </div>
        <ol className="border-t border-white/10">
          {game.rounds.map((round) => {
            const score = round.score ?? 0;
            const focused = focusedRound === round.roundNumber;
            return (
              <li key={round.roundNumber} className="border-b border-white/10">
                <button
                  type="button"
                  aria-pressed={focused}
                  onClick={() =>
                    onFocusRound(focused ? null : round.roundNumber)
                  }
                  className={`grid w-full cursor-pointer grid-cols-[1.75rem_1fr_auto] items-baseline gap-x-2 px-2 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${
                    focused ? "bg-sky-400/10" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`text-sm tabular-nums ${focused ? "font-bold text-sky-300" : "text-white/40"}`}
                  >
                    {String(round.roundNumber).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {round.country}
                    </span>
                    <span className="block text-sm text-white/50">
                      {km(round.distanceKm)} off
                    </span>
                  </span>
                  <span className="text-right font-bold tabular-nums">
                    {score.toLocaleString()}
                  </span>
                  <span
                    aria-hidden="true"
                    className="col-start-2 col-end-4 mt-2 block h-px bg-white/10"
                  >
                    <span
                      className="block h-px bg-sky-400"
                      style={{ width: `${(score / MAX_SCORE) * 100}%` }}
                    />
                  </span>
                  <span className="sr-only">
                    {focused
                      ? "Shown on the map"
                      : "Show this round on the map"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="flex items-center gap-5 text-xs text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-600 ring-2 ring-white" />{" "}
          Your guess
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-600 ring-2 ring-white" />{" "}
          Real location
        </span>
      </p>
    </section>
  );
}
