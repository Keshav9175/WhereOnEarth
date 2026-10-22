// Chooses a game's rounds from a list of random candidate locations.
// Rule: every round in a different country when possible, so one game never shows
// "France, France, France". Candidates are already in random order, so we simply take
// the first one from each new country, and only reuse a country if we run out.
export function pickRounds<T extends { country: string }>(candidates: T[], count: number): T[] {
  const chosen: T[] = [];
  const countriesUsed = new Set<string>();

  for (const candidate of candidates) {
    if (chosen.length === count) return chosen;
    if (!countriesUsed.has(candidate.country)) {
      countriesUsed.add(candidate.country);
      chosen.push(candidate);
    }
  }

  // Not enough different countries (a tiny pool): fill the gaps with the unused candidates.
  for (const candidate of candidates) {
    if (chosen.length === count) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }

  return chosen;
}
