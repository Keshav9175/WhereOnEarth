"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, X } from "lucide-react";
import { MAX_SCORE } from "@/lib/game/scoring";
import type { PartyPlayer, PartyView } from "@/lib/party/protocol";
import { GLASS } from "../play/gameStyles";

// How many players the compact standings list shows before "+N more".
const STANDINGS_PREVIEW = 3;

const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
};

// A player's total as a bar that fills towards the best possible score (e.g. 25,000 for 5 rounds).
function ScoreCard({ player, maxTotal, align, label, rank }: { player: PartyPlayer; maxTotal: number; align: "left" | "right"; label: string; rank?: string }) {
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
        {rank && <span className="text-amber-300">{rank}</span>}
        {player.guessed && <Check aria-label="Guessed" className="size-4 text-emerald-300" />}
      </p>
    </div>
  );
}

// 3+ players: the top 3 (plus you, if you're lower down), with "+N more" to see everyone.
function Standings({ view, standings }: { view: PartyView; standings: PartyPlayer[] }) {
  const [showAll, setShowAll] = useState(false);
  const yourIndex = standings.findIndex((player) => player.id === view.you);
  const preview = standings.slice(0, STANDINGS_PREVIEW);
  if (yourIndex >= STANDINGS_PREVIEW) preview.push(standings[yourIndex]);
  const shown = showAll ? standings : preview;
  const hidden = standings.length - preview.length;

  return (
    <div className={`${GLASS} w-56 p-2 sm:w-64`}>
      <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-white/60 uppercase">Standings</p>
      <ol className="flex flex-col gap-0.5">
        {shown.map((player) => {
          const place = standings.indexOf(player) + 1;
          return (
            <li
              key={player.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${player.id === view.you ? "bg-white/10" : ""} ${player.connected ? "" : "opacity-50"}`}
            >
              <span className="w-4 text-right text-xs font-bold text-white/55 tabular-nums">{place}</span>
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: player.color }} />
              <span className="min-w-0 flex-1 truncate font-semibold">{player.id === view.you ? "You" : player.name}</span>
              {player.id === view.hostId && <Crown aria-label="Host" className="size-3 shrink-0 text-amber-300" />}
              {player.guessed ? (
                <Check aria-label="Guessed" className="size-3.5 shrink-0 text-emerald-300" />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <span className="text-xs font-bold text-amber-300 tabular-nums">{player.score.toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((open) => !open)}
          aria-expanded={showAll}
          className="mt-1 w-full cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-sky-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          {showAll ? "Show less" : `+${hidden} more`}
        </button>
      )}
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
  onLeave: () => void;
};

// The top of the screen while a round is being played (like WorldGuessr duels):
// - 2 players: your score bar on the left, your opponent's on the right;
// - 3+ players: your bar and place on the left, compact live standings on the right;
// - always: round number and a big countdown in the middle.
export function PartyHud({ view, secondsLeft, onLeave }: PartyHudProps) {
  const maxTotal = MAX_SCORE * view.totalRounds;
  const standings = [...view.players].sort((a, b) => b.score - a.score);
  const me = view.players.find((player) => player.id === view.you);
  const opponents = view.players.filter((player) => player.id !== view.you);
  const duel = view.players.length === 2;
  const myPlace = standings.findIndex((player) => player.id === view.you) + 1;
  const urgent = secondsLeft !== null && secondsLeft <= 10;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[600] grid grid-cols-[1fr_auto_1fr] items-start gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto flex items-start gap-2">
        <LeaveButton onLeave={onLeave} />
        {me && (
          <div className="hidden sm:block">
            <ScoreCard
              player={me}
              maxTotal={maxTotal}
              align="left"
              label="You"
              rank={duel || view.players.length === 1 ? undefined : `${ordinal(myPlace)} of ${view.players.length}`}
            />
          </div>
        )}
      </div>

      {/* Round + countdown */}
      <div
        className={`pointer-events-auto flex min-w-28 flex-col items-center rounded-2xl border px-5 py-2 shadow-xl backdrop-blur-md transition-colors ${
          urgent ? "border-rose-300/50 bg-rose-700/80" : "border-white/15 bg-emerald-800/80"
        }`}
        aria-live="off"
      >
        <span className="text-xs font-semibold tracking-wide text-white/80">
          Round {view.roundNumber} / {view.totalRounds}
        </span>
        <span className="text-3xl font-extrabold tabular-nums">{secondsLeft === null ? "∞" : `${secondsLeft}s`}</span>
      </div>

      <div className="pointer-events-auto flex justify-end">
        {duel && opponents[0] ? (
          <div className="hidden sm:block">
            <ScoreCard player={opponents[0]} maxTotal={maxTotal} align="right" label={opponents[0].name} />
          </div>
        ) : view.players.length > 2 ? (
          <div className="hidden sm:block">
            <Standings view={view} standings={standings} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
