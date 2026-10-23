"use client";

import { useEffect, useState } from "react";

// How big the guess map is on wide screens (phones always use the small map). Like WorldGuessr, the player
// picks the size: the map opens to the chosen size while hovered, and "pinned" keeps it open all the time.
// The choice is remembered in this browser (a personal preference, so localStorage is the right place).

// Smallest → biggest. Full class strings, so Tailwind can find them in the source.
const OPEN_SIZES = [
  { box: "sm:h-72 sm:w-[28rem]", width: "sm:w-[28rem]" },
  { box: "sm:h-96 sm:w-[36rem]", width: "sm:w-[36rem]" },
  { box: "sm:h-[32rem] sm:w-[48rem]", width: "sm:w-[48rem]" },
  { box: "sm:h-[40rem] sm:w-[60rem]", width: "sm:w-[60rem]" },
] as const;
const CLOSED = { box: "sm:h-52 sm:w-80", width: "sm:w-80" };
// Never bigger than the window: leave room for Google's Street View controls (right) and our top bar.
const BOX_LIMIT = "sm:max-h-[calc(100dvh-11rem)] sm:max-w-[calc(100vw-5rem)]";
const WIDTH_LIMIT = "sm:max-w-[calc(100vw-5rem)]";

const DEFAULT_LEVEL = 1;
const STORAGE_KEY = "woe-guess-map";

type Saved = { level: number; pinned: boolean };

function readSaved(): Saved {
  const fallback = { level: DEFAULT_LEVEL, pinned: false };
  // The guess map only appears after the game loads in the browser, so this never runs on the server
  // in practice — but stay safe if it does.
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<Saved> | null;
    const level = Number(saved?.level);
    return {
      level:
        Number.isInteger(level) && level >= 0 && level < OPEN_SIZES.length
          ? level
          : DEFAULT_LEVEL,
      pinned: saved?.pinned === true,
    };
  } catch {
    return fallback; // storage blocked (private window, etc.): just use the defaults
  }
}

export type GuessMapSize = ReturnType<typeof useGuessMapSize>;

// `hovered` = what useGuessMapExpansion decided (mouse or keyboard is on the map).
export function useGuessMapSize(hovered: boolean) {
  const [saved, setSaved] = useState(readSaved);
  const { level, pinned } = saved;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Not saved; the size still works for this visit.
    }
  }, [saved]);

  const open = hovered || pinned;
  const size = open ? OPEN_SIZES[level] : CLOSED;
  return {
    open,
    pinned,
    canGrow: level < OPEN_SIZES.length - 1,
    canShrink: level > 0,
    grow: () =>
      setSaved((current) => ({
        ...current,
        level: Math.min(current.level + 1, OPEN_SIZES.length - 1),
      })),
    shrink: () =>
      setSaved((current) => ({
        ...current,
        level: Math.max(current.level - 1, 0),
      })),
    togglePin: () =>
      setSaved((current) => ({ ...current, pinned: !current.pinned })),
    // Classes for the map box and for the Guess button under it (same width).
    boxClass: `${size.box} ${BOX_LIMIT}`,
    widthClass: `${size.width} ${WIDTH_LIMIT}`,
  };
}
