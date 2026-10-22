import type { Metadata } from "next";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { GLASS_PANEL, PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Leaderboard — WhereOnEarth",
};

// /leaderboard — top players by their best completed game.
export default function LeaderboardPage() {
  return (
    <PageShell current="/leaderboard">
      <section className={`mx-auto flex w-full max-w-3xl flex-col gap-6 p-5 sm:p-8 ${GLASS_PANEL}`}>
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg shadow-amber-900/40">
            <Trophy aria-hidden="true" className="size-7 text-slate-950" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-white/70">
              Players ranked by their best finished game. Guest games are not ranked — sign in to
              compete.
            </p>
          </div>
        </div>

        <Suspense fallback={<p className="py-6 text-center text-white/70">Loading scores…</p>}>
          <LeaderboardTable limit={20} />
        </Suspense>
      </section>
    </PageShell>
  );
}
