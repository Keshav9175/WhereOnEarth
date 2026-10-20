import { connectToDatabase } from "@/server/db";
import { GameModel } from "@/server/models/Game";

// One line in a player's game history (no answers — just the outcome).
export type GameSummary = {
  id: string;
  status: "in_progress" | "completed";
  totalScore: number;
  roundsPlayed: number;
  totalRounds: number;
  createdAt: string;
  completedAt: string | null;
};

export type PlayerStats = {
  gamesCompleted: number;
  bestScore: number;
  averageScore: number;
  totalScore: number;
};

// A player's most recent games, newest first.
export async function listGamesForUser(userId: string, limit: number): Promise<GameSummary[]> {
  await connectToDatabase();

  const games = await GameModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select({ status: 1, totalScore: 1, rounds: 1, createdAt: 1, completedAt: 1 })
    .lean();

  return games.map((game) => ({
    id: game._id.toString(),
    status: game.status,
    totalScore: game.totalScore,
    roundsPlayed: game.rounds.filter((round) => round.guess != null).length,
    totalRounds: game.rounds.length,
    createdAt: game.createdAt.toISOString(),
    completedAt: game.completedAt ? game.completedAt.toISOString() : null,
  }));
}

// Totals across a player's completed games. Unfinished games don't count.
export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  await connectToDatabase();

  const [result] = await GameModel.aggregate<{
    gamesCompleted: number;
    bestScore: number;
    averageScore: number;
    totalScore: number;
  }>([
    { $match: { userId, status: "completed" } },
    {
      $group: {
        _id: null,
        gamesCompleted: { $sum: 1 },
        bestScore: { $max: "$totalScore" },
        averageScore: { $avg: "$totalScore" },
        totalScore: { $sum: "$totalScore" },
      },
    },
  ]);

  if (!result) {
    return { gamesCompleted: 0, bestScore: 0, averageScore: 0, totalScore: 0 };
  }

  return {
    gamesCompleted: result.gamesCompleted,
    bestScore: result.bestScore,
    averageScore: Math.round(result.averageScore),
    totalScore: result.totalScore,
  };
}
