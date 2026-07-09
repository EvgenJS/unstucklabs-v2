import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

// Every subdomain (store, admin, each mini-app) needs to send/receive the
// shared-domain auth cookie, so CORS must allow credentials and match against
// an explicit origin list rather than a wildcard.
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
  "http://localhost:5174",
];

export const corsPlugin = fp(async (fastify: FastifyInstance) => {
  const configured = process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = configured?.length ? configured : DEFAULT_DEV_ORIGINS;

  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });
});
