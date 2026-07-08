import type { FastifyInstance } from "fastify";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const PRODUCT_SLUG = "unstuck-daily";

export async function pushRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.post("/apps/:productSlug/push/subscribe", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }
      const body = subscribeSchema.parse(request.body);
      const userAgent = request.headers["user-agent"];

      await instance.prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        create: {
          userId: request.user!.id,
          productId: request.product!.id,
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          userAgent,
        },
        update: {
          userId: request.user!.id,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          userAgent,
        },
      });

      return reply.code(201).send({ ok: true });
    });

    instance.delete("/apps/:productSlug/push/subscribe", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }
      const body = unsubscribeSchema.parse(request.body);
      await instance.prisma.pushSubscription.deleteMany({
        where: { endpoint: body.endpoint, userId: request.user!.id },
      });
      return reply.code(204).send();
    });
  });
}
