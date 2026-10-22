import { connection } from "next/server";
import { getLeaderboard } from "@/server/services/leaderboardService";

type LeaderboardTableProps = {
  // How many players to show.
  limit: number;
};

// Gold, silver and bronze badges for the top 3; everyone else gets a plain number.
const RANK_BADGE: Record<number, string> = {
  1: "bg-gradient-to-br from-amber-200 to-amber-500 text-slate-950",
  2: "bg-gradient-to-br from-slate-100 to-slate-400 text-slate-950",
  3: "bg-gradient-to-br from-orange-300 to-orange-700 text-slate-950",
};

// Server component: reads the rankings straight from the database (no fetch needed).
// Wrap it in <Suspense> wherever it is used — it waits for the database.
export async function LeaderboardTable({ limit }: LeaderboardTableProps) {
  // Scores change all the time, so read them fresh on every request.
  await connection();
  const entries = await getLeaderboard(limit);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl bg-white/5 py-8 text-center text-white/70">
        No scores yet. Sign in and finish a game to be the first!
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-white/15 text-xs tracking-wider text-white/60 uppercase">
          <th scope="col" className="py-3 pr-4 pl-2 font-semibold">
            Rank
          </th>
          <th scope="col" className="py-3 pr-4 font-semibold">
            Player
          </th>
          <th scope="col" className="py-3 pr-4 text-right font-semibold">
            Best score
          </th>
          <th scope="col" className="py-3 pr-2 text-right font-semibold">
            Games
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.rank} className="border-b border-white/10 last:border-0 hover:bg-white/5">
            <td className="py-3 pr-4 pl-2">
              <span
                className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                  RANK_BADGE[entry.rank] ?? "bg-white/10 text-white"
                }`}
              >
                {entry.rank}
              </span>
            </td>
            <td className="py-3 pr-4 font-semibold">{entry.playerName}</td>
            <td className="py-3 pr-4 text-right font-bold text-amber-300 tabular-nums">
              {entry.bestScore.toLocaleString()}
            </td>
            <td className="py-3 pr-2 text-right text-white/70 tabular-nums">{entry.gamesCompleted}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
