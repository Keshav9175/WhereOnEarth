"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

const ROUND_BUTTON =
  "pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-2xl border border-white/15 bg-slate-950/60 text-white shadow-xl backdrop-blur-md hover:bg-slate-900/80 focus-visible:outline-2 focus-visible:outline-amber-300";

type ExitGameButtonProps = {
  // While a game is being played, leaving asks for confirmation (an accidental click mustn't lose it).
  inProgress: boolean;
};

// The "back" button in the game's top-left corner.
export function ExitGameButton({ inProgress }: ExitGameButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const stayRef = useRef<HTMLButtonElement>(null);

  // When the question appears, put keyboard focus on "Stay" (the safe choice); Esc closes it.
  useEffect(() => {
    if (!confirming) return;
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setConfirming(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  if (!inProgress) {
    return (
      <Link href="/" aria-label="Back to home" className={ROUND_BUTTON}>
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Leave the game"
        aria-expanded={confirming}
        onClick={() => setConfirming((open) => !open)}
        className={ROUND_BUTTON}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>

      {confirming && (
        <div
          role="alertdialog"
          aria-label="Leave this game?"
          className="pointer-events-auto absolute top-full left-0 mt-2 flex w-64 flex-col gap-3 rounded-2xl border border-white/15 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-md"
        >
          <p className="font-semibold">Leave this game?</p>
          <p className="text-sm text-white/70">This game won&apos;t be finished or count for the leaderboard.</p>
          <div className="flex gap-2">
            <button
              ref={stayRef}
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 cursor-pointer rounded-xl bg-amber-400 px-3 py-2 font-bold text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Stay
            </button>
            <Link
              href="/"
              className="flex-1 rounded-xl px-3 py-2 text-center font-semibold text-white ring-1 ring-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              Leave
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
