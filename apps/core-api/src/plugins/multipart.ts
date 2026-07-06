import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

// Global cap generous enough for video uploads; per-type limits (images vs
// video) are enforced in the route handler itself, after we know the mime
// type of the specific part being uploaded.
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

export const multipartPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
});
