"use client";

import { ArrowDownRight, ArrowUpLeft, Maximize2, Minimize2, Pin, PinOff } from "lucide-react";
import type { GuessMapSize } from "./useGuessMapSize";

const BUTTON =
  "grid size-8 cursor-pointer place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-white";

// The map-size toolbar (wide screens only), like WorldGuessr. It sits in the map's bottom-right corner, next
// to Google's zoom buttons: the map grows up and to the left, so this corner never moves and the buttons stay
// under the mouse (a second quick click can't land on the map and drop a pin by accident). The buttons:
// bigger (the map grows up and to the left), smaller, and pin = keep the map open even without hovering.
// It sits INSIDE the map box, so hovering it keeps the map open and clicks on it never place a pin.
export function GuessMapControls({
  size,
  mobileExpanded = false,
  onToggleMobile,
}: {
  size: GuessMapSize;
  mobileExpanded?: boolean;
  onToggleMobile?: () => void;
}) {
  return (
    <>
      <div
        role="toolbar"
        aria-label="Map size"
        className={`absolute right-14 bottom-6 z-10 hidden items-center gap-0.5 rounded-full bg-slate-950/75 p-1 shadow-lg backdrop-blur-md transition-opacity duration-200 sm:flex ${
          size.open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
      <button
        type="button"
        onClick={size.grow}
        disabled={!size.canGrow}
        aria-label="Make the map bigger"
        title="Bigger"
        className={BUTTON}
      >
        <ArrowUpLeft aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={size.shrink}
        disabled={!size.canShrink}
        aria-label="Make the map smaller"
        title="Smaller"
        className={BUTTON}
      >
        <ArrowDownRight aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={size.togglePin}
        aria-pressed={size.pinned}
        aria-label="Keep the map open"
        title={
          size.pinned
            ? "Unpin: close the map when the mouse leaves"
            : "Pin: keep the map open"
        }
        className={`${BUTTON} ${size.pinned ? "bg-sky-500 hover:bg-sky-400" : ""}`}
      >
        {size.pinned ? (
          <PinOff aria-hidden="true" className="size-4" />
        ) : (
          <Pin aria-hidden="true" className="size-4" />
        )}
      </button>
      </div>
      {onToggleMobile && (
        <button
          type="button"
          onClick={onToggleMobile}
          aria-expanded={mobileExpanded}
          aria-label={mobileExpanded ? "Collapse map" : "Expand map"}
          title={mobileExpanded ? "Collapse map" : "Expand map"}
          className="mobile-map-toggle absolute top-2 left-2 z-20 grid size-9 place-items-center rounded-xl bg-slate-950/80 text-white shadow-lg backdrop-blur-md focus-visible:outline-2 focus-visible:outline-white sm:hidden"
        >
          {mobileExpanded ? (
            <Minimize2 aria-hidden="true" className="size-4" />
          ) : (
            <Maximize2 aria-hidden="true" className="size-4" />
          )}
        </button>
      )}
    </>
  );
}
