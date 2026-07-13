import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getApiClient, PRODUCT_SLUG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { emptyData, pruneCatches, type CatchEntry, type FishCastData, type SavedSpot, type Units, type WaterType } from "../lib/types";

interface NewSpotInput {
  name: string;
  lat: number;
  lng: number;
  waterType: WaterType;
}

interface NewCatchInput {
  result: "caught" | "nothing";
  verdict: "GO" | "WAIT" | null;
  location: { lat: number; lng: number; name: string };
  fishSpecies?: CatchEntry["fishSpecies"];
  weightLbs?: number;
  notes?: string;
  photoUrl?: string | null;
  date?: string;
}

interface AppDataContextValue {
  data: FishCastData;
  loading: boolean;
  addSpot: (input: NewSpotInput) => void;
  removeSpot: (spotId: string) => void;
  logCatch: (input: NewCatchInput) => void;
  setUnits: (units: Units) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const WRITE_DEBOUNCE_MS = 800;

// Structural port of apps/habitflow/src/context/AppDataProvider.tsx's
// debounced-write pattern -- update() computes `next` synchronously against
// a ref (not via setData's functional-updater form) so a flush() called
// right after always ships the latest state, not a stale snapshot. See
// docs/ROADMAP.md's Phase 4+ follow-up for the bug this fixes.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<FishCastData>(emptyData());
  const [loading, setLoading] = useState(true);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    if (!accessToken) return;
    getApiClient(accessToken)
      .appUserData.get(PRODUCT_SLUG)
      .then(({ data: remote }) => {
        if (remote) setData(remote as FishCastData);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const flush = useCallback(() => {
    if (!accessToken) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = null;
    getApiClient(accessToken).appUserData.put(PRODUCT_SLUG, latestData.current);
  }, [accessToken]);

  const scheduleWrite = useCallback(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(flush, WRITE_DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", flush);
    };
  }, [flush]);

  function update(updater: (current: FishCastData) => FishCastData) {
    const next = updater(latestData.current);
    latestData.current = next;
    setData(next);
    scheduleWrite();
  }

  function addSpot(input: NewSpotInput) {
    const spot: SavedSpot = {
      id: crypto.randomUUID(),
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      waterType: input.waterType,
      createdAt: new Date().toISOString(),
    };
    update((c) => ({ ...c, savedSpots: [spot, ...c.savedSpots] }));
    flush();
  }

  function removeSpot(spotId: string) {
    update((c) => ({ ...c, savedSpots: c.savedSpots.filter((s) => s.id !== spotId) }));
    flush();
  }

  function logCatch(input: NewCatchInput) {
    const entry: CatchEntry = {
      id: crypto.randomUUID(),
      result: input.result,
      verdict: input.verdict,
      location: input.location,
      fishSpecies: input.fishSpecies,
      weightLbs: input.weightLbs,
      notes: input.notes,
      photoUrl: input.photoUrl ?? null,
      date: input.date ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    update((c) => ({ ...c, catches: pruneCatches([entry, ...c.catches]) }));
    flush();
  }

  function setUnits(units: Units) {
    update((c) => ({ ...c, units }));
    flush();
  }

  return (
    <AppDataContext.Provider value={{ data, loading, addSpot, removeSpot, logCatch, setUnits }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
