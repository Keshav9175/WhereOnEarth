"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  LogIn,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import partyArt from "../../../public/Card 1.png";
import singleplayerArt from "../../../public/Card 2.png";
import unrankedArt from "../../../public/Card 3.png";
import rankedArt from "../../../public/Card 4.png";

type SubOption = {
  label: string;
  icon: LucideIcon;
  // A playable choice links to its page and shows `hint`; without `href` it shows "Coming soon".
  href?: string;
  hint?: string;
};

type GameMode = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  // Accent colour of the icon (like the coloured icons in the reference).
  iconColor: string;
  // Full-card background illustration (its left side is plain colour, so the text stays readable).
  image: StaticImageData;
  // A playable mode links straight to its page...
  href?: string;
  // ...an upcoming mode expands to show its choices instead (static for now).
  options?: [SubOption, SubOption];
};

const MATCH_SIZES: [SubOption, SubOption] = [
  { label: "1 vs 1", icon: Swords },
  { label: "2 vs 2", icon: Users },
];

// Singleplayer and Party are playable; Ranked and Unranked (matchmaking) come later in Phase 9.
// Their sub-options are shown now so players can see what's coming — they do nothing yet.
const MODES: GameMode[] = [
  {
    id: "singleplayer",
    title: "Singleplayer",
    description: "Real places on every continent.",
    icon: Globe,
    iconColor: "text-emerald-300",
    image: singleplayerArt,
    href: "/play",
  },
  {
    id: "ranked",
    title: "Ranked",
    description: "Compete for the top spot.",
    icon: Trophy,
    iconColor: "text-amber-300",
    image: rankedArt,
    options: MATCH_SIZES,
  },
  {
    id: "unranked",
    title: "Unranked",
    description: "Casual matches, just for fun.",
    icon: Zap,
    iconColor: "text-yellow-300",
    image: unrankedArt,
    options: MATCH_SIZES,
  },
  {
    id: "party",
    title: "Party",
    description: "Play privately with friends.",
    icon: Users,
    iconColor: "text-lime-200",
    image: partyArt,
    options: [
      { label: "Create Party", icon: UserPlus, href: "/party?create=1", hint: "Invite friends" },
      { label: "Join Party", icon: LogIn, href: "/party?join=1", hint: "Enter a code" },
    ],
  },
];

// The PNGs have rounded white corners baked in; a slight zoom pushes them outside the card's clip.
const ART_CLASSES = "pointer-events-none scale-[1.06] object-cover object-right";

const CARD_BASE =
  "relative overflow-hidden rounded-2xl bg-slate-800 shadow-lg shadow-black/25 ring-1 ring-white/25";

const FOCUS_RING = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300";

// Background art + a soft left shade (keeps white text readable on the lighter images) + glossy shine.
function CardArt({ mode }: { mode: GameMode }) {
  return (
    <>
      <Image
        src={mode.image}
        alt=""
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 32rem, 100vw"
        className={ART_CLASSES}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/35 via-slate-950/10 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/15 to-transparent"
      />
    </>
  );
}

// Icon circle + title + one-line description (the left part of every card's top row).
function CardLabel({ mode }: { mode: GameMode }) {
  return (
    <>
      <span className="mobile-mode-icon relative grid size-12 shrink-0 place-items-center rounded-full bg-slate-950/25 ring-1 ring-white/40">
        <mode.icon aria-hidden="true" className={`size-6 ${mode.iconColor}`} />
      </span>
      <span className="mobile-mode-label relative max-w-[58%] min-w-0 flex-1 text-left">
        <span className="mobile-mode-title block truncate text-lg leading-tight font-bold text-white drop-shadow">
          {mode.title}
        </span>
        <span className="mobile-mode-description block truncate text-xs text-white/80 drop-shadow">
          {mode.description}
        </span>
      </span>
    </>
  );
}

// A playable mode: the whole card is a link (unchanged Singleplayer card).
function PlayableCard({ mode }: { mode: GameMode }) {
  return (
    <Link
      href={mode.href ?? "/"}
      className={`mobile-mode-card ${CARD_BASE} flex h-24 items-center gap-4 px-4 transition hover:-translate-y-0.5 hover:ring-white/50 hover:brightness-110 ${FOCUS_RING}`}
    >
      <CardArt mode={mode} />
      <CardLabel mode={mode} />
      <span className="mobile-mode-chevron relative ml-auto grid size-8 shrink-0 place-items-center rounded-full border border-white/80 bg-slate-950/30 backdrop-blur-sm">
        <ChevronRight aria-hidden="true" className="size-4 text-white" />
      </span>
    </Link>
  );
}

type ExpandableCardProps = {
  mode: GameMode & { options: [SubOption, SubOption] };
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// An upcoming mode: clicking the card expands it in place to show its two choices.
function ExpandableCard({ mode, isOpen, onOpen, onClose }: ExpandableCardProps) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close and put keyboard focus back on the card, so keyboard users don't get lost.
  function closeAndRefocus() {
    onClose();
    toggleRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.stopPropagation();
      closeAndRefocus();
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`mobile-mode-card-wrap ${CARD_BASE} transition ${isOpen ? "ring-white/60" : "hover:ring-white/50 hover:brightness-110"}`}
    >
      <CardArt mode={mode} />

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={isOpen ? onClose : onOpen}
        className={`mobile-mode-card relative flex h-24 w-full cursor-pointer items-center gap-4 rounded-2xl px-4 ${FOCUS_RING}`}
      >
        <CardLabel mode={mode} />
        <span className="relative ml-auto grid size-8 shrink-0 place-items-center rounded-full border border-white/80 bg-slate-950/30 backdrop-blur-sm">
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-white transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* The choices. A grid row animating from 0fr to 1fr = a smooth open/close.
          `inert` makes the hidden choices unreachable by Tab and screen readers while closed. */}
      <div
        id={panelId}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="relative flex items-stretch gap-2 px-3 pt-1 pb-3">
            {mode.options.map((option) => {
              const content = (
                <>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <option.icon aria-hidden="true" className="size-4" />
                    {option.label}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider text-white/70 uppercase">
                    {option.href ? option.hint : "Coming soon"}
                  </span>
                </>
              );
              return option.href ? (
                <Link
                  key={option.label}
                  href={option.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-slate-950/30 px-2 py-2 ring-1 ring-white/40 backdrop-blur-sm hover:bg-slate-950/50 hover:ring-white/70 ${FOCUS_RING}`}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={option.label}
                  type="button"
                  aria-disabled="true"
                  aria-label={`${option.label} — coming soon`}
                  className={`flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 rounded-xl bg-slate-950/30 px-2 py-2 ring-1 ring-white/25 backdrop-blur-sm hover:bg-slate-950/40 ${FOCUS_RING}`}
                >
                  {content}
                </button>
              );
            })}
            <button
              type="button"
              onClick={closeAndRefocus}
              aria-label={`Close ${mode.title} options`}
              title="Close"
              className={`grid w-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-slate-950/30 text-white/85 ring-1 ring-white/25 hover:bg-slate-950/50 hover:text-white ${FOCUS_RING}`}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// The 4 game modes, one card per row. Only one card can be open at a time.
export function GameModeCards() {
  // Which expandable card is open (its id), or null when all are closed.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul aria-label="Game modes" className="mobile-mode-carousel flex flex-col gap-6">
      {MODES.map((mode) => (
        <li
          key={mode.id}
          className={`mobile-mode-item ${openId === mode.id ? "mobile-mode-item-expanded" : openId ? "mobile-mode-item-collapsed" : ""}`}
        >
          {mode.options ? (
            <ExpandableCard
              mode={{ ...mode, options: mode.options }}
              isOpen={openId === mode.id}
              onOpen={() => setOpenId(mode.id)}
              onClose={() => setOpenId(null)}
            />
          ) : (
            <PlayableCard mode={mode} />
          )}
        </li>
      ))}
    </ul>
  );
}
