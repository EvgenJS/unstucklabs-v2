import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// Composable product-access gate: `fastify.requireProductAccess()` returns a
// preHandler, meant to run AFTER `fastify.authenticate` so request.user is
// already set. Resolves `:productSlug` from the route params, 404s if the
// product doesn't exist, and 403s unless the product is FREEMIUM or the
// caller holds an ACTIVE/TRIALING Subscription to it. This is the ONE place
// per-mini-app product-gating logic lives -- AppUserData, AI, and push
// routes all compose it as a preHandler instead of re-deriving the check,
// mirroring the requireRole RBAC pattern in modules/admin/rbac.plugin.ts.
export const productAccessPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("requireProductAccess", () => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const { productSlug } = request.params as { productSlug: string };
      const product = await fastify.prisma.product.findUnique({ where: { slug: productSlug } });
      if (!product) {
        return reply.code(404).send({ error: "Unknown app" });
      }
      request.product = product;

      if (product.pricingModel === "FREEMIUM") return;

      const subscription = await fastify.prisma.subscription.findUnique({
        where: { userId_productId: { userId: request.user.id, productId: product.id } },
      });
      if (subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING")) {
        return;
      }

      return reply.code(403).send({ error: "This app requires an active subscription." });
    };
  });
});
