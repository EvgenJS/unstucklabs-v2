import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

// Registered globally with a generous default; auth routes apply a stricter
// per-route override (see modules/auth/auth.routes.ts).
export const rateLimitPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });
});
