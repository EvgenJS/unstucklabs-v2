import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validatePromoCode } from "./promo-codes.service.js";

const validateSchema = z.object({
  productId: z.string().min(1),
  code: z.string().min(1),
});

export async function promoCodesRoutes(fastify: FastifyInstance) {
  fastify.post("/promo-codes/validate", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = validateSchema.parse(request.body);

    const product = await fastify.prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return reply.code(404).send({ error: "Product not found" });

    const result = await validatePromoCode(fastify.prisma, {
      productId: body.productId,
      code: body.code,
      userId: request.user!.id,
    });

    if (!result.valid) {
      return reply.send({ valid: false, reason: result.reason });
    }

    const discountedPriceCents = Math.round(product.priceCents * (1 - result.promoCode.discountPercent / 100));

    return reply.send({
      valid: true,
      discountPercent: result.promoCode.discountPercent,
      discountedPriceCents,
    });
  });
}
