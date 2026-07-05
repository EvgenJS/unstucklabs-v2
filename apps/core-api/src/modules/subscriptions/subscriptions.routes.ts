import type { FastifyInstance } from "fastify";

// Authenticated user's own subscriptions -- backs the Store's "my
// subscriptions / launch app" account area.
export async function subscriptionsRoutes(fastify: FastifyInstance) {
  fastify.get("/me/subscriptions", { preHandler: fastify.authenticate }, async (request) => {
    const subscriptions = await fastify.prisma.subscription.findMany({
      where: { userId: request.user!.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return { subscriptions };
  });
}
