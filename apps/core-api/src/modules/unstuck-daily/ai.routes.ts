import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { retryJsonCall } from "../../lib/openrouter.js";

const splitTaskSchema = z.object({
  taskTitle: z.string().min(1).max(500),
  brainDump: z.string().max(2000).optional(),
});

const findResourcesSchema = z.object({
  subtaskTitle: z.string().min(1).max(300),
  taskTitle: z.string().max(500).optional(),
});

const aiResponseSchema = z.object({
  subtasks: z.array(z.string().min(1)).min(1).max(10),
  estimateMinutes: z.number().int().positive(),
  encouragement: z.string().min(1),
});

const SYSTEM_PROMPT = `You are Uno, a warm and encouraging time-management coach who feels like the
user's smartest, most supportive best friend -- not a clinical productivity
app. The user struggles to start big, overwhelming tasks (maybe ADHD, maybe
anxiety, maybe just being human). They'll describe ONE big task, sometimes
with extra context or worries first ("brain dump"). Your job:
1. Break the task into 3-7 small, concrete, doable subtasks. Each starts with
   a verb and is specific enough to just do -- no vague steps like "work on
   it" or "figure out logistics."
2. Order them in the sequence that actually makes sense to execute.
3. Estimate a realistic but generous total time in minutes for the whole
   task -- err on giving room, never on creating pressure.
4. Write one warm, specific sentence of encouragement about THIS task (not
   generic "you got this!" filler).
5. Never be clinical, judgmental, or guilt-inducing. No "you should have."
   Always sound like you're in this with them.
6. Respond with ONLY valid JSON, no prose before or after, in this exact shape:
{"subtasks": ["...", "..."], "estimateMinutes": <integer>, "encouragement": "..."}`;

const JSON_ONLY_REMINDER = "Reply with JSON only, nothing else -- no markdown, no code fences, no prose.";

const PRODUCT_SLUG = "unstuck-daily";
const DEFAULT_DAILY_CAP = 15;
const DEFAULT_RESOURCES_DAILY_CAP = 10;
// openrouter/free is OpenRouter's auto-router across ALL currently-free
// models -- more resilient than pinning one model+provider combo (e.g.
// meta-llama/llama-3.3-70b-instruct:free was found to be persistently
// rate-limited upstream via its Venice provider during testing). Override
// via OPENROUTER_MODEL to pin a specific model if ever needed.
const DEFAULT_MODEL = "openrouter/free";

interface UnstuckDailyAiUsage {
  date: string;
  callsToday: number;
}

interface Resource {
  title: string;
  url: string;
}

// Attempt plan: retry the free auto-router twice (it re-samples routing on
// every call, so a second attempt often lands on a different, unblocked
// provider), then fall through to a specific free model, then -- only if
// every free option failed -- a paid call on the same model so the user
// essentially never sees a hard failure. OPENROUTER_FALLBACK_MODEL requires
// the account's OpenRouter privacy/data-policy settings to allow free-tier
// providers (https://openrouter.ai/settings/privacy); until that's enabled
// it 404s and this step is silently skipped. OPENROUTER_PAID_FALLBACK_MODEL
// costs real (tiny, ~$0.00004/call) money -- leave unset to disable it.
function buildAttemptPlan(): string[] {
  const primary = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const freeFallback = process.env.OPENROUTER_FALLBACK_MODEL;
  const paidFallback = process.env.OPENROUTER_PAID_FALLBACK_MODEL;

  const plan = [primary, primary];
  if (freeFallback && freeFallback !== primary) plan.push(freeFallback);
  if (paidFallback) plan.push(paidFallback);
  return plan;
}

// Grounds the model with a real web search via OpenRouter's built-in "web"
// plugin, then reads the real source URLs straight out of the response's
// `annotations` (type "url_citation") rather than trusting the model to
// author a JSON list in its own text -- reasoning models routed through
// openrouter/free were observed spending their whole token budget on visible
// chain-of-thought and returning content: null, but the annotations array is
// still populated by the search step regardless. This costs real (tiny)
// money per call via the web plugin itself, independent of the model being
// "free" -- that's why it's a separate, explicitly user-triggered endpoint
// with its own daily cap rather than folded into split-task.
async function callOpenRouterWithWebSearch(model: string, userMessage: string): Promise<Resource[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        plugins: [{ id: "web", max_results: 4 }],
        max_tokens: 600,
        temperature: 0.3,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: { annotations?: Array<{ type?: string; url_citation?: { url?: string; title?: string } }> };
      }>;
    };
    const annotations = payload.choices?.[0]?.message?.annotations ?? [];

    const seen = new Set<string>();
    const resources: Resource[] = [];
    for (const a of annotations) {
      const url = a.url_citation?.url;
      const title = a.url_citation?.title;
      if (!url || !title || seen.has(url)) continue;
      seen.add(url);
      resources.push({ title, url });
    }
    return resources;
  } finally {
    clearTimeout(timeout);
  }
}

// AI proxy for Unstuck Daily's task-breakdown feature. Server-side only,
// since it holds the OpenRouter API key -- gated by requireProductAccess()
// so an inactive/unsubscribed user can never trigger a paid-model call (the
// model itself is free, but this is still an abuse backstop). Side-effect
// light: only the aiUsage counter is persisted here; the client persists the
// accepted breakdown into currentTask via PUT /apps/:productSlug/data.
export async function unstuckDailyAiRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.post("/apps/:productSlug/ai/split-task", async (request, reply) => {
      // This route's business logic (system prompt, OpenRouter model) is
      // hardcoded to Unstuck Daily -- requireProductAccess() only checks
      // subscription status generically, so guard the slug too.
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const body = splitTaskSchema.parse(request.body);
      const userId = request.user!.id;
      const productId = request.product!.id;

      const existing = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const existingData = (existing?.data ?? {}) as { aiUsage?: UnstuckDailyAiUsage };
      const today = new Date().toISOString().slice(0, 10);
      const cap = Number(process.env.UNSTUCK_DAILY_AI_DAILY_CAP ?? DEFAULT_DAILY_CAP);

      const usage: UnstuckDailyAiUsage =
        existingData.aiUsage?.date === today ? existingData.aiUsage : { date: today, callsToday: 0 };

      if (usage.callsToday >= cap) {
        return reply.code(429).send({ error: `Daily AI limit reached (${cap}/day). Try again tomorrow.` });
      }

      const userMessage = body.brainDump
        ? `Brain dump: ${body.brainDump}\n\nThe task: ${body.taskTitle}`
        : `The task: ${body.taskTitle}`;

      // Free-tier flakiness observed during testing: per-model upstream rate
      // limits, transient provider infra errors (502s), reasoning models
      // occasionally returning malformed/empty content, and -- when the
      // whole openrouter/free pool is congested -- 429s on every attempt.
      // None of these are specific to a single request, so we walk a plan of
      // models (see buildAttemptPlan) with a short backoff between tries
      // rather than failing the user's very first attempt.
      const attemptPlan = buildAttemptPlan();
      const { parsed, succeededModel, lastError } = await retryJsonCall(
        attemptPlan,
        SYSTEM_PROMPT,
        userMessage,
        aiResponseSchema,
        { jsonOnlyReminder: JSON_ONLY_REMINDER }
      );

      if (!parsed) {
        request.log.error({ err: lastError, attemptPlan }, `AI call failed after ${attemptPlan.length} attempts`);
        return reply.code(502).send({ error: "Couldn't reach the AI coach just now -- try again in a moment." });
      }

      if (succeededModel === process.env.OPENROUTER_PAID_FALLBACK_MODEL) {
        request.log.warn({ model: succeededModel, userId }, "AI request fell back to paid model");
      }

      const nextUsage: UnstuckDailyAiUsage = { date: today, callsToday: usage.callsToday + 1 };
      const nextData = { ...existingData, aiUsage: nextUsage } as unknown as Prisma.InputJsonValue;

      await instance.prisma.appUserData.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, data: nextData },
        update: { data: nextData },
      });

      return reply.send(parsed);
    });

    // Explicitly user-triggered ("find resources for this step" button), not
    // called automatically per subtask -- the web-search plugin costs real
    // money on every call regardless of the underlying model's own price, so
    // it gets its own opt-in daily cap separate from split-task's.
    instance.post("/apps/:productSlug/ai/find-resources", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const body = findResourcesSchema.parse(request.body);
      const userId = request.user!.id;
      const productId = request.product!.id;

      const existing = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const existingData = (existing?.data ?? {}) as { resourcesUsage?: UnstuckDailyAiUsage };
      const today = new Date().toISOString().slice(0, 10);
      const cap = Number(process.env.UNSTUCK_DAILY_RESOURCES_DAILY_CAP ?? DEFAULT_RESOURCES_DAILY_CAP);

      const usage: UnstuckDailyAiUsage =
        existingData.resourcesUsage?.date === today
          ? existingData.resourcesUsage
          : { date: today, callsToday: 0 };

      if (usage.callsToday >= cap) {
        return reply.code(429).send({ error: `Daily resource-search limit reached (${cap}/day). Try again tomorrow.` });
      }

      const userMessage = body.taskTitle
        ? `Find 3-4 helpful, reputable resources (tutorials, guides, or tools) for this specific step: "${body.subtaskTitle}". It's part of a larger task: "${body.taskTitle}".`
        : `Find 3-4 helpful, reputable resources (tutorials, guides, or tools) for this specific step: "${body.subtaskTitle}".`;

      const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
      let resources: Resource[] | undefined;
      let lastError: unknown;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          resources = await callOpenRouterWithWebSearch(model, userMessage);
          if (resources.length > 0) break;
        } catch (err) {
          lastError = err;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!resources || resources.length === 0) {
        request.log.error({ err: lastError }, "Resource search failed or found nothing");
        return reply.code(502).send({ error: "Couldn't find resources just now -- try again in a moment." });
      }

      const nextUsage: UnstuckDailyAiUsage = { date: today, callsToday: usage.callsToday + 1 };
      const nextData = { ...existingData, resourcesUsage: nextUsage } as unknown as Prisma.InputJsonValue;

      await instance.prisma.appUserData.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, data: nextData },
        update: { data: nextData },
      });

      return reply.send({ resources });
    });
  });
}
