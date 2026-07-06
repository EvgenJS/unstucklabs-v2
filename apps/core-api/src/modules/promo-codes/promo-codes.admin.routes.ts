import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createPromoCodeSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  productId: z.string().min(1),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.coerce.date().optional(),
});

const updatePromoCodeSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

// Admin CRUD for promo codes -- gated the same as products.admin.routes.ts
// (OWNER/EDITOR), since a discount is a pricing concern.
export async function promoCodesAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR"));

    instance.get("/admin/promo-codes", async (request) => {
      const { productId } = request.query as { productId?: string };

      const promoCodes = await instance.prisma.promoCode.findMany({
        where: productId ? { productId } : undefined,
        include: { product: true },
        orderBy: { createdAt: "desc" },
      });
      return { promoCodes };
    });

    instance.post("/admin/promo-codes", async (request, reply) => {
      const body = createPromoCodeSchema.parse(request.body);
      const promoCode = await instance.prisma.promoCode.create({ data: body });
      return reply.code(201).send({ promoCode });
    });

    instance.patch("/admin/promo-codes/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePromoCodeSchema.parse(request.body);

      const promoCode = await instance.prisma.promoCode.update({
        where: { id },
        data: body,
      });
      return reply.send({ promoCode });
    });

    instance.delete("/admin/promo-codes/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await instance.prisma.promoCode.delete({ where: { id } });
      return reply.code(204).send();
    });
  });
}
