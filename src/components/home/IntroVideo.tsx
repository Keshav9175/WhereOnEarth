"use client";

import { SkipForward } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OCEAN_BACKGROUND } from "@/components/PageShell";
import { INTRO_ATTRIBUTE, INTRO_SEEN_KEY, INTRO_VIDEO_LANDSCAPE, INTRO_VIDEO_PORTRAIT } from "@/lib/intro";

// If the video hasn't started after this long (slow network, blocked autoplay), give up quietly.
const START_TIMEOUT_MS = 6000;

// The <html> attribute never changes while the intro plays, so there is nothing to subscribe to.
const subscribe = () => () => {};
const shouldPlayNow = () => document.documentElement.getAttribute(INTRO_ATTRIBUTE) === "play";
// The server can't see the browser's storage, so it always says "don't play". React then reads the
// real value after hydration without a hydration error (that's what useSyncExternalStore is for).
const shouldPlayOnServer = () => false;

// Only called in the browser (the video is never rendered on the server).
function pickVideo() {
  return window.matchMedia("(orientation: portrait)").matches ? INTRO_VIDEO_PORTRAIT : INTRO_VIDEO_LANDSCAPE;
}

function rememberSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage blocked: the intro may show again next time. Harmless.
  }
}

// Full-screen intro shown on a player's first visit to the home page (D-025). The black screen
// itself is visible from the first paint (CSS + the inline script in the root layout); this
// component adds the video, the Skip button, and the fade out to the home page.
export function IntroVideo() {
  const shouldPlay = useSyncExternalStore(subscribe, shouldPlayNow, shouldPlayOnServer);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const active = shouldPlay && !done;

  useEffect(() => {
    if (!active) return;
    skipRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLeaving(true);
    };
    const timeout = window.setTimeout(() => {
      if (!started.current) setLeaving(true);
    }, START_TIMEOUT_MS);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timeout);
    };
  }, [active]);

  // After the fade-out: hide the intro screen for good and hand the page back.
  function finish() {
    document.documentElement.removeAttribute(INTRO_ATTRIBUTE);
    setDone(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WhereOnEarth intro"
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget) finish();
      }}
      // The video starts and ends on the app's own ocean background, so the screen behind it matches and the
      // short fade lands seamlessly on the home page (video 4.6 s + fade 0.4 s = 5 s).
      className={`fixed inset-0 z-[100] hidden items-center justify-center ${OCEAN_BACKGROUND} transition-opacity duration-400 ease-out intro:flex ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {active && (
        <>
          <video
            src={pickVideo()}
            autoPlay
            muted
            playsInline
            preload="auto"
            onPlaying={() => {
              // Counted as seen once it actually plays, so closing the tab mid-way won't repeat it.
              started.current = true;
              rememberSeen();
            }}
            onEnded={() => setLeaving(true)}
            onError={() => setLeaving(true)}
            // cover: fills the whole screen like part of the app (no black bars); see the safe area in intro.ts.
            className="h-full w-full object-cover"
          />
          <button
            ref={skipRef}
            type="button"
            onClick={() => {
              rememberSeen();
              setLeaving(true);
            }}
            className="absolute right-6 bottom-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            Skip
            <SkipForward aria-hidden="true" className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
