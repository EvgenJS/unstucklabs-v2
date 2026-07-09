import type { z } from "zod";

// Shared low-level OpenRouter plumbing used by every mini-app's AI routes.
// Each app's own system prompt, response schema, and model choice stay in
// that app's own routes file -- those are legitimately per-app. What's
// shared here is just "call the chat-completions endpoint, extract JSON
// from the response, retry across a list of models with backoff."

export function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model response");
  return JSON.parse(match[0]);
}

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userMessage: string,
  opts?: { maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 30_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts?.maxTokens ?? 1200,
        temperature: opts?.temperature ?? 0.4,
        messages: [
          { role: "system", content: systemPrompt },
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

const DEFAULT_JSON_ONLY_REMINDER = "Reply with JSON only, nothing else -- no markdown, no code fences, no prose.";

export interface RetryJsonCallResult<T> {
  parsed?: T;
  succeededModel?: string;
  lastError?: unknown;
}

// Walks `attemptPlan` (a list of models, tried in order) with a short
// backoff between tries, validating each response against `schema`. Stops
// at the first success. Callers that care which model actually succeeded
// (e.g. to log a warning when a paid fallback fires) can read
// `succeededModel` off the result.
export async function retryJsonCall<T>(
  attemptPlan: string[],
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  opts?: { maxTokens?: number; temperature?: number; jsonOnlyReminder?: string; backoffMs?: number }
): Promise<RetryJsonCallResult<T>> {
  const jsonOnlyReminder = opts?.jsonOnlyReminder ?? DEFAULT_JSON_ONLY_REMINDER;
  let lastError: unknown;

  for (let i = 0; i < attemptPlan.length; i++) {
    const model = attemptPlan[i]!;
    try {
      const message = i === 0 ? userMessage : `${userMessage}\n\n${jsonOnlyReminder}`;
      const raw = await callOpenRouter(model, systemPrompt, message, opts);
      const result = schema.safeParse(raw);
      if (result.success) {
        return { parsed: result.data, succeededModel: model };
      }
      lastError = result.error;
    } catch (err) {
      lastError = err;
    }
    if (i < attemptPlan.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, opts?.backoffMs ?? 1000));
    }
  }

  return { lastError };
}
