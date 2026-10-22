"use client";

import { useId, useRef, type KeyboardEvent } from "react";

export type Segment<T extends string | number> = { value: T; label: string; title?: string };

type SegmentedControlProps<T extends string | number> = {
  label: string;
  value: T;
  segments: Segment<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

// A row of buttons where exactly one is chosen (e.g. 3 / 5 / 7 / 10 rounds) — quicker than a dropdown
// when there are only a few choices, and every choice is visible at once. Built as an accessible
// "radio group": screen readers hear "Rounds, 5, selected, 2 of 4"; ←/→ move between choices.
export function SegmentedControl<T extends string | number>({
  label,
  value,
  segments,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  function onKey(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + segments.length) % segments.length;
    onChange(segments[next].value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium text-white/80">
        {label}
      </span>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-disabled={disabled}
        className="flex gap-1 rounded-xl border border-white/10 bg-slate-950/50 p-1"
      >
        {segments.map((segment, index) => {
          const checked = segment.value === value;
          return (
            <button
              key={String(segment.value)}
              type="button"
              role="radio"
              aria-checked={checked}
              title={segment.title}
              disabled={disabled}
              // Only the chosen button is reachable with Tab; arrows move within the group.
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(segment.value)}
              onKeyDown={(event) => onKey(event, index)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed ${
                checked
                  ? "bg-gradient-to-b from-sky-500 to-blue-700 text-white shadow-md shadow-blue-900/50"
                  : `text-white/75 ${disabled ? "" : "cursor-pointer hover:bg-white/10 hover:text-white"}`
              }`}
            >
              {segment.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
