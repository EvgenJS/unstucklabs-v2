import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const putDataSchema = z.object({
  data: z.unknown(),
});

// Generic per-mini-app user data store. Every mini-app (Unstuck Daily and
// whatever comes after it) reads/writes one JSON blob per user+product here
// instead of getting its own relational tables -- see CLAUDE.md's AppUserData
// convention. This module owns ONLY ownership + access enforcement; it never
// interprets the shape of `data`, that's each mini-app's own concern.
export async function appUserDataRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.get("/apps/:productSlug/data", async (request) => {
      const product = request.product!;
      const row = await instance.prisma.appUserData.findUnique({
        where: { userId_productId: { userId: request.user!.id, productId: product.id } },
      });
      return { data: row?.data ?? null };
    });

    instance.put("/apps/:productSlug/data", async (request, reply) => {
      const product = request.product!;
      const body = putDataSchema.parse(request.body);
      const data = body.data as Prisma.InputJsonValue;

      const row = await instance.prisma.appUserData.upsert({
        where: { userId_productId: { userId: request.user!.id, productId: product.id } },
        create: { userId: request.user!.id, productId: product.id, data },
        update: { data },
      });

      return reply.send({ data: row.data });
    });
  });
}
