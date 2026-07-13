// Shared low-level OpenWeatherMap plumbing for FishCast -- mirrors
// lib/openrouter.ts's split: this file only knows how to call OWM's REST
// endpoints and shape the response; FishCast's own routes own the AI
// prompt/caching/business logic built on top. Keeping this server-side
// (never called from the browser) is a deliberate fix over v1, which had
// a real OpenWeatherMap API key hardcoded in frontend source.

const OWM_BASE = "https://api.openweathermap.org";

function apiKey(): string {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) throw new Error("OPENWEATHERMAP_API_KEY not configured");
  return key;
}

async function owmFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${OWM_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("appid", apiKey());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeatherMap request failed: ${response.status} ${path}`);
  }
  return (await response.json()) as T;
}

export interface CurrentWeather {
  city: string;
  country: string;
  temp: number;
  pressureHpa: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  humidity: number;
}

// "Current Weather Data" endpoint -- data/2.5/weather.
export async function getCurrentWeather(lat: number, lng: number, units: "imperial" | "metric"): Promise<CurrentWeather> {
  const raw = await owmFetch<{
    name: string;
    sys: { country: string };
    main: { temp: number; pressure: number; humidity: number };
    wind: { speed: number; deg: number };
    clouds: { all: number };
  }>("/data/2.5/weather", { lat: String(lat), lon: String(lng), units });

  return {
    city: raw.name,
    country: raw.sys.country,
    temp: raw.main.temp,
    pressureHpa: raw.main.pressure,
    windSpeed: raw.wind.speed,
    windDeg: raw.wind.deg,
    clouds: raw.clouds.all,
    humidity: raw.main.humidity,
  };
}

export interface ForecastBucket {
  time: string; // ISO timestamp of this 3-hour window
  temp: number;
  pressureHpa: number;
  windSpeed: number;
  clouds: number;
}

// "5 Day / 3 Hour Forecast" endpoint -- data/2.5/forecast. Real hourly-ish
// (3-hour-step) data, unlike v1 which only ever called current-conditions
// and had the AI invent a fake 24-value heatmap from one snapshot. Returns
// the next ~8 buckets (~24h).
export async function getForecast(lat: number, lng: number, units: "imperial" | "metric"): Promise<ForecastBucket[]> {
  const raw = await owmFetch<{
    list: Array<{
      dt_txt: string;
      main: { temp: number; pressure: number };
      wind: { speed: number };
      clouds: { all: number };
    }>;
  }>("/data/2.5/forecast", { lat: String(lat), lon: String(lng), units });

  return raw.list.slice(0, 8).map((bucket) => ({
    time: bucket.dt_txt,
    temp: bucket.main.temp,
    pressureHpa: bucket.main.pressure,
    windSpeed: bucket.wind.speed,
    clouds: bucket.clouds.all,
  }));
}

export interface GeocodeResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const raw = await owmFetch<Array<{ name: string; country: string; state?: string; lat: number; lon: number }>>(
    "/geo/1.0/direct",
    { q: query, limit: "5" }
  );
  return raw.map((r) => ({ name: r.name, country: r.country, state: r.state, lat: r.lat, lng: r.lon }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const raw = await owmFetch<Array<{ name: string; country: string; state?: string; lat: number; lon: number }>>(
    "/geo/1.0/reverse",
    { lat: String(lat), lon: String(lng), limit: "1" }
  );
  const first = raw[0];
  if (!first) return null;
  return { name: first.name, country: first.country, state: first.state, lat: first.lat, lng: first.lon };
}

// Julian-day moon-phase and meteorological-season calculations, ported
// verbatim from v1's backend/src/lib/moonPhase.ts (working math, no reason
// to redesign it).
export function getMoonPhase(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let y = year;
  let m = month;
  if (m < 3) {
    y--;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  const daysSinceNew = (jd - 2451549.5) % 29.53058867;
  const phase = daysSinceNew < 0 ? daysSinceNew + 29.53058867 : daysSinceNew;

  if (phase < 1.85) return "New Moon";
  if (phase < 7.38) return "Waxing Crescent";
  if (phase < 9.22) return "First Quarter";
  if (phase < 14.77) return "Waxing Gibbous";
  if (phase < 16.61) return "Full Moon";
  if (phase < 22.15) return "Waning Gibbous";
  if (phase < 23.99) return "Last Quarter";
  if (phase < 29.53) return "Waning Crescent";
  return "New Moon";
}

export function getSeason(date: Date, lat: number): string {
  const month = date.getMonth() + 1;
  const isNorthern = lat >= 0;
  const northSeason =
    month >= 3 && month <= 5 ? "Spring" : month >= 6 && month <= 8 ? "Summer" : month >= 9 && month <= 11 ? "Fall" : "Winter";
  if (isNorthern) return northSeason;
  const flip: Record<string, string> = { Spring: "Fall", Fall: "Spring", Summer: "Winter", Winter: "Summer" };
  return flip[northSeason]!;
}
