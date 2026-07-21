import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { notifyAdmin } from "../notifications/admin-notify.js";

const requestSchema = z.object({
  billingPeriod: z.enum(["MONTHLY", "ANNUAL"]),
  promoCode: z.string().optional(),
});

const fulfillSchema = z.object({
  status: z.enum(["FULFILLED", "CANCELED"]),
});

// One period from now, not from the old currentPeriodEnd -- fulfilment
// happens whenever the admin actually sees the Payoneer payment land, which
// is the honest start of the paid period for a manual flow like this one.
export function computePeriodEnd(billingPeriod: "MONTHLY" | "ANNUAL", from: Date = new Date()): Date {
  const end = new Date(from);
  if (billingPeriod === "ANNUAL") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

// Customer-facing capture + admin fulfilment for the Payoneer "Request a
// Payment" manual-payment flow (see docs/ROADMAP.md's "Payoneer manual
// invoicing" note) -- no automated PaymentProvider involved. Submitting a
// request notifies the admin (email + Telegram, best-effort); fulfilling one
// activates the real Subscription by hand, mirroring the existing
// PATCH /admin/subscriptions/:id override but computing currentPeriodEnd
// from the request's billingPeriod instead of leaving it unset.
export async function manualPaymentRequestsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/apps/:productSlug/manual-payment-request",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { productSlug } = request.params as { productSlug: string };
      const body = requestSchema.parse(request.body);
      const userId = request.user!.id;

      const product = await fastify.prisma.product.findUnique({ where: { slug: productSlug } });
      if (!product) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      // Idempotent on resubmission (e.g. a page reload after the first
      // click) -- avoids duplicate rows and duplicate admin pings for the
      // same still-unfulfilled request.
      const existing = await fastify.prisma.manualPaymentRequest.findFirst({
        where: { userId, productId: product.id, status: "PENDING" },
      });
      if (existing) {
        return reply.code(200).send({ manualPaymentRequest: existing });
      }

      const manualPaymentRequest = await fastify.prisma.manualPaymentRequest.create({
        data: {
          userId,
          productId: product.id,
          billingPeriod: body.billingPeriod,
          promoCode: body.promoCode,
        },
      });

      const user = await fastify.prisma.user.findUnique({ where: { id: userId } });

      notifyAdmin(
        `New manual payment request: ${product.name}`,
        `${user?.email ?? userId} requested ${product.name} (${body.billingPeriod})` +
          `${body.promoCode ? ` with promo code ${body.promoCode}` : ""}.\n\n` +
          `Create a Payoneer "Request a Payment" invoice and send it to them, then mark this request Fulfilled in Admin once paid.`,
      ).catch((err) => request.log.error(err, "Failed to notify admin of new manual payment request"));

      return reply.code(201).send({ manualPaymentRequest });
    },
  );

  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/manual-payment-requests", async () => {
      const manualPaymentRequests = await instance.prisma.manualPaymentRequest.findMany({
        include: { user: { select: { id: true, email: true } }, product: true },
        orderBy: { createdAt: "desc" },
      });
      return { manualPaymentRequests };
    });

    instance.patch(
      "/admin/manual-payment-requests/:id",
      { preHandler: instance.requireRole("OWNER", "EDITOR") },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = fulfillSchema.parse(request.body);

        const manualPaymentRequest = await instance.prisma.manualPaymentRequest.findUnique({ where: { id } });
        if (!manualPaymentRequest) {
          return reply.code(404).send({ error: "Not found" });
        }

        if (body.status === "FULFILLED") {
          const currentPeriodEnd = computePeriodEnd(manualPaymentRequest.billingPeriod);
          await instance.prisma.subscription.upsert({
            where: {
              userId_productId: {
                userId: manualPaymentRequest.userId,
                productId: manualPaymentRequest.productId,
              },
            },
            create: {
              userId: manualPaymentRequest.userId,
              productId: manualPaymentRequest.productId,
              status: "ACTIVE",
              provider: "payoneer-manual",
              billingPeriod: manualPaymentRequest.billingPeriod,
              currentPeriodEnd,
            },
            update: {
              status: "ACTIVE",
              billingPeriod: manualPaymentRequest.billingPeriod,
              currentPeriodEnd,
              renewalReminderSentAt: null,
            },
          });
        }

        const updated = await instance.prisma.manualPaymentRequest.update({
          where: { id },
          data: { status: body.status },
        });

        return reply.send({ manualPaymentRequest: updated });
      },
    );
  });
}
