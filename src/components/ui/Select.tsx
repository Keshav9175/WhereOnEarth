"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; hint?: string };

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

// A dropdown in our glass style, replacing the browser's plain <select>. It follows the standard
// accessible "listbox" pattern, so it works like a native one:
// - mouse: click to open, click an option;  - keyboard: ↑/↓/Enter/Space to open, ↑/↓/Home/End to move,
//   Enter to choose, Esc to close (focus returns to the button), Tab closes;
// - screen readers hear "Map, World, collapsed / expanded, option 2 of 7, selected".
export function Select({ label, value, options, onChange, disabled = false }: SelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  // While open: focus the list, keep the highlighted option in view, close when clicking elsewhere.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, id]);

  function openList() {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKey(event: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  }

  function onListKey(event: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(activeIndex + 1, last),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActiveIndex(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium text-white/80">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKey}
        className={`flex w-full items-center gap-3 rounded-xl border bg-slate-950/50 px-3.5 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-70 ${
          open ? "border-sky-400/70 ring-2 ring-sky-400/25" : "border-white/15 enabled:hover:border-white/35"
        } ${disabled ? "" : "cursor-pointer"}`}
      >
        <span id={`${id}-value`} className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{selected?.label}</span>
          {selected?.hint && <span className="block truncate text-xs text-white/55">{selected.hint}</span>}
        </span>
        {!disabled && (
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-white/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      <ul
        ref={listRef}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={`${id}-label`}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        onKeyDown={onListKey}
        className={`absolute top-full right-0 left-0 z-50 mt-2 max-h-72 origin-top overflow-y-auto rounded-xl border border-white/15 bg-slate-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md transition duration-150 focus:outline-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={isSelected}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                index === activeIndex ? "bg-white/10" : ""
              } ${isSelected ? "text-white" : "text-white/85"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{option.label}</span>
                {option.hint && <span className="block truncate text-xs text-white/55">{option.hint}</span>}
              </span>
              {isSelected && <Check aria-hidden="true" className="size-4 shrink-0 text-sky-300" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
