import type { GameSummary } from "@/server/services/playerService";

type GameHistoryTableProps = {
  games: GameSummary[];
  // Best possible total for one game, to show "3,120 / 25,000".
  maxGameScore: number;
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

// The player's recent games, newest first. Plain component: the page passes the data in.
export function GameHistoryTable({ games, maxGameScore }: GameHistoryTableProps) {
  if (games.length === 0) {
    return (
      <p className="rounded-xl bg-white/5 py-8 text-center text-white/70">
        No games yet. Play your first game and it will show up here!
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-white/15 text-xs tracking-wider text-white/60 uppercase">
          <th scope="col" className="py-3 pr-4 pl-2 font-semibold">
            Played
          </th>
          <th scope="col" className="py-3 pr-4 font-semibold">
            Rounds
          </th>
          <th scope="col" className="py-3 pr-2 text-right font-semibold">
            Score
          </th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => (
          <tr key={game.id} className="border-b border-white/10 last:border-0 hover:bg-white/5">
            <td className="py-3 pr-4 pl-2 text-white/85">
              {DATE_FORMAT.format(new Date(game.createdAt))}
            </td>
            <td className="py-3 pr-4">
              {game.status === "completed" ? (
                <span className="text-white/70 tabular-nums">
                  {game.roundsPlayed} / {game.totalRounds}
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">
                  Unfinished · {game.roundsPlayed} / {game.totalRounds}
                </span>
              )}
            </td>
            <td className="py-3 pr-2 text-right tabular-nums">
              <span className="font-bold text-amber-300">{game.totalScore.toLocaleString()}</span>
              <span className="text-white/50"> / {maxGameScore.toLocaleString()}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
