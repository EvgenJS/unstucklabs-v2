import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActivePaymentProvider } from "./provider-factory.js";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  const provider = getActivePaymentProvider();

  fastify.post("/checkout/session", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = checkoutSchema.parse(request.body);

    const product = await fastify.prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.isActive) {
      return reply.code(404).send({ error: "Product not found" });
    }

    const session = await provider.createCheckoutSession({
      userId: request.user!.id,
      productId: product.id,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    return reply.send(session);
  });
}
