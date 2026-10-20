import { connectToDatabase } from "@/server/db";
import { GameModel } from "@/server/models/Game";

export type LeaderboardEntry = {
  rank: number;
  playerName: string;
  bestScore: number;
  gamesCompleted: number;
  achievedAt: string;
};

type LeaderboardRow = {
  bestScore: number;
  gamesCompleted: number;
  achievedAt: Date;
  playerName: string | null;
};

// Top players by their single best completed game. Guest games are not ranked.
// Only the display name is shown — never e-mail addresses.
export async function getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  await connectToDatabase();

  const rows = await GameModel.aggregate<LeaderboardRow>([
    // 1. Only finished games that belong to a signed-in player.
    { $match: { status: "completed", userId: { $type: "string" } } },
    // 2. Best game first (earlier finish wins a tie), so $first below picks each player's best.
    { $sort: { totalScore: -1, completedAt: 1 } },
    // 3. One row per player.
    {
      $group: {
        _id: "$userId",
        bestScore: { $first: "$totalScore" },
        achievedAt: { $first: "$completedAt" },
        gamesCompleted: { $sum: 1 },
      },
    },
    { $sort: { bestScore: -1, achievedAt: 1 } },
    { $limit: limit },
    // 4. Look up each player's name in Better Auth's `user` collection.
    {
      $lookup: {
        from: "user",
        let: { userObjectId: { $convert: { input: "$_id", to: "objectId", onError: null } } },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userObjectId"] } } },
          { $project: { _id: 0, name: 1 } },
        ],
        as: "user",
      },
    },
    {
      $project: {
        _id: 0,
        bestScore: 1,
        gamesCompleted: 1,
        achievedAt: 1,
        playerName: { $first: "$user.name" },
      },
    },
  ]);

  return rows.map((row, index) => ({
    rank: index + 1,
    playerName: row.playerName ?? "Unknown player",
    bestScore: row.bestScore,
    gamesCompleted: row.gamesCompleted,
    achievedAt: new Date(row.achievedAt).toISOString(),
  }));
}
