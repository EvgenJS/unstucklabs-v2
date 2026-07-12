import type { CatchEntry, FishSpecies } from "./types";

export interface BadgeMeta {
  key: string;
  icon: string;
  label: string;
}

// Same 5 badges, keys, icons, and thresholds as v1's GET /api/catch/stats
// (backend/src/routes/catch.ts) -- ported client-side since the whole
// catches array is already loaded via the one AppUserData fetch, same
// "computed, not stored" principle as HabitFlow's streaks. Available to
// every trialing/subscribed user now instead of Pro-only.
export const BADGE_META: BadgeMeta[] = [
  { key: "first_catch", icon: "\u{1F3A3}", label: "First Catch" },
  { key: "streak_5", icon: "\u{1F525}", label: "On Fire" },
  { key: "early_bird", icon: "\u{1F305}", label: "Early Bird" },
  { key: "sniper", icon: "\u{1F3AF}", label: "Sniper" },
  { key: "seasonal", icon: "\u{1F3C6}", label: "Seasonal" },
];

export interface CatchStats {
  total: number;
  successful: number;
  streak: number;
  accuracy: number | null;
  accuracyTrips: number;
  topSpecies: FishSpecies | null;
  badges: Set<string>;
}

function sortedByDateDesc(catches: CatchEntry[]): CatchEntry[] {
  return [...catches].sort((a, b) => b.date.localeCompare(a.date));
}

export function computeStats(catches: CatchEntry[]): CatchStats {
  const sorted = sortedByDateDesc(catches);
  const total = sorted.length;
  const successful = sorted.filter((c) => c.result === "caught").length;

  let streak = 0;
  for (const c of sorted) {
    if (c.result === "caught") streak++;
    else break;
  }

  const withVerdict = sorted.filter((c) => c.verdict !== null);
  const accurate = withVerdict.filter(
    (c) => (c.verdict === "GO" && c.result === "caught") || (c.verdict === "WAIT" && c.result === "nothing")
  ).length;
  const accuracy = withVerdict.length === 0 ? null : Math.round((accurate / withVerdict.length) * 100);

  const speciesCounts = new Map<FishSpecies, number>();
  for (const c of sorted) {
    if (!c.fishSpecies) continue;
    speciesCounts.set(c.fishSpecies, (speciesCounts.get(c.fishSpecies) ?? 0) + 1);
  }
  let topSpecies: FishSpecies | null = null;
  let topCount = 0;
  for (const [species, count] of speciesCounts) {
    if (count > topCount) {
      topSpecies = species;
      topCount = count;
    }
  }

  const earlyBird = sorted.some((c) => c.result === "caught" && new Date(c.date).getHours() < 7);

  const badges = new Set<string>();
  if (total >= 1) badges.add("first_catch");
  if (streak >= 5) badges.add("streak_5");
  if (earlyBird) badges.add("early_bird");
  if (accurate >= 5) badges.add("sniper");
  if (total >= 30) badges.add("seasonal");

  return { total, successful, streak, accuracy, accuracyTrips: withVerdict.length, topSpecies, badges };
}
