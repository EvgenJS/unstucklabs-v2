import type { FastifyInstance } from "fastify";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

// Public, unauthenticated -- this is meant to capture emails before a
// mini-app (or even a purchasable product) exists yet, per the
// pre-launch lead-magnet requirement in docs/ROADMAP.md Phase 2.
export async function waitlistRoutes(fastify: FastifyInstance) {
  fastify.post("/waitlist", async (request, reply) => {
    const body = waitlistSchema.parse(request.body);

    const subscriber = await fastify.prisma.emailSubscriber.upsert({
      where: { email: body.email },
      create: { email: body.email, source: body.source },
      update: { unsubscribedAt: null },
    });

    return reply.code(201).send({ subscriber: { id: subscriber.id, email: subscriber.email } });
  });
}
