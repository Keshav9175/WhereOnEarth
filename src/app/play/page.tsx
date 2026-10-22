import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DEFAULT_MAP_ID, findMap } from "@/lib/maps/catalog";
import { listCountryMaps, resolveMap } from "@/server/services/mapService";
import { PlayGame } from "./PlayGame";

export const metadata: Metadata = {
  title: "Play — WhereOnEarth",
};

type PageProps = {
  searchParams: Promise<{ map?: string }>;
};

// Reads ?map=… (an unknown map, or a country without enough locations, falls back to World).
async function GameOnMap({ searchParams }: PageProps) {
  // Reads the database (country maps), so it must run per request, never while prerendering.
  await connection();
  const { map: requested } = await searchParams;
  const [resolved, countryMaps] = await Promise.all([
    requested ? resolveMap(requested) : null,
    listCountryMaps(),
  ]);
  const map = resolved ?? findMap(DEFAULT_MAP_ID)!;

  // Only what the map picker needs crosses to the browser.
  const countries = countryMaps.map(({ id, name, countryCode }) => ({ id, name, countryCode }));
  // `key`: a different map = a brand-new PlayGame, which starts a new game on that map.
  return <PlayGame key={map.id} map={map} countryMaps={countries} />;
}

// /play?map=europe or /play?map=fr — the game screen. The interactive part lives in a client component.
export default function PlayPage({ searchParams }: PageProps) {
  return (
    // searchParams is per-request data, so (with Cache Components) it is read inside Suspense.
    <Suspense fallback={<main className="h-dvh bg-[#01275e]" />}>
      <GameOnMap searchParams={searchParams} />
    </Suspense>
  );
}
