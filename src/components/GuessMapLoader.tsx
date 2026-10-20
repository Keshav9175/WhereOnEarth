"use client";

import dynamic from "next/dynamic";

// Same size as the real map (see MAP_BOX_CLASSES in GuessMap.tsx), so nothing jumps when it loads.
const PLACEHOLDER_CLASSES = "h-full min-h-70 w-full rounded-xl bg-card";

// Loads the Leaflet map only in the browser (Leaflet crashes on the server: no `window`).
export const GuessMapLoader = dynamic(() => import("./GuessMap"), {
  ssr: false,
  loading: () => <div className={PLACEHOLDER_CLASSES} aria-busy="true" />,
});
