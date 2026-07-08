import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const splitTaskSchema = z.object({
  taskTitle: z.string().min(1).max(500),
  brainDump: z.string().max(2000).optional(),
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
const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

interface UnstuckDailyAiUsage {
  date: string;
  callsToday: number;
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model response");
  return JSON.parse(match[0]);
}

async function callOpenRouter(userMessage: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenRouter");
    return extractJson(content);
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

      let parsed: z.infer<typeof aiResponseSchema>;
      try {
        let raw = await callOpenRouter(userMessage);
        let result = aiResponseSchema.safeParse(raw);
        if (!result.success) {
          raw = await callOpenRouter(`${userMessage}\n\n${JSON_ONLY_REMINDER}`);
          result = aiResponseSchema.safeParse(raw);
        }
        if (!result.success) {
          request.log.error({ err: result.error }, "AI response failed validation twice");
          return reply.code(502).send({ error: "Couldn't reach the AI coach just now -- try again in a moment." });
        }
        parsed = result.data;
      } catch (err) {
        request.log.error(err, "OpenRouter call failed");
        return reply.code(502).send({ error: "Couldn't reach the AI coach just now -- try again in a moment." });
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
  });
}
