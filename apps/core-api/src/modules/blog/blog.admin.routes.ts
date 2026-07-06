import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  publishedAt: z.coerce.date().optional(),
});

// Admin CRUD for blog posts. Built now alongside the schema even though
// Phase 3's admin UI doesn't exist yet to call it -- same shape as
// products.admin.routes.ts, low marginal cost, and it means Phase 3 doesn't
// need a core-api PR just to get an editor working. Deliberate pull-forward,
// documented in docs/ROADMAP.md, not silent scope creep.
export async function blogAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR"));

    instance.get("/admin/blog/posts", async () => {
      const posts = await instance.prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { posts };
    });

    instance.post("/admin/blog/posts", async (request, reply) => {
      const body = createPostSchema.parse(request.body);
      const post = await instance.prisma.blogPost.create({ data: body });
      return reply.code(201).send({ post });
    });

    instance.patch("/admin/blog/posts/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePostSchema.parse(request.body);

      const post = await instance.prisma.blogPost.update({
        where: { id },
        data: body,
      });
      return reply.send({ post });
    });

    instance.delete("/admin/blog/posts/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await instance.prisma.blogPost.delete({ where: { id } });
      return reply.code(204).send();
    });
  });
}
