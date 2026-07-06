import fp from "fastify-plugin";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import { mkdir } from "node:fs/promises";
import { UPLOAD_DIR } from "../lib/storage.js";

// Serves locally-stored product media at /uploads/... . In production this
// would typically be handled by Nginx directly (see CLAUDE.md's deployment
// model), but core-api serving it too keeps local dev self-contained.
export const staticPlugin = fp(async (fastify: FastifyInstance) => {
  await mkdir(UPLOAD_DIR, { recursive: true });

  await fastify.register(fastifyStatic, {
    root: UPLOAD_DIR,
    prefix: "/uploads/",
  });
});
