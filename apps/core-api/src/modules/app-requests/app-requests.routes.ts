import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createRequestSchema = z.object({
  email: z.string().email(),
  description: z.string().min(1).max(2000),
});

// Public capture for the landing page's "help shape what we build next"
// section -- lightweight (email + free text), NOT the full AI-quiz
// confirmation pipeline described in docs/ROADMAP.md Future/Backlog. Just
// gives submissions a real place to land instead of a dead-end CTA.
export async function appRequestsRoutes(fastify: FastifyInstance) {
  fastify.post("/app-requests", async (request, reply) => {
    const body = createRequestSchema.parse(request.body);

    const appRequest = await fastify.prisma.appRequest.create({ data: body });

    return reply.code(201).send({ appRequest: { id: appRequest.id } });
  });

  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/app-requests", async () => {
      const appRequests = await instance.prisma.appRequest.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { appRequests };
    });
  });
}
