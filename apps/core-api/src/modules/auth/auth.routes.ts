import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createAuthService, EmailAlreadyRegisteredError, InvalidCredentialsError, InvalidRefreshTokenError } from "./auth.service.js";
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie } from "../../lib/refresh-cookie.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function serializeUser(user: { id: string; email: string; createdAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function authRoutes(fastify: FastifyInstance) {
  const authService = createAuthService(fastify.prisma);

  // Auth routes get a stricter rate limit than the global default -- these
  // are the endpoints most worth throttling against credential stuffing.
  const authRateLimit = { rateLimit: { max: 10, timeWindow: "1 minute" } };

  fastify.post("/auth/register", { config: authRateLimit }, async (request, reply) => {
    const body = credentialsSchema.parse(request.body);

    try {
      const { user, accessToken, refreshToken } = await authService.register(body.email, body.password);
      setRefreshCookie(reply, refreshToken);
      return reply.code(201).send({ user: serializeUser(user), accessToken });
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        return reply.code(409).send({ error: "Email already registered" });
      }
      throw err;
    }
  });

  fastify.post("/auth/login", { config: authRateLimit }, async (request, reply) => {
    const body = credentialsSchema.parse(request.body);

    try {
      const { user, accessToken, refreshToken } = await authService.login(body.email, body.password);
      setRefreshCookie(reply, refreshToken);
      return reply.send({ user: serializeUser(user), accessToken });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.code(401).send({ error: "Invalid email or password" });
      }
      throw err;
    }
  });

  fastify.post("/auth/refresh", { config: authRateLimit }, async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Missing refresh token" });
    }

    try {
      const { user, accessToken, refreshToken } = await authService.refresh(token);
      setRefreshCookie(reply, refreshToken);
      return reply.send({ user: serializeUser(user), accessToken });
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) {
        clearRefreshCookie(reply);
        return reply.code(401).send({ error: "Invalid or expired refresh token" });
      }
      throw err;
    }
  });

  fastify.post("/auth/logout", async (_request, reply) => {
    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  fastify.get("/auth/me", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await authService.me(request.user!.id);
    if (!user) return reply.code(404).send({ error: "User not found" });
    return reply.send({
      ...serializeUser(user),
      roles: user.memberships.map((m) => m.role),
    });
  });
}
