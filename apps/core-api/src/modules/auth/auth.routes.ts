import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createAuthService,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  EmailNotVerifiedError,
  InvalidVerificationTokenError,
} from "./auth.service.js";
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie } from "../../lib/refresh-cookie.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const emailSchema = z.object({
  email: z.string().email(),
});

const tokenSchema = z.object({
  token: z.string().min(1),
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
      // No refreshToken in this branch -- registration no longer implies a
      // session, the account must be verified first (see auth.service.ts).
      const { user, accessToken } = await authService.register(body.email, body.password);
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
      if (err instanceof EmailNotVerifiedError) {
        return reply.code(403).send({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
      }
      throw err;
    }
  });

  fastify.get("/auth/verify-email", { config: authRateLimit }, async (request, reply) => {
    const query = tokenSchema.parse(request.query);

    try {
      const { user, accessToken, refreshToken } = await authService.verifyEmail(query.token);
      setRefreshCookie(reply, refreshToken);
      return reply.send({ user: serializeUser(user), accessToken });
    } catch (err) {
      if (err instanceof InvalidVerificationTokenError) {
        return reply.code(400).send({ error: "This verification link is invalid or has expired." });
      }
      throw err;
    }
  });

  fastify.post("/auth/resend-verification", { config: authRateLimit }, async (request, reply) => {
    const body = emailSchema.parse(request.body);
    await authService.resendVerification(body.email);
    // Always the same response, whether or not the account exists or was
    // already verified -- see resendVerification()'s own comment.
    return reply.code(202).send({ message: "If that account exists, a verification email is on its way." });
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
