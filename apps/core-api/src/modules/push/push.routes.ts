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

// Push subscribe/unsubscribe have no product-specific business logic --
// requireProductAccess() already generically resolves and validates
// request.product, so these routes work for any app without a per-product
// slug guard (unlike the AI routes, whose system prompts/models are
// legitimately per-app).
export async function pushRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.post("/apps/:productSlug/push/subscribe", async (request, reply) => {
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
      const body = unsubscribeSchema.parse(request.body);
      await instance.prisma.pushSubscription.deleteMany({
        where: { endpoint: body.endpoint, userId: request.user!.id },
      });
      return reply.code(204).send();
    });
  });
}
