import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { retryJsonCall } from "../../lib/openrouter.js";
import { getCurrentWeather, getForecast, getMoonPhase, getSeason, geocode, reverseGeocode } from "../../lib/openweathermap.js";

const PRODUCT_SLUG = "fishcast";
const DEFAULT_AI_DAILY_CAP = 15;
const DEFAULT_CACHE_TTL_HOURS = 12;
// A cheap paid model by default -- same choice as HabitFlow, sidesteps the
// openrouter/free congestion problems documented for Unstuck Daily. The
// client plans to supply a different AI API key/model separately; swapping
// it in later is a one-line env var change since callOpenRouter() already
// accepts a per-call apiKey override.
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

const FISH_SPECIES = ["bass", "trout", "walleye", "catfish", "crappie", "pike", "salmon", "carp", "perch", "other"] as const;
const WATER_TYPES = ["lake", "river", "reservoir", "pond", "ocean"] as const;

const forecastInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fish: z.enum(FISH_SPECIES),
  waterType: z.enum(WATER_TYPES),
  units: z.enum(["imperial", "metric"]),
});

const forecastAiResponseSchema = z.object({
  verdict: z.enum(["GO", "WAIT"]),
  confidence: z.enum(["high", "medium", "low"]),
  oneReason: z.string().min(1),
  score: z.number().min(1).max(10),
  analysis: z.string().min(1),
  bestWindows: z.array(z.object({ time: z.string().min(1), score: z.number().min(1).max(10) })).min(1).max(10),
  lures: z.array(z.string().min(1)).min(1).max(6),
  disclaimer: z.string().min(1),
});

const JSON_ONLY_REMINDER = "Reply with JSON only, nothing else -- no markdown, no code fences, no prose.";

const SYSTEM_PROMPT = `You are a fishing conditions analyst. Always respond in English. Target audience: US anglers (also CA, UK, AU, NZ).
Respond ONLY in valid JSON with this exact structure:
{"verdict": "GO" or "WAIT", "confidence": "high" or "medium" or "low", "oneReason": "single sentence explaining the main factor", "score": number 1-10, "analysis": "2-3 paragraphs explaining why these conditions affect the target fish, what the pressure trend means, and how the moon phase plays in -- write like talking to an experienced angler", "bestWindows": [{"time": "<one entry per forecast step you were given, formatted like '6:00 AM'>", "score": number 1-10}], "lures": ["specific lure with technique, e.g. Rapala X-Rap slow retrieve near bottom", "lure 2", "lure 3"], "disclaimer": "Forecast based on nearest weather station and short-range forecast data. Actual conditions at your specific spot may vary."}`;

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function degToCompass(deg: number): string {
  return COMPASS_POINTS[Math.round(deg / 45) % 8]!;
}

function formatBucketTime(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

interface DailyUsage {
  date: string;
  callsToday: number;
}

interface FishCastCatchEntry {
  result: "caught" | "nothing";
  location: { lat: number; lng: number; name: string };
}

interface FishCastAppData {
  aiUsage?: DailyUsage;
  catches?: FishCastCatchEntry[];
}

function todayUsage(usage: DailyUsage | undefined, today: string): DailyUsage {
  return usage?.date === today ? usage : { date: today, callsToday: 0 };
}

// A separate OpenRouter key for FishCast, matching the HabitFlow pattern --
// falls back to the shared key if unset.
function fishcastApiKey(): string | undefined {
  return process.env.FISHCAST_OPENROUTER_API_KEY;
}

// v1's exact "nearby" definition (combined lat+lng delta under 0.5, roughly
// same lake/region) -- kept for continuity since anglers rarely log the
// exact same GPS point twice.
function personalNote(catches: FishCastCatchEntry[], lat: number, lng: number): string | null {
  const nearby = catches.filter((c) => Math.abs(c.location.lat - lat) + Math.abs(c.location.lng - lng) < 0.5);
  if (nearby.length === 0) return null;
  const caught = nearby.filter((c) => c.result === "caught").length;
  const pct = Math.round((caught / nearby.length) * 100);
  return `You've logged ${nearby.length} trip${nearby.length === 1 ? "" : "s"} near here — ${caught} successful (${pct}%).`;
}

// FishCast's forecast + geocoding proxy. All OpenWeatherMap calls happen
// server-side -- v1 had a real OWM key hardcoded in frontend source for
// geocoding, this fixes that. The forecast itself is cached cross-user by
// location+fish+waterType+units (FishCastForecastCache) -- deliberately
// WITHOUT any per-user catch-history personalization baked into the cached
// AI response, unlike v1 (whose cache key omitted the user id despite the
// prompt including that user's own catch history, leaking one user's
// personalized analysis to every other user querying the same spot).
// Personalization here is a separate, uncached, deterministic note
// computed per-request from the caller's own AppUserData.
export async function fishcastForecastRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.get("/apps/:productSlug/geocode", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }
      const { query } = request.query as { query?: string };
      if (!query || query.trim().length < 2) return reply.send({ results: [] });
      const results = await geocode(query.trim());
      return reply.send({ results });
    });

    instance.get("/apps/:productSlug/reverse-geocode", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }
      const { lat, lng } = request.query as { lat?: string; lng?: string };
      if (!lat || !lng) return reply.code(400).send({ error: "lat and lng are required" });
      const result = await reverseGeocode(Number(lat), Number(lng));
      return reply.send({ result });
    });

    instance.post("/apps/:productSlug/forecast", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const body = forecastInputSchema.parse(request.body);
      const userId = request.user!.id;
      const productId = request.product!.id;

      const existing = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const existingData = (existing?.data ?? {}) as FishCastAppData;

      const latRounded = body.lat.toFixed(2);
      const lngRounded = body.lng.toFixed(2);
      const cacheKey = `${latRounded}:${lngRounded}:${body.fish}:${body.waterType}:${body.units}`;
      const ttlMs = Number(process.env.FISHCAST_FORECAST_CACHE_TTL_HOURS ?? DEFAULT_CACHE_TTL_HOURS) * 60 * 60 * 1000;

      const cached = await instance.prisma.fishCastForecastCache.findUnique({ where: { cacheKey } });
      const isFresh = cached && Date.now() - cached.createdAt.getTime() < ttlMs;

      let payload: Record<string, unknown>;

      if (isFresh) {
        payload = cached.data as Record<string, unknown>;
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const cap = Number(process.env.FISHCAST_AI_DAILY_CAP ?? DEFAULT_AI_DAILY_CAP);
        const usage = todayUsage(existingData.aiUsage, today);
        if (usage.callsToday >= cap) {
          return reply.code(429).send({ error: `Daily forecast limit reached (${cap}/day). Try again tomorrow.` });
        }

        const now = new Date();
        const [weather, forecast] = await Promise.all([
          getCurrentWeather(body.lat, body.lng, body.units),
          getForecast(body.lat, body.lng, body.units),
        ]);
        const moonPhase = getMoonPhase(now);
        const season = getSeason(now, body.lat);
        const tempUnit = body.units === "metric" ? "°C" : "°F";
        const windUnit = body.units === "metric" ? "m/s" : "mph";
        const hemisphere = body.lat >= 0 ? "Northern" : "Southern";

        const bucketLines = forecast
          .map((b) => `${formatBucketTime(b.time)}: pressure ${b.pressureHpa} hPa, wind ${b.windSpeed} ${windUnit}, clouds ${b.clouds}%, temp ${b.temp}${tempUnit}`)
          .join("\n");

        const userMessage = `Location: ${weather.city}, ${weather.country}
Water body: ${body.waterType}
Target fish: ${body.fish}
Season: ${season} (${hemisphere} hemisphere)

Current conditions:
- Atmospheric pressure: ${weather.pressureHpa} hPa
- Air temperature: ${weather.temp}${tempUnit}
- Wind: ${weather.windSpeed} ${windUnit} from ${degToCompass(weather.windDeg)}
- Cloud cover: ${weather.clouds}%
- Moon phase: ${moonPhase}

Forecast over the next ~24 hours (real 3-hour steps):
${bucketLines}`;

        const model = process.env.FISHCAST_OPENROUTER_MODEL ?? DEFAULT_MODEL;
        const { parsed, lastError } = await retryJsonCall([model, model], SYSTEM_PROMPT, userMessage, forecastAiResponseSchema, {
          maxTokens: 1000,
          jsonOnlyReminder: JSON_ONLY_REMINDER,
          apiKey: fishcastApiKey(),
        });

        if (!parsed) {
          request.log.error({ err: lastError }, "FishCast forecast call failed");
          return reply.code(502).send({ error: "Couldn't reach the forecast service just now -- try again in a moment." });
        }

        payload = {
          ...parsed,
          weightUnit: body.units === "metric" ? "kg" : "lbs",
          weather: {
            city: weather.city,
            country: weather.country,
            temp: weather.temp,
            tempUnit,
            pressureHpa: weather.pressureHpa,
            windSpeed: weather.windSpeed,
            windUnit,
            windDir: degToCompass(weather.windDeg),
            clouds: weather.clouds,
            humidity: weather.humidity,
          },
          moonPhase,
          season,
          fish: body.fish,
          waterType: body.waterType,
          units: body.units,
          generatedAt: now.toISOString(),
        };

        await instance.prisma.fishCastForecastCache.upsert({
          where: { cacheKey },
          create: { cacheKey, data: payload as Prisma.InputJsonValue },
          update: { data: payload as Prisma.InputJsonValue, createdAt: now },
        });

        const nextUsage: DailyUsage = { date: today, callsToday: usage.callsToday + 1 };
        const nextData = { ...existingData, aiUsage: nextUsage } as unknown as Prisma.InputJsonValue;
        await instance.prisma.appUserData.upsert({
          where: { userId_productId: { userId, productId } },
          create: { userId, productId, data: nextData },
          update: { data: nextData },
        });
      }

      const note = personalNote(existingData.catches ?? [], body.lat, body.lng);

      return reply.send({ ...payload, cached: Boolean(isFresh), personalNote: note });
    });
  });
}
