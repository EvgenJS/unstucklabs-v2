import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";

export const cookiePlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(cookie);
});
