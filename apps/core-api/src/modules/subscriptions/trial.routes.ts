import type { FastifyInstance } from "fastify";

const DEFAULT_TRIAL_DAYS = 5;

// Generic, product-agnostic free-trial start -- reusable by any mini-app,
// not just HabitFlow. Deliberately gated by `authenticate` only, NOT
// `requireProductAccess()`, since the whole point is granting first access;
// that gate would 403 before the trial could ever start. Bypasses
// PaymentProvider entirely -- NullPaymentProvider is a stub, and nothing
// elsewhere assumes every Subscription row came through checkout.
export async function trialRoutes(fastify: FastifyInstance) {
  fastify.post("/apps/:productSlug/trial/start", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { productSlug } = request.params as { productSlug: string };
    const userId = request.user!.id;

    const product = await fastify.prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      return reply.code(404).send({ error: "Unknown app" });
    }

    // One trial ever, per product, per user -- keyed off the existing
    // Subscription unique constraint rather than a separate "hasTrialed"
    // flag. Any prior row (even an expired/canceled one) blocks a second
    // trial.
    const existing = await fastify.prisma.subscription.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    if (existing) {
      return reply.code(409).send({ error: "Trial already used" });
    }

    const trialDays = Number(process.env.TRIAL_DAYS ?? DEFAULT_TRIAL_DAYS);
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const subscription = await fastify.prisma.subscription.create({
      data: {
        userId,
        productId: product.id,
        status: "TRIALING",
        provider: "trial",
        trialEndsAt,
      },
    });

    return reply.code(201).send({ subscription });
  });
}
