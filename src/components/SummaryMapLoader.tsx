"use client";

import dynamic from "next/dynamic";

// Loads the end-of-game Leaflet map only in the browser (Leaflet crashes on the server: no `window`).
export const SummaryMapLoader = dynamic(() => import("./SummaryMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900/60" aria-busy="true" />,
});
