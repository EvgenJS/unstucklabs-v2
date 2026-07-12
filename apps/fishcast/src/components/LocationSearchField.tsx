import { useEffect, useRef, useState } from "react";
import { Input } from "@unstucklabs/ui";
import { getApiClient } from "../lib/api";
import type { GeocodeResult } from "@unstucklabs/sdk";

export interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface Props {
  accessToken: string | undefined;
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
}

function formatResult(r: GeocodeResult): string {
  return [r.name, r.state, r.country].filter(Boolean).join(", ");
}

// Shared debounced geocode-search + "use my location" input, used by
// Forecast, Spots, and Catch Log -- all three need the exact same "find a
// lat/lng from a place name" flow, so this is a real within-app reuse case
// (unlike SubscriptionGate's cross-app copies, which cross an independent-
// deployment boundary). All OpenWeatherMap calls happen server-side via
// core-api -- v1 had a real OWM key hardcoded in frontend source for this
// exact feature.
export function LocationSearchField({ accessToken, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.name]);

  function handleQueryChange(next: string) {
    setQuery(next);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (next.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      const { results: found } = await getApiClient(accessToken).fishcast.geocode(next.trim());
      setResults(found);
      setOpen(found.length > 0);
    }, 350);
  }

  function pickResult(r: GeocodeResult) {
    const name = formatResult(r);
    setQuery(name);
    setOpen(false);
    onChange({ lat: r.lat, lng: r.lng, name });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { result } = await getApiClient(accessToken).fishcast.reverseGeocode(latitude, longitude);
          const name = result ? formatResult(result) : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setQuery(name);
          onChange({ lat: latitude, lng: longitude, name });
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false)
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder ?? "Search for a lake, river..."}
          className="bg-surface border-border text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 cursor-pointer rounded-lg border border-border bg-surface px-3 text-lg disabled:opacity-50"
          aria-label="Use my location"
        >
          {locating ? "…" : "📍"}
        </button>
      </div>
      {open && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`}>
              <button
                type="button"
                onClick={() => pickResult(r)}
                className="w-full cursor-pointer px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10"
              >
                {formatResult(r)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
