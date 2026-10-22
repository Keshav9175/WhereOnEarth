import { redirect } from "next/navigation";
import { MAX_SCORE } from "@/lib/game/scoring";
import { ROUNDS_PER_GAME } from "@/server/models/Game";
import { getPlayerStats, listGamesForUser } from "@/server/services/playerService";
import { getSignedInUser } from "@/server/session";
import { GameHistoryTable } from "./GameHistoryTable";

const HISTORY_LIMIT = 20;

const MEMBER_SINCE_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

// Server component: reads the session, so wrap it in <Suspense>. Guests are sent to sign in —
// this check runs on the server, so the page can't be opened by hiding a button.
export async function PlayerProfile() {
  const user = await getSignedInUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Both queries are independent, so run them at the same time.
  const [stats, games] = await Promise.all([
    getPlayerStats(user.id),
    listGamesForUser(user.id, HISTORY_LIMIT),
  ]);

  const tiles = [
    { label: "Games completed", value: stats.gamesCompleted },
    { label: "Best score", value: stats.bestScore },
    { label: "Average score", value: stats.averageScore },
    { label: "Total points", value: stats.totalScore },
  ];
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-3xl font-bold ring-2 ring-sky-300/70"
        >
          {initial}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-3xl font-bold">{user.name}</h1>
          <p className="text-white/70">Playing since {MEMBER_SINCE_FORMAT.format(user.createdAt)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <dt className="text-xs font-semibold tracking-wider text-white/60 uppercase">{tile.label}</dt>
            <dd className="text-2xl font-bold text-amber-300 tabular-nums">{tile.value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-xl font-bold">
          Recent games
        </h2>
        <GameHistoryTable games={games} maxGameScore={MAX_SCORE * ROUNDS_PER_GAME} />
      </section>
    </>
  );
}
