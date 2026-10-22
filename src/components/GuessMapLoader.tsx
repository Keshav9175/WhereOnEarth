"use client";

import dynamic from "next/dynamic";

// Loads the Leaflet map only in the browser (Leaflet crashes on the server: no `window`).
// The placeholder fills whatever box the map will occupy, so nothing jumps when it loads.
export const GuessMapLoader = dynamic(() => import("./GuessMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-slate-900/60" aria-busy="true" />,
});
