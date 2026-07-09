import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { retryJsonCall } from "../../lib/openrouter.js";

const PRODUCT_SLUG = "habitflow";
const DEFAULT_AI_DAILY_CAP = 15;
const DEFAULT_RECOVERY_DAILY_CAP = 5;
// A cheap paid model, deliberately not the free tier -- sidesteps the
// openrouter/free congestion problems documented for Unstuck Daily (see
// docs/ROADMAP.md's Phase 4+ follow-up). Already proven reliable/cheap as
// Unstuck Daily's OPENROUTER_PAID_FALLBACK_MODEL.
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const RECOVERY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const coachInputSchema = z.object({
  habits: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        streak: z.number().int().nonnegative(),
        last7DaysCompleted: z.number().int().min(0).max(7),
      })
    )
    .min(1)
    .max(50),
});

const coachResponseSchema = z.object({
  consistencyScore: z.number().int().min(0).max(100),
  encouragement: z.string().min(1),
  insights: z
    .array(
      z.object({
        type: z.enum(["success", "warning", "tip"]),
        text: z.string().min(1),
      })
    )
    .min(1)
    .max(6),
});

const recoveryInputSchema = z.object({
  habitId: z.string().min(1),
  habitName: z.string().min(1).max(200),
});

const recoveryResponseSchema = z.object({
  suggestion: z.string().min(1),
  rationale: z.string().min(1),
});

const COACH_SYSTEM_PROMPT = `You are a warm, encouraging habit coach -- direct but never
clinical or judgmental. You'll receive a user's recent habit-tracking data
(per-habit streaks and completion counts over the last 7 days). Your job:
1. Compute an overall consistency score from 0-100 reflecting how well
   they're sticking to their habits this week -- be fair, not harsh.
2. Write one warm, specific sentence of encouragement mentioning at least
   one actual habit by name (not generic "you got this!" filler).
3. Give 3-4 short, specific insights about their patterns. Each insight has
   a type: "success" (something going well), "warning" (something slipping,
   said gently, never guilt-inducing), or "tip" (one concrete, actionable
   suggestion).
4. Never use clinical or shame-based language. No "you failed to," no "you
   should have." Frame everything as forward-looking.
5. Respond with ONLY valid JSON, no prose before or after, in this exact shape:
{"consistencyScore": <integer 0-100>, "encouragement": "...", "insights": [{"type": "success"|"warning"|"tip", "text": "..."}]}`;

const RECOVERY_SYSTEM_PROMPT = `You are a warm, encouraging habit coach helping someone
whose streak on one habit is about to break because they missed yesterday.
Your job: suggest ONE smaller, easier version of the habit they can still do
today to keep their streak alive -- not the full habit, something genuinely
lighter and quick. Then give one short, warm sentence explaining why even
this small version counts.
Never be clinical or guilt-inducing about the missed day -- focus entirely
forward, on today's small win.
Respond with ONLY valid JSON, no prose before or after, in this exact shape:
{"suggestion": "<the smaller version of the habit, one sentence>", "rationale": "<why it counts, one sentence>"}`;

const JSON_ONLY_REMINDER = "Reply with JSON only, nothing else -- no markdown, no code fences, no prose.";

interface DailyUsage {
  date: string;
  callsToday: number;
}

interface RecoveryUsageEntry {
  habitId: string;
  usedAt: string;
}

interface HabitFlowUsageData {
  aiUsage?: DailyUsage;
  recoveryUsage?: DailyUsage;
  recoveries?: RecoveryUsageEntry[];
}

function todayUsage(usage: DailyUsage | undefined, today: string): DailyUsage {
  return usage?.date === today ? usage : { date: today, callsToday: 0 };
}

// A separate OpenRouter key for HabitFlow, distinct from the shared
// OPENROUTER_API_KEY used by Unstuck Daily -- lets each app's OpenRouter
// spend be tracked/capped independently. Falls back to the shared key if
// unset, so a fresh clone still works with just one key configured.
function habitflowApiKey(): string | undefined {
  return process.env.HABITFLOW_OPENROUTER_API_KEY;
}

// AI proxy for HabitFlow's coach + recovery-day features. Server-side only,
// since it holds the OpenRouter API key -- gated by requireProductAccess()
// (which treats TRIALING identically to ACTIVE, so the 5-day free trial
// grants full access to these too). Both endpoints are side-effect light:
// only usage counters (and, for recovery, the usage record itself) are
// persisted here; the client persists habit/streak state via the generic
// PUT /apps/:productSlug/data.
export async function habitflowAiRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.post("/apps/:productSlug/ai/coach", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const body = coachInputSchema.parse(request.body);
      const userId = request.user!.id;
      const productId = request.product!.id;

      const existing = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const existingData = (existing?.data ?? {}) as HabitFlowUsageData;
      const today = new Date().toISOString().slice(0, 10);
      const cap = Number(process.env.HABITFLOW_AI_DAILY_CAP ?? DEFAULT_AI_DAILY_CAP);
      const usage = todayUsage(existingData.aiUsage, today);

      if (usage.callsToday >= cap) {
        return reply.code(429).send({ error: `Daily AI limit reached (${cap}/day). Try again tomorrow.` });
      }

      const userMessage = `Habit data (last 7 days):\n${JSON.stringify(body.habits, null, 2)}`;
      const model = process.env.HABITFLOW_OPENROUTER_MODEL ?? DEFAULT_MODEL;
      // No multi-model fallback chain -- this is a paid model with no
      // free-tier congestion problem to route around, so a couple of
      // attempts against the same model covers transient errors.
      const attemptPlan = [model, model];

      const { parsed, lastError } = await retryJsonCall(attemptPlan, COACH_SYSTEM_PROMPT, userMessage, coachResponseSchema, {
        maxTokens: 800,
        jsonOnlyReminder: JSON_ONLY_REMINDER,
        apiKey: habitflowApiKey(),
      });

      if (!parsed) {
        request.log.error({ err: lastError }, "HabitFlow coach call failed");
        return reply.code(502).send({ error: "Couldn't reach the AI coach just now -- try again in a moment." });
      }

      const nextUsage: DailyUsage = { date: today, callsToday: usage.callsToday + 1 };
      const nextData = { ...existingData, aiUsage: nextUsage } as unknown as Prisma.InputJsonValue;

      await instance.prisma.appUserData.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, data: nextData },
        update: { data: nextData },
      });

      return reply.send(parsed);
    });

    instance.post("/apps/:productSlug/ai/recovery-day", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const body = recoveryInputSchema.parse(request.body);
      const userId = request.user!.id;
      const productId = request.product!.id;

      const existing = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const existingData = (existing?.data ?? {}) as HabitFlowUsageData;
      const today = new Date().toISOString().slice(0, 10);
      const cap = Number(process.env.HABITFLOW_RECOVERY_DAILY_CAP ?? DEFAULT_RECOVERY_DAILY_CAP);
      const usage = todayUsage(existingData.recoveryUsage, today);

      if (usage.callsToday >= cap) {
        return reply.code(429).send({ error: `Daily recovery-day limit reached (${cap}/day). Try again tomorrow.` });
      }

      // Server-enforced guard: at most one recovery per habit per rolling
      // 7 days, regardless of what the client's own UI check allows.
      const recoveries = existingData.recoveries ?? [];
      const windowStart = Date.now() - RECOVERY_WINDOW_MS;
      const recentlyUsed = recoveries.some(
        (r) => r.habitId === body.habitId && new Date(r.usedAt).getTime() > windowStart
      );
      if (recentlyUsed) {
        return reply.code(429).send({ error: "You've already used a recovery day for this habit this week." });
      }

      const userMessage = `The habit: "${body.habitName}". The user missed it yesterday and their streak would break today without a smaller makeup action.`;
      const model = process.env.HABITFLOW_OPENROUTER_MODEL ?? DEFAULT_MODEL;
      const attemptPlan = [model, model];

      const { parsed, lastError } = await retryJsonCall(
        attemptPlan,
        RECOVERY_SYSTEM_PROMPT,
        userMessage,
        recoveryResponseSchema,
        { maxTokens: 300, jsonOnlyReminder: JSON_ONLY_REMINDER, apiKey: habitflowApiKey() }
      );

      if (!parsed) {
        request.log.error({ err: lastError }, "HabitFlow recovery-day call failed");
        return reply.code(502).send({ error: "Couldn't reach the AI coach just now -- try again in a moment." });
      }

      const nextUsage: DailyUsage = { date: today, callsToday: usage.callsToday + 1 };
      const nextRecoveries: RecoveryUsageEntry[] = [
        ...recoveries,
        { habitId: body.habitId, usedAt: new Date().toISOString() },
      ];
      const nextData = {
        ...existingData,
        recoveryUsage: nextUsage,
        recoveries: nextRecoveries,
      } as unknown as Prisma.InputJsonValue;

      await instance.prisma.appUserData.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, data: nextData },
        update: { data: nextData },
      });

      return reply.send(parsed);
    });
  });
}
