import { apiRequest, apiUpload, type ApiClientConfig } from "../client";

export type FishSpecies = "bass" | "trout" | "walleye" | "catfish" | "crappie" | "pike" | "salmon" | "carp" | "perch" | "other";
export type WaterType = "lake" | "river" | "reservoir" | "pond" | "ocean";
export type Units = "imperial" | "metric";

export interface ForecastInput {
  lat: number;
  lng: number;
  fish: FishSpecies;
  waterType: WaterType;
  units: Units;
}

export interface ForecastResult {
  verdict: "GO" | "WAIT";
  confidence: "high" | "medium" | "low";
  oneReason: string;
  score: number;
  analysis: string;
  bestWindows: Array<{ time: string; score: number }>;
  lures: string[];
  disclaimer: string;
  weightUnit: "lbs" | "kg";
  weather: {
    city: string;
    country: string;
    temp: number;
    tempUnit: string;
    pressureHpa: number;
    windSpeed: number;
    windUnit: string;
    windDir: string;
    clouds: number;
    humidity: number;
  };
  moonPhase: string;
  season: string;
  fish: FishSpecies;
  waterType: WaterType;
  units: Units;
  generatedAt: string;
  cached: boolean;
  personalNote: string | null;
}

export interface GeocodeResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
}

// FishCast's forecast + geocoding endpoints. Saved spots and catch-log data
// go through the generic `appUserData` module -- this module is only for
// the server-proxied external calls (weather/AI/geocoding/photo upload).
export function createFishCastModule(config: ApiClientConfig) {
  return {
    forecast(input: ForecastInput) {
      return apiRequest<ForecastResult>(config, "/apps/fishcast/forecast", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    geocode(query: string) {
      return apiRequest<{ results: GeocodeResult[] }>(config, `/apps/fishcast/geocode?query=${encodeURIComponent(query)}`);
    },

    reverseGeocode(lat: number, lng: number) {
      return apiRequest<{ result: GeocodeResult | null }>(config, `/apps/fishcast/reverse-geocode?lat=${lat}&lng=${lng}`);
    },

    uploadCatchPhoto(file: File | Blob) {
      return apiUpload<{ url: string }>(config, "/apps/fishcast/catch-photo", file);
    },
  };
}
