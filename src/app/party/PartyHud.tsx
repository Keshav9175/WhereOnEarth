"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, UserRound, X } from "lucide-react";
import { MAX_SCORE } from "@/lib/game/scoring";
import type { PartyPlayer, PartyView } from "@/lib/party/protocol";
import { GLASS } from "../play/gameStyles";

// A player's total as a bar that fills towards the best possible score (e.g. 25,000 for 5 rounds).
function ScoreCard({ player, maxTotal, align, label }: { player: PartyPlayer; maxTotal: number; align: "left" | "right"; label: string }) {
  const percent = Math.min(100, (player.score / maxTotal) * 100);
  return (
    <div className={`flex w-60 flex-col gap-1.5 sm:w-72 ${align === "right" ? "items-end" : "items-start"}`}>
      <div className="w-full rounded-2xl border border-white/15 bg-slate-950/75 p-1.5 shadow-xl backdrop-blur-md">
        <div className="relative h-8 overflow-hidden rounded-xl bg-white/10">
          <div
            className={`absolute inset-y-0 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-700 ease-out ${align === "right" ? "right-0" : "left-0"}`}
            style={{ width: `${percent}%` }}
          />
          <p className="relative grid h-full place-items-center text-sm font-extrabold tabular-nums drop-shadow">
            <span>
              {player.score.toLocaleString()}
              <span className="text-xs font-semibold text-white/75"> / {maxTotal.toLocaleString()}</span>
            </span>
          </p>
        </div>
      </div>
      <p className={`${GLASS} flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${player.connected ? "" : "opacity-60"}`}>
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: player.color }} />
        <span className="max-w-36 truncate">{label}</span>
        {player.guessed && <Check aria-label="Guessed" className="size-4 text-emerald-300" />}
      </p>
    </div>
  );
}

// "Leave the party": the first click asks, the second leaves (an accidental click mustn't drop you out).
function LeaveButton({ onLeave }: { onLeave: () => void }) {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const timer = window.setTimeout(() => setAsking(false), 3000);
    return () => window.clearTimeout(timer);
  }, [asking]);

  return asking ? (
    <div className={`${GLASS} flex items-center gap-1 rounded-full p-1 pl-3 text-sm`}>
      <span className="font-semibold">Leave party?</span>
      <button type="button" onClick={onLeave} className="cursor-pointer rounded-full bg-rose-500 px-3 py-1 font-bold hover:bg-rose-400">
        Leave
      </button>
      <button type="button" onClick={() => setAsking(false)} aria-label="Stay" className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-white/10">
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setAsking(true)}
      aria-label="Leave the party"
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-slate-950/70 shadow-xl backdrop-blur-md hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-amber-300"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </button>
  );
}

type PartyHudProps = {
  view: PartyView;
  secondsLeft: number | null; // null = no time limit
  // On the results: "Next round in" instead of "Round 2 / 5", and no red warning colour.
  centerLabel?: string;
  calm?: boolean;
  onLeave: () => void;
};

// The top of the screen during a round and its results (like WorldGuessr):
// - 2 players (a duel): your score bar on the left, your opponent's on the right, the clock in the middle;
// - otherwise: just the leave button and how many are playing on the left, the clock on the right.
//   Scores stay hidden until the final standings, so the screen stays clear with 3 or 100 players.
export function PartyHud({ view, secondsLeft, centerLabel, calm = false, onLeave }: PartyHudProps) {
  const me = view.players.find((player) => player.id === view.you);
  const opponent = view.players.find((player) => player.id !== view.you);
  const duel = view.players.length === 2 && me && opponent;
  const maxTotal = MAX_SCORE * view.totalRounds;
  const urgent = !calm && secondsLeft !== null && secondsLeft <= 10;

  const clock = (
    <div
      className={`mobile-party-clock pointer-events-auto flex min-w-28 flex-col items-center rounded-2xl border px-5 py-2 shadow-xl backdrop-blur-md transition-colors ${
        urgent ? "border-rose-300/50 bg-rose-700/80" : calm ? "border-white/15 bg-blue-800/80" : "border-white/15 bg-emerald-800/80"
      }`}
      aria-live="off"
    >
      <span className="text-xs font-semibold tracking-wide text-white/80">{centerLabel ?? `Round ${view.roundNumber} / ${view.totalRounds}`}</span>
      <span className="mobile-party-clock-value text-3xl font-extrabold tabular-nums">{secondsLeft === null ? "∞" : `${secondsLeft}s`}</span>
    </div>
  );

  if (duel) {
    return (
      <header className="mobile-party-hud pointer-events-none absolute inset-x-0 top-0 z-[600] grid grid-cols-[1fr_auto_1fr] items-start gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-start gap-2">
          <LeaveButton onLeave={onLeave} />
          <div className="hidden sm:block">
            <ScoreCard player={me} maxTotal={maxTotal} align="left" label="You" />
          </div>
        </div>
        {clock}
        <div className="pointer-events-auto flex justify-end">
          <div className="hidden sm:block">
            <ScoreCard player={opponent} maxTotal={maxTotal} align="right" label={opponent.name} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="mobile-party-hud pointer-events-none absolute inset-x-0 top-0 z-[600] flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto flex items-center gap-2">
        <LeaveButton onLeave={onLeave} />
        <p
          className={`${GLASS} flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-bold tabular-nums`}
          title={`${view.players.length} players`}
        >
          <UserRound aria-hidden="true" className="size-5" />
          {view.players.length}
          <span className="sr-only">players</span>
        </p>
      </div>
      {clock}
    </header>
  );
}
