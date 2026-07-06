import type { FastifyInstance } from "fastify";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// Public blog reads -- only published posts (and only once publishedAt has
// actually passed) are ever exposed here. Paginated, unlike the small
// products catalog, since the blog is expected to grow over time.
export async function blogRoutes(fastify: FastifyInstance) {
  fastify.get("/blog/posts", async (request) => {
    const { page, pageSize } = request.query as { page?: string; pageSize?: string };
    const pageNum = Math.max(1, Number(page) || 1);
    const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));

    const where = {
      status: "PUBLISHED" as const,
      publishedAt: { lte: new Date() },
    };

    const [posts, total] = await Promise.all([
      fastify.prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (pageNum - 1) * size,
        take: size,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      }),
      fastify.prisma.blogPost.count({ where }),
    ]);

    return { posts, page: pageNum, pageSize: size, total };
  });

  fastify.get("/blog/posts/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const post = await fastify.prisma.blogPost.findUnique({ where: { slug } });

    if (!post || post.status !== "PUBLISHED" || !post.publishedAt || post.publishedAt > new Date()) {
      return reply.code(404).send({ error: "Post not found" });
    }

    return { post };
  });
}
