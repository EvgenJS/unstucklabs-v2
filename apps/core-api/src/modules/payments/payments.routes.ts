import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActivePaymentProvider } from "./provider-factory.js";
import { validatePromoCode, redeemPromoCode } from "../promo-codes/promo-codes.service.js";
import { createSubscriptionsService } from "../subscriptions/subscriptions.service.js";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  promoCode: z.string().optional(),
  billingPeriod: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  const provider = getActivePaymentProvider();

  fastify.post("/checkout/session", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = checkoutSchema.parse(request.body);
    const userId = request.user!.id;

    const product = await fastify.prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.isActive) {
      return reply.code(404).send({ error: "Product not found" });
    }

    let priceCents =
      body.billingPeriod === "ANNUAL" ? (product.annualPriceCents ?? product.priceCents * 12) : product.priceCents;

    if (body.promoCode) {
      const result = await validatePromoCode(fastify.prisma, {
        productId: product.id,
        code: body.promoCode,
        userId,
      });

      if (!result.valid) {
        return reply.code(400).send({ error: result.reason });
      }

      // Consume the redemption now (see docs/ROADMAP.md for why this happens
      // at checkout-creation rather than webhook confirmation). If this
      // fails (e.g. a concurrent request just hit maxUses), fall back to
      // reporting the code as no longer usable rather than silently
      // charging full price.
      const redeemed = await redeemPromoCode(fastify.prisma, result.promoCode.id, userId);
      if (!redeemed) {
        return reply.code(400).send({ error: "This promo code just reached its usage limit" });
      }

      priceCents = Math.round(priceCents * (1 - result.promoCode.discountPercent / 100));
    }

    const session = await provider.createCheckoutSession({
      userId,
      productId: product.id,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      priceCents,
      currency: product.currency,
      billingPeriod: body.billingPeriod,
    });

    // NullPaymentProvider has no real payment page to redirect to, so no
    // webhook will ever arrive to grant access -- grant it here instead,
    // synchronously, so the site is fully testable (WesternBid reviews the
    // live storefront before issuing API access, see docs/ROADMAP.md)
    // while still blocked on that ticket. Remove this branch once a real
    // provider is wired in; its webhook will take over granting access.
    if (provider.name === "null") {
      const subscriptionsService = createSubscriptionsService(fastify.prisma);
      await subscriptionsService.createOrUpdateFromPaymentEvent(
        {
          type: "purchase.completed",
          userId,
          productId: product.id,
          providerTransactionId: session.providerSessionId,
          billingPeriod: body.billingPeriod,
          raw: session,
        },
        provider.name
      );
    }

    return reply.send(session);
  });
}
