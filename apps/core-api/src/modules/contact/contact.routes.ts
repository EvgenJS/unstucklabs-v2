import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createMessageSchema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

// Public capture for the /contact page -- general support/questions, kept
// separate from AppRequest (product ideas) and EmailSubscriber (marketing
// opt-in) since the intent behind reaching out is different.
export async function contactRoutes(fastify: FastifyInstance) {
  fastify.post("/contact", async (request, reply) => {
    const body = createMessageSchema.parse(request.body);

    const message = await fastify.prisma.contactMessage.create({ data: body });

    return reply.code(201).send({ message: { id: message.id } });
  });

  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/contact-messages", async () => {
      const messages = await instance.prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { messages };
    });
  });
}
