"use client";

import { useState } from "react";
import { Check, Clock, Copy, Crown, Link2, Lock, LogOut, Play, Unlock, UserX, WifiOff } from "lucide-react";
import { ERROR_TEXT } from "@/components/formStyles";
import { GLASS_PANEL } from "@/components/PageShell";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { MAPS } from "@/lib/maps/catalog";
import {
  MAX_PARTY_PLAYERS,
  ROUND_COUNT_CHOICES,
  ROUND_TIME_CHOICES,
  type ClientMessage,
  type PartySettings,
  type PartyView,
} from "@/lib/party/protocol";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "../play/gameStyles";

const MAP_OPTIONS = MAPS.map((map) => ({ value: map.id, label: map.name, hint: map.description }));
const ROUND_SEGMENTS = ROUND_COUNT_CHOICES.map((rounds) => ({ value: rounds, label: String(rounds) }));
const TIME_SEGMENTS = ROUND_TIME_CHOICES.map((seconds) => ({
  value: seconds,
  label: seconds === 0 ? "∞" : seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`,
  title: seconds === 0 ? "No time limit" : `${seconds} seconds per round`,
}));

// "5 rounds · 60 s each · about 6 min" — so everyone knows what they're signing up for.
function summary({ rounds, roundSeconds }: PartySettings) {
  if (roundSeconds === 0) return `${rounds} rounds · no time limit`;
  // Each round = guessing time + a few seconds looking at the results.
  const minutes = Math.max(1, Math.round((rounds * (roundSeconds + 5)) / 60));
  return `${rounds} rounds · ${roundSeconds} s each · about ${minutes} min`;
}

type PartyLobbyProps = {
  view: PartyView;
  send: (message: ClientMessage) => void;
  onLeave: () => void;
  error: string | null;
};

// The waiting room: the code to share, who's in, and the game settings. The host changes the settings
// (map, number of rounds, time per round, lock); everyone else sees them update live.
export function PartyLobby({ view, send, onLeave, error }: PartyLobbyProps) {
  const isHost = view.you === view.hostId;
  const host = view.players.find((player) => player.id === view.hostId);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(what: "code" | "link") {
    const text = what === "code" ? view.code : `${window.location.origin}/party?code=${view.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked (e.g. not https): the code is on screen to type instead.
    }
  }

  // The server checks the values and sends everyone the new settings.
  const changeSettings = (changes: Partial<Pick<PartySettings, "mapId" | "rounds" | "roundSeconds">>) =>
    send({
      type: "settings",
      mapId: changes.mapId ?? view.settings.mapId,
      rounds: (changes.rounds ?? view.settings.rounds) as (typeof ROUND_COUNT_CHOICES)[number],
      roundSeconds: (changes.roundSeconds ?? view.settings.roundSeconds) as (typeof ROUND_TIME_CHOICES)[number],
    });

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <section className={`flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8 ${GLASS_PANEL}`}>
        {/* Code to share */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300/90 uppercase">Party code</p>
          <p className="font-mono text-5xl font-extrabold tracking-[0.2em] tabular-nums">
            {view.code.slice(0, 3)} {view.code.slice(3)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => copy("code")} className={SECONDARY_BUTTON}>
              {copied === "code" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              {copied === "code" ? "Copied!" : "Copy code"}
            </button>
            <button type="button" onClick={() => copy("link")} className={SECONDARY_BUTTON}>
              {copied === "link" ? <Check aria-hidden="true" className="size-4" /> : <Link2 aria-hidden="true" className="size-4" />}
              {copied === "link" ? "Copied!" : "Copy invite link"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1.15fr]">
          {/* Players */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">
              Players {view.players.length}/{MAX_PARTY_PLAYERS}
            </h2>
            <ul className="flex max-h-[22rem] flex-col gap-1.5 overflow-y-auto pr-1">
              {view.players.map((player) => (
                <li
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 ${player.connected ? "" : "opacity-50"}`}
                >
                  <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: player.color }} />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {player.name}
                    {player.id === view.you && <span className="font-normal text-white/55"> (you)</span>}
                  </span>
                  {player.id === view.hostId && <Crown aria-label="Host" className="size-4 text-amber-300" />}
                  {!player.connected && <WifiOff aria-label="Reconnecting" className="size-4 text-white/60" />}
                  {isHost && player.id !== view.you && (
                    <button
                      type="button"
                      onClick={() => send({ type: "kick", playerId: player.id })}
                      aria-label={`Remove ${player.name}`}
                      title="Remove from party"
                      className="grid size-7 cursor-pointer place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-rose-300"
                    >
                      <UserX aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </li>
              ))}
              {view.players.length === 1 && (
                <li className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-center text-sm text-white/55">
                  Share the code — friends appear here as they join.
                </li>
              )}
            </ul>
          </div>

          {/* Settings: the host changes them, everyone sees them */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Game settings</h2>
              {!isHost && <span className="text-xs text-white/50">Set by the host</span>}
            </div>

            <Select
              label="Map"
              value={view.settings.mapId}
              options={MAP_OPTIONS}
              onChange={(mapId) => changeSettings({ mapId })}
              disabled={!isHost}
            />
            <SegmentedControl
              label="Rounds"
              value={view.settings.rounds}
              segments={ROUND_SEGMENTS}
              onChange={(rounds) => changeSettings({ rounds })}
              disabled={!isHost}
            />
            <SegmentedControl
              label="Time to guess"
              value={view.settings.roundSeconds}
              segments={TIME_SEGMENTS}
              onChange={(roundSeconds) => changeSettings({ roundSeconds })}
              disabled={!isHost}
            />

            <p className="flex items-center gap-2 text-xs text-white/60">
              <Clock aria-hidden="true" className="size-3.5" />
              {summary(view.settings)}
            </p>

            {isHost && (
              <button
                type="button"
                role="switch"
                aria-checked={view.locked}
                onClick={() => send({ type: "lock", locked: !view.locked })}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${view.locked ? "bg-sky-500" : "bg-white/20"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${view.locked ? "translate-x-5" : ""}`}
                  />
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  {view.locked ? <Lock aria-hidden="true" className="size-4" /> : <Unlock aria-hidden="true" className="size-4" />}
                  {view.locked ? "Locked — nobody new can join" : "Lock party"}
                </span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className={ERROR_TEXT} role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={onLeave} className={SECONDARY_BUTTON}>
            <LogOut aria-hidden="true" className="size-4" /> Leave
          </button>
          {isHost ? (
            <button type="button" onClick={() => send({ type: "start" })} className={`${PRIMARY_BUTTON} flex-1`}>
              <Play aria-hidden="true" className="size-4" /> Start game
            </button>
          ) : (
            <p className="flex flex-1 items-center justify-center rounded-xl bg-white/5 px-4 py-2.5 text-white/75" aria-live="polite">
              Waiting for {host?.name ?? "the host"} to start…
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
