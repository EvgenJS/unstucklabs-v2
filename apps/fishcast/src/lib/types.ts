export type WaterType = "lake" | "river" | "reservoir" | "pond" | "ocean";
export type FishSpecies = "bass" | "trout" | "walleye" | "catfish" | "crappie" | "pike" | "salmon" | "carp" | "perch" | "other";
export type Units = "imperial" | "metric";

// Species/water-type lists ported verbatim from v1 -- client said existing
// functionality is mostly fine, no reason to invent a different list.
export const FISH_SPECIES_OPTIONS: Array<{ value: FishSpecies; label: string }> = [
  { value: "bass", label: "Bass" },
  { value: "trout", label: "Trout" },
  { value: "walleye", label: "Walleye" },
  { value: "catfish", label: "Catfish" },
  { value: "crappie", label: "Crappie" },
  { value: "pike", label: "Pike" },
  { value: "salmon", label: "Salmon" },
  { value: "carp", label: "Carp" },
  { value: "perch", label: "Perch" },
  { value: "other", label: "Other" },
];

export const WATER_TYPE_OPTIONS: Array<{ value: WaterType; label: string }> = [
  { value: "lake", label: "Lake" },
  { value: "river", label: "River" },
  { value: "reservoir", label: "Reservoir" },
  { value: "pond", label: "Pond" },
  { value: "ocean", label: "Ocean/Coast" },
];

export interface SavedSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  waterType: WaterType;
  createdAt: string;
}

export interface CatchEntry {
  id: string;
  result: "caught" | "nothing";
  verdict: "GO" | "WAIT" | null;
  location: { lat: number; lng: number; name: string };
  fishSpecies?: FishSpecies;
  weightLbs?: number;
  notes?: string;
  photoUrl?: string | null;
  date: string;
  createdAt: string;
}

export interface DailyUsage {
  date: string;
  callsToday: number;
}

export interface FishCastData {
  version: 1;
  units: Units;
  savedSpots: SavedSpot[];
  // Capped at MAX_CATCHES, oldest pruned client-side on write -- mirrors
  // v1's 100-most-recent cap (backend/src/routes/catch.ts), roomier since
  // this is a client-side cap rather than a query limit.
  catches: CatchEntry[];
  aiUsage: DailyUsage;
}

export const MAX_CATCHES = 200;

export function emptyData(): FishCastData {
  return {
    version: 1,
    units: "imperial",
    savedSpots: [],
    catches: [],
    aiUsage: { date: "", callsToday: 0 },
  };
}

export function pruneCatches(catches: CatchEntry[]): CatchEntry[] {
  if (catches.length <= MAX_CATCHES) return catches;
  // Newest first by createdAt -- keep the most recent MAX_CATCHES.
  return [...catches].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_CATCHES);
}
