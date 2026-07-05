import type { FastifyInstance } from "fastify";

// Public catalog -- consumed by the Store to render pricing pages. Only
// active products are exposed here; inactive/draft products are visible to
// admins only via products.admin.routes.ts.
export async function productsRoutes(fastify: FastifyInstance) {
  fastify.get("/products", async () => {
    const products = await fastify.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return { products };
  });

  fastify.get("/products/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await fastify.prisma.product.findUnique({ where: { slug } });

    if (!product || !product.isActive) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return { product };
  });
}
