import { useEffect, useState } from "react";
import { Button } from "@unstucklabs/ui";
import type { ForecastResult } from "@unstucklabs/sdk";
import { getApiClient } from "../lib/api";
import { FISH_SPECIES_OPTIONS, WATER_TYPE_OPTIONS, type FishSpecies, type Units, type WaterType } from "../lib/types";
import { LocationSearchField, type LocationValue } from "./LocationSearchField";
import { ForecastResultCard } from "./ForecastResultCard";

interface Props {
  accessToken: string | undefined;
  units: Units;
  prefillLocation: LocationValue | null;
  onPrefillConsumed: () => void;
  onLogCatch: (input: {
    result: "caught" | "nothing";
    verdict: "GO" | "WAIT";
    location: LocationValue;
  }) => void;
}

export function ForecastView({ accessToken, units, prefillLocation, onPrefillConsumed, onLogCatch }: Props) {
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [fish, setFish] = useState<FishSpecies>("bass");
  const [waterType, setWaterType] = useState<WaterType>("lake");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillLocation) {
      setLocation(prefillLocation);
      setForecast(null);
      onPrefillConsumed();
    }
    // onPrefillConsumed is stable enough for this one-shot consume effect --
    // re-running on every render would clear the prefill immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillLocation]);

  async function getForecast() {
    if (!location) return;
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const result = await getApiClient(accessToken).fishcast.forecast({
        lat: location.lat,
        lng: location.lng,
        fish,
        waterType,
        units,
      });
      setForecast(result);
    } catch {
      setError("Couldn't reach the forecast service just now -- try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">🎣 Forecast</h1>
      <p className="mt-1 text-sm text-muted-foreground">Stop guessing. Start catching.</p>

      <div className="mt-6 flex flex-col gap-4">
        <LocationSearchField accessToken={accessToken} value={location} onChange={setLocation} />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={fish}
            onChange={(e) => setFish(e.target.value as FishSpecies)}
            className="rounded-lg border border-border bg-surface px-3 py-3 text-foreground"
          >
            {FISH_SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={waterType}
            onChange={(e) => setWaterType(e.target.value as WaterType)}
            className="rounded-lg border border-border bg-surface px-3 py-3 text-foreground"
          >
            {WATER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={getForecast} disabled={!location || loading}>
          {loading ? "Checking conditions…" : "Get Forecast"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {forecast && (
        <ForecastResultCard
          forecast={forecast}
          onLog={(result) =>
            location &&
            onLogCatch({
              result,
              verdict: forecast.verdict,
              location,
            })
          }
        />
      )}
    </div>
  );
}
