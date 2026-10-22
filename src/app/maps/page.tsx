import type { Metadata } from "next";
import { Suspense } from "react";
import { MapLibrary } from "@/components/maps/MapLibrary";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Maps — WhereOnEarth",
};

// /maps — the map library: pick where your next game takes place.
export default function MapsPage() {
  return (
    <PageShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Where do you want to play?</h1>
          <p className="max-w-2xl text-white/70">
            Pick a map for your next game. You can switch maps any time from the button at the top of
            the game screen.
          </p>
        </div>

        <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white/5" />}>
          <MapLibrary />
        </Suspense>
      </section>
    </PageShell>
  );
}
