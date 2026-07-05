import type { FastifyInstance } from "fastify";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELED", "PAST_DUE", "EXPIRED", "TRIALING"]),
});

// Admin view/override of subscriptions -- OWNER/EDITOR/SUPPORT can all view
// and filter (support needs this to help users), but manual status override
// is OWNER/EDITOR only.
export async function subscriptionsAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/subscriptions", async (request) => {
      const { userId, productId, status } = request.query as {
        userId?: string;
        productId?: string;
        status?: string;
      };

      const subscriptions = await instance.prisma.subscription.findMany({
        where: {
          ...(userId && { userId }),
          ...(productId && { productId }),
          ...(status && { status: status as never }),
        },
        include: { user: { select: { id: true, email: true } }, product: true },
        orderBy: { createdAt: "desc" },
      });
      return { subscriptions };
    });

    instance.patch(
      "/admin/subscriptions/:id",
      { preHandler: instance.requireRole("OWNER", "EDITOR") },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = updateStatusSchema.parse(request.body);

        const subscription = await instance.prisma.subscription.update({
          where: { id },
          data: { status: body.status },
        });
        return reply.send({ subscription });
      }
    );
  });
}
