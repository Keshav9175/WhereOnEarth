"use client";

import "flag-icons/css/flag-icons.min.css";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Map as MapIcon } from "lucide-react";
import { LISTED_MAPS, type GameMap } from "@/lib/maps/catalog";

// A country map in the list (just enough to show it and switch to it).
export type CountryChoice = { id: string; name: string; countryCode: string };

type MapSwitcherProps = {
  current: GameMap;
  countryMaps: CountryChoice[];
  // Switching mid-game throws the current game away, so we say so in the list.
  inProgress: boolean;
};

const OPTION =
  "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300";
const GROUP_LABEL = "px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-white/45 uppercase";

// The "World ▾" button in the game's top bar. Picking a map changes the address to /play?map=…,
// which starts a fresh game on that map (the page restarts the game whenever the map changes).
export function MapSwitcher({ current, countryMaps, inProgress }: MapSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Esc (focus goes back to the button) or on a click anywhere outside the list.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function choose(id: string) {
    setOpen(false);
    if (id !== current.id) router.replace(`/play?map=${id}`);
  }

  function option(id: string, label: string, flagCode: string | null) {
    const selected = id === current.id;
    return (
      <li key={id}>
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          onClick={() => choose(id)}
          className={`${OPTION} ${selected ? "font-bold text-amber-300" : "text-white"}`}
        >
          {flagCode && (
            <span aria-hidden="true" className={`fi fi-${flagCode.toLowerCase()} shrink-0 rounded-[2px]`} />
          )}
          <span className="flex-1 truncate">{label}</span>
          {selected && <Check aria-hidden="true" className="size-4 shrink-0" />}
        </button>
      </li>
    );
  }

  return (
    <div ref={wrapperRef} className="pointer-events-auto relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Map: ${current.name}. Change map`}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/60 px-3 text-sm font-semibold text-white shadow-xl backdrop-blur-md hover:bg-slate-900/80 focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        {current.countryCode ? (
          <span aria-hidden="true" className={`fi fi-${current.countryCode.toLowerCase()} rounded-[2px]`} />
        ) : (
          <MapIcon aria-hidden="true" className="size-4 text-amber-300" />
        )}
        {current.name}
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute top-full left-0 mt-2 flex max-h-[min(70dvh,32rem)] w-64 flex-col rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl backdrop-blur-md"
        >
          <p className="border-b border-white/10 px-4 py-2.5 text-xs text-white/60">
            {inProgress ? "Choosing a map starts a new game." : "Choose a map for your next game."}
          </p>
          <div className="overflow-y-auto p-1.5">
            <p className={GROUP_LABEL}>Regions</p>
            <ul>{LISTED_MAPS.map((map) => option(map.id, map.name, null))}</ul>
            {countryMaps.length > 0 && (
              <>
                <p className={GROUP_LABEL}>Countries</p>
                <ul>{countryMaps.map((map) => option(map.id, map.name, map.countryCode))}</ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
