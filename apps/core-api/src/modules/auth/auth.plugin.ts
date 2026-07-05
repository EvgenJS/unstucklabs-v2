import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../../lib/jwt.js";

// Decorates `fastify.authenticate` -- verifies the Bearer access token and
// sets request.user. Registered once at the app level so every module's
// routes reuse it as a preHandler instead of duplicating token checks.
// RBAC (`requireRole`) is a separate decorator in modules/admin/rbac.plugin.ts,
// composed as a second preHandler after this one.
export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

    if (!token) {
      return reply.code(401).send({ error: "Missing access token" });
    }

    try {
      const payload = verifyAccessToken(token);
      request.user = { id: payload.sub };
    } catch {
      return reply.code(401).send({ error: "Invalid or expired access token" });
    }
  });
});
