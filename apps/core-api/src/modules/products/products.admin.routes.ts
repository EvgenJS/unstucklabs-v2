import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  subdomain: z.string().min(1).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  pricingModel: z.enum(["ONE_TIME", "RECURRING", "FREEMIUM"]),
  priceCents: z.number().int().nonnegative(),
  annualPriceCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Admin CRUD for the product/app catalog. Gated to OWNER/EDITOR -- SUPPORT
// can view (see subscriptions.admin.routes.ts) but not change pricing/catalog.
export async function productsAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR"));

    instance.get("/admin/products", async () => {
      const products = await instance.prisma.product.findMany({
        include: { media: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "asc" },
      });
      return { products };
    });

    instance.post("/admin/products", async (request, reply) => {
      const body = createProductSchema.parse(request.body);
      const product = await instance.prisma.product.create({ data: body });
      return reply.code(201).send({ product });
    });

    instance.patch("/admin/products/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateProductSchema.parse(request.body);

      const product = await instance.prisma.product.update({
        where: { id },
        data: body,
      });
      return reply.send({ product });
    });

    instance.delete("/admin/products/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await instance.prisma.product.delete({ where: { id } });
      return reply.code(204).send();
    });
  });
}
