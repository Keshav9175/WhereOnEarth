// A friendly title for a finished game, based on how much of the maximum score the player got.
// Pure so it can be tested, and so a future server (e.g. sharing results) gives the same title.
const RATINGS = [
  { minShare: 0.9, title: "Geo Legend", line: "You could find your way anywhere on Earth." },
  { minShare: 0.7, title: "World Explorer", line: "Impressive — you know this planet well." },
  { minShare: 0.45, title: "Seasoned Traveller", line: "Solid instincts. A few more trips and you're a pro." },
  { minShare: 0.2, title: "Backpacker", line: "Good start! Look for signs, plants and road markings." },
  { minShare: 0, title: "Tourist", line: "Every expert started here. Try another round!" },
] as const;

export function rateGame(totalScore: number, maxScore: number) {
  const share = maxScore > 0 ? totalScore / maxScore : 0;
  const rating = RATINGS.find((candidate) => share >= candidate.minShare) ?? RATINGS[RATINGS.length - 1];
  return { title: rating.title, line: rating.line, percent: Math.round(share * 100) };
}
